import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  User, 
  Info, 
  Flame, 
  Wifi, 
  Wind, 
  Coffee,
  X
} from 'lucide-react';
import './SeatMap.css';

// Predefined Bus Interior Layouts for Cameroon & Nigeria (Left-Hand Drive)
const BUS_CONFIGURATIONS = {
  70: {
    id: 70,
    name: '70-Seater Long-Distance Cruiser (2+2 + Rear Row)',
    description: '17 Rows with 2+2 layout, central aisle, Left Driver Cabin, and 5 rear seats.',
    type: 'Standard / Express Coach',
    rows: 16,
    layoutType: '2+2',
    rearSeats: 5,
    frontRightSeats: 1, // Co-pilot / Guide
    hasRestroom: true
  },
  50: {
    id: 50,
    name: '50-Seater Executive Coach (2+2)',
    description: '11 Rows with 2+2 layout, central aisle, Left Driver Cabin, and 5 rear seats.',
    type: 'Executive Coach',
    rows: 11,
    layoutType: '2+2',
    rearSeats: 5,
    frontRightSeats: 1,
    hasRestroom: true
  },
  32: {
    id: 32,
    name: '32-Seater Gold VIP+ Recliner (2+1 Ultra-Comfort)',
    description: '10 Rows of wide 2+1 recliners with extra legroom & solo window seats on the right.',
    type: 'Gold VIP+ Luxury',
    rows: 10,
    layoutType: '2+1',
    rearSeats: 1,
    frontRightSeats: 1,
    hasRestroom: false
  },
  18: {
    id: 18,
    name: '18-Seater Express Coaster / Minibus (1+2)',
    description: 'Compact 5 rows with 1+2 layout, ideal for inter-city shuttle transit.',
    type: 'Inter-City Shuttle',
    rows: 5,
    layoutType: '1+2',
    rearSeats: 2,
    frontRightSeats: 1,
    hasRestroom: false
  }
};

