import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function AgentConsole() {
  const { bookings, schedules, routes, buses, addBooking, updateBooking, currentUser } = useApp();
  const navigate = useNavigate();
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [form, setForm] = useState({ scheduleId: '', passengerName: '', phone: '', seats: '1', travelClass: 'Silver', paymentMethod: 'Cash' });
  const [msg, setMsg] = useState('');

  const agentBookings = bookings.filter(b => b.bookingType === 'agent' || b.bookingType === 'walk-in');
  const confirmedTickets = agentBookings.filter(b => b.checkInStatus === 'Confirmed' || b.checkInStatus === 'Checked-In');
  const agentRevenue = agentBookings.filter(b => b.paymentStatus === 'Paid' || b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const getRoute = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
    return { schedule, route };
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    if (!form.scheduleId || !form.passengerName.trim() || !form.phone.trim()) {
      setMsg('Please fill in all fields.'); return;
    }
    const { route } = getRoute(form.scheduleId);
    const seatCount = parseInt(form.seats) || 1;
    const basePrice = (route?.price || 10) * (form.travelClass === 'Gold' ? 2.5 : 1);

    try {
      await addBooking({
        scheduleId: form.scheduleId,
        passengerName: form.passengerName,
        phone: form.phone,
        seats: Array.from({ length: seatCount }, (_, i) => `A${i + 1}`),
        travelClass: form.travelClass === 'Gold' ? 'Gold VIP+' : 'Silver',
        paymentMethod: form.paymentMethod,
        paymentStatus: 'Paid',
        checkInStatus: 'Confirmed',
        totalAmount: basePrice * seatCount,
        bookingType: 'walk-in',
        agentId: currentUser?.id,
      });
      setMsg(`✓ Walk-in booking created for ${form.passengerName}`);
      setForm({ scheduleId: '', passengerName: '', phone: '', seats: '1', travelClass: 'Silver', paymentMethod: 'Cash' });
      setShowWalkInForm(false);
    } catch (err) {
      setMsg(`✕ Failed to create booking: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Agent Console</h2>
          <p className="text-gray-400 text-sm mt-1">Create walk-in bookings, manage support, and prepare manifests</p>
        </div>
        <button
          onClick={() => setShowWalkInForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          New Walk-in Booking
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border-green-500/20' : 'bg-red-50 text-red-600 border-red-500/20'}`}>
          {msg}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2l-4 5-4-5M8 14l2 2 4-4"/></svg>,
            iconBg: 'bg-amber-500/10',
            value: agentBookings.length,
            label: 'Agent Bookings',
          },
          {
            icon: <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
            iconBg: 'bg-green-500/10',
            value: confirmedTickets.length,
            label: 'Confirmed Tickets',
          },
          {
            icon: <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
            iconBg: 'bg-blue-500/10',
            value: `${agentRevenue.toLocaleString()} FCFA`,
            label: 'Revenue Collected',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-gray-900">
            <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4`}>{stat.icon}</div>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-gray-400 text-sm mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
            iconBg: 'bg-amber-500/10',
            label: 'Prepare Manifest',
            desc: 'Export border manifests for drivers',
            to: '/admin/manifests',
          },
          {
            icon: <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
            iconBg: 'bg-blue-500/10',
            label: 'Support Desk',
            desc: 'Handle passenger inquiries & issues',
            to: '/admin/support',
          },
          {
            icon: <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2l-4 5-4-5M8 14l2 2 4-4"/></svg>,
            iconBg: 'bg-purple-500/10',
            label: 'Manage Bookings',
            desc: 'View, update, and cancel reservations',
            to: '/admin/bookings',
          },
        ].map(card => (
          <a key={card.label} href={card.to} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all block group cursor-pointer text-gray-900">
            <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>{card.icon}</div>
            <p className="font-bold text-gray-900 mb-1">{card.label}</p>
            <p className="text-gray-400 text-sm">{card.desc}</p>
          </a>
        ))}
      </div>

      {/* Walk-in Form Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">New Walk-in Booking</h3>
              <button onClick={() => setShowWalkInForm(false)} className="text-gray-500 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleWalkIn} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Trip / Schedule</label>
                <select value={form.scheduleId} onChange={e => setForm(p => ({...p, scheduleId: e.target.value}))}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="" className="bg-white text-gray-900">Select trip...</option>
                  {schedules.map(s => {
                    const { route } = getRoute(s.id);
                    return route ? <option key={s.id} value={s.id} className="bg-white text-gray-900">{route.origin} → {route.destination} · {s.departureDate} {s.departureTime}</option> : null;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Passenger Name</label>
                <input type="text" value={form.passengerName} onChange={e => setForm(p => ({...p, passengerName: e.target.value}))}
                  placeholder="Full name" className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-600"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                  placeholder="+237 6 XX XX XX XX" className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-600"/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Seats</label>
                  <input type="number" min="1" max="10" value={form.seats} onChange={e => setForm(p => ({...p, seats: e.target.value}))}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Class</label>
                  <select value={form.travelClass} onChange={e => setForm(p => ({...p, travelClass: e.target.value}))}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option className="bg-white text-gray-900">Silver</option>
                    <option className="bg-white text-gray-900">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment</label>
                  <select value={form.paymentMethod} onChange={e => setForm(p => ({...p, paymentMethod: e.target.value}))}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option className="bg-white text-gray-900">Cash</option>
                    <option className="bg-white text-gray-900">MTN MoMo</option>
                    <option className="bg-white text-gray-900">Orange Money</option>
                  </select>
                </div>
              </div>
              {msg && !msg.startsWith('✓') && <p className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">{msg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWalkInForm(false)} className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2.5 rounded-xl text-sm transition-colors">Create Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Walk-in Bookings */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white/50">
          <h3 className="font-bold text-gray-900">Recent Walk-in Bookings</h3>
        </div>
        {agentBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No walk-in bookings yet. Use the button above to create one.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agentBookings.slice(0, 6).map(booking => {
              const { route, schedule } = getRoute(booking.scheduleId);
              return (
                <div key={booking.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/10 transition-colors">
                  <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2}/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{booking.passengerName}</p>
                    <p className="text-gray-400 text-xs">{booking.id}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-600 text-sm">{route ? `${route.origin} → ${route.destination}` : '—'}</p>
                    <p className="text-gray-400 text-xs">{schedule?.departureDate}</p>
                  </div>
                  <span className={`ml-4 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    booking.travelClass === 'Gold' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}>
                    {booking.travelClass || 'Silver'}
                  </span>
                  <span className="text-gray-900 font-bold text-sm flex-shrink-0">
                    {(booking.totalAmount || 0).toLocaleString()} FCFA
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
