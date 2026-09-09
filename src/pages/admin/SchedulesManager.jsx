import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isNigeriaDestination, isTuesdayOrFriday } from '../../context/FleetContext';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export default function SchedulesManager() {
  const { schedules, routes, buses, addSchedule, deleteSchedule, deleteSchedules, updateSchedule } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    routeId: '', busId: '', departureDate: new Date().toISOString().split('T')[0], departureTime: '08:00', arrivalTime: '12:00'
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'Cancelled') return 'bg-red-50 text-red-600 border border-red-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  };

  const filtered = schedules.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const route = routes.find(r => r.id === s.routeId);
    const bus = buses.find(b => b.id === s.busId);
    return (
      s.departureDate?.toLowerCase().includes(q) ||
      s.departureTime?.includes(q) ||
      route?.origin?.toLowerCase().includes(q) ||
      route?.destination?.toLowerCase().includes(q) ||
      bus?.plate?.toLowerCase().includes(q) ||
      bus?.name?.toLowerCase().includes(q) ||
      s.status?.toLowerCase().includes(q)
    );
  });

  const allFilteredIds = filtered.map(s => s.id);
  const isAllSelected = filtered.length > 0 && filtered.every(s => selectedIds.includes(s.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (window.confirm(`Are you sure you want to delete ${count} selected schedule${count > 1 ? 's' : ''}?`)) {
      setIsProcessing(true);
      try {
        if (typeof deleteSchedules === 'function') {
          await deleteSchedules(selectedIds);
        } else {
          for (const id of selectedIds) {
            await deleteSchedule(id);
          }
        }
        setSelectedIds([]);
      } catch (err) {
        alert(`Failed to delete schedules: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBatchUpdateStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await updateSchedule(id, { status: newStatus });
      }
      setSelectedIds([]);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleDelete = async (scheduleId) => {
    if (window.confirm('Delete this departure schedule?')) {
      try {
        await deleteSchedule(scheduleId);
        setSelectedIds(prev => prev.filter(item => item !== scheduleId));
      } catch (err) {
        alert(err.message || 'Failed to delete schedule.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Departure Schedules</h2>
          <p className="text-gray-400 text-sm mt-0.5">Create and manage bus departure times across transit hubs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-slide-up">
          <h3 className="font-extrabold text-gray-900 mb-4 text-base">New Departure Schedule</h3>
          
          {isNigeriaRoute && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Nigeria Service Policy:</span> Direct bus lines to Nigeria only depart on <strong>Tuesdays</strong> and <strong>Fridays</strong>.
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-bold">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Route</label>
              <select value={newSchedule.routeId} onChange={e => { setNewSchedule(p => ({...p, routeId: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold">
                <option value="" className="bg-white text-gray-900">Select corridor route...</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id} className="bg-white text-gray-900">
                    {r.origin} → {r.destination} {isNigeriaDestination(r.destination) ? '(Tue & Fri Only)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assigned Bus</label>
              <select value={newSchedule.busId} onChange={e => { setNewSchedule(p => ({...p, busId: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold">
                <option value="" className="bg-white text-gray-900">Select bus coach...</option>
                {buses.filter(b => b.status === 'Active').map(b => (
                  <option key={b.id} value={b.id} className="bg-white text-gray-900">
                    {b.plate || b.name} ({b.capacity} seats • {b.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Departure Date</label>
              <input type="date" value={newSchedule.departureDate} onChange={e => { setNewSchedule(p => ({...p, departureDate: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Departure Time</label>
              <input type="time" value={newSchedule.departureTime} onChange={e => setNewSchedule(p => ({...p, departureTime: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Arrival Time</label>
              <input type="time" value={newSchedule.arrivalTime} onChange={e => setNewSchedule(p => ({...p, arrivalTime: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"/>
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm font-bold px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95">Create Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Bulk Actions Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search date, origin, bus plate, or status..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-red-400"
          />
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end animate-fade-in">
            <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {selectedIds.length} Selected
            </span>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBatchUpdateStatus('Completed')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Mark Completed
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBatchUpdateStatus('Cancelled')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Mark Cancelled
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-gray-700 px-2 py-1 text-xs font-semibold"
            >
              Deselect All
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-medium">
            Total <strong className="text-gray-700">{filtered.length}</strong> departure trips scheduled
          </div>
        )}
      </div>

      {/* Schedules Table */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/70">
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center mx-auto"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-600" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-red-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Corridor Route</th>
                <th className="px-4 py-3.5">Assigned Bus</th>
                <th className="px-4 py-3.5">Departure Date</th>
                <th className="px-4 py-3.5">Departure</th>
                <th className="px-4 py-3.5">Arrival</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(schedule => {
                const route = routes.find(r => r.id === schedule.routeId);
                const bus = buses.find(b => b.id === schedule.busId);
                const isSelected = selectedIds.includes(schedule.id);

                return (
                  <tr 
                    key={schedule.id} 
                    className={`transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50/70'}`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectRow(schedule.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center mx-auto"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-red-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-extrabold text-gray-900 text-xs">{route ? `${route.origin} → ${route.destination}` : '—'}</p>
                      {route?.type === 'Cross-Border' && (
                        <span className="text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          Cross-Border
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-gray-700 font-medium text-xs">
                      <p className="font-bold text-gray-900">{bus?.plate || bus?.name || 'Unassigned'}</p>
                      <p className="text-[10px] text-gray-400">{bus?.capacity || 70} Seats &bull; {bus?.type || 'Coach'}</p>
                    </td>

                    <td className="px-4 py-3.5 text-gray-800 font-semibold text-xs">{schedule.departureDate}</td>
                    <td className="px-4 py-3.5 font-mono text-red-600 font-black text-xs">{schedule.departureTime}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-500 font-medium text-xs">{schedule.arrivalTime}</td>
                    
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => cycleStatus(schedule.id, schedule.status || 'Scheduled')}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer hover:opacity-80 transition-opacity ${statusStyle(schedule.status || 'Scheduled')}`}
                        title="Click to cycle status"
                      >
                        {schedule.status || 'Scheduled'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSingleDelete(schedule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No matching departure schedules found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
