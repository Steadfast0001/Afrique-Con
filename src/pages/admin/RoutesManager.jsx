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
  Globe,
  ArrowRight
} from 'lucide-react';

export const REGIONAL_TOWNS = {
  cameroon: [
    'Douala (Akwa)',
    'Douala (Bonabéri)',
    'Douala (Bassa)',
    'Yaoundé (Quartier Fouda)',
    'Yaoundé (Mvan)',
    'Yaoundé (Biyem-Assi)',
    'Buea (Mile 17)',
    'Limbe (Half Mile)',
    'Bafoussam (Gare Routière)',
    'Bamenda (Commercial Avenue)',
    'Kumba (Main Motor Park)',
    'Garoua (Terminal)',
    'Maroua (Main Hub)',
    'Ngaoundéré (Station)',
    'Kribi (Ocean Terminal)',
    'Bertoua (Central)',
    'Dschang (University Hub)',
    'Ebolowa (South Station)'
  ],
  nigeria: [
    'Ikom (Nigeria)',
    'Calabar (Nigeria)',
    'Enugu (Nigeria)',
    'Onitsha (Nigeria)',
    'Lagos (Nigeria)',
    'Port Harcourt (Nigeria)',
    'Abuja (Nigeria)',
    'Kano (Nigeria)'
  ],
  ecowas_cemac: [
    'Cotonou (Benin)',
    'Lomé (Togo)',
    'Accra (Ghana)',
    'Abidjan (Ivory Coast)',
    'Libreville (Gabon)',
    'N\'Djamena (Chad)',
    'Bangui (Central African Rep.)',
    'Malabo (Equatorial Guinea)',
    'Niamey (Niger)',
    'Ouagadougou (Burkina Faso)',
    'Bamako (Mali)',
    'Dakar (Senegal)'
  ]
};

