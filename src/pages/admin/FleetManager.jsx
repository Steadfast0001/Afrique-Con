import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Search, 
  Plus, 
  Bus as BusIcon, 
  Wrench, 
  CheckCircle2,
  Edit2
} from 'lucide-react';

export default function FleetManager() {
  const { buses, addBus, updateBus, deleteBus, deleteBuses } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newBus, setNewBus] = useState({ name: '', plate: '', type: 'Silver', capacity: 45, branch: 'Douala' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const filtered = buses.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.plate?.toLowerCase().includes(q) ||
      b.branch?.toLowerCase().includes(q) ||
      b.type?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  const allFilteredIds = filtered.map(b => b.id);
  const isAllSelected = filtered.length > 0 && filtered.every(b => selectedIds.includes(b.id));
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
    if (window.confirm(`Are you sure you want to remove ${count} selected bus${count > 1 ? 'es' : ''} from the fleet?`)) {
      setIsProcessing(true);
      try {
        if (typeof deleteBuses === 'function') {
          await deleteBuses(selectedIds);
        } else {
          for (const id of selectedIds) {
            await deleteBus(id);
          }
        }
        setSelectedIds([]);
      } catch (err) {
        alert(`Failed to delete buses: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSingleDelete = async (bus) => {
    if (window.confirm(`Remove ${bus.name} (${bus.plate}) from fleet?`)) {
      try {
        await deleteBus(bus.id);
        setSelectedIds(prev => prev.filter(item => item !== bus.id));
      } catch (err) {
        alert(err.message || 'Failed to remove bus.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Fleet Management</h2>
          <p className="text-gray-400 text-sm mt-0.5">Register, configure, and maintain coach capacity across all branches</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bus</span>
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-slide-up">
          <h3 className="font-extrabold text-gray-900 mb-4 text-base">Register New Bus Coach</h3>
          {error && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-bold">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bus Model / Name</label>
              <input type="text" placeholder="e.g. Mercedes Tourismo VIP"
                value={newBus.name} onChange={e => { setNewBus(p => ({...p, name: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plate Number</label>
              <input type="text" placeholder="e.g. LT-1204-B"
                value={newBus.plate} onChange={e => { setNewBus(p => ({...p, plate: e.target.value})); setError(''); }}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold placeholder:text-gray-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Travel Class</label>
              <select value={newBus.type} onChange={e => setNewBus(p => ({...p, type: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold">
                <option value="Silver">Silver Standard (2+2)</option>
                <option value="Gold VIP+">Gold VIP+ (2+1 Luxury)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seat Capacity</label>
              <select 
                value={newBus.capacity} 
                onChange={e => setNewBus(p => ({...p, capacity: parseInt(e.target.value, 10)}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
              >
                <option value={70}>70 Seats (Long-Haul 2+2 Coach)</option>
                <option value={50}>50 Seats (Executive 2+2 Coach)</option>
                <option value={32}>32 Seats (Gold VIP+ 2+1 Recliner)</option>
                <option value={18}>18 Seats (Express 1+2 Minibus)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Home Terminal / Branch</label>
              <select value={newBus.branch} onChange={e => setNewBus(p => ({...p, branch: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold">
                <option value="Douala (Akwa)">Douala (Akwa)</option>
                <option value="Douala (Bonabéri)">Douala (Bonabéri)</option>
                <option value="Yaoundé (Quartier Fouda)">Yaoundé (Quartier Fouda)</option>
                <option value="Buea (Mile 17)">Buea (Mile 17)</option>
                <option value="Limbe">Limbe</option>
                <option value="Ikom (Nigeria Hub)">Ikom (Nigeria Hub)</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm font-bold px-4 py-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95">Register Coach</button>
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
            placeholder="Search bus model, plate, branch, or class..."
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
            Total <strong className="text-gray-700">{filtered.length}</strong> buses in active fleet
          </div>
        )}
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(bus => {
          const isSelected = selectedIds.includes(bus.id);

          return (
            <div 
              key={bus.id} 
              className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                isSelected ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20' : 'border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectRow(bus.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>

                  <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-200 text-red-600">
                    <BusIcon className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{bus.plate || bus.name}</p>
                    <p className="text-gray-400 text-xs truncate max-w-[140px]">{bus.name}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus(bus.id, bus.status)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
                    bus.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {bus.status === 'Active' ? '✓ Active' : '⚙ Maintenance'}
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 py-3 px-2 bg-gray-50 rounded-2xl mb-4 text-center border border-gray-100">
                <div>
                  <p className="text-base font-black text-gray-900">{bus.capacity}</p>
                  <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Seats</p>
                </div>
                <div className="border-x border-gray-200">
                  <p className="text-xs font-black text-gray-900 mt-0.5">{bus.type || 'Silver'}</p>
                  <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Class</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{bus.branch || 'Douala'}</p>
                  <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Branch</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-[10px] text-gray-400 font-mono">ID: {bus.id}</span>
                <button
                  type="button"
                  onClick={() => handleSingleDelete(bus)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl py-16 text-center text-gray-400 text-sm shadow-sm">
          No matching coach buses found.
        </div>
      )}

    </div>
  );
}
