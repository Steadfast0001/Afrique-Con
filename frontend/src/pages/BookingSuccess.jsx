import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/auth'

export default function BookingSuccess() {
  const [qs] = useSearchParams()
  const navigate = useNavigate()
  const ref = qs.get('ref') || 'UNKNOWN'
  const journeyId = qs.get('journeyId') || ''
  const seat = qs.get('seat') || ''
  const amount = qs.get('amount') || ''

  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)

  const apiBase = import.meta.env.VITE_API_BASE || ''
  const origin = journeyId ? journeyId.split('-')[0].toLowerCase() : ''

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    try {
      const resp = await authFetch(`${apiBase}/branch/${origin}/journeys/${encodeURIComponent(journeyId)}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat, booking_ref: ref }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail || `Confirmation failed: ${resp.status}`)
      }
      setConfirmed(true)
    } catch (e) {
      setError(e.message || 'Confirmation failed')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="page-root">
      <section className="page-card booking-success">
        <div style={{textAlign:'center'}}>
          {confirmed ? (
            <>
              <div style={{fontSize:20, color:'var(--success-green)'}}>✓ Booking Confirmed!</div>
              <h2 style={{marginTop:8}}>Payment Successful</h2>
            </>
          ) : (
            <>
              <div style={{fontSize:20, color:'var(--warning-orange)'}}>Seat Held</div>
              <h2 style={{marginTop:8}}>Complete Your Booking</h2>
            </>
          )}
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

        {error && <div className="alert alert-error" style={{marginTop: '16px'}}>{error}</div>}

        <div className="page-actions" style={{justifyContent:'center'}}>
          {!confirmed ? (
            <>
              <button className="secondary" onClick={() => navigate(-1)} disabled={confirming}>Cancel</button>
              <button className="primary" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Processing...' : 'Pay & Confirm'}
              </button>
            </>
          ) : (
            <button className="primary" onClick={() => navigate('/')}>Return to Home</button>
          )}
        </div>
      </section>
    </div>
  )
}
