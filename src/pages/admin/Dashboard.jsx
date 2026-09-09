import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon, iconBg, value, label, sub, trend, trendUp }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
              </svg>
            )}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { bookings, buses, routes, schedules } = useApp();
  const navigate = useNavigate();

  const activeBookings = bookings.filter(b => b.checkInStatus !== 'Cancelled');
  const paidBookings = activeBookings.filter(b => b.paymentStatus === 'Paid' || b.paymentStatus === 'paid');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeBuses = buses.filter(b => b.status === 'Active').length;
  const maintenanceBuses = buses.filter(b => b.status === 'Maintenance').length;

  const getTripDetails = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
    return { schedule, route };
  };

  // Revenue simulation data (weekly)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueData = [420, 385, 510, 490, 760, 920, 850];
  const maxRevenue = Math.max(...revenueData);

  // Top routes by bookings
  const routeBookingCounts = {};
  activeBookings.forEach(b => {
    const { route } = getTripDetails(b.scheduleId);
    if (route) {
      const key = `${route.origin} → ${route.destination}`;
      const seatCount = Array.isArray(b.seats) ? b.seats.length : (b.seats ? 1 : 0);
      routeBookingCounts[key] = (routeBookingCounts[key] || 0) + seatCount;
    }
  });
  const topRoutes = Object.entries(routeBookingCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxCount = topRoutes.length > 0 ? topRoutes[0][1] : 1;

  return (
    <div className="space-y-6">

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          iconBg="bg-red-500/10 text-red-400"
          icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          value={`${totalRevenue.toLocaleString()} FCFA`}
          label="Revenue (Paid)"
          sub="vs. last week"
          trend="12.5%"
          trendUp={true}
        />
        <StatCard
          iconBg="bg-blue-500/10 text-blue-400"
          icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2l-4 5-4-5M8 14l2 2 4-4"/></svg>}
          value={activeBookings.length}
          label="Total Bookings"
          sub="vs. last week"
          trend="8.2%"
          trendUp={true}
        />
        <StatCard
          iconBg="bg-green-500/10 text-green-400"
          icon={<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11h18"/></svg>}
          value={activeBuses}
          label="Active Fleet"
          sub={`${maintenanceBuses} in maintenance`}
          trend="4.1%"
          trendUp={true}
        />
        <StatCard
          iconBg="bg-purple-500/10 text-purple-400"
          icon={<svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18"/></svg>}
          value={schedules.length}
          label="Scheduled Trips"
          sub="1 cancelled today"
          trend="2.3%"
          trendUp={false}
        />
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-gray-900 font-bold text-base">Revenue Overview</h3>
              <p className="text-gray-400 text-xs mt-0.5">Daily revenue from paid bookings</p>
            </div>
            <span className="text-green-600 text-xs font-bold flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              +12.5% this week
            </span>
          </div>
          <div className="mt-6">
            {/* SVG Area Chart — works reliably in all layouts */}
            <svg
              viewBox="0 0 700 160"
              preserveAspectRatio="none"
              className="w-full h-40"
              aria-label="Revenue overview chart"
            >
              {/* Y-axis grid lines */}
              {[0, 1, 2, 3].map(i => (
                <line
                  key={i}
                  x1="0" y1={i * 40} x2="700" y2={i * 40}
                  stroke="#e5e7eb" strokeWidth="1"
                />
              ))}
              {/* Area fill */}
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              {(() => {
                const W = 700, H = 140, pad = 50;
                const pts = revenueData.map((v, i) => {
                  const x = pad + (i * (W - pad * 2)) / (revenueData.length - 1);
                  const y = H - (v / maxRevenue) * (H - 10) - 4;
                  return `${x},${y}`;
                });
                const polyline = pts.join(' ');
                const areaPath = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${700 - pad},${H} L${pad},${H} Z`;
                return (
                  <>
                    <path d={areaPath} fill="url(#revenueGrad)"/>
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data point dots */}
                    {revenueData.map((v, i) => {
                      const x = pad + (i * (W - pad * 2)) / (revenueData.length - 1);
                      const y = H - (v / maxRevenue) * (H - 10) - 4;
                      return <circle key={i} cx={x} cy={y} r="3.5" fill="#ef4444" stroke="white" strokeWidth="2"/>;
                    })}
                  </>
                );
              })()}
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between px-[50px] mt-1">
              {weekDays.map(d => (
                <span key={d} className="text-[10px] font-semibold text-gray-400">{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Routes Donut-style */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-gray-900 font-bold text-base mb-1">Top Routes</h3>
          <p className="text-gray-400 text-xs mb-5">Bookings by route this week</p>
          <div className="space-y-4">
            {topRoutes.length === 0 ? (
              <p className="text-gray-400 text-sm">No booking data yet.</p>
            ) : topRoutes.map(([route, count], i) => {
              const colors = ['bg-red-500', 'bg-teal-500', 'bg-blue-500', 'bg-purple-500'];
              return (
                <div key={route}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium truncate pr-2">{route}</span>
                    <span className="text-gray-400 font-bold flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[i % colors.length]} rounded-full`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== RECENT BOOKINGS TABLE ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900 font-bold text-base">Recent Bookings</h3>
          <button onClick={() => navigate('/admin/bookings')} className="text-red-600 hover:text-red-500 text-xs font-semibold transition-colors">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-6 py-3">Reference</th>
                <th className="text-left px-6 py-3">Passenger</th>
                <th className="text-left px-6 py-3">Route</th>
                <th className="text-left px-6 py-3">Class</th>
                <th className="text-left px-6 py-3">Amount</th>
                <th className="text-left px-6 py-3">Payment</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.slice(0, 6).map(booking => {
                const { route } = getTripDetails(booking.scheduleId);
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-red-600 text-xs">{booking.id}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{booking.passengerName}</p>
                      <p className="text-gray-400 text-xs">{booking.phone}</p>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-sm">
                      {route ? `${route.origin} → ${route.destination}` : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        booking.travelClass === 'Gold' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {booking.travelClass || 'Silver'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {(booking.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.paymentStatus === 'Paid' || booking.paymentStatus === 'paid'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {booking.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
