import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Bus, 
  Search, 
  ArrowRight,
  Smartphone,
  Check,
  RefreshCw
} from 'lucide-react';

export default function Scanner() {
  const { bookings, schedules, routes, buses, updateBooking } = useApp();
  const [scanInput, setScanInput] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Play audio feedback chime
  const playChime = (success = true) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 587.33 : 220, ctx.currentTime);
      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      }
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context may be restricted
    }
  };

  const handleSearchOrScan = (code) => {
    const cleanCode = (code || scanInput).trim();
    if (!cleanCode) return;

    // Parse potential barcode string format *TFLOW-TH-12345678-01*
    let bookingId = cleanCode.replace(/^\*TFLOW-/, '').replace(/\*$/, '');
    // If ticket has sub-seat suffix like TH-12345678-01, extract main ID
    if (bookingId.includes('-') && bookingId.startsWith('TH-')) {
      const parts = bookingId.split('-');
      if (parts.length >= 3) {
        bookingId = `${parts[0]}-${parts[1]}`;
      }
    }

    const found = bookings.find(b => 
      b.id.toLowerCase() === bookingId.toLowerCase() ||
      b.id.toLowerCase() === cleanCode.toLowerCase() ||
      b.passengerName?.toLowerCase().includes(cleanCode.toLowerCase()) ||
      b.phone?.includes(cleanCode)
    );

    if (found) {
      const schedule = schedules.find(s => s.id === found.scheduleId);
      const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
      const bus = schedule ? buses.find(b => b.id === schedule.busId) : null;

      const ticketData = {
        booking: found,
        schedule,
        route,
        bus
      };

      setActiveTicket(ticketData);
      setStatusMsg({ type: 'success', text: `✓ Valid Ticket Found: ${found.id}` });
      playChime(true);
    } else {
      setActiveTicket(null);
      setStatusMsg({ type: 'error', text: `✕ No matching booking found for "${cleanCode}"` });
      playChime(false);
    }
  };

  const handleUpdateCheckIn = async (newStatus) => {
    if (!activeTicket) return;
    setIsProcessing(true);
    try {
      await updateBooking(activeTicket.booking.id, { checkInStatus: newStatus });
      
      const updatedBooking = { ...activeTicket.booking, checkInStatus: newStatus };
      setActiveTicket(prev => ({ ...prev, booking: updatedBooking }));
      
      setRecentScans(prev => [
        {
          id: updatedBooking.id,
          name: updatedBooking.passengerName,
          seat: Array.isArray(updatedBooking.seats) ? updatedBooking.seats.join(', ') : updatedBooking.seats,
          status: newStatus,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 7)
      ]);

      setStatusMsg({ type: 'success', text: `✓ Passenger successfully marked as "${newStatus}"!` });
      playChime(true);
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to update status: ${err.message}` });
      playChime(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-200">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gate & Boarding Pass Scanner</h1>
              <p className="text-gray-400 text-xs font-medium">Fast Conductor & Terminal Dispatcher Check-in Verification</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Scanner Online &bull; Gate Terminal Akwa
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Scanner & Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Quick Search & Scan Input */}
          <div className="bg-white border-2 border-gray-200 focus-within:border-red-500 rounded-3xl p-5 shadow-sm transition-all">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
              Scan Barcode / Enter Booking Reference (e.g. TH-12345678 or Passenger Name)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => {
                    setScanInput(e.target.value);
                    if (e.target.value.length >= 8) {
                      handleSearchOrScan(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrScan()}
                  placeholder="Scan barcode or type ref e.g. TH-84729103..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchOrScan()}
                className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Scan className="w-4 h-4" />
                <span>Verify</span>
              </button>
            </div>

            {/* Status notification banner */}
            {statusMsg && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{statusMsg.text}</span>
              </div>
            )}
          </div>

          {/* Ticket Verification Card */}
          {activeTicket ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
              
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900 font-mono">{activeTicket.booking.id}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      activeTicket.booking.checkInStatus === 'Boarded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeTicket.booking.checkInStatus === 'Checked-In'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeTicket.booking.checkInStatus || 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{activeTicket.bus?.name || 'Afrique Con Luxury Coach'}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-gray-400 uppercase block">PAYMENT</span>
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                    ✓ {activeTicket.booking.paymentStatus || 'Paid'} ({(activeTicket.booking.totalAmount || 0).toLocaleString()} FCFA)
                  </span>
                </div>
              </div>

              {/* Route & Passenger Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Passenger</span>
                  <span className="text-gray-900 font-black text-sm capitalize block truncate">{activeTicket.booking.passengerName}</span>
                  <span className="text-gray-400 text-[11px] block">{activeTicket.booking.phone}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Route</span>
                  <span className="text-gray-900 font-bold block">
                    {activeTicket.route ? `${activeTicket.route.origin} ➔ ${activeTicket.route.destination}` : 'Direct Service'}
                  </span>
                  <span className="text-gray-400 text-[11px] block">{activeTicket.schedule?.departureDate} &bull; {activeTicket.schedule?.departureTime}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Seat(s)</span>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {(Array.isArray(activeTicket.booking.seats) ? activeTicket.booking.seats : [activeTicket.booking.seats]).map(s => (
                      <span key={s} className="bg-red-500 text-white font-black text-xs px-2 py-0.5 rounded-md shadow-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="text-amber-600 text-[10px] font-bold block mt-1">{activeTicket.booking.travelClass || 'Standard'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Gate Action</span>
                  <span className="text-gray-700 font-mono text-[11px] block font-bold">Platform 3</span>
                  <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons for Conductor */}
              <div className="pt-5 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  disabled={isProcessing || activeTicket.booking.checkInStatus === 'Boarded'}
                  onClick={() => handleUpdateCheckIn('Boarded')}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-97"
                >
                  <Bus className="w-4 h-4" />
                  <span>Mark as Boarded (Allow Entry)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleUpdateCheckIn('Checked-In')}
                  className="py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-sm transition-all text-xs active:scale-97"
                >
                  <span>Check-In Only</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400">
              <Scan className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
              <p className="font-bold text-sm text-gray-600">Awaiting Passenger Ticket Scan</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Scan passenger's physical A4 slip barcode or electronic boarding pass QR on their mobile phone.
              </p>
            </div>
          )}

        </div>

        {/* Right Col: Live Boarding Feed & Manifest (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Live Gate Boarding Activity</span>
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {recentScans.length} Recent
              </span>
            </div>

            {recentScans.length > 0 ? (
              <div className="space-y-2.5">
                {recentScans.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <span className="font-black text-gray-900 block leading-tight">{item.name}</span>
                        <span className="text-gray-400 text-[10px] font-mono">{item.id} &bull; Seat {item.seat}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] block">
                        {item.status}
                      </span>
                      <span className="text-gray-400 text-[9px] font-mono block mt-0.5">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8 italic">No boarding activity recorded yet for this session.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