export default function RoutesManager() {
  const { routes, addRoute, deleteRoute, deleteRoutes } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newRoute, setNewRoute] = useState({ 
    origin: '', 
    destination: '', 
    customOrigin: '',
    customDestination: '',
    price: '', 
    duration: '', 
    distance: '', 
    type: 'Inter-city' 
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to detect cross-border destinations
  const isCrossBorderLocation = (loc = '') => {
    const l = loc.toLowerCase();
    return (
      l.includes('nigeria') || l.includes('ikom') || l.includes('calabar') || 
      l.includes('enugu') || l.includes('onitsha') || l.includes('lagos') ||
      l.includes('benin') || l.includes('togo') || l.includes('ghana') ||
      l.includes('ivory coast') || l.includes('gabon') || l.includes('chad') ||
      l.includes('mali') || l.includes('senegal') || l.includes('guinea')
    );
  };

  const handleOriginChange = (val) => {
    const isCustom = val === '__custom__';
    const effectiveOrigin = isCustom ? newRoute.customOrigin : val;
    const dest = newRoute.destination === '__custom__' ? newRoute.customDestination : newRoute.destination;
    const isCross = isCrossBorderLocation(effectiveOrigin) || isCrossBorderLocation(dest);

    setNewRoute(p => ({
      ...p,
      origin: val,
      type: isCross ? 'Cross-Border' : 'Inter-city'
    }));
    setError('');
  };

  const handleDestinationChange = (val) => {
    const isCustom = val === '__custom__';
    const effectiveDest = isCustom ? newRoute.customDestination : val;
    const orig = newRoute.origin === '__custom__' ? newRoute.customOrigin : newRoute.origin;
    const isCross = isCrossBorderLocation(effectiveDest) || isCrossBorderLocation(orig);

    setNewRoute(p => ({
      ...p,
      destination: val,
      type: isCross ? 'Cross-Border' : 'Inter-city',
      price: isCross && !p.price ? '18000' : p.price || '6000',
      duration: isCross && !p.duration ? '6h 30m' : p.duration || '3h 30m',
      distance: isCross && !p.distance ? '310 km' : p.distance || '245 km'
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalOrigin = (newRoute.origin === '__custom__' ? newRoute.customOrigin : newRoute.origin).trim();
    const finalDestination = (newRoute.destination === '__custom__' ? newRoute.customDestination : newRoute.destination).trim();

    if (!finalOrigin || !finalDestination) {
      setError('Please select both an Origin city and a Destination city.');
      return;
    }
    if (finalOrigin.toLowerCase() === finalDestination.toLowerCase()) {
      setError('Origin and Destination cannot be the same city.');
      return;
    }
    const priceNum = parseFloat(newRoute.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please specify a valid Silver class base price (in FCFA).');
      return;
    }

    try {
      await addRoute({
        origin: finalOrigin,
        destination: finalDestination,
        price: priceNum,
        duration: newRoute.duration.trim() || (newRoute.type === 'Cross-Border' ? '6h 30m' : '3h 30m'),
        distance: newRoute.distance.trim() || (newRoute.type === 'Cross-Border' ? '310 km' : '245 km'),
        type: newRoute.type
      });

      setNewRoute({
        origin: '',
        destination: '',
        customOrigin: '',
        customDestination: '',
        price: '',
        duration: '',
        distance: '',
        type: 'Inter-city'
      });
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
          <p className="text-gray-400 text-sm mt-0.5">Configure inter-city hubs and cross-border CEMAC/ECOWAS connections</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Add Route Form with Dropdowns */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-slide-up">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Register New Transit Route</h3>
              <p className="text-gray-400 text-xs">Select origin and destination towns from the CEMAC/ECOWAS transit network</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
              newRoute.type === 'Cross-Border' 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {newRoute.type}
            </span>
          </div>

          {error && <p className="text-red-500 text-xs mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-bold">{error}</p>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Origin Town Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Origin City</span>
              </label>
              <select 
                value={newRoute.origin} 
                onChange={e => handleOriginChange(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
              >
                <option value="">-- Select Origin Town --</option>
                <optgroup label="🇨🇲 Cameroon Major Terminals">
                  {REGIONAL_TOWNS.cameroon.map(t => (
                    <option key={`orig-cm-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="🇳🇬 Nigeria Cross-Border Hubs">
                  {REGIONAL_TOWNS.nigeria.map(t => (
                    <option key={`orig-ng-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="🌍 CEMAC / ECOWAS West Africa">
                  {REGIONAL_TOWNS.ecowas_cemac.map(t => (
                    <option key={`orig-eco-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="✍️ Other / Custom Terminal">
                  <option value="__custom__">Custom Town (Type custom name...)</option>
                </optgroup>
              </select>

              {newRoute.origin === '__custom__' && (
                <input
                  type="text"
                  placeholder="Enter custom origin city name..."
                  value={newRoute.customOrigin}
                  onChange={e => {
                    setNewRoute(p => ({ ...p, customOrigin: e.target.value }));
                    setError('');
                  }}
                  className="mt-2 w-full border border-red-200 bg-white rounded-xl px-3.5 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                  autoFocus
                />
              )}
            </div>

            {/* Destination Town Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-red-500" />
                <span>Destination City</span>
              </label>
              <select 
                value={newRoute.destination} 
                onChange={e => handleDestinationChange(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
              >
                <option value="">-- Select Destination Town --</option>
                <optgroup label="🇨🇲 Cameroon Major Terminals">
                  {REGIONAL_TOWNS.cameroon.map(t => (
                    <option key={`dest-cm-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="🇳🇬 Nigeria Cross-Border Hubs">
                  {REGIONAL_TOWNS.nigeria.map(t => (
                    <option key={`dest-ng-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="🌍 CEMAC / ECOWAS West Africa">
                  {REGIONAL_TOWNS.ecowas_cemac.map(t => (
                    <option key={`dest-eco-${t}`} value={t}>{t}</option>
                  ))}
                </optgroup>
                <optgroup label="✍️ Other / Custom Terminal">
                  <option value="__custom__">Custom Town (Type custom name...)</option>
                </optgroup>
              </select>

              {newRoute.destination === '__custom__' && (
                <input
                  type="text"
                  placeholder="Enter custom destination city name..."
                  value={newRoute.customDestination}
                  onChange={e => {
                    setNewRoute(p => ({ ...p, customDestination: e.target.value }));
                    setError('');
                  }}
                  className="mt-2 w-full border border-red-200 bg-white rounded-xl px-3.5 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                  autoFocus
                />
              )}
            </div>

            {/* Transit Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-red-500" />
                <span>Transit Type</span>
              </label>
              <select 
                value={newRoute.type} 
                onChange={e => setNewRoute(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
              >
                <option value="Inter-city">Domestic Inter-city</option>
                <option value="Cross-Border">Cross-Border (Passport Required)</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Silver Base Price (FCFA)</label>
              <input 
                type="number" 
                placeholder="e.g. 6000" 
                value={newRoute.price}
                onChange={e => { setNewRoute(p => ({ ...p, price: e.target.value })); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold placeholder:text-gray-400"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Estimated Duration</label>
              <input 
                type="text" 
                placeholder="e.g. 3h 30m" 
                value={newRoute.duration}
                onChange={e => setNewRoute(p => ({ ...p, duration: e.target.value }))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium placeholder:text-gray-400"
              />
            </div>

            {/* Distance */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Distance</label>
              <input 
                type="text" 
                placeholder="e.g. 245 km" 
                value={newRoute.distance}
                onChange={e => setNewRoute(p => ({ ...p, distance: e.target.value }))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium placeholder:text-gray-400"
              />
            </div>

            <div className="col-span-1 sm:col-span-3 flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="text-gray-500 hover:text-gray-700 text-sm font-bold px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                Save Corridor Route
              </button>
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
