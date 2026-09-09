import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isNigeriaDestination, isTuesdayOrFriday } from '../../context/FleetContext';

export default function SchedulesManager() {
  const { schedules, routes, buses, addSchedule, deleteSchedule, updateSchedule } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    routeId: '', busId: '', departureDate: new Date().toISOString().split('T')[0], departureTime: '08:00', arrivalTime: '12:00'
  });
  const [error, setError] = useState('');

  const selectedRoute = routes.find(r => r.id === newSchedule.routeId);
  const isNigeriaRoute = selectedRoute && isNigeriaDestination(selectedRoute.destination);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSchedule.routeId || !newSchedule.busId) { setError('Please select both a route and a bus.'); return; }
    
    if (isNigeriaRoute && !isTuesdayOrFriday(newSchedule.departureDate)) {
      setError('Direct bus lines from Cameroon to Nigeria depart strictly on Tuesdays and Fridays only.');
      return;
    }

    try {
      await addSchedule({ ...newSchedule });
      setNewSchedule({ routeId: '', busId: '', departureDate: new Date().toISOString().split('T')[0], departureTime: '08:00', arrivalTime: '12:00' });
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add schedule.');
    }
  };

  const cycleStatus = async (scheduleId, currentStatus) => {
    const next = currentStatus === 'Scheduled' ? 'Completed' : currentStatus === 'Completed' ? 'Cancelled' : 'Scheduled';
    try {
      await updateSchedule(scheduleId, { status: next });
    } catch (err) {
      alert(err.message || 'Failed to update schedule status.');
    }
  };

  const statusStyle = (status) => {
    if (status === 'Completed') return 'bg-green-50 text-green-700 border border-green-200';
    if (status === 'Cancelled') return 'bg-red-50 text-red-600 border border-red-200';
    return 'bg-blue-50 text-blue-600 border border-blue-200';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Schedules</h2>
          <p className="text-gray-400 text-sm mt-1">Create and manage trip departure schedules</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          Add Schedule
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">New Departure Schedule</h3>
          
          {isNigeriaRoute && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-medium">
              <span className="font-bold">⚠️ Nigeria Service Rule:</span> Direct bus lines from Cameroon to Nigeria only operate on <strong>Tuesdays</strong> and <strong>Fridays</strong>.
            </div>
          )}

          {error && <p className="text-red-400 text-sm mb-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Route</label>
              <select value={newSchedule.routeId} onChange={e => { setNewSchedule(p => ({...p, routeId: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="" className="bg-white text-gray-900">Select route...</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id} className="bg-white text-gray-900">
                    {r.origin} → {r.destination} {isNigeriaDestination(r.destination) ? '(Tue & Fri Only)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Assigned Bus</label>
              <select value={newSchedule.busId} onChange={e => { setNewSchedule(p => ({...p, busId: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="" className="bg-white text-gray-900">Select bus...</option>
                {buses.filter(b => b.status === 'Active').map(b => <option key={b.id} value={b.id} className="bg-white text-gray-900">{b.plate || b.name} ({b.capacity} seats)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Departure Date</label>
              <input type="date" value={newSchedule.departureDate} onChange={e => { setNewSchedule(p => ({...p, departureDate: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Departure Time</label>
              <input type="time" value={newSchedule.departureTime} onChange={e => setNewSchedule(p => ({...p, departureTime: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Arrival Time</label>
              <input type="time" value={newSchedule.arrivalTime} onChange={e => setNewSchedule(p => ({...p, arrivalTime: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"/>
            </div>
            <div className="col-span-2 sm:col-span-3 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-600 text-sm font-medium px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Create Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-6 py-4">Route</th>
                <th className="text-left px-6 py-4">Bus</th>
                <th className="text-left px-6 py-4">Date</th>
                <th className="text-left px-6 py-4">Departure</th>
                <th className="text-left px-6 py-4">Arrival</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map(schedule => {
                const route = routes.find(r => r.id === schedule.routeId);
                const bus = buses.find(b => b.id === schedule.busId);
                return (
                  <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{route ? `${route.origin} → ${route.destination}` : '—'}</p>
                      {route?.type === 'Cross-Border' && (
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">Cross-Border</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{bus?.plate || bus?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{schedule.departureDate}</td>
                    <td className="px-6 py-4 font-mono text-gray-900 font-semibold">{schedule.departureTime}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{schedule.arrivalTime}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => cycleStatus(schedule.id, schedule.status || 'Scheduled')}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${statusStyle(schedule.status || 'Scheduled')}`}
                      >
                        {schedule.status || 'Scheduled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this schedule?')) {
                            try {
                              await deleteSchedule(schedule.id);
                            } catch (err) {
                              alert(err.message || 'Failed to delete schedule.');
                            }
                          }
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="text-center py-16 text-gray-400">No schedules yet. Add your first schedule above.</div>
          )}
        </div>
      </div>

    </div>
  );
}
