import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Search, 
  Plus, 
  MapPin, 
  Navigation,
  Globe
} from 'lucide-react';

export default function RoutesManager() {
  const { routes, addRoute, deleteRoute, deleteRoutes } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newRoute, setNewRoute] = useState({ origin: '', destination: '', price: '', duration: '', distance: '', type: 'Inter-city' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const filtered = routes.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.origin?.toLowerCase().includes(q) ||
      r.destination?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q)
    );
  });

  const allFilteredIds = filtered.map(r => r.id);
  const isAllSelected = filtered.length > 0 && filtered.every(r => selectedIds.includes(r.id));
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
    if (window.confirm(`Are you sure you want to delete ${count} selected route${count > 1 ? 's' : ''}?`)) {
      setIsProcessing(true);
      try {
        if (typeof deleteRoutes === 'function') {
          await deleteRoutes(selectedIds);
        } else {
          for (const id of selectedIds) {
            await deleteRoute(id);
          }
        }
        setSelectedIds([]);
      } catch (err) {
        alert(`Failed to delete routes: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSingleDelete = async (route) => {
    if (window.confirm(`Delete route ${route.origin} → ${route.destination}?`)) {
      try {
        await deleteRoute(route.id);
        setSelectedIds(prev => prev.filter(item => item !== route.id));
      } catch (err) {
        alert(err.message || 'Failed to delete route.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Transit Corridors & Routes</h2>
          <p className="text-gray-400 text-sm mt-0.5">Manage inter-city corridors and cross-border CEMAC/ECOWAS connections</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Add Route Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-slide-up">
          <h3 className="font-extrabold text-gray-900 mb-4 text-base">Register New Transit Route</h3>
          {error && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-bold">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Origin City</label>
              <input type="text" placeholder="e.g. Yaoundé (Quartier Fouda)" value={newRoute.origin}
                onChange={e => { setNewRoute(p => ({...p, origin: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Destination City</label>
              <input type="text" placeholder="e.g. Douala (Akwa)" value={newRoute.destination}
                onChange={e => { setNewRoute(p => ({...p, destination: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Transit Type</label>
              <select value={newRoute.type} onChange={e => setNewRoute(p => ({...p, type: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold">
                <option value="Inter-city">Domestic Inter-city</option>
                <option value="Cross-Border">Cross-Border (Passport Required)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Silver Base Price (FCFA)</label>
              <input type="number" placeholder="e.g. 6000" value={newRoute.price}
                onChange={e => { setNewRoute(p => ({...p, price: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Estimated Duration</label>
              <input type="text" placeholder="e.g. 3h 30m" value={newRoute.duration}
                onChange={e => setNewRoute(p => ({...p, duration: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Distance</label>
              <input type="text" placeholder="e.g. 245 km" value={newRoute.distance}
                onChange={e => setNewRoute(p => ({...p, distance: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium placeholder:text-gray-400"/>
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm font-bold px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95">Save Corridor</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Bulk Action Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search origin, destination, or corridor type..."
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
            Total <strong className="text-gray-700">{filtered.length}</strong> active routes configured
          </div>
        )}
      </div>

      {/* Routes Table */}
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
                <th className="px-4 py-3.5">Transit Type</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Distance</th>
                <th className="px-4 py-3.5">Silver Price</th>
                <th className="px-4 py-3.5">Gold VIP+</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(route => {
                const isSelected = selectedIds.includes(route.id);
                return (
                  <tr 
                    key={route.id} 
                    className={`transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50/70'}`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectRow(route.id)}
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
                      <p className="font-extrabold text-gray-900 text-xs">{route.origin} → {route.destination}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {route.id}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        route.type === 'Cross-Border' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {route.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 text-xs font-medium">{route.duration}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs font-medium">{route.distance}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 text-xs">{(route.price || 0).toLocaleString()} FCFA</td>
                    <td className="px-4 py-3.5 font-black text-red-600 text-xs">{((route.price || 0) * 2.5).toLocaleString()} FCFA</td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSingleDelete(route)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Route"
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
              No matching routes found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
