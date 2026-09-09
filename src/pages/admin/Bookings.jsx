import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function AdminBookings() {
  const { bookings, schedules, routes, updateBooking } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const getTripDetails = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
    return { schedule, route };
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.checkInStatus?.toLowerCase() === filter);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Bookings</h2>
          <p className="text-gray-400 text-sm mt-1">View and manage all passenger reservations across branches</p>
        </div>
        <div className="flex gap-2">
          {['all', 'confirmed', 'checked-in', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-6 py-4">Booking Ref</th>
                <th className="text-left px-6 py-4">Passenger</th>
                <th className="text-left px-6 py-4">Route</th>
                <th className="text-left px-6 py-4">Class</th>
                <th className="text-left px-6 py-4">Amount</th>
                <th className="text-left px-6 py-4">Payment</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(booking => {
                const { schedule, route } = getTripDetails(booking.scheduleId);
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-red-600 text-xs">{booking.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{booking.passengerName}</p>
                      <p className="text-gray-400 text-xs">{booking.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{route ? `${route.origin} → ${route.destination}` : '—'}</p>
                      <p className="text-xs text-gray-400">{schedule?.departureDate} · {schedule?.departureTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        booking.travelClass === 'Gold' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {booking.travelClass || 'Silver'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {(booking.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.paymentStatus === 'Paid' || booking.paymentStatus === 'paid'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {booking.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.checkInStatus === 'Checked-In' || booking.checkInStatus === 'Boarded' || booking.checkInStatus === 'Confirmed'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : booking.checkInStatus === 'Cancelled'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>
                        {booking.checkInStatus?.toLowerCase() || 'confirmed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">No bookings found.</div>
          )}
        </div>
      </div>

    </div>
  );
}
