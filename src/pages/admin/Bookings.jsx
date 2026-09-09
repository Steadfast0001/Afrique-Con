import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search,
  ArrowUpDown,
  Download
} from 'lucide-react';

export default function AdminBookings() {
  const { bookings, schedules, routes, updateBooking, deleteBooking, deleteBookings } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const getTripDetails = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
    return { schedule, route };
  };

  // Filter & Search
  const filtered = bookings
    .filter(b => filter === 'all' ? true : b.checkInStatus?.toLowerCase() === filter.toLowerCase())
    .filter(b => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.id?.toLowerCase().includes(q) ||
        b.passengerName?.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.passengerEmail?.toLowerCase().includes(q)
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
    if (window.confirm(`Are you sure you want to permanently delete ${count} selected booking${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      setIsProcessing(true);
      try {
        await deleteBookings(selectedIds);
        setSelectedIds([]);
      } catch (err) {
        alert(`Failed to delete bookings: ${err.message}`);
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
        await updateBooking(id, { checkInStatus: newStatus });
      }
      setSelectedIds([]);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleDelete = async (id, name) => {
    if (window.confirm(`Delete booking ${id} for ${name || 'passenger'}?`)) {
      try {
        await deleteBooking(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
      } catch (err) {
        alert(`Failed to delete booking: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-5 select-none animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Passenger Bookings</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage, verify, and clean reservations across all regional transit corridors
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'confirmed', 'boarded', 'checked-in', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Bulk Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ref, name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-red-400"
          />
        </div>

        {/* Selected count & Batch actions */}
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end animate-fade-in">
            <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {selectedIds.length} Selected
            </span>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBatchUpdateStatus('Confirmed')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Mark Confirmed
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
            Showing <strong className="text-gray-700">{filtered.length}</strong> of {bookings.length} reservations
          </div>
        )}
      </div>

      {/* Table */}
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
                <th className="px-4 py-3.5">Ref ID</th>
                <th className="px-4 py-3.5">Passenger</th>
                <th className="px-4 py-3.5">Route & Schedule</th>
                <th className="px-4 py-3.5">Seats</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Check-In Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(booking => {
                const { schedule, route } = getTripDetails(booking.scheduleId);
                const isSelected = selectedIds.includes(booking.id);
                const seatsDisplay = Array.isArray(booking.seats) ? booking.seats.join(', ') : (booking.seats || '1A');

                return (
                  <tr 
                    key={booking.id} 
                    className={`transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50/70'}`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectRow(booking.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center mx-auto"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-red-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Booking ID */}
                    <td className="px-4 py-3.5 font-mono font-black text-red-600 text-xs">
                      {booking.id}
                    </td>

                    {/* Passenger */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900 text-xs capitalize">{booking.passengerName}</p>
                      <p className="text-gray-400 text-[11px]">{booking.phone || booking.passengerEmail || '—'}</p>
                    </td>

                    {/* Route & Schedule */}
                    <td className="px-4 py-3.5 text-gray-600">
                      <p className="font-semibold text-gray-900 text-xs">
                        {route ? `${route.origin} → ${route.destination}` : 'Direct Service'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {schedule?.departureDate || 'Today'} &bull; {schedule?.departureTime || '07:30 AM'}
                      </p>
                    </td>

                    {/* Seats & Class */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                          {seatsDisplay}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          booking.travelClass === 'Gold VIP+' || booking.travelClass === 'Gold'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.travelClass || 'Silver'}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-bold text-gray-900 text-xs">
                      {(booking.totalAmount || 0).toLocaleString()} FCFA
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        booking.paymentStatus?.toLowerCase() === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {booking.paymentStatus || 'Paid'}
                      </span>
                    </td>

                    {/* CheckIn Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        booking.checkInStatus === 'Boarded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : booking.checkInStatus === 'Checked-In'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.checkInStatus === 'Cancelled'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.checkInStatus || 'Confirmed'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/ticket/${booking.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Boarding Pass / Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleDelete(booking.id, booking.passengerName)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Reservation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No matching passenger bookings found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
