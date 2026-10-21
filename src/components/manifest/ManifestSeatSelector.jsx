import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  Lock, 
  Unlock, 
  User, 
  Search, 
  Sparkles, 
  FileText, 
  HelpCircle,
  MousePointerClick,
  X
} from 'lucide-react';
import '../booking/SeatMap.css';

// Bus interior specifications for West/Central African inter-city transit (Left-Hand Drive)
const BUS_CONFIGURATIONS = {
  70: {
    id: 70,
    name: '70-Seater Long-Distance Cruiser (2+2 + Rear Row)',
    description: '16 Rows (2+2) with central aisle, front-left driver cabin, passenger door, and 5-seater rear lounge.',
    rows: 16,
    layoutType: '2+2',
    rearSeats: 5,
    frontRightSeats: 1,
    hasRestroom: true
  },
  50: {
    id: 50,
    name: '50-Seater Executive Coach (2+2)',
    description: '11 Rows (2+2) with central aisle, front-left driver cabin, passenger door, and 5 rear seats.',
    rows: 11,
    layoutType: '2+2',
    rearSeats: 5,
    frontRightSeats: 1,
    hasRestroom: true
  },
  32: {
    id: 32,
    name: '32-Seater Gold VIP+ Recliner (2+1)',
    description: '10 Rows (2+1) ultra-comfort layout with solo right window recliners.',
    rows: 10,
    layoutType: '2+1',
    rearSeats: 1,
    frontRightSeats: 1,
    hasRestroom: false
  },
  18: {
    id: 18,
    name: '18-Seater Express Shuttle (1+2)',
    description: '5 Rows (1+2) rapid transit minibus.',
    rows: 5,
    layoutType: '1+2',
    rearSeats: 2,
    frontRightSeats: 1,
    hasRestroom: false
  }
};

/**
 * ManifestSeatSelector
 * 
 * An interactive seat layout component tailored for bus manifests and conductor dispatchers.
 * Supports toggling between:
 * - 'available': Empty, unassigned seat ready for booking
 * - 'reserved': Occupied / booked / held seat with passenger roster info
 * - 'selected': Marked by the dispatcher for bulk assignment, status changes, or ticket operations
 */
