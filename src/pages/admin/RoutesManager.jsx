import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function RoutesManager() {
  const { routes, addRoute, deleteRoute } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newRoute, setNewRoute] = useState({ origin: '', destination: '', price: '', duration: '', distance: '', type: 'Inter-city' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoute.origin.trim() || !newRoute.destination.trim()) { setError('Origin and destination are required.'); return; }
    if (newRoute.origin.toLowerCase() === newRoute.destination.toLowerCase()) { setError('Origin and destination cannot be the same.'); return; }
    const priceNum = parseFloat(newRoute.price);
    if (isNaN(priceNum) || priceNum <= 0) { setError('Please specify a valid Silver class base price (in FCFA).'); return; }
    try {
      await addRoute({ origin: newRoute.origin, destination: newRoute.destination, price: priceNum, duration: newRoute.duration || '5h 00m', distance: newRoute.distance || '300 km', type: newRoute.type });
      setNewRoute({ origin: '', destination: '', price: '', duration: '', distance: '', type: 'Inter-city' });
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add route.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Routes</h2>
          <p className="text-gray-400 text-sm mt-1">Manage inter-city and cross-border transit routes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          Add Route
        </button>
      </div>

      {/* Add Route Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">New Transit Route</h3>
          {error && <p className="text-red-400 text-sm mb-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Origin City</label>
              <input type="text" placeholder="e.g. Yaoundé" value={newRoute.origin}
                onChange={e => { setNewRoute(p => ({...p, origin: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destination City</label>
              <input type="text" placeholder="e.g. Douala" value={newRoute.destination}
                onChange={e => { setNewRoute(p => ({...p, destination: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select value={newRoute.type} onChange={e => setNewRoute(p => ({...p, type: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="Inter-city" className="bg-white text-gray-900">Inter-city</option>
                <option value="Cross-Border" className="bg-white text-gray-900">Cross-Border</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Silver Price (FCFA)</label>
              <input type="number" placeholder="e.g. 5000" value={newRoute.price}
                onChange={e => { setNewRoute(p => ({...p, price: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duration</label>
              <input type="text" placeholder="e.g. 3h 30m" value={newRoute.duration}
                onChange={e => setNewRoute(p => ({...p, duration: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Distance</label>
              <input type="text" placeholder="e.g. 250 km" value={newRoute.distance}
                onChange={e => setNewRoute(p => ({...p, distance: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-stone-600"/>
            </div>
            <div className="col-span-2 sm:col-span-3 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-600 text-sm font-medium px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">Add Route</button>
            </div>
          </form>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-6 py-4">Route</th>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Duration</th>
                <th className="text-left px-6 py-4">Distance</th>
                <th className="text-left px-6 py-4">Silver Price</th>
                <th className="text-left px-6 py-4">Gold VIP+</th>
                <th className="text-left px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.map(route => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{route.origin} → {route.destination}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      route.type === 'Cross-Border' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}>
                      {route.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{route.duration}</td>
                  <td className="px-6 py-4 text-gray-500">{route.distance}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{(route.price || 0).toLocaleString()} FCFA</td>
                  <td className="px-6 py-4 font-bold text-red-600">{((route.price || 0) * 2.5).toLocaleString()} FCFA</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete route ${route.origin} → ${route.destination}?`)) {
                          try {
                            await deleteRoute(route.id);
                          } catch (err) {
                            alert(err.message || 'Failed to delete route.');
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
              ))}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="text-center py-16 text-gray-400">No routes yet. Add your first route above.</div>
          )}
        </div>
      </div>

    </div>
  );
}
