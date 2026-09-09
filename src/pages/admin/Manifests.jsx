import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Printer, 
  FileText, 
  Bus as BusIcon, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Users, 
  Download, 
  Search,
  CheckCircle,
  FileCheck,
  Building
} from 'lucide-react';

export default function Manifests() {
  const { schedules, routes, buses, bookings } = useApp();
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Default to first schedule if none selected
  const activeScheduleId = selectedScheduleId || (schedules.length > 0 ? schedules[0].id : null);
  const selectedSchedule = schedules.find(s => s.id === activeScheduleId);
  const selectedRoute = selectedSchedule ? routes.find(r => r.id === selectedSchedule.routeId) : null;
  const selectedBus = selectedSchedule ? buses.find(b => b.id === selectedSchedule.busId) : null;

  // Filter bookings for this schedule
  const rawManifestBookings = activeScheduleId
    ? bookings.filter(b => b.scheduleId === activeScheduleId && b.checkInStatus !== 'Cancelled')
    : [];

  // Expand multi-seat bookings into individual passenger manifest rows
  const manifestPassengers = [];
  rawManifestBookings.forEach((b) => {
    const seats = Array.isArray(b.seats) ? b.seats : typeof b.seats === 'string' ? b.seats.split(',').map(s => s.trim()) : ['1A'];
    const names = b.passengers && Array.isArray(b.passengers) && b.passengers.length > 0
      ? b.passengers.map(p => p.name || p.passengerName)
      : (b.passengerName || 'Passenger').split(',').map(n => n.trim());
    const passports = b.passengers && Array.isArray(b.passengers) && b.passengers.length > 0
      ? b.passengers.map(p => p.passportNumber)
      : (b.passportNumber || '').split(',').map(p => p.trim());

    seats.forEach((seat, idx) => {
      manifestPassengers.push({
        id: `${b.id}-${seat}`,
        bookingRef: b.id,
        seatNumber: seat,
        passengerName: names[idx] || names[0] || b.passengerName || 'Passenger',
        passportNumber: passports[idx] || passports[0] || b.passportNumber || 'N/A',
        phone: b.phone || '—',
        travelClass: b.travelClass || 'Gold VIP+',
        paymentStatus: b.paymentStatus || 'Paid',
        checkInStatus: b.checkInStatus || 'Confirmed'
      });
    });
  });

  // Sort passengers by seat number
  manifestPassengers.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' }));

  const getPassengerCount = (scheduleId) => {
    return bookings
      .filter(b => b.scheduleId === scheduleId && b.checkInStatus !== 'Cancelled')
      .reduce((sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : (b.seats ? 1 : 0)), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedSchedule || manifestPassengers.length === 0) return;
    const headers = ['Seat', 'Passenger Name', 'National ID / Passport', 'Phone', 'Class', 'Booking Ref', 'Status'];
    const rows = manifestPassengers.map(p => [
      p.seatNumber,
      `"${p.passengerName}"`,
      `"${p.passportNumber}"`,
      `"${p.phone}"`,
      p.travelClass,
      p.bookingRef,
      p.checkInStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [`TRIP MANIFEST: ${selectedRoute?.origin || ''} to ${selectedRoute?.destination || ''}`,
       `DATE: ${selectedSchedule.departureDate} ${selectedSchedule.departureTime} | BUS: ${selectedBus?.plate || selectedBus?.name || ''}`,
       headers.join(','),
       ...rows.map(e => e.join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Manifest_${selectedSchedule.id}_${selectedSchedule.departureDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSchedules = schedules.filter(s => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const r = routes.find(rt => rt.id === s.routeId);
    const b = buses.find(bs => bs.id === s.busId);
    return (
      s.departureDate?.includes(q) ||
      s.departureTime?.includes(q) ||
      r?.origin?.toLowerCase().includes(q) ||
      r?.destination?.toLowerCase().includes(q) ||
      b?.plate?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Screen Header (Hidden on Print) */}
      <div className="flex items-start justify-between flex-wrap gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Border & Departure Manifests</h2>
              <p className="text-gray-400 text-xs font-medium">Official passenger trip manifests for conductors, terminal dispatchers, and border immigration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-red-500 hover:bg-red-600 text-white font-black px-5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Manifest (A4)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Col: Trip Selector (Hidden on Print) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden no-print">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter trips by date or city..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-red-400 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Select Departure Trip</span>
              <span>{filteredSchedules.length} Trips</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
            {filteredSchedules.map(schedule => {
              const route = routes.find(r => r.id === schedule.routeId);
              const bus = buses.find(b => b.id === schedule.busId);
              const count = getPassengerCount(schedule.id);
              const isCrossBorder = route?.type === 'Cross-Border';
              const isSelected = (activeScheduleId === schedule.id);

              return (
                <button
                  key={schedule.id}
                  onClick={() => setSelectedScheduleId(schedule.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50/80 transition-all flex items-start justify-between gap-2 ${
                    isSelected ? 'bg-red-50/70 border-l-4 border-red-500 shadow-inner' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-gray-900 text-xs truncate">
                        {route ? `${route.origin} → ${route.destination}` : schedule.id}
                      </span>
                      {isCrossBorder && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                          CROSS-BORDER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1 text-gray-600 font-semibold">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {schedule.departureDate} &bull; {schedule.departureTime}
                      </span>
                      <span>&bull;</span>
                      <span className="text-gray-500">{bus?.plate || 'Coach'}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-black px-2 py-0.5 rounded-lg inline-block">
                      {count} Pax
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Official Manifest Document (Visible on Screen AND 100% Isolated for @media print) */}
        <div className="lg:col-span-8">
          
          <div className="printable-area bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* Manifest Official Branding & Header */}
            <div className="border-b-2 border-gray-900 pb-4 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0">
                    AC
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-gray-950 uppercase tracking-tight">
                      AFRIQUE CON EXPRESS &bull; TRIP PASSENGER MANIFEST
                    </h1>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">
                      CEMAC & ECOWAS INTER-STATE CROSS-BORDER TRANSIT PERMIT & MANIFEST REGISTRATION
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">DOCUMENT REF:</span>
                  <span className="font-mono font-black text-xs text-red-600 block">MAN-{selectedSchedule?.id || 'AUTO'}</span>
                  <span className="text-[9px] text-gray-400 font-mono block">PRINTED: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Trip & Coach Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-200 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70">
                  <span className="text-[9px] font-black text-gray-400 uppercase block">CORRIDOR ROUTE</span>
                  <span className="font-black text-gray-900 text-xs block truncate">
                    {selectedRoute ? `${selectedRoute.origin} ➔ ${selectedRoute.destination}` : 'Direct Service'}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70">
                  <span className="text-[9px] font-black text-gray-400 uppercase block">DEPARTURE DATE & TIME</span>
                  <span className="font-bold text-gray-900 text-xs block">
                    {selectedSchedule?.departureDate} &bull; <strong className="text-red-600">{selectedSchedule?.departureTime}</strong>
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70">
                  <span className="text-[9px] font-black text-gray-400 uppercase block">ASSIGNED COACH / VEHICLE</span>
                  <span className="font-black text-gray-900 text-xs block">
                    {selectedBus?.plate || 'LT-8891-A'} ({selectedBus?.capacity || 70} Seats)
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70">
                  <span className="text-[9px] font-black text-gray-400 uppercase block">PASSENGERS ONBOARD</span>
                  <span className="font-black text-red-600 text-xs block">
                    {manifestPassengers.length} Total Checked ({selectedBus?.capacity ? `${Math.round((manifestPassengers.length / selectedBus.capacity) * 100)}% Load` : 'Active'})
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger Manifest Table */}
            {manifestPassengers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No active bookings recorded for this scheduled trip yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-[10px] font-black text-gray-600 uppercase tracking-wider bg-gray-100/80">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3 w-14">Seat</th>
                      <th className="py-2.5 px-3">Passenger Full Name</th>
                      <th className="py-2.5 px-3">Passport / National ID</th>
                      <th className="py-2.5 px-3">Contact Phone</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Ref ID</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {manifestPassengers.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-black text-red-600">{p.seatNumber}</td>
                        <td className="py-2 px-3 font-bold text-gray-950 capitalize">{p.passengerName}</td>
                        <td className="py-2 px-3 font-mono text-gray-700">{p.passportNumber || 'Cameroon CNI'}</td>
                        <td className="py-2 px-3 text-gray-600 font-mono">{p.phone}</td>
                        <td className="py-2 px-3 text-gray-700 font-semibold">{p.travelClass}</td>
                        <td className="py-2 px-3 font-mono text-[10px] text-gray-500">{p.bookingRef}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-bold text-emerald-700 text-[10px] uppercase">
                            ✓ {p.checkInStatus || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Border Control & Conductor Sign-off Section */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300 grid grid-cols-3 gap-6 text-xs">
              <div className="border border-dashed border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">1. BUS DRIVER / CONDUCTOR</span>
                <div className="border-b border-gray-400 w-full mb-1"></div>
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Signature & Date</span>
                  <span>Afrique Con Staff</span>
                </div>
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">2. TERMINAL DISPATCH MASTER</span>
                <div className="border-b border-gray-400 w-full mb-1"></div>
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Stamp & Clearance</span>
                  <span>Akwa / Fouda Hub</span>
                </div>
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-3 h-28 flex flex-col justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">3. BORDER IMMIGRATION POLICE</span>
                <div className="border-b border-gray-400 w-full mb-1"></div>
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Official Entry/Exit Stamp</span>
                  <span>Border Post</span>
                </div>
              </div>
            </div>

            {/* Print Footer Note */}
            <div className="mt-4 text-center text-[9px] text-gray-400 font-mono">
              Afrique Con Transit & Logistics Network &bull; CEMAC Transport Protocol No. 849/2026 &bull; Page 1 of 1
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
