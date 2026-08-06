import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Calendar, Bus, User, CreditCard, PhoneCall, UserCheck } from 'lucide-react';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { schedules, routes, buses, bookings, addBooking, currentUser } = useApp();
  const { t, language } = useLanguage();

  const schedule = schedules.find(s => s.id === id);
  const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
  const bus = schedule ? buses.find(b => b.id === schedule.busId) : null;

  // Step state: 1 (Seats), 2 (Details), 3 (Payment)
  const [step, setStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [serviceClass, setServiceClass] = useState('Gold VIP+'); // default to Gold VIP+ as shown in screenshot

  // Passenger list dynamically synced with selected seats
  const [passengerList, setPassengerList] = useState([]);

  // Contact email & phone details
  const [contactEmail, setContactEmail] = useState(currentUser ? currentUser.email : '');
  const [contactPhone, setContactPhone] = useState('');

  // Payment inputs
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [errors, setErrors] = useState({});

  // CamPay Demo Modal State
  const [showCampayModal, setShowCampayModal] = useState(false);
  const [campayStatus, setCampayStatus] = useState('pending'); // pending, success, failed
  const [campayError, setCampayError] = useState('');
  const [campayRef, setCampayRef] = useState('');

  // Ref to hold the status polling interval ID
  const pollingRef = useRef(null);

  // Find seats already booked for this schedule
  const [bookedSeats, setBookedSeats] = useState([]);

  useEffect(() => {
    if (schedule) {
      const scheduleBookings = bookings.filter(b => b.scheduleId === schedule.id && b.checkInStatus !== 'Cancelled');
      const seats = scheduleBookings.reduce((arr, b) => [...arr, ...b.seats], []);
      setBookedSeats(seats);
    }
  }, [schedule, bookings]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Sync passenger input list dynamically with selected seats
  useEffect(() => {
    setPassengerList(prev => {
      return selectedSeats.map((seat, idx) => {
        const existing = prev.find(p => p.seat === seat);
        return existing || {
          seat,
          name: idx === 0 && currentUser ? currentUser.name : '',
          passportNumber: ''
        };
      });
    });
  }, [selectedSeats, currentUser]);

  if (!schedule || !route || !bus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{t('book.tripNotFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-amber-500 hover:text-amber-600 font-bold">{t('book.goHome')}</button>
      </div>
    );
  }

  // 2+1 Layout Seat Matrix (Rows A-W, 3 seats per row)
  const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
  const seatGrid = [];

  // Row A (Disabled seat 1, seats A2, A3)
  seatGrid.push({
    row: 'A',
    cols: [
      { id: 'x', label: 'x', disabled: true, type: 'disabled' },
      { id: 'A2', label: 'A2', disabled: false, type: 'seat' },
      { id: 'A3', label: 'A3', disabled: false, type: 'seat' }
    ]
  });

  // Rows B to W
  for (let r = 1; r < ROWS.length; r++) {
    const rowChar = ROWS[r];
    seatGrid.push({
      row: rowChar,
      cols: [
        { id: `${rowChar}1`, label: `${rowChar}1`, disabled: false, type: 'seat' },
        { id: `${rowChar}2`, label: `${rowChar}2`, disabled: false, type: 'seat' },
        { id: `${rowChar}3`, label: `${rowChar}3`, disabled: false, type: 'seat' }
      ]
    });
  }

  // Row X at the bottom (Middle seat X1 only)
  seatGrid.push({
    row: 'X',
    cols: [
      { id: 'spacer1', label: '', disabled: true, type: 'spacer' },
      { id: 'X1', label: 'X1', disabled: false, type: 'seat' },
      { id: 'spacer2', label: '', disabled: true, type: 'spacer' }
    ]
  });

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return; // already booked

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(s => s !== seatId);
      }
      return [...prev, seatId];
    });
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!contactEmail.trim()) {
      newErrors.contactEmail = t('book.errors.emailRequired');
    }
    
    passengerList.forEach((passenger, idx) => {
      if (!passenger.name.trim()) {
        newErrors[`name_${idx}`] = t('book.errors.nameRequired');
      }
      if (route.passportRequired && !passenger.passportNumber.trim()) {
        newErrors[`passport_${idx}`] = t('book.errors.passportRequired');
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(3);
  };

  const startStatusPolling = (ref) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/campay-status?ref=${ref}`, {
          method: 'GET'
        });

        const statusText = await statusRes.text();
        let statusData;
        try {
          statusData = JSON.parse(statusText);
        } catch {
          console.warn("Status endpoint returned non-JSON:", statusText);
          return;
        }

        if (statusData.status === 'SUCCESSFUL' || statusData.status === 'successful' || statusData.status === 'SUCCESS') {
          clearInterval(pollingRef.current);
          setCampayStatus('success');
          setTimeout(() => {
            setShowCampayModal(false);
            completeBooking();
          }, 1500);
        } else if (statusData.status === 'FAILED' || statusData.status === 'failed') {
          clearInterval(pollingRef.current);
          setCampayStatus('failed');
          setCampayError(statusData.description || 'Transaction declined or failed on phone.');
        }
      } catch (err) {
        console.error("Error polling transaction status:", err);
      }
    }, 3000);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentAccount.trim()) {
      setErrors({ account: language === 'fr' ? 'Ce champ est requis.' : language === 'pcm' ? 'Write detail dem here.' : 'This field is required.' });
      return;
    }

    if (paymentMethod === 'Mobile Money') {
      try {
        setCampayStatus('pending');
        setCampayError('');
        setShowCampayModal(true);

        // Format phone number to 237xxxxxxxxx
        let phone = paymentAccount.replace(/[^0-9]/g, '');
        if (!phone.startsWith('237')) {
          phone = '237' + phone;
        }

        // Call proxy collect endpoint
        const collectRes = await fetch('/api/campay-collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: "25", // CamPay Sandbox limits transactions to max 25 XAF
            currency: "XAF",
            from: phone,
            description: `TransitFlow Booking ${schedule.id}`,
            external_reference: 'bk-' + Math.floor(1000 + Math.random() * 9000)
          })
        });

        const responseText = await collectRes.text();
        let collectData;
        try {
          collectData = JSON.parse(responseText);
        } catch {
          throw new Error(`Server returned non-JSON response (Status ${collectRes.status}): ${responseText.slice(0, 100) || '[Empty Response]'}`);
        }

        if (!collectRes.ok) {
          throw new Error(collectData.message || JSON.stringify(collectData));
        }

        const ref = collectData.reference;
        setCampayRef(ref);

        // Start status polling
        startStatusPolling(ref);

      } catch (err) {
        setCampayStatus('failed');
        setCampayError(err.message || 'Error connecting to CamPay API.');
      }
      return;
    }

    // Standard checkout logic for credit card / bank
    completeBooking();
  };

  const completeBooking = async () => {
    try {
      const booking = await addBooking({
        scheduleId: schedule.id,
        passengerName: passengerList.map(p => p.name).join(', '),
        passengerEmail: contactEmail,
        phone: contactPhone || paymentAccount,
        seats: selectedSeats,
        totalAmount: totalAmount,
        paymentMethod,
        passportNumber: passengerList.map(p => p.passportNumber).filter(Boolean).join(', '),
        travelClass: serviceClass,
        passengers: passengerList
      });

      navigate(`/ticket/${booking.id}`);
    } catch (err) {
      alert("Error confirming your ticket: " + (err.message || err));
    }
  };

  const handleCloseCampayModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setShowCampayModal(false);
  };

  // Pricing calculations
  const silverPrice = route.price;
  const goldPrice = Math.round(route.price * 2.5);
  const pricePerSeat = serviceClass === 'Gold VIP+' ? goldPrice : silverPrice;
  const totalAmount = pricePerSeat * selectedSeats.length;

  const renderSeat = (col) => {
    if (!col) return null;
    if (col.type === 'spacer') {
      return <div className="h-10 w-10"></div>;
    }
    if (col.type === 'disabled') {
      return (
        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs select-none">
          {col.label}
        </div>
      );
    }

    const seatId = col.id;
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);

    return (
      <button
        key={seatId}
        type="button"
        disabled={isBooked}
        onClick={() => handleSeatClick(seatId)}
        className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${
          isBooked
            ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed select-none'
            : isSelected
              ? 'bg-amber-500 text-white border-amber-600 scale-105 shadow-md shadow-amber-500/25 font-black'
              : 'bg-white hover:bg-amber-50 text-gray-700 border-gray-300'
        }`}
      >
        {seatId}
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 text-gray-900 min-h-screen relative">
      
      {/* CamPay Live Sandbox Checkout Modal Overlay */}
      {showCampayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-6">
            
            {/* Header logo */}
            <div className="text-center">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black text-gray-900">{t('book.campayCheckout')}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Cameroon Aggregated Gateway</p>
            </div>

            {/* Main status view */}
            {campayStatus === 'pending' && (
              <div className="space-y-5 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center w-12 h-12 mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{t('book.paymentPending')}</p>
                  <p className="text-xs text-gray-400 mt-1.5 max-w-xs px-4">
                    {t('book.momoPrompt')} <strong className="text-gray-700">{paymentAccount}</strong>.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">{language === 'fr' ? 'Montant à facturer' : language === 'pcm' ? 'Total Money' : 'Charge Amount'}</span>
                  <span className="font-bold text-gray-800">{totalAmount.toLocaleString()} FCFA</span>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 text-left space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[9px] text-amber-900 mb-1">Sandbox Test Numbers:</p>
                  <p>✓ <strong>MTN Success:</strong> 237677777777</p>
                  <p>✓ <strong>Orange Success:</strong> 237699999999</p>
                  <p>✕ <strong>Simulate Fail:</strong> 237677777770 or 237699999990</p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseCampayModal}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold py-2 px-3 rounded-xl text-xs transition-all active:scale-97 bg-white"
                >
                  {t('book.cancelBtn')}
                </button>
              </div>
            )}

            {campayStatus === 'success' && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
                  ✓
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">{t('book.paymentSuccess')}</p>
                  <p className="text-xs text-gray-400 mt-1">Ref: {campayRef}</p>
                </div>
                <p className="text-xs text-gray-500 animate-pulse">{language === 'fr' ? 'Génération de votre billet de voyage...' : language === 'pcm' ? 'Waka paper dey load...' : 'Generating your travel ticket pass...'}</p>
              </div>
            )}

            {campayStatus === 'failed' && (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✕
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">{t('book.paymentFailed')}</p>
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-2 font-medium">
                    {campayError}
                  </p>
                </div>
                <div className="flex gap-2 border-t border-gray-150 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCampayStatus('pending');
                      setCampayError('');
                      // re-trigger payment submission mock
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-97"
                  >
                    {t('book.retryBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCampayModal}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-97 bg-white"
                  >
                    {t('book.cancelBtn')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      
      {/* Custom Stepper Progress Flow */}
      <div className="relative flex items-center justify-between max-w-2xl mx-auto mb-12 mt-6">
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
        
        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 1 ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <Bus className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className={`mt-2.5 text-xs font-semibold tracking-wide ${step >= 1 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{t('book.step1')}</span>
        </div>

        {/* Step 2 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 2 ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <User className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className={`mt-2.5 text-xs font-semibold tracking-wide ${step >= 2 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{t('book.step2')}</span>
        </div>

        {/* Step 3 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 3 ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <CreditCard className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className={`mt-2.5 text-xs font-semibold tracking-wide ${step >= 3 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{t('book.step3')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Wizard Panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: Seat Selection */}
          {step === 1 && (
            <div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{t('book.step1')}</h3>
                    <p className="text-gray-400 text-xs">
                      {serviceClass} ({language === 'pcm' ? '2+1 layout' : '2+1 layout'}) - {bus.capacity} {language === 'fr' ? 'places' : language === 'pcm' ? 'seat dem' : 'seats'}
                    </p>
                  </div>

                  {/* Legend / Driver Indicator */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4.5 w-4.5 rounded border border-gray-350 bg-white"></div>
                      <span>{t('book.available')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4.5 w-4.5 rounded bg-amber-500 border border-amber-600"></div>
                      <span>{t('book.selected')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4.5 w-4.5 rounded bg-gray-200 border border-gray-300"></div>
                      <span>{t('book.booked')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-500 border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {language === 'fr' ? 'Chauffeur' : 'Driver'}
                    </div>
                  </div>
                </div>

                {/* Seat Matrix Grid Cabin */}
                <div className="border border-gray-200 rounded-2xl p-6 max-w-xs mx-auto bg-white shadow-inner max-h-[500px] overflow-y-auto">
                  <div className="space-y-3.5">
                    {seatGrid.map((row) => (
                      <div key={row.row} className="flex items-center justify-between">
                        {/* Column 1 (Left Seat) */}
                        <div className="w-10 flex justify-center">
                          {row.cols[0].type !== 'spacer' ? renderSeat(row.cols[0]) : <div className="w-10 h-10"></div>}
                        </div>

                        {/* Aisle Spacer Gap (Completely empty walkway) */}
                        <div className="w-12"></div>

                        {/* Columns 2 & 3 (Right Seats) */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 flex justify-center">
                            {row.cols[1].type !== 'spacer' ? renderSeat(row.cols[1]) : <div className="w-10 h-10"></div>}
                          </div>
                          <div className="w-10 flex justify-center">
                            {row.cols[2].type !== 'spacer' ? renderSeat(row.cols[2]) : <div className="w-10 h-10"></div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yellow Selected seat indicator bar */}
                {selectedSeats.length > 0 && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span>{t('book.seatsAssigned')}: {selectedSeats.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Centered Continue button below selection card */}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep(2)}
                  className={`px-10 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md ${
                    selectedSeats.length > 0
                      ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-97 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>{language === 'fr' ? 'Continuer' : language === 'pcm' ? 'Go to details' : 'Continue'}</span>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Passenger Details Form fields for each seat */}
          {step === 2 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center space-x-2">
                  <UserCheck className="h-5.5 w-5.5 text-amber-500" />
                  <span>{t('book.step2')}</span>
                </h3>
                <p className="text-gray-400 text-xs">{language === 'fr' ? 'Veuillez fournir les détails d\'identification de chaque passager.' : language === 'pcm' ? 'Write names of passenger dem.' : 'Please provide the identification details for each selected passenger.'}</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                
                {/* Contact Email field */}
                <div className="border-b border-gray-200 pb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('book.contactEmail')}</label>
                  <input
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={contactEmail}
                    onChange={e => {
                      setContactEmail(e.target.value);
                      setErrors(prev => ({ ...prev, contactEmail: '' }));
                    }}
                    className={`w-full max-w-md bg-gray-50 border text-gray-900 p-3 rounded-xl focus:outline-none focus:ring-1 text-sm ${
                      errors.contactEmail ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-amber-500/50'
                    }`}
                  />
                  {errors.contactEmail && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contactEmail}</p>}
                </div>

                {/* Form fields for each selected seat */}
                <div className="space-y-6">
                  {passengerList.map((passenger, idx) => (
                    <div key={passenger.seat} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-250 pb-2">
                        <span className="font-bold text-gray-800 text-sm">{t('book.passengerNum')}{idx + 1}</span>
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('myTrips.seat')} {passenger.seat}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('book.fullName')}</label>
                          <input
                            type="text"
                            placeholder="e.g. Brandy Jay"
                            value={passenger.name}
                            onChange={e => {
                              const newList = [...passengerList];
                              newList[idx].name = e.target.value;
                              setPassengerList(newList);
                              setErrors(prev => ({ ...prev, [`name_${idx}`]: '' }));
                            }}
                            className={`w-full bg-white border text-gray-900 p-3 rounded-xl focus:outline-none focus:ring-1 text-sm ${
                              errors[`name_${idx}`] ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-amber-500/50'
                            }`}
                          />
                          {errors[`name_${idx}`] && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors[`name_${idx}`]}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {t('book.passportNumber')} {route.passportRequired && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={route.passportRequired ? t('book.passportNum') : "e.g. CM8928374 (Optional)"}
                            value={passenger.passportNumber}
                            onChange={e => {
                              const newList = [...passengerList];
                              newList[idx].passportNumber = e.target.value;
                              setPassengerList(newList);
                              setErrors(prev => ({ ...prev, [`passport_${idx}`]: '' }));
                            }}
                            className={`w-full bg-white border text-gray-900 p-3 rounded-xl focus:outline-none focus:ring-1 text-sm ${
                              errors[`passport_${idx}`] ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-amber-500/50'
                            }`}
                          />
                          {errors[`passport_${idx}`] && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors[`passport_${idx}`]}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-900 font-semibold transition-colors text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>{language === 'fr' ? 'Retour aux places' : language === 'pcm' ? 'Go back for seat dem' : 'Back to Seats'}</span>
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3.5 rounded-xl font-bold active:scale-97 transition-all text-sm flex items-center gap-1.5 shadow"
                  >
                    <span>{t('book.proceedPayment')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* STEP 3: Payment Gate */}
          {step === 3 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center space-x-2">
                  <CreditCard className="h-5.5 w-5.5 text-amber-500" />
                  <span>{t('book.step3')}</span>
                </h3>
                <p className="text-gray-400 text-xs">{language === 'fr' ? 'Simulez le paiement sécurisé instantanément.' : language === 'pcm' ? 'Simulate waka pay place' : 'Simulate secure ticket payments instantly via local payment networks.'}</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                
                {/* Method Radios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'Mobile Money', label: t('book.momo') },
                    { id: 'Credit Card', label: 'Credit / Debit Card' },
                    { id: 'Bank Transfer', label: 'Bank Transfer' }
                  ].map(method => (
                    <label
                      key={method.id}
                      className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'bg-amber-50/55 border-amber-500 text-gray-900 ring-1 ring-amber-500/30'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === method.id}
                        onChange={() => {
                          setPaymentMethod(method.id);
                          setErrors({});
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-bold block mb-1 text-gray-900">{method.label}</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">{language === 'fr' ? 'Règlement instantané' : language === 'pcm' ? 'Pay quick-quick' : 'Instant Settlement'}</span>
                    </label>
                  ))}
                </div>

                {/* Simulated fields depending on selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {paymentMethod === 'Mobile Money' ? t('book.phoneLabel') : paymentMethod === 'Credit Card' ? 'Credit Card Number' : 'Sender Account/Reference Details'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <PhoneCall className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        placeholder={paymentMethod === 'Mobile Money' ? 'e.g. +237 670 123 456' : paymentMethod === 'Credit Card' ? 'e.g. 4000 1234 5678 9010' : 'e.g. ACC-192837'}
                        value={paymentAccount}
                        onChange={e => {
                          setPaymentAccount(e.target.value);
                          setErrors({});
                          if (paymentMethod === 'Mobile Money') {
                            setContactPhone(e.target.value);
                          }
                        }}
                        className={`w-full bg-gray-50 border text-gray-900 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 text-sm ${
                          errors.account ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-amber-500/50'
                        }`}
                      />
                    </div>
                    {errors.account && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.account}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500 leading-relaxed">
                  {language === 'fr' 
                    ? 'Cliquer sur « Confirmer et payer » déclenchera une simulation de paiement. Une fois confirmée, votre billet d\'embarquement imprimable sera immédiatement généré.' 
                    : language === 'pcm' 
                    ? 'Click "Confirm Waka Booking" go simulate transaction. Waka Paper go generate immediately.'
                    : 'Clicking "Confirm & Pay" triggers a mock payment API. Upon transaction confirmation, your printable ticket boarding pass will be instantly generated and saved to your trips profile.'}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-gray-500 hover:text-gray-900 font-semibold transition-colors text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>{t('book.goBack')}</span>
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3.5 rounded-xl font-bold active:scale-97 transition-all text-sm flex items-center gap-1.5 shadow"
                  >
                    <span>{t('book.confirmBooking')} ({totalAmount.toLocaleString()} FCFA)</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

        {/* Right Side Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24 space-y-6">
            
            <h3 className="text-gray-900 font-bold text-lg border-b border-gray-150 pb-3">{t('book.summary')}</h3>

            {/* Trip Details */}
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">{t('ticket.departureStation')} / {t('ticket.arrivalStation')}</span>
                  <span className="text-gray-900 font-bold text-sm">{route.origin} &mdash; {route.destination}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">{t('ticket.date')} & {t('ticket.departureTime')}</span>
                  <span className="text-gray-900 font-bold text-sm">{schedule.departureDate} - {schedule.departureTime}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bus className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">{t('ticket.busClass')}</span>
                  <span className="text-gray-900 font-bold text-sm">{bus.plate} - {bus.name}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-150 pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">{t('book.class')}</span>
              <div className="grid grid-cols-2 gap-3">
                {/* Silver Selection Card */}
                <button
                  type="button"
                  onClick={() => setServiceClass('Silver')}
                  className={`border rounded-xl p-3 text-left transition-all ${
                    serviceClass === 'Silver'
                      ? 'bg-white border-amber-500 text-gray-900 ring-2 ring-amber-500/20'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-bold block text-gray-800">Silver</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{silverPrice.toLocaleString()} FCFA</span>
                </button>

                {/* Gold VIP+ Selection Card */}
                <button
                  type="button"
                  onClick={() => setServiceClass('Gold VIP+')}
                  className={`border rounded-xl p-3 text-left transition-all ${
                    serviceClass === 'Gold VIP+'
                      ? 'bg-white border-amber-500 text-gray-900 ring-2 ring-amber-500/20'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-350'
                  }`}
                >
                  <span className="text-xs font-bold block text-gray-800 font-extrabold">Gold VIP+</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{goldPrice.toLocaleString()} FCFA</span>
                </button>
              </div>
            </div>

            {/* Selected Seats Badges */}
            <div className="border-t border-gray-150 pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">{t('book.seatsAssigned')}</span>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <span key={seat} className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {seat}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">{language === 'fr' ? 'Aucun' : 'None selected'}</span>
                )}
              </div>
            </div>

            {/* Calculations */}
            <div className="border-t border-gray-150 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>{t('book.pricePerSeat')}</span>
                <span>{pricePerSeat.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>{language === 'fr' ? 'Quantité' : language === 'pcm' ? 'How many seat' : 'Quantity'}</span>
                <span>{selectedSeats.length}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-amber-500">{totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