export function SeatMap({
  selectedSeats = [],
  bookedSeats = [],
  onSeatClick,
  serviceClass = 'Gold VIP+',
  onServiceClassChange,
  busName = 'Afrique Con Luxury Coach',
  busCapacity = 70,
  basePrice = 6000,
  t
}) {
  // Determine active capacity configuration (defaults to busCapacity or closest match)
  const initialCap = BUS_CONFIGURATIONS[busCapacity] ? busCapacity : 70;
  const [activeCapacity, setActiveCapacity] = useState(initialCap);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'window', 'aisle', 'front'

  const currentConfig = BUS_CONFIGURATIONS[activeCapacity] || BUS_CONFIGURATIONS[70];

  // Calculate pricing
  const silverFare = Number(basePrice) || 6000;
  const goldFare = Math.round(silverFare * 1.5);
  const seatPrice = serviceClass === 'Gold VIP+' || serviceClass === 'Gold' ? goldFare : silverFare;

  // Generate Bus Grid Model dynamically based on chosen capacity & Left-Hand Drive spec
  const busModel = useMemo(() => {
    const config = currentConfig;
    const gridRows = [];

    // 1. FRONT CABIN ROW (Driver on FRONT-LEFT, Entrance Door & Co-pilot on FRONT-RIGHT)
    const frontRow = {
      rowId: 'FRONT',
      isFront: true,
      leftSection: [
        { id: 'DRIVER', label: 'DRIVER', type: 'driver', isLeftHandDrive: true }
      ],
      rightSection: [
        { id: 'DOOR', label: 'DOOR', type: 'door' },
        ...(config.frontRightSeats > 0 
          ? [{ id: 'F1', label: 'F1', type: 'seat', position: 'Front Window', isWindow: true, isFront: true }] 
          : [])
      ]
    };
    gridRows.push(frontRow);

    // 2. MAIN PASSENGER ROWS
    for (let r = 1; r <= config.rows; r++) {
      let leftSeats = [];
      let rightSeats = [];

      if (config.layoutType === '2+2') {
        leftSeats = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window', isWindow: true, rowNum: r },
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Left Aisle', isAisle: true, rowNum: r }
        ];
        rightSeats = [
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Right Aisle', isAisle: true, rowNum: r },
          { id: `${r}D`, label: `${r}D`, type: 'seat', position: 'Right Window', isWindow: true, rowNum: r }
        ];
      } else if (config.layoutType === '2+1') {
        // VIP 2+1 Layout: 2 Left, Aisle, 1 Solo Right
        leftSeats = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window (VIP)', isWindow: true, rowNum: r, isVip: true },
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Left Aisle (VIP)', isAisle: true, rowNum: r, isVip: true }
        ];
        rightSeats = [
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Solo Window (VIP)', isWindow: true, rowNum: r, isVip: true }
        ];
      } else if (config.layoutType === '1+2') {
        // Minibus 1+2 Layout: 1 Left, Aisle, 2 Right
        leftSeats = [
          { id: `${r}A`, label: `${r}A`, type: 'seat', position: 'Left Window', isWindow: true, rowNum: r }
        ];
        rightSeats = [
          { id: `${r}B`, label: `${r}B`, type: 'seat', position: 'Right Aisle', isAisle: true, rowNum: r },
          { id: `${r}C`, label: `${r}C`, type: 'seat', position: 'Right Window', isWindow: true, rowNum: r }
        ];
      }

      gridRows.push({
        rowId: `ROW-${r}`,
        rowNumber: r,
        leftSection: leftSeats,
        rightSection: rightSeats,
        hasEmergencyExit: r === Math.floor(config.rows / 2)
      });
    }

    // 3. REAR BACK ROW
    if (config.rearSeats > 0) {
      const rearSeats = [];
      const rearLabels = ['B1', 'B2', 'B3', 'B4', 'B5'].slice(0, config.rearSeats);
      rearLabels.forEach((lbl, idx) => {
        rearSeats.push({
          id: lbl,
          label: lbl,
          type: 'seat',
          position: idx === 0 ? 'Rear Left' : idx === rearLabels.length - 1 ? 'Rear Right' : 'Rear Center',
          isRear: true,
          isWindow: idx === 0 || idx === rearLabels.length - 1,
          isAisle: idx > 0 && idx < rearLabels.length - 1
        });
      });

      gridRows.push({
        rowId: 'REAR',
        isRear: true,
        fullSection: rearSeats
      });
    }

    return gridRows;
  }, [currentConfig]);

  // Extract all valid seat IDs in this configuration
  const allSeatList = useMemo(() => {
    const list = [];
    busModel.forEach(row => {
      if (row.leftSection) row.leftSection.forEach(s => s.type === 'seat' && list.push(s));
      if (row.rightSection) row.rightSection.forEach(s => s.type === 'seat' && list.push(s));
      if (row.fullSection) row.fullSection.forEach(s => s.type === 'seat' && list.push(s));
    });
    return list;
  }, [busModel]);

  // Quick Action: Select Next Available Window Seat
  const handleSelectWindowSeats = () => {
    const windowSeats = allSeatList.filter(s => s.isWindow && !bookedSeats.includes(s.id));
    if (windowSeats.length > 0) {
      const nextSeat = windowSeats.find(s => !selectedSeats.includes(s.id));
      if (nextSeat) onSeatClick(nextSeat.id);
    }
  };

  // Quick Action: Select Next Available Aisle Seat
  const handleSelectAisleSeats = () => {
    const aisleSeats = allSeatList.filter(s => s.isAisle && !bookedSeats.includes(s.id));
    if (aisleSeats.length > 0) {
      const nextSeat = aisleSeats.find(s => !selectedSeats.includes(s.id));
      if (nextSeat) onSeatClick(nextSeat.id);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-gray-200 shadow-sm transition-all select-none">
      
      {/* ===== 1. HEADER & CAPACITY SWITCHER ===== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t ? t('book.selectSeats') : 'Interactive Bus Seat Map'}
            </h2>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
            <span>{busName}</span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-red-600 font-bold">{currentConfig.name}</span>
          </p>
        </div>

        {/* Class Switcher Pill */}
        {onServiceClassChange && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200 self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => onServiceClassChange('Gold VIP+')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                serviceClass.includes('Gold')
                  ? 'bg-amber-400 text-amber-950 shadow-sm scale-102'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Gold VIP+</span>
            </button>
            <button
              type="button"
              onClick={() => onServiceClassChange('Silver')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                !serviceClass.includes('Gold')
                  ? 'bg-white text-gray-900 shadow-sm scale-102 border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-gray-500" />
              <span>Silver Classic</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== 2. BUS CAPACITY CONFIGURATION SELECTOR ===== */}
      <div className="py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 font-bold">
          <Bus className="w-4 h-4 text-red-500" />
          <span>Select Capacity Layout:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {Object.values(BUS_CONFIGURATIONS).map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setActiveCapacity(cfg.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs flex items-center gap-1 ${
                activeCapacity === cfg.id
                  ? 'bg-red-500 text-white shadow-sm scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cfg.id} Seater</span>
              {cfg.id === 70 && <span className="bg-white/20 text-[10px] px-1 rounded">Standard</span>}
              {cfg.id === 32 && <span className="bg-amber-300 text-amber-950 text-[9px] font-black px-1 rounded">VIP</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 3. STATUS LEGEND & QUICK SHORTCUTS ===== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-gray-100 text-xs font-semibold text-gray-600">
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md border-2 border-gray-300 bg-white shadow-xs" />
            <span>Available</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              ✓
            </div>
            <span className="text-red-600 font-bold">Selected ({selectedSeats.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gray-200 border border-gray-300" />
            <span className="text-gray-400">Booked / Taken</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center text-[10px]">
              🎛️
            </div>
            <span>Driver (Left)</span>
          </div>
        </div>

        {/* Quick Helper Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={handleSelectWindowSeats}
            className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold transition-all"
            title="Auto-select an available window seat"
          >
            🪟 + Window
          </button>
          <button
            type="button"
            onClick={handleSelectAisleSeats}
            className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold transition-all"
            title="Auto-select an available aisle seat"
          >
            🚶 + Aisle
          </button>
        </div>
      </div>

      {/* ===== 4. MAIN ANIMATED BUS INTERIOR CANVAS ===== */}
      <div className="mt-6 p-4 sm:p-6 bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100 rounded-3xl border border-stone-200 shadow-inner flex flex-col items-center relative overflow-hidden">
        
        {/* Left Hand Drive Road Compliance Notice Badge */}
        <div className="mb-4 bg-stone-900/90 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-stone-700 shadow-sm flex items-center gap-2 animate-fade-in">
          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">CM &bull; NG</span>
          <span>Left-Hand Drive Standard &bull; Steering Cabin on Front-Left</span>
        </div>

        {/* BUS EXTERIOR CHASSIS SHELL */}
        <div 
          className="w-full max-w-[380px] sm:max-w-[420px] bg-white rounded-t-[48px] rounded-b-[32px] border-4 border-stone-800 shadow-2xl p-4 sm:p-6 relative transition-all"
        >
          {/* Side Mirror Left */}
          <div className="absolute top-10 -left-4 w-3.5 h-10 bg-stone-800 rounded-l-lg shadow-md border-r border-stone-600 flex items-center justify-center">
            <div className="w-1 h-6 bg-stone-300 rounded-full" />
          </div>

          {/* Side Mirror Right */}
          <div className="absolute top-10 -right-4 w-3.5 h-10 bg-stone-800 rounded-r-lg shadow-md border-l border-stone-600 flex items-center justify-center">
            <div className="w-1 h-6 bg-stone-300 rounded-full" />
          </div>

          {/* --- FRONT WINDSHIELD & CABIN --- */}
          <div className="relative mb-5 pb-4 border-b-2 border-dashed border-stone-300">
            
            {/* Aerodynamic Windshield Glass Curve */}
            <div className="h-12 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-white rounded-t-[36px] border border-sky-300/80 mb-3 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 animate-pulse" />
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-sky-900 uppercase opacity-80">
                <span>🚍 FRONT WINDSHIELD (HIGHWAY VIEW)</span>
              </div>
            </div>

            {/* CABIN DECK: DRIVER ON LEFT, DOOR & CO-PILOT ON RIGHT */}
            <div className="grid grid-cols-12 gap-3 items-center">
              
              {/* DRIVER COCKPIT (LEFT-HAND DRIVE) */}
              <div className="col-span-6 bg-stone-900 text-white p-2.5 rounded-2xl border border-stone-700 shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black tracking-wider text-amber-400 uppercase">DRIVER CABIN</span>
                  <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded">LEFT DRIVE</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Steering Wheel Icon with hover animation */}
                  <div className="steering-wheel-animated w-9 h-9 rounded-full bg-stone-800 border-2 border-amber-400 flex items-center justify-center shadow-inner cursor-pointer" title="Steering Wheel (Left-hand Drive)">
                    <div className="w-3 h-3 rounded-full bg-amber-400 border border-stone-900 flex items-center justify-center">
                      <div className="w-1 h-1 bg-stone-900 rounded-full" />
                    </div>
                  </div>

                  {/* Dashboard Instruments */}
                  <div className="flex-1 leading-none text-[8px] text-stone-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>SPEED:</span>
                      <span className="text-emerald-400 font-bold">85 KM/H</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className="text-amber-400 font-bold">READY</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ENTRANCE DOOR & STEPS (RIGHT SIDE) */}
              <div className="col-span-6 bg-emerald-50 border border-emerald-300 p-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="leading-tight">
                  <span className="text-[9px] font-black text-emerald-900 uppercase block">PASSENGER DOOR</span>
                  <span className="text-[7.5px] text-emerald-700 font-medium block">Entry Steps &bull; Right Side</span>
                </div>
                
                <div className="door-step-animated flex flex-col items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-white shadow-sm font-black text-xs">
                  <span>⬇️</span>
                </div>
              </div>

            </div>

          </div>

          {/* --- MAIN PASSENGER DECK --- */}
          <div className="space-y-3 bus-interior-scroll max-h-[560px] overflow-y-auto px-1 py-1">
            {busModel.map((rowItem, rIdx) => {
              if (rowItem.isFront) return null; // Already rendered in cockpit

              if (rowItem.isRear) {
                // BACK ROW (5 Continuous Seats across rear)
                return (
                  <div key="rear-row" className="pt-3 border-t-2 border-dashed border-stone-300">
                    <div className="text-center text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                      <span>─── REAR SEATS ───</span>
                      {currentConfig.hasRestroom && (
                        <span className="bg-sky-100 text-sky-800 text-[8px] px-1.5 py-0.5 rounded font-bold border border-sky-200">
                          🚻 WC ONBOARD
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 bg-stone-100 p-2 rounded-2xl border border-stone-200">
                      {rowItem.fullSection.map((seat) => renderSeatButton(seat))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={rowItem.rowId} className="relative">
                  
                  {/* Optional Mid-Cabin Emergency Exit Marker */}
                  {rowItem.hasEmergencyExit && (
                    <div className="flex items-center justify-between text-[8px] font-bold text-red-500 uppercase tracking-wider py-1 px-1 opacity-75">
                      <span>🚪 EMERGENCY EXIT</span>
                      <span className="h-[1px] bg-red-200 flex-1 mx-2" />
                      <span>EMERGENCY EXIT 🚪</span>
                    </div>
                  )}

                  {/* Standard Row (Left Seats + Center Aisle + Right Seats) */}
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Row Number Marker */}
                    <span className="w-5 text-[10px] font-black text-stone-400 text-center select-none">
                      {rowItem.rowNumber}
                    </span>

                    {/* Left Side Seats (Window & Aisle) */}
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      {rowItem.leftSection.map((seat) => renderSeatButton(seat))}
                    </div>

                    {/* Walkthrough Center Aisle with subtle directional arrows */}
                    <div className="w-7 h-10 flex flex-col items-center justify-center aisle-ambient-line rounded text-stone-300 select-none">
                      <span className="text-[8px] opacity-40">▲</span>
                    </div>

                    {/* Right Side Seats (Aisle & Window) */}
                    <div className="flex items-center gap-1.5 flex-1 justify-start">
                      {rowItem.rightSection.map((seat) => renderSeatButton(seat))}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Rear Engine & Bumper */}
          <div className="mt-4 pt-3 border-t border-stone-300 flex items-center justify-between text-[8px] font-mono text-stone-400">
            <span>⚙️ REAR ENGINE CHASSIS</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded font-bold text-stone-600">CAPACITY: {currentConfig.id} PASSENGERS</span>
          </div>

        </div>

      </div>

      {/* ===== 5. HOVER TOOLTIP & SELECTED SEATS SUMMARY PANEL ===== */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        
        {/* Live Hover Info Strip */}
        {hoveredSeat ? (
          <div className="mb-4 p-3 bg-red-50/80 border border-red-200 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-red-500 text-white font-black flex items-center justify-center">
                {hoveredSeat.id}
              </span>
              <div>
                <span className="font-bold text-gray-900 block">{hoveredSeat.position}</span>
                <span className="text-gray-500 text-[11px]">
                  {bookedSeats.includes(hoveredSeat.id) 
                    ? '⚠️ Already Reserved by another passenger' 
                    : selectedSeats.includes(hoveredSeat.id)
                    ? '✓ Currently Selected by you'
                    : '🟢 Available to reserve now'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-red-600 text-sm block">{seatPrice.toLocaleString()} FCFA</span>
              <span className="text-gray-400 text-[10px] uppercase font-bold">{serviceClass}</span>
            </div>
          </div>
        ) : null}

        {/* Selected Seats Roster */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">YOUR SEAT SELECTION</span>
            {selectedSeats.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {selectedSeats.map((seatId) => (
                  <span
                    key={seatId}
                    className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs animate-spring"
                  >
                    <span>Seat {seatId}</span>
                    <button
                      type="button"
                      onClick={() => onSeatClick(seatId)}
                      className="hover:bg-red-700 rounded-full p-0.5 transition-colors"
                      title="Remove seat"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mt-0.5">Click on any available seat inside the bus to select it.</p>
            )}
          </div>

          {/* Pricing summary */}
          <div className="text-right flex-shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase block">SUBTOTAL</span>
            <span className="text-xl font-black text-red-600">
              {(seatPrice * selectedSeats.length).toLocaleString()} FCFA
            </span>
            <span className="text-[10px] text-gray-400 block font-medium">
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} &bull; {seatPrice.toLocaleString()} FCFA/seat
            </span>
          </div>
        </div>

      </div>

    </div>
  );

  // Helper renderer for individual 3D animated seat buttons
  function renderSeatButton(seat) {
    const isBooked = bookedSeats.includes(seat.id);
    const isSelected = selectedSeats.includes(seat.id);

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isBooked}
        onClick={() => onSeatClick(seat.id)}
        onMouseEnter={() => setHoveredSeat(seat)}
        onMouseLeave={() => setHoveredSeat(null)}
        className={`bus-seat-card relative w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${
          isBooked
            ? 'bg-stone-200 border-2 border-stone-300 text-stone-400 cursor-not-allowed opacity-50'
            : isSelected
            ? 'seat-selected-animated bg-gradient-to-b from-red-500 to-red-600 text-white border-2 border-red-400 shadow-md shadow-red-200 font-black scale-105 z-10'
            : 'bg-white text-stone-800 border-2 border-stone-200 hover:border-red-400 hover:text-red-600 shadow-xs'
        }`}
        title={`Seat ${seat.label} - ${seat.position}`}
      >
        {/* Top Headrest Cushion */}
        <div
          className={`w-6 h-2 rounded-full mb-0.5 ${
            isSelected
              ? 'bg-red-400/80 shadow-xs'
              : isBooked
              ? 'bg-stone-300'
              : 'bg-stone-100 border border-stone-200'
          }`}
        />

        {/* Seat Number Text */}
        <span className="text-[10px] sm:text-[11px] font-black leading-none tracking-tight">
          {seat.label}
        </span>

        {/* Bottom indicator badge: Window icon or checkmark */}
        <div className="flex items-center justify-center w-full">
          {isSelected ? (
            <Check className="w-3 h-3 text-white font-bold" />
          ) : isBooked ? (
            <span className="text-[8px] text-stone-400">✕</span>
          ) : seat.isWindow ? (
            <span className="text-[7px] text-stone-400 font-medium" title="Window seat">🪟</span>
          ) : (
            <span className="text-[7px] text-stone-300 font-medium">🚶</span>
          )}
        </div>
      </button>
    );
  }
}

export default SeatMap;

