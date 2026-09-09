import React from 'react';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];

export function SeatMap({
  selectedSeats,
  bookedSeats,
  onSeatClick,
  serviceClass,
  onServiceClassChange,
  busName,
  t
}) {
  // 2+1 Layout Seat Matrix (Rows A-W, 3 seats per row)
  const seatGrid = [];

  // Row A (Disabled seat 1, seats A2, A3)
  seatGrid.push({
    row: 'A',
    cols: [
      { id: 'x', label: 'x', disabled: true, type: 'disabled' },
      { id: 'A2', label: 'A2', disabled: false, type: 'seat' },
      { id: 'A3', label: 'A3', disabled: false, type: 'seat' }
    ]
  });

  // Rows B to W
  for (let r = 1; r < ROWS.length; r++) {
    const rowChar = ROWS[r];
    seatGrid.push({
      row: rowChar,
      cols: [
        { id: `${rowChar}1`, label: `${rowChar}1`, disabled: false, type: 'seat' },
        { id: `${rowChar}2`, label: `${rowChar}2`, disabled: false, type: 'seat' },
        { id: `${rowChar}3`, label: `${rowChar}3`, disabled: false, type: 'seat' }
      ]
    });
  }

  // Row X at the bottom (Middle seat X1 only)
  seatGrid.push({
    row: 'X',
    cols: [
      { id: 'spacer1', label: '', disabled: true, type: 'spacer' },
      { id: 'X1', label: 'X1', disabled: false, type: 'seat' },
      { id: 'spacer2', label: '', disabled: true, type: 'spacer' }
    ]
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
      {/* Header with Bus info and Class Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t ? t('book.selectSeats') : 'Select Seats'}</h2>
          <p className="text-gray-400 text-sm">{busName || 'Premium Coach'}</p>
        </div>

        {/* Travel Class Badges */}
        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
          <button
            type="button"
            onClick={() => onServiceClassChange('Gold VIP+')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              serviceClass === 'Gold VIP+'
                ? 'bg-amber-400 text-amber-950 shadow-sm scale-105'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ★ Gold VIP+
          </button>
          <button
            type="button"
            onClick={() => onServiceClassChange('Silver')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              serviceClass === 'Silver'
                ? 'bg-slate-300 text-slate-900 shadow-sm scale-105'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Silver Standard
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-5 border-b border-gray-100 text-xs font-semibold text-gray-500 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg border-2 border-gray-200 bg-white" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
          <span>Selected ({selectedSeats.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-gray-200 border border-gray-300" />
          <span>Booked</span>
        </div>
      </div>

      {/* Bus Cockpit Graphic */}
      <div className="max-w-xs mx-auto mt-6 p-4 rounded-3xl bg-gray-50 border border-gray-200">
        <div className="text-center py-2 mb-4 bg-white rounded-xl border border-gray-200 shadow-sm text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
          <span>🚍 DRIVER CABIN</span>
        </div>

        {/* Seat Matrix Grid */}
        <div className="space-y-2">
          {seatGrid.map((rowItem) => (
            <div key={rowItem.row} className="flex items-center justify-between gap-2">
              <span className="w-4 text-[11px] font-black text-gray-400 text-center">{rowItem.row}</span>
              <div className="flex-1 flex justify-center gap-2">
                {rowItem.cols.map((col, idx) => {
                  if (col.type === 'spacer') {
                    return <div key={idx} className="w-9 h-9" />;
                  }
                  if (col.type === 'disabled') {
                    return (
                      <div
                        key={col.id}
                        className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-300 cursor-not-allowed"
                      >
                        ✕
                      </div>
                    );
                  }

                  const isBooked = bookedSeats.includes(col.id);
                  const isSelected = selectedSeats.includes(col.id);

                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => onSeatClick(col.id)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isBooked
                          ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-red-500 text-white shadow-md shadow-red-200 scale-105 font-black ring-2 ring-red-300'
                          : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-red-400 hover:text-red-500 shadow-sm'
                      }`}
                    >
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SeatMap;
