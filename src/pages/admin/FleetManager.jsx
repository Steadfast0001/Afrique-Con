import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function FleetManager() {
  const { buses, addBus, updateBus, deleteBus } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newBus, setNewBus] = useState({ name: '', plate: '', type: 'Silver', capacity: 45, branch: 'Douala' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBus.name.trim() || !newBus.plate.trim()) { setError('Bus model and plate are required.'); return; }
    const cap = parseInt(newBus.capacity);
    if (isNaN(cap) || cap <= 0) { setError('Please specify a valid seat capacity.'); return; }
    try {
      await addBus({ name: newBus.name, plate: newBus.plate, type: newBus.type, capacity: cap, branch: newBus.branch });
      setNewBus({ name: '', plate: '', type: 'Silver', capacity: 45, branch: 'Douala' });
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to add bus.');
    }
  };

  const toggleStatus = async (busId, currentStatus) => {
    try {
      await updateBus(busId, { status: currentStatus === 'Active' ? 'Maintenance' : 'Active' });
    } catch (err) {
      alert(err.message || 'Failed to update bus status.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Fleet Management</h2>
          <p className="text-gray-400 text-sm mt-1">Register, configure, and maintain your bus fleet across all branches</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          Add Bus
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Register New Bus</h3>
          {error && <p className="text-red-400 text-sm mb-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Bus Model</label>
              <input type="text" placeholder="e.g. Toyota Coaster"
                value={newBus.name} onChange={e => { setNewBus(p => ({...p, name: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Plate Number</label>
              <input type="text" placeholder="e.g. CE-1234-AB"
                value={newBus.plate} onChange={e => { setNewBus(p => ({...p, plate: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Class</label>
              <select value={newBus.type} onChange={e => setNewBus(p => ({...p, type: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="Silver" className="bg-white text-gray-900">Silver</option>
                <option value="Gold" className="bg-white text-gray-900">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Seats</label>
              <input type="number" value={newBus.capacity} onChange={e => setNewBus(p => ({...p, capacity: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Branch</label>
              <select value={newBus.branch} onChange={e => setNewBus(p => ({...p, branch: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="Douala" className="bg-white text-gray-900">Douala</option>
                <option value="Yaoundé" className="bg-white text-gray-900">Yaoundé</option>
                <option value="Bamenda" className="bg-white text-gray-900">Bamenda</option>
                <option value="Bafoussam" className="bg-white text-gray-900">Bafoussam</option>
                <option value="Buea" className="bg-white text-gray-900">Buea</option>
                <option value="Limbe" className="bg-white text-gray-900">Limbe</option>
                <option value="Kumba" className="bg-white text-gray-900">Kumba</option>
                <option value="Garoua" className="bg-white text-gray-900">Garoua</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-3 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-stone-200 text-sm font-medium px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Register Bus</button>
            </div>
          </form>
        </div>
      )}

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all">

            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{bus.plate || bus.name}</p>
                  <p className="text-gray-400 text-xs">{bus.name}</p>
                </div>
              </div>
              <button
                onClick={() => toggleStatus(bus.id, bus.status)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                  bus.status === 'Active'
                    ? 'bg-green-50 text-green-700 border-green-500/20 hover:bg-green-500/20'
                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                }`}
              >
                {bus.status === 'Active' ? '✓ Active' : '⚙ Maintenance'}
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xl font-black text-gray-900">{bus.capacity}</p>
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">SEATS</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-sm font-black text-gray-900">{bus.type || 'Silver'}</p>
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">CLASS</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900 truncate">{bus.branch || 'Douala'}</p>
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">BRANCH</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200/60">
              <button className="flex items-center justify-center gap-1.5 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl py-2 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(`Remove ${bus.name}?`)) {
                    try {
                      await deleteBus(bus.id);
                    } catch (err) {
                      alert(err.message || 'Failed to remove bus.');
                    }
                  }
                }}
                className="flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 border border-red-950/40 hover:bg-red-950/20 rounded-xl py-2 text-xs font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Remove
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