export function ManifestSeatSelector({
  busCapacity = 70,
  busName = 'Afrique Con Cruiser',
  busPlate = 'LT-8891-A',
  scheduleInfo = null,
  routeInfo = null,
  initialBookings = [], // Array of bookings from AppContext
  seatStateOverrides = null, // Optional external control: { [seatId]: 'available' | 'reserved' | 'selected' }
  onSeatStateChange = null, // (seatId, newState, passengerData) => void
  onSelectionChange = null, // (selectedSeatIds) => void
  onReserveWalkIn = null, // (reservationData) => void
  readOnly = false
}) {
  // Normalize capacity
  const activeCapacity = useMemo(() => {
    const cap = Number(busCapacity);
    if (BUS_CONFIGURATIONS[cap]) return cap;
    if (cap >= 65) return 70;
    if (cap >= 45) return 50;
    if (cap >= 25) return 32;
    return 18;
  }, [busCapacity]);

  const config = BUS_CONFIGURATIONS[activeCapacity] || BUS_CONFIGURATIONS[70];

  // Generate complete bus seating geometry
  const busModel = useMemo(() => {
    const gridRows = [];

    // Front cabin row (Driver on Left, Door on Right)
    gridRows.push({
      rowId: 'CABIN',
      isCabin: true,
      leftSection: [{ id: 'DRIVER', label: 'DRIVER', type: 'driver' }],
      rightSection: [
        { id: 'DOOR', label: 'DOOR', type: 'door' },
        ...(config.frontRightSeats > 0 ? [{ id: 'F1', label: 'F1', type: 'seat', position: 'Front Window', isWindow: true, isFront: true }] : [])
      ]
    });

    // Passenger Rows
    for (let r = 1; r <= config.rows; r++) {
      let left = [];
      let right = [];

      if (config.layoutType === '2+2') {
        left = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window', isWindow: true, rowNum: r },
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Left Aisle', isAisle: true, rowNum: r }
        ];
        right = [
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Right Aisle', isAisle: true, rowNum: r },
          { id: `${r}D`, label: `${r}D`, type: 'seat', position: 'Right Window', isWindow: true, rowNum: r }
        ];
      } else if (config.layoutType === '2+1') {
        left = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window', isWindow: true, rowNum: r },
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Left Aisle', isAisle: true, rowNum: r }
        ];
        right = [
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Solo Window', isWindow: true, rowNum: r }
        ];
      } else if (config.layoutType === '1+2') {
        left = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window', isWindow: true, rowNum: r }
        ];
        right = [
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Right Aisle', isAisle: true, rowNum: r },
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Right Window', isWindow: true, rowNum: r }
        ];
      }

      gridRows.push({
        rowId: `ROW-${r}`,
        rowNumber: r,
        leftSection: left,
        rightSection: right,
        hasEmergencyExit: r === Math.floor(config.rows / 2)
      });
    }

    // Rear bench row
    if (config.rearSeats > 0) {
      const rearLabels = ['B1', 'B2', 'B3', 'B4', 'B5'].slice(0, config.rearSeats);
      const rear = rearLabels.map((lbl, idx) => ({
        id: lbl,
        label: lbl,
        type: 'seat',
        position: idx === 0 ? 'Rear Left' : idx === rearLabels.length - 1 ? 'Rear Right' : 'Rear Center',
        isRear: true,
        isWindow: idx === 0 || idx === rearLabels.length - 1,
        isAisle: idx > 0 && idx < rearLabels.length - 1
      }));

      gridRows.push({
        rowId: 'REAR',
        isRear: true,
        fullSection: rear
      });
    }

    return gridRows;
  }, [config]);

  // Flatten all interactive seats
  const allSeats = useMemo(() => {
    const list = [];
    busModel.forEach(row => {
      if (row.leftSection) row.leftSection.forEach(s => s.type === 'seat' && list.push(s));
      if (row.rightSection) row.rightSection.forEach(s => s.type === 'seat' && list.push(s));
      if (row.fullSection) row.fullSection.forEach(s => s.type === 'seat' && list.push(s));
    });
    return list;
  }, [busModel]);

  // Master Seat Registry State: { [seatId]: { state: 'available' | 'reserved' | 'selected', passenger?: object } }
  const [seatMap, setSeatMap] = useState(() => {
    const initial = {};
    allSeats.forEach(s => {
      initial[s.id] = {
        state: 'available',
        passenger: null
      };
    });
    return initial;
  });

  // Sync initial bookings from database / props
  useEffect(() => {
    setSeatMap(prev => {
      const updated = { ...prev };

      // Initialize all seats as available by default
      allSeats.forEach(s => {
        if (!updated[s.id]) {
          updated[s.id] = { state: 'available', passenger: null };
        }
      });

      // Populate reserved seats from initialBookings
      if (initialBookings && initialBookings.length > 0) {
        initialBookings.forEach(booking => {
          if (booking.checkInStatus === 'Cancelled') return;

          const seats = Array.isArray(booking.seats) 
            ? booking.seats 
            : typeof booking.seats === 'string' 
            ? booking.seats.split(',').map(str => str.trim()) 
            : [];

          const names = booking.passengers && Array.isArray(booking.passengers)
            ? booking.passengers.map(p => p.name || p.passengerName)
            : (booking.passengerName || 'Passenger').split(',').map(n => n.trim());

          const phones = booking.phone || '';
          const passports = booking.passengers && Array.isArray(booking.passengers)
            ? booking.passengers.map(p => p.passportNumber)
            : (booking.passportNumber || '').split(',').map(p => p.trim());

          seats.forEach((seatId, idx) => {
            if (updated[seatId]) {
              updated[seatId] = {
                state: 'reserved',
                passenger: {
                  name: names[idx] || names[0] || booking.passengerName || 'Passenger',
                  phone: phones,
                  passport: passports[idx] || passports[0] || booking.passportNumber || '',
                  bookingRef: booking.id,
                  travelClass: booking.travelClass || 'Gold VIP+',
                  paymentStatus: booking.paymentStatus || 'Paid',
                  checkInStatus: booking.checkInStatus || 'Confirmed'
                }
              };
            }
          });
        });
      }

      // Apply external overrides if provided
      if (seatStateOverrides) {
        Object.keys(seatStateOverrides).forEach(id => {
          if (updated[id]) {
            updated[id] = {
              ...updated[id],
              state: seatStateOverrides[id]
            };
          }
        });
      }

      return updated;
    });
  }, [allSeats, initialBookings, seatStateOverrides]);

  // Interactive Tool / Brush Mode
  // 'toggle': 1-click cycle (available -> selected -> reserved -> available)
  // 'select': directly toggles selected on/off
  // 'reserve': directly toggles reserved on/off
  // 'inspect': opens detail drawer for inspected seat
  const [interactionMode, setInteractionMode] = useState('toggle');

  // Currently inspected seat ID
  const [inspectedSeatId, setInspectedSeatId] = useState(allSeats[0]?.id || '1A');

  // Search / highlight query
  const [searchQuery, setSearchQuery] = useState('');

  // Status Filter ('all' | 'available' | 'reserved' | 'selected')
  const [statusFilter, setStatusFilter] = useState('all');

  // Walk-in Quick Form input
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPassport, setWalkInPassport] = useState('');

  // Selected seat IDs list derived from seatMap
  const selectedSeatIds = useMemo(() => {
    return Object.keys(seatMap).filter(id => seatMap[id]?.state === 'selected');
  }, [seatMap]);

  // Statistics
  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let selected = 0;

    allSeats.forEach(s => {
      const state = seatMap[s.id]?.state || 'available';
      if (state === 'available') available++;
      else if (state === 'reserved') reserved++;
      else if (state === 'selected') selected++;
    });

    const total = allSeats.length;
    const occupancyRate = total > 0 ? Math.round(((reserved + selected) / total) * 100) : 0;

    return { total, available, reserved, selected, occupancyRate };
  }, [allSeats, seatMap]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedSeatIds);
    }
  }, [selectedSeatIds, onSelectionChange]);

  // Inspected Seat Object
  const inspectedSeat = useMemo(() => {
    if (!inspectedSeatId) return null;
    const geometry = allSeats.find(s => s.id === inspectedSeatId);
    const data = seatMap[inspectedSeatId] || { state: 'available', passenger: null };
    return { ...geometry, ...data };
  }, [inspectedSeatId, allSeats, seatMap]);

  // Main Toggle Handler for Individual Seats
  const handleSeatClick = (seatId) => {
    if (readOnly) {
      setInspectedSeatId(seatId);
      return;
    }

    setInspectedSeatId(seatId);

    const currentSeat = seatMap[seatId] || { state: 'available', passenger: null };
    const currentState = currentSeat.state;
    let nextState = currentState;

    if (interactionMode === 'toggle') {
      // Tri-state cycle: available -> selected -> reserved -> available
      if (currentState === 'available') {
        nextState = 'selected';
      } else if (currentState === 'selected') {
        nextState = 'reserved';
      } else {
        nextState = 'available';
      }
    } else if (interactionMode === 'select') {
      nextState = currentState === 'selected' ? 'available' : 'selected';
    } else if (interactionMode === 'reserve') {
      nextState = currentState === 'reserved' ? 'available' : 'reserved';
    } else if (interactionMode === 'inspect') {
      // Just inspect, do not change state
      return;
    }

    updateSeatState(seatId, nextState, currentSeat.passenger);
  };

  // Helper to commit seat state change
  const updateSeatState = (seatId, newState, passengerData = null) => {
    setSeatMap(prev => {
      const existing = prev[seatId] || {};
      let updatedPassenger = passengerData ?? existing.passenger;

      if (newState === 'available') {
        updatedPassenger = null;
      } else if (newState === 'reserved' && !updatedPassenger) {
        updatedPassenger = {
          name: 'Walk-In Passenger',
          phone: '',
          passport: '',
          bookingRef: `WALK-${seatId}-${Math.floor(100 + Math.random() * 900)}`,
          travelClass: 'Standard',
          paymentStatus: 'Cash Counter',
          checkInStatus: 'Checked-In'
        };
      }

      const updated = {
        ...prev,
        [seatId]: {
          state: newState,
          passenger: updatedPassenger
        }
      };

      if (onSeatStateChange) {
        onSeatStateChange(seatId, newState, updatedPassenger);
      }

      return updated;
    });
  };

  // Batch Action: Mark All Selected as Reserved
  const handleBatchReserve = () => {
    if (selectedSeatIds.length === 0) return;

    setSeatMap(prev => {
      const next = { ...prev };
      selectedSeatIds.forEach(id => {
        next[id] = {
          state: 'reserved',
          passenger: next[id]?.passenger || {
            name: `Reserved Group (${id})`,
            phone: '',
            passport: '',
            bookingRef: `HOLD-${id}`,
            travelClass: 'Standard',
            paymentStatus: 'Pending',
            checkInStatus: 'Reserved'
          }
        };
        if (onSeatStateChange) {
          onSeatStateChange(id, 'reserved', next[id].passenger);
        }
      });
      return next;
    });
  };

  // Batch Action: Release All Selected to Available
  const handleBatchRelease = () => {
    if (selectedSeatIds.length === 0) return;

    setSeatMap(prev => {
      const next = { ...prev };
      selectedSeatIds.forEach(id => {
        next[id] = {
          state: 'available',
          passenger: null
        };
        if (onSeatStateChange) {
          onSeatStateChange(id, 'available', null);
        }
      });
      return next;
    });
  };

  // Batch Action: Select All Available Seats
  const handleSelectAllAvailable = () => {
    setSeatMap(prev => {
      const next = { ...prev };
      allSeats.forEach(s => {
        if (next[s.id]?.state === 'available') {
          next[s.id] = { ...next[s.id], state: 'selected' };
        }
      });
      return next;
    });
  };

  // Batch Action: Clear All Selections
  const handleClearSelection = () => {
    setSeatMap(prev => {
      const next = { ...prev };
      selectedSeatIds.forEach(id => {
        next[id] = { ...next[id], state: 'available' };
      });
      return next;
    });
  };

  // Quick Walk-in Registration for the currently inspected seat
  const handleSaveWalkIn = (e) => {
    e.preventDefault();
    if (!inspectedSeatId) return;

    const passengerData = {
      name: walkInName.trim() || 'Walk-In Passenger',
      phone: walkInPhone.trim(),
      passport: walkInPassport.trim(),
      bookingRef: `WI-${inspectedSeatId}-${Date.now().toString().slice(-4)}`,
      travelClass: 'Counter Reserved',
      paymentStatus: 'Cash Counter',
      checkInStatus: 'Confirmed'
    };

    updateSeatState(inspectedSeatId, 'reserved', passengerData);

    if (onReserveWalkIn) {
      onReserveWalkIn({ seatId: inspectedSeatId, ...passengerData });
    }

    setWalkInName('');
    setWalkInPhone('');
    setWalkInPassport('');
  };

  // Check if seat matches active search query
  const doesSeatMatchSearch = (seat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const data = seatMap[seat.id];
    const passName = data?.passenger?.name?.toLowerCase() || '';
    const passPhone = data?.passenger?.phone?.toLowerCase() || '';
    const passRef = data?.passenger?.bookingRef?.toLowerCase() || '';
    const seatId = seat.id.toLowerCase();

    return seatId.includes(q) || passName.includes(q) || passPhone.includes(q) || passRef.includes(q);
  };

  // Check if seat matches active status filter
  const doesSeatMatchFilter = (seat) => {
    if (statusFilter === 'all') return true;
    const state = seatMap[seat.id]?.state || 'available';
    return state === statusFilter;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden select-none">
      
      {/* ===== TOP MANIFEST CONTROLS & TOOLBAR ===== */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/70">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Interactive Bus Manifest & Seat Roster
              </h3>
              <span className="bg-stone-900 text-stone-100 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg">
                {config.id} SEATS
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>{busName}</span>
              <span className="text-gray-300">&bull;</span>
              <span className="font-mono text-gray-700 font-semibold">{busPlate}</span>
              {routeInfo && (
                <>
                  <span className="text-gray-300">&bull;</span>
                  <span className="text-red-600 font-bold">{routeInfo.origin} ➔ {routeInfo.destination}</span>
                </>
              )}
            </p>
          </div>

          {/* Interactive Mode Brush Selector */}
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-2xl shadow-xs self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setInteractionMode('toggle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                interactionMode === 'toggle'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Clicking any seat cycles: Available ➔ Selected ➔ Reserved ➔ Available"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Cycle</span>
            </button>

            <button
              type="button"
              onClick={() => setInteractionMode('select')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                interactionMode === 'select'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Clicking toggles seat selection for bulk operations"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select</span>
            </button>

            <button
              type="button"
              onClick={() => setInteractionMode('reserve')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                interactionMode === 'reserve'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Clicking directly reserves or blocks a seat"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Reserve</span>
            </button>

            <button
              type="button"
              onClick={() => setInteractionMode('inspect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                interactionMode === 'inspect'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Click to view passenger details without changing state"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          </div>
        </div>

        {/* Live Metrics & State Filters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200/80">
          
          {/* Total Capacity */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              statusFilter === 'all'
                ? 'bg-white border-stone-800 shadow-sm ring-2 ring-stone-800/10'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
              <span>Total Seats</span>
              <span className="text-[10px] text-gray-400">{stats.occupancyRate}% Full</span>
            </div>
            <div className="text-lg font-black text-gray-900 mt-0.5">{stats.total}</div>
          </button>

          {/* Available State */}
          <button
            type="button"
            onClick={() => setStatusFilter('available')}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              statusFilter === 'available'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/10'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Available
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">
                {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{stats.available}</div>
          </button>

          {/* Reserved State */}
          <button
            type="button"
            onClick={() => setStatusFilter('reserved')}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              statusFilter === 'reserved'
                ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/10'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Reserved / Booked
              </span>
              <span className="text-[10px] text-amber-700 font-mono">
                {stats.total > 0 ? Math.round((stats.reserved / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{stats.reserved}</div>
          </button>

          {/* Selected State */}
          <button
            type="button"
            onClick={() => setStatusFilter('selected')}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              statusFilter === 'selected'
                ? 'bg-red-50/80 border-red-500 shadow-sm ring-2 ring-red-500/10'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-red-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Selected
              </span>
              <span className="text-[10px] text-red-500 font-mono">Active</span>
            </div>
            <div className="text-lg font-black text-red-600 mt-0.5">{stats.selected}</div>
          </button>

        </div>

        {/* Search & Batch Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
          
          {/* Seat / Passenger Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seat (e.g. 12A) or passenger name..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-red-400 placeholder:text-gray-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Batch Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedSeatIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleBatchReserve}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-3 h-3" />
                  <span>Reserve Selected ({selectedSeatIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchRelease}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-200"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Release to Available</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  Clear ({selectedSeatIds.length})
                </button>
              </>
            )}

            {selectedSeatIds.length === 0 && (
              <button
                type="button"
                onClick={handleSelectAllAvailable}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all border border-gray-200 shadow-2xs"
              >
                Select All Available ({stats.available})
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ===== MAIN GRID: BUS VISUAL CHASSIS + SEAT INSPECTOR PANEL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* --- LEFT COL (8 cols): BUS VISUAL LAYOUT --- */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-7 bg-gradient-to-b from-stone-50 via-white to-stone-50 border-r border-gray-200 flex flex-col items-center">
          
          {/* Legend and instructions note */}
          <div className="w-full max-w-[440px] mb-4 flex items-center justify-between text-[11px] text-gray-500 font-semibold flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border-2 border-stone-300 bg-white" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">
                🔒
              </span>
              <span>Reserved</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-red-500 text-white flex items-center justify-center text-[8px] font-black">
                ✓
              </span>
              <span>Selected</span>
            </span>
            <span className="text-[10px] text-gray-400 italic">Click seat to toggle</span>
          </div>

          {/* BUS CHASSIS CONTAINER */}
          <div className="w-full max-w-[390px] sm:max-w-[430px] bg-white rounded-t-[44px] rounded-b-[28px] border-4 border-stone-800 shadow-xl p-4 sm:p-5 relative transition-all">
            
            {/* Side Mirrors */}
            <div className="absolute top-10 -left-4 w-3.5 h-10 bg-stone-800 rounded-l-lg border-r border-stone-600 flex items-center justify-center">
              <div className="w-1 h-6 bg-stone-300 rounded-full" />
            </div>
            <div className="absolute top-10 -right-4 w-3.5 h-10 bg-stone-800 rounded-r-lg border-l border-stone-600 flex items-center justify-center">
              <div className="w-1 h-6 bg-stone-300 rounded-full" />
            </div>

            {/* Front Windshield Curve */}
            <div className="h-10 bg-gradient-to-b from-sky-200/60 to-white rounded-t-[32px] border border-sky-300/80 mb-3 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 animate-pulse" />
              <span className="text-[9px] font-black tracking-widest text-sky-950 uppercase opacity-75">
                🚍 FRONT CABIN &bull; HIGHWAY DRIVING
              </span>
            </div>

            {/* Front Cabin Row: Driver (Left) + Door & Entry (Right) */}
            <div className="grid grid-cols-12 gap-2.5 items-center pb-3 mb-3 border-b-2 border-dashed border-stone-300">
              {/* Driver Cockpit */}
              <div className="col-span-6 bg-stone-900 text-white p-2 rounded-xl border border-stone-700 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[8px] font-black tracking-wider text-amber-400 uppercase block">DRIVER</span>
                  <span className="text-[7px] text-stone-400 font-mono">LEFT-HAND DRIVE</span>
                </div>
                <div className="steering-wheel-animated w-7 h-7 rounded-full bg-stone-800 border-2 border-amber-400 flex items-center justify-center shadow-inner cursor-pointer" title="Driver Steering Wheel">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Entrance Door & Optional Guide Seat */}
              <div className="col-span-6 bg-emerald-50 border border-emerald-300 p-2 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[8px] font-black text-emerald-900 uppercase block">DOOR ENTRY</span>
                  <span className="text-[7px] text-emerald-700 font-mono">RIGHT-HAND PASSENGER STEP</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  ⬇️
                </div>
              </div>
            </div>

            {/* Scrollable Passenger Rows Deck */}
            <div className="space-y-2.5 bus-interior-scroll max-h-[580px] overflow-y-auto px-1 py-1">
              {busModel.map((rowItem) => {
                if (rowItem.isCabin) return null;

                if (rowItem.isRear) {
                  return (
                    <div key="rear-bench" className="pt-2.5 border-t-2 border-dashed border-stone-300">
                      <div className="text-center text-[8.5px] font-black text-stone-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                        <span>── REAR 5-SEATER LOUNGE ──</span>
                        {config.hasRestroom && (
                          <span className="bg-sky-100 text-sky-800 text-[7px] px-1.5 py-0.2 rounded font-bold border border-sky-200">
                            🚻 WC
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                        {rowItem.fullSection.map((seat) => renderSeatButton(seat))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={rowItem.rowId} className="relative">
                    {/* Emergency Exit Row Indicator */}
                    {rowItem.hasEmergencyExit && (
                      <div className="flex items-center justify-between text-[7px] font-bold text-red-500 uppercase py-0.5 px-1 opacity-70">
                        <span>🚪 EMERGENCY EXIT</span>
                        <span className="h-[1px] bg-red-200 flex-1 mx-2" />
                        <span>EMERGENCY EXIT 🚪</span>
                      </div>
                    )}

                    {/* Standard Row */}
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Row Number Marker */}
                      <span className="w-4 text-[9px] font-mono font-black text-stone-400 text-center select-none">
                        {rowItem.rowNumber}
                      </span>

                      {/* Left Seats (Window, Aisle) */}
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        {rowItem.leftSection.map((seat) => renderSeatButton(seat))}
                      </div>

                      {/* Walkable Aisle */}
                      <div className="w-6 h-9 flex flex-col items-center justify-center aisle-ambient-line rounded text-stone-300 select-none">
                        <span className="text-[7px] opacity-35">▲</span>
                      </div>

                      {/* Right Seats (Aisle, Window) */}
                      <div className="flex items-center gap-1 flex-1 justify-start">
                        {rowItem.rightSection.map((seat) => renderSeatButton(seat))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rear Chassis & Engine Bar */}
            <div className="mt-3 pt-2.5 border-t border-stone-300 flex items-center justify-between text-[7.5px] font-mono text-stone-400">
              <span>⚙️ REAR ENGINE PLATFORM</span>
              <span className="bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-600">
                AFRIQUE CON &bull; MANIFEST
              </span>
            </div>

          </div>

        </div>

        {/* --- RIGHT COL (4-5 cols): ACTIVE SEAT INSPECTION & DETAIL DRAWER --- */}
        <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-white flex flex-col justify-between">
          
          {inspectedSeat ? (
            <div className="space-y-5 animate-fade-in">
              
              {/* Inspected Seat Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                    inspectedSeat.state === 'reserved'
                      ? 'bg-amber-500 shadow-amber-200'
                      : inspectedSeat.state === 'selected'
                      ? 'bg-red-500 shadow-red-200'
                      : 'bg-emerald-500 shadow-emerald-200'
                  }`}>
                    {inspectedSeat.label}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">Seat {inspectedSeat.label}</h4>
                    <p className="text-xs text-gray-500 font-medium">{inspectedSeat.position || 'Standard Coach Seat'}</p>
                  </div>
                </div>

                {/* Status Indicator Pill */}
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    inspectedSeat.state === 'reserved'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : inspectedSeat.state === 'selected'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {inspectedSeat.state}
                  </span>
                </div>
              </div>

              {/* State Transition Segmented Controls */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Toggle Seat State
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => updateSeatState(inspectedSeat.id, 'available', null)}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      inspectedSeat.state === 'available'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSeatState(inspectedSeat.id, 'reserved', inspectedSeat.passenger)}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      inspectedSeat.state === 'reserved'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Reserved</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSeatState(inspectedSeat.id, 'selected', inspectedSeat.passenger)}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      inspectedSeat.state === 'selected'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Selected</span>
                  </button>
                </div>
              </div>

              {/* Reserved Passenger Information Card */}
              {inspectedSeat.state === 'reserved' && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      Passenger Manifest Details
                    </span>
                    <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {inspectedSeat.passenger?.bookingRef || 'REF-N/A'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-bold text-gray-900 capitalize">
                        {inspectedSeat.passenger?.name || 'Walk-In Passenger'}
                      </span>
                    </div>

                    {inspectedSeat.passenger?.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-mono text-gray-800">{inspectedSeat.passenger.phone}</span>
                      </div>
                    )}

                    {inspectedSeat.passenger?.passport && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Passport / ID:</span>
                        <span className="font-mono text-gray-800">{inspectedSeat.passenger.passport}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-500">Class:</span>
                      <span className="font-semibold text-gray-800">
                        {inspectedSeat.passenger?.travelClass || 'Standard'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Check-In:</span>
                      <span className="font-bold text-emerald-700">
                        ✓ {inspectedSeat.passenger?.checkInStatus || 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSeatState(inspectedSeat.id, 'available', null)}
                      className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-amber-300 font-bold text-xs transition-all"
                    >
                      Release / Cancel Seat Hold
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Walk-in Hold Form (Visible when seat is Available or Selected) */}
              {inspectedSeat.state !== 'reserved' && (
                <form onSubmit={handleSaveWalkIn} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      Assign Walk-In Passenger
                    </span>
                    <span className="text-[10px] text-gray-400">Terminal Counter</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Passenger Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="e.g. Jean-Paul Mbarga"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-red-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                        placeholder="237 6..."
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-red-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Passport / CNI
                      </label>
                      <input
                        type="text"
                        value={walkInPassport}
                        onChange={(e) => setWalkInPassport(e.target.value)}
                        placeholder="ID or Passport"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-red-400 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirm Hold for Seat {inspectedSeat.label}</span>
                  </button>
                </form>
              )}

              {/* Instructions Tip */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <p>
                  Click any seat in the bus diagram to inspect passenger manifests, or change brush modes in the top toolbar to batch select or hold rows.
                </p>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              Select a seat from the bus diagram to inspect details or toggle reservation states.
            </div>
          )}

          {/* Bottom Dispatch Signature / Summary */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Terminal Akwa &bull; Fouda</span>
            <span className="font-mono text-[10px]">VERIFIED DISPATCH</span>
          </div>

        </div>

      </div>

    </div>
  );

  // Renders individual interactive seat button in the 3 states
  function renderSeatButton(seat) {
    const data = seatMap[seat.id] || { state: 'available', passenger: null };
    const state = data.state;
    const isInspected = inspectedSeatId === seat.id;
    const matchesSearch = doesSeatMatchSearch(seat);
    const matchesFilter = doesSeatMatchFilter(seat);

    // Dynamic styling based on state
    let stateClasses = '';
    let icon = null;

    if (state === 'reserved') {
      stateClasses = 'bg-amber-100 border-2 border-amber-400 text-amber-950 font-black shadow-xs';
      icon = <Lock className="w-2.5 h-2.5 text-amber-700" />;
    } else if (state === 'selected') {
      stateClasses = 'seat-selected-animated bg-gradient-to-b from-red-500 to-red-600 text-white border-2 border-red-400 shadow-md shadow-red-200 font-black scale-105 z-10';
      icon = <Check className="w-3 h-3 text-white font-bold" />;
    } else {
      // available
      stateClasses = 'bg-white text-stone-800 border-2 border-stone-200 hover:border-red-400 hover:text-red-600 shadow-2xs';
      icon = seat.isWindow ? (
        <span className="text-[6.5px] text-stone-400" title="Window seat">🪟</span>
      ) : (
        <span className="text-[6.5px] text-stone-300">🚶</span>
      );
    }

    // Dim if doesn't match filter or search
    const dimClasses = (!matchesSearch || !matchesFilter) ? 'opacity-25 grayscale' : '';
    const inspectedClasses = isInspected ? 'ring-2 ring-stone-900 ring-offset-2' : '';

    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => handleSeatClick(seat.id)}
        className={`bus-seat-card relative w-8 h-10 sm:w-9 sm:h-11 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${stateClasses} ${dimClasses} ${inspectedClasses}`}
        title={`Seat ${seat.label} (${state.toUpperCase()})${data.passenger?.name ? ` - ${data.passenger.name}` : ''}`}
        aria-label={`Seat ${seat.label}, status ${state}`}
        aria-pressed={state === 'selected'}
      >
        {/* Top Headrest Cushion */}
        <div
          className={`w-5 h-1.5 rounded-full mb-0.5 ${
            state === 'selected'
              ? 'bg-red-300/80'
              : state === 'reserved'
              ? 'bg-amber-300'
              : 'bg-stone-100 border border-stone-200'
          }`}
        />

        {/* Seat Number */}
        <span className="text-[9px] sm:text-[10px] font-black leading-none tracking-tight">
          {seat.label}
        </span>

        {/* Bottom State Icon Indicator */}
        <div className="flex items-center justify-center w-full">
          {icon}
        </div>
      </button>
    );
  }
}

export default ManifestSeatSelector;
