import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, isAdminEmail } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Calendar, Bus, User, CreditCard, ArrowLeft } from 'lucide-react';
import { SeatMap } from '../components/booking/SeatMap';
import { PassengerForm } from '../components/booking/PassengerForm';
import { PaymentGatewaySelector } from '../components/booking/PaymentGatewaySelector';
import { usePaymentPolling } from '../hooks/usePaymentPolling';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { schedules, routes, buses, bookings, addBooking, currentUser } = useApp();
  const { t, language } = useLanguage();

  const isAdmin = currentUser?.role === 'admin' || isAdminEmail(currentUser?.email);

  const schedule = schedules.find(s => s.id === id);
  const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
  const bus = schedule ? buses.find(b => b.id === schedule.busId) : null;

  // Step state: 1 (Seats), 2 (Details), 3 (Payment)
  const [step, setStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [serviceClass, setServiceClass] = useState('Gold VIP+');

  // Passenger list dynamically synced with selected seats
  const [passengerList, setPassengerList] = useState([]);

  // Contact info
  const [contactEmail, setContactEmail] = useState(currentUser ? currentUser.email : '');
  const [contactPhone, setContactPhone] = useState('');

  // Payment inputs
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [errors, setErrors] = useState({});

  // CamPay Modal State & Polling
  const [showCampayModal, setShowCampayModal] = useState(false);
  const [campayRef, setCampayRef] = useState('');

  // Booked seats calculation
  const [bookedSeats, setBookedSeats] = useState([]);

  useEffect(() => {
    if (schedule) {
      const scheduleBookings = bookings.filter(b => b.scheduleId === schedule.id && b.checkInStatus !== 'Cancelled');
      const seats = scheduleBookings.reduce((arr, b) => [...arr, ...(Array.isArray(b.seats) ? b.seats : (b.seats ? [b.seats] : []))], []);
      setBookedSeats(seats);
    }
  }, [schedule, bookings]);

  // Sync passenger list dynamically with selected seats
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

  // Complete Reservation Action
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
      alert(err.message || 'Error confirming your ticket.');
    }
  };

  // Custom Payment Polling Hook
  const {
    status: campayStatus,
    setStatus: setCampayStatus,
    error: campayError,
    startPolling,
    stopPolling
  } = usePaymentPolling({
    onSuccess: () => {
      setTimeout(() => {
        setShowCampayModal(false);
        completeBooking();
      }, 1500);
    }
  });

  if (!schedule || !route || !bus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{t ? t('book.tripNotFound') : 'Trip not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-red-500 hover:text-red-600 font-bold">
          {t ? t('book.goHome') : 'Return to Home'}
        </button>
      </div>
    );
  }

  // Pricing calculations
  const silverPrice = route.price || 5000;
  const goldPrice = Math.round((route.price || 5000) * 1.5);
  const pricePerSeat = serviceClass === 'Gold VIP+' ? goldPrice : silverPrice;
  const totalAmount = pricePerSeat * selectedSeats.length;

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]);
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengerList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors(prev => ({ ...prev, [`${field}_${index}`]: '' }));
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!contactEmail.trim()) {
      newErrors.contactEmail = t ? t('book.errors.emailRequired') : 'Email is required';
    }

    passengerList.forEach((passenger, idx) => {
      if (!passenger.name.trim()) {
        newErrors[`name_${idx}`] = t ? t('book.errors.nameRequired') : 'Passenger name is required';
      }
      if (route.passportRequired && !passenger.passportNumber.trim()) {
        newErrors[`passport_${idx}`] = t ? t('book.errors.passportRequired') : 'Passport ID is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(3);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentAccount.trim()) {
      setErrors({ account: 'Please enter your payment account/phone number.' });
      return;
    }

    if (paymentMethod === 'Mobile Money') {
      try {
        setCampayStatus('pending');
        setShowCampayModal(true);

        let phone = paymentAccount.replace(/[^0-9]/g, '');
        if (!phone.startsWith('237')) phone = '237' + phone;

        const collectRes = await fetch('/api/campay-collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: '25',
            currency: 'XAF',
            from: phone,
            description: `TransitFlow Booking ${schedule.id}`,
            external_reference: 'bk-' + Math.floor(1000 + Math.random() * 9000)
          })
        });

        const collectData = await collectRes.json();
        if (!collectRes.ok) throw new Error(collectData.message || 'Payment initiation failed.');

        setCampayRef(collectData.reference);
        startPolling(collectData.reference);
      } catch (err) {
        setCampayStatus('failed');
      }
      return;
    }

    // Credit Card / Terminal / Cash
    completeBooking();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 text-gray-900 min-h-screen">
      {/* Stepper Header */}
      <div className="relative flex items-center justify-between max-w-xl mx-auto mb-10 mt-4">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 1 ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <Bus className="w-5 h-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-gray-800">1. Seats</span>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 2 ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <User className="w-5 h-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-gray-800">2. Passengers</span>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
            step >= 3 ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'
          }`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="mt-2 text-xs font-bold text-gray-800">3. Payment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Wizard */}
        <div className="lg:col-span-8 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <SeatMap
                selectedSeats={selectedSeats}
                bookedSeats={bookedSeats}
                onSeatClick={handleSeatClick}
                serviceClass={serviceClass}
                onServiceClassChange={setServiceClass}
                busName={bus.name}
                t={t}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep(2)}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all text-sm uppercase tracking-wider"
                >
                  Continue with {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Seat Map
              </button>
              <PassengerForm
                passengerList={passengerList}
                onPassengerChange={handlePassengerChange}
                contactEmail={contactEmail}
                onContactEmailChange={setContactEmail}
                contactPhone={contactPhone}
                onContactPhoneChange={setContactPhone}
                passportRequired={route.passportRequired}
                errors={errors}
                onSubmit={handleDetailsSubmit}
                t={t}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Passenger Details
              </button>
              <PaymentGatewaySelector
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentAccount={paymentAccount}
                onPaymentAccountChange={setPaymentAccount}
                errors={errors}
                onSubmit={handlePaymentSubmit}
                totalAmount={totalAmount}
                showCampayModal={showCampayModal}
                campayStatus={campayStatus}
                campayError={campayError}
                campayRef={campayRef}
                onCloseModal={() => {
                  stopPolling();
                  setShowCampayModal(false);
                }}
                isAdmin={isAdmin}
                t={t}
              />
            </div>
          )}
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="text-gray-900 font-black text-lg border-b border-gray-100 pb-3">Trip Summary</h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">Route</span>
                  <span className="text-gray-900 font-bold">{route.origin} &rarr; {route.destination}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">Date & Departure</span>
                  <span className="text-gray-900 font-bold">{schedule.departureDate} at {schedule.departureTime}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bus className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-xs block">Assigned Bus</span>
                  <span className="text-gray-900 font-bold">{bus.name} ({bus.plate})</span>
                </div>
              </div>
            </div>

            {/* Selected Seats Badges */}
            <div className="border-t border-gray-100 pt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Selected Seats</span>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <span key={seat} className="bg-red-50 text-red-600 border border-red-200 text-xs font-black px-3 py-1.5 rounded-xl">
                      {seat}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">None selected</span>
                )}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>Class Tier</span>
                <span className="font-bold text-gray-900">{serviceClass}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>Price per Seat</span>
                <span>{pricePerSeat.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>Seats</span>
                <span>x {selectedSeats.length}</span>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                <span className="text-sm font-black text-gray-800">Total Amount</span>
                <span className="text-2xl font-black text-red-500">{totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
