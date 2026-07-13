import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function Manifests() {
  const { schedules, routes, bookings } = useApp();
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const selectedRoute = selectedSchedule ? routes.find(r => r.id === selectedSchedule.routeId) : null;

  const manifestBookings = selectedScheduleId
    ? bookings.filter(b => b.scheduleId === selectedScheduleId && b.checkInStatus !== 'Cancelled')
    : [];

  const getScheduleLabel = (schedule) => {
    const route = routes.find(r => r.id === schedule.routeId);
    if (!route) return schedule.id;
    return `${route.origin} → ${route.destination}`;
  };

  const getPassengerCount = (scheduleId) => {
    return bookings
      .filter(b => b.scheduleId === scheduleId && b.checkInStatus !== 'Cancelled')
      .reduce((sum, b) => sum + b.seats.length, 0);
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Border Manifests</h2>
        <p className="text-gray-400 text-sm mt-1">Prepare and export passenger manifests for drivers and border control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Trip List */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-white/50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SELECT TRIP</p>
          </div>
          <div className="divide-y divide-gray-100">
            {schedules.map(schedule => {
              const route = routes.find(r => r.id === schedule.routeId);
              const count = getPassengerCount(schedule.id);
              const isCrossBorder = route?.type === 'Cross-Border';
              return (
                <button
                  key={schedule.id}
                  onClick={() => setSelectedScheduleId(schedule.id)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${selectedScheduleId === schedule.id ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-gray-900 text-sm">
                      {route ? `${route.origin} → ${route.destination}` : schedule.id}
                    </p>
                    {isCrossBorder && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">CROSS-BORDER</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      {schedule.departureDate} &nbsp; {schedule.departureTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manifest View */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
          {!selectedScheduleId ? (
            <div className="flex flex-col items-center justify-center h-full min-h-64 text-gray-400 p-8">
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-500">Select a trip</p>
              <p className="text-sm text-gray-400 mt-1 text-center">Choose a trip from the list to preview its passenger manifest.</p>
            </div>
          ) : (
            <div>
              {/* Manifest Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedRoute ? `${selectedRoute.origin} → ${selectedRoute.destination}` : '—'}
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {selectedSchedule?.departureDate} · {selectedSchedule?.departureTime}
                    &nbsp;·&nbsp; {manifestBookings.reduce((s, b) => s + b.seats.length, 0)} passenger(s)
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                  Print
                </button>
              </div>

              {/* Passenger Table */}
              {manifestBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No passengers on this trip yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3">#</th>
                      <th className="text-left px-6 py-3">Passenger</th>
                      <th className="text-left px-6 py-3">Phone</th>
                      <th className="text-left px-6 py-3">Class</th>
                      <th className="text-left px-6 py-3">Seat(s)</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {manifestBookings.map((b, i) => (
                      <tr key={b.id} className="hover:bg-gray-50/20 transition-colors">
                        <td className="px-6 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">{b.passengerName}</td>
                        <td className="px-6 py-3.5 text-gray-500">{b.phone}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            b.travelClass === 'Gold' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                            {b.travelClass || 'Silver'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 font-mono text-xs">{b.seats.join(', ')}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            b.checkInStatus === 'Checked-In' || b.checkInStatus === 'Boarded' || b.checkInStatus === 'Confirmed'
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                            {b.checkInStatus?.toLowerCase() || 'confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
