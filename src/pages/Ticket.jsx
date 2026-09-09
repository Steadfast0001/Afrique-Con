import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Ticket as TicketIcon, Printer, CheckCircle, ShieldCheck, Home, Scissors, Layers, FileText } from 'lucide-react';

export default function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, schedules, routes, buses } = useApp();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState('a4'); // 'a4' (all 6-per-page) or 'single'

  const booking = bookings.find(b => b.id === id);
  const schedule = booking ? schedules.find(s => s.id === booking.scheduleId) : null;
  const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
  const bus = schedule ? buses.find(b => b.id === schedule.busId) : null;

  if (!booking || !schedule || !route || !bus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{t('ticket.notFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-red-500 hover:text-red-600 font-bold">{t('ticket.goHome')}</button>
      </div>
    );
  }

  // Parse seat list
  const seatList = Array.isArray(booking.seats)
    ? booking.seats
    : typeof booking.seats === 'string'
    ? booking.seats.split(',').map(s => s.trim()).filter(Boolean)
    : ['Standard'];

  // Parse names for each seat (from booking.passengers array or comma-separated string)
  const nameList = booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0
    ? booking.passengers.map(p => p.name || p.passengerName)
    : (booking.passengerName || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);

  const passportList = booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0
    ? booking.passengers.map(p => p.passportNumber)
    : (booking.passportNumber || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

  // Generate individual pass objects for each booked seat
  const individualPasses = seatList.map((seatNumber, index) => {
    const passengerName = nameList[index] || nameList[0] || booking.passengerName || 'Passenger';
    const passportNumber = passportList[index] || passportList[0] || '';
    const subTicketId = seatList.length > 1 ? `${booking.id}-${String(index + 1).padStart(2, '0')}` : booking.id;
    const singleFare = Math.round(booking.totalAmount / (seatList.length || 1));

    return {
      subTicketId,
      seatNumber,
      passengerName,
      passportNumber,
      singleFare,
      passNumber: index + 1,
      totalPasses: seatList.length
    };
  });

  // Chunk passes into A4 pages (up to 6 slips per A4 page)
  const SLIPS_PER_PAGE = 6;
  const pages = [];
  for (let i = 0; i < individualPasses.length; i += SLIPS_PER_PAGE) {
    pages.push(individualPasses.slice(i, i + SLIPS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Success banner */}
      <div className="text-center mb-8 animate-fade-in no-print">
        <div className="inline-flex items-center justify-center bg-emerald-50 p-3 rounded-full text-emerald-600 mb-3 border border-emerald-500/20 shadow-sm">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">{t('ticket.confirmed')}</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          {language === 'fr'
            ? `Réservation confirmée pour ${individualPasses.length} siège(s). Disposé au format feuille A4 (6 coupons par page, 20.00 × 4.78 cm).`
            : language === 'pcm'
            ? `Booking confirm for ${individualPasses.length} seat(s). Arranged for A4 paper (6 slips per sheet, 20.00 × 4.78 cm).`
            : `Booking confirmed for ${individualPasses.length} seat(s). Arranged on standard A4 paper (6 slips per sheet, 20.00 × 4.78 cm each).`}
        </p>
      </div>

      {/* Control Toolbar */}
      <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-600 p-2 rounded-xl border border-red-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">A4 Sheet Layout (Portrait)</span>
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">6 SLIPS / A4</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Slip Size: <strong className="text-gray-700">20.00 × 4.78 cm</strong> &bull; Printable Area: <strong className="text-gray-700">92.0%</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === 'a4' ? 'single' : 'a4')}
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            {viewMode === 'a4' ? 'Show Single Slips' : 'Show Full A4 Sheet (6 per page)'}
          </button>

          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-stone-950 px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-xs shadow-md transition-all active:scale-97"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4 Boarding Passes</span>
          </button>
        </div>
      </div>

      {/* A4 PAGES CONTAINER */}
      <div className="flex flex-col items-center gap-12 py-2">
        {pages.map((pageSlips, pageIdx) => (
          <div
            key={pageIdx}
            className="a4-page-sheet bg-white border border-gray-300 shadow-2xl p-3 sm:p-4 rounded-xl relative select-none"
            style={{
              width: '100%',
              maxWidth: '210mm',
              minHeight: '287mm',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {/* Sheet top header indicator on screen */}
            <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2 mb-2 text-[10px] text-gray-400 font-mono no-print">
              <span className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-red-500" />
                A4 Page {pageIdx + 1} of {pages.length} &bull; Standard 20.00cm × 4.78cm Slips (6 per sheet)
              </span>
              <span>Printable Area: 92.0%</span>
            </div>

            {/* 6 SLIPS STACKED VERTICALLY */}
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: SLIPS_PER_PAGE }).map((_, slotIdx) => {
                const pass = pageSlips[slotIdx];
                const slipIndexNumber = pageIdx * SLIPS_PER_PAGE + slotIdx + 1;

                if (!pass) {
                  // Optional empty slot guide on A4 sheet
                  return (
                    <div
                      key={`empty-${slotIdx}`}
                      className="boarding-slip-20x478 border border-dashed border-gray-200 bg-gray-50/50 rounded flex items-center justify-between px-4 text-gray-300 text-[10px] font-mono no-print"
                      style={{
                        width: '100%',
                        height: '47.8mm',
                        minHeight: '47.8mm',
                        maxHeight: '47.8mm'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-gray-300" />
                        <span>Slip {slotIdx + 1} of 6 &bull; [Blank / Spare Ticket Slot &bull; 20.00 × 4.78 cm]</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-300">TransitFlow Ticket Template</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={pass.subTicketId}
                    className="boarding-slip-20x478 bg-white border border-gray-300 rounded shadow-xs relative overflow-hidden flex flex-col justify-between"
                    style={{
                      width: '100%',
                      height: '47.8mm',
                      minHeight: '47.8mm',
                      maxHeight: '47.8mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Top slim branding header */}
                    <div className="bg-[#b90e38] text-white px-3 py-0.5 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <TicketIcon className="w-3 h-3 text-white/90" />
                        <span className="font-black text-[8.5px] tracking-wider uppercase">TRANSITHUB BOARDING PASS / E-TICKET</span>
                        <span className="bg-white/20 text-white text-[7px] font-bold px-1.5 py-0.2 rounded ml-1">
                          {slotIdx + 1} of 6
                        </span>
                      </div>
                      <div className="flex items-center gap-3 leading-none">
                        <span className="text-[6.5px] font-bold uppercase text-white/80">BOOKING REF:</span>
                        <span className="font-extrabold text-[8.5px] text-white tracking-wide">{pass.subTicketId}</span>
                      </div>
                    </div>

                    {/* Main content body in a horizontal 4-column layout spanning 20cm */}
                    <div className="px-3 py-1 flex-1 grid grid-cols-12 gap-2 items-center text-gray-800 leading-tight">
                      
                      {/* 1. Route & Stations (Cols 1-4) */}
                      <div className="col-span-4 border-r border-gray-200 pr-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase tracking-wider block">FROM</span>
                            <span className="text-gray-950 font-black text-[10px] tracking-tight block truncate max-w-[28mm]">{route.origin}</span>
                          </div>
                          
                          <div className="flex flex-col items-center px-1">
                            <span className="text-[5.5px] text-gray-400 font-bold uppercase">{route.duration}</span>
                            <div className="relative w-10 h-[1.5px] bg-gray-300 my-0.5 flex items-center justify-center">
                              <div className="absolute w-1.5 h-1.5 rounded-full bg-red-600"></div>
                            </div>
                            <span className="text-[5.5px] text-gray-400 font-bold">{route.distance}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase tracking-wider block">TO</span>
                            <span className="text-gray-950 font-black text-[10px] tracking-tight block truncate max-w-[28mm]">{route.destination}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Passenger & Seat Assignment (Cols 5-7) */}
                      <div className="col-span-3 border-r border-gray-200 px-1">
                        <div className="flex items-start justify-between">
                          <div className="max-w-[26mm]">
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase tracking-wider block">PASSENGER</span>
                            <span className="text-gray-950 font-black text-[9px] capitalize truncate block">{pass.passengerName}</span>
                            <span className="text-[6px] text-gray-500 truncate block">{booking.passengerEmail || booking.phone}</span>
                          </div>
                          <div className="text-center bg-red-50 border border-red-200 px-2 py-0.5 rounded flex-shrink-0">
                            <span className="text-[5px] font-bold text-red-500 uppercase block leading-none">SEAT</span>
                            <span className="text-red-600 font-black text-[11px] leading-tight block">{pass.seatNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Date, Time & Gate (Cols 8-9) */}
                      <div className="col-span-2 border-r border-gray-200 px-1 text-center">
                        <div className="grid grid-cols-2 gap-1 text-left">
                          <div>
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase block">DATE</span>
                            <span className="text-gray-900 font-bold text-[7.5px] block">{schedule.departureDate}</span>
                          </div>
                          <div>
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase block">TIME</span>
                            <span className="text-red-600 font-black text-[8px] block">{schedule.departureTime}</span>
                          </div>
                          <div>
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase block">GATE</span>
                            <span className="text-gray-800 font-bold text-[7px] block">Platform 3</span>
                          </div>
                          <div>
                            <span className="text-[5.5px] font-bold text-gray-400 uppercase block">STATUS</span>
                            <span className="text-emerald-700 font-black text-[7px] block">Paid • OK</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Barcode & Fare (Cols 10-12) */}
                      <div className="col-span-3 pl-1 flex items-center justify-between">
                        {/* Barcode representation */}
                        <div className="flex flex-col items-start max-w-[28mm]">
                          <div className="h-5 w-full bg-white flex items-center justify-between px-0.5 overflow-hidden border border-gray-300">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-full bg-black"
                                style={{
                                  width: `${(i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 1.5)}px`,
                                  opacity: i % 7 === 0 ? 0.35 : 1
                                }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[5px] text-gray-400 tracking-tighter truncate block mt-0.5">
                            *TFLOW-{pass.subTicketId}-{pass.seatNumber}*
                          </span>
                        </div>

                        {/* Price summary */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-[5.5px] font-bold text-gray-400 uppercase block leading-none">SEAT FARE</span>
                          <span className="text-red-600 font-black text-[10px] leading-tight block">
                            {pass.singleFare.toLocaleString()} FCFA
                          </span>
                          <span className="text-[5px] text-gray-400 block leading-none">{booking.paymentMethod || 'Paid'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom dashed cut-line guide */}
                    <div className="border-t border-dashed border-gray-300 px-3 py-0.5 bg-gray-50/50 flex items-center justify-between text-[6px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-2.5 h-2.5 text-gray-400" />
                        Cut along dashed line &bull; Size: 20.00 × 4.78 cm &bull; Slip #{pass.passNumber} of {pass.totalPasses}
                      </span>
                      <span>Afrique Con Transit Network</span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 no-print border-t border-gray-200 pt-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
        >
          <Home className="h-4 w-4" />
          <span>{t('ticket.bookAnother')}</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-stone-950 px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 text-sm shadow-md transition-all active:scale-97"
        >
          <Printer className="h-4 w-4" />
          <span>Print A4 Boarding Passes (20.00 × 4.78 cm Slips)</span>
        </button>
      </div>

    </div>
  );
}
