import React from 'react'

export default function SeatMap({ seats, selectedSeat, onSelect, disabled }) {
  return (
    <div className="seat-map">
      {seats.map((seat) => (
        <button
          key={seat.id}
          type="button"
          className={`seat ${seat.status === 'taken' ? 'taken' : selectedSeat === seat.id ? 'selected' : 'available'}`}
          onClick={() => onSelect(seat)}
          disabled={disabled || seat.status === 'taken'}
          aria-pressed={selectedSeat === seat.id}
        >
          <div className="seat-id">{seat.id}</div>
          <div className="seat-meta">{seat.status === 'taken' ? 'Taken' : selectedSeat === seat.id ? 'Selected' : 'Available'}</div>
        </button>
      ))}
    </div>
  )
}
