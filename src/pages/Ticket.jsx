import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Ticket as TicketIcon, Printer, CheckCircle, ArrowRight, ShieldCheck, Home } from 'lucide-react';

export default function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, schedules, routes, buses } = useApp();
  const printRef = useRef();

  const booking = bookings.find(b => b.id === id);
  const schedule = booking ? schedules.find(s => s.id === booking.scheduleId) : null;
  const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
  const bus = schedule ? buses.find(b => b.id === schedule.busId) : null;

  if (!booking || !schedule || !route || !bus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Ticket record not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-amber-500 hover:text-amber-600 font-bold">Go Home</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      
      {/* Success banner */}
      <div className="text-center mb-8 animate-fade-in no-print">
        <div className="inline-flex items-center justify-center bg-emerald-50 p-3 rounded-full text-emerald-600 mb-4 border border-emerald-500/20">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 text-sm">
          Your payment was processed successfully. Print your E-Ticket below for boarding check-in.
        </p>
      </div>

      {/* Ticket Wrapper (Print target) */}
      <div 
        ref={printRef}
        className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        
        {/* Decorative ticket notch left */}
        <div className="absolute top-[48%] -left-4 w-8 h-8 rounded-full bg-gray-100 border-r border-gray-200 z-10 hidden sm:block"></div>
        {/* Decorative ticket notch right */}
        <div className="absolute top-[48%] -right-4 w-8 h-8 rounded-full bg-gray-100 border-l border-gray-200 z-10 hidden sm:block"></div>

        {/* Brand Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-stone-950 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TicketIcon className="h-6 w-6" />
            <span className="font-extrabold text-lg tracking-wider">BOARDING PASS / E-TICKET</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Booking Ref</span>
            <span className="font-extrabold text-sm tracking-wide">{booking.id}</span>
          </div>
        </div>

        {/* Body details */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Origin / Destination Grid */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200/80">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Departure Station</span>
              <span className="text-gray-900 font-extrabold text-2xl tracking-wide">{route.origin}</span>
            </div>
            <div className="flex flex-col items-center flex-grow max-w-[150px] px-4">
              <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">{route.duration}</span>
              <div className="relative w-full h-[2px] bg-gray-200 flex items-center justify-center">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold mt-1 uppercase">{route.distance}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Arrival Station</span>
              <span className="text-gray-900 font-extrabold text-2xl tracking-wide">{route.destination}</span>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-200/80">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Passenger Name</span>
                <span className="text-gray-900 font-bold text-base">{booking.passengerName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contact Email</span>
                <span className="text-gray-600 font-semibold text-sm">{booking.passengerEmail}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Seats Assigned</span>
                  <span className="text-amber-600 font-extrabold text-base tracking-wider">{booking.seats.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bus Class</span>
                  <span className="text-gray-700 font-semibold text-sm">{bus.type}</span>
                </div>
              </div>
              {booking.passportNumber && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Travel Document / Passport</span>
                  <span className="text-gray-600 font-semibold text-sm flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    <span>{booking.passportNumber}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-200/80 text-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</span>
              <span className="text-gray-900 font-bold">{schedule.departureDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Departure Time</span>
              <span className="text-gray-900 font-bold text-amber-500">{schedule.departureTime}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Gate / Platform</span>
              <span className="text-gray-900 font-bold">Platform 3</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Boarding Status</span>
              <span className="text-emerald-600 font-bold">Paid &bull; Confirmed</span>
            </div>
          </div>

          {/* QR Barcode representation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-2">
            
            {/* Visual HTML/CSS Barcode */}
            <div className="w-full sm:max-w-xs space-y-1.5">
              <div className="h-12 w-full bg-white flex items-center justify-between px-2 overflow-hidden border border-stone-300">
                {/* Simulated vertical bar lines */}
                {Array.from({ length: 42 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-full bg-stone-950" 
                    style={{ 
                      width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px`,
                      opacity: i % 7 === 0 ? 0.3 : 1 
                    }}
                  ></div>
                ))}
              </div>
              <div className="text-center font-mono text-[10px] text-gray-400 tracking-widest">
                *TFLOW-{booking.id}-{schedule.id}*
              </div>
            </div>

            {/* Fare detail summary */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Total Fare Charged</span>
              <span className="text-2xl font-extrabold text-amber-600">{booking.totalAmount.toLocaleString()} FCFA</span>
              <p className="text-[10px] text-gray-500 font-medium">Settled via {booking.paymentMethod}</p>
            </div>
          </div>

        </div>

      </div>

      {/* Action buttons */}
      <div className="mt-8 flex justify-between items-center no-print">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
        >
          <Home className="h-4 w-4" />
          <span>Book Another Trip</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 text-sm shadow-md"
        >
          <Printer className="h-4 w-4" />
          <span>Print E-Ticket</span>
        </button>
      </div>

    </div>
  );
}
