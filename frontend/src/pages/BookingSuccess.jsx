import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function BookingSuccess() {
  const [qs] = useSearchParams()
  const navigate = useNavigate()
  const ref = qs.get('ref') || 'UNKNOWN'
  const journeyId = qs.get('journeyId') || ''
  const seat = qs.get('seat') || ''
  const amount = qs.get('amount') || ''

  return (
    <div className="page-root">
      <section className="page-card booking-success">
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:20, color:'var(--success-green)'}}>✓ Booking Successful</div>
          <h2 style={{marginTop:8}}>Booking Complete</h2>
          <p className="muted">Reference <strong>{ref}</strong></p>
        </div>

        <div className="booking-summary">
          <div className="summary-left">
            <div className="summary-row"><strong>Journey</strong><span>{journeyId}</span></div>
            <div className="summary-row"><strong>Seat</strong><span>{seat}</span></div>
            <div className="summary-row"><strong>Passenger</strong><span>John Doe</span></div>
          </div>
          <div className="summary-right">
            <div className="summary-row"><strong>Total</strong><span>£{amount}</span></div>
          </div>
        </div>

        <div className="page-actions" style={{justifyContent:'center'}}>
          <button className="primary" onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </section>
    </div>
  )
}
