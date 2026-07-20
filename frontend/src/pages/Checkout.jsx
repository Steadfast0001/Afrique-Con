import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/auth'
import SeatMap from '../components/SeatMap'

export default function Checkout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const journeyId = searchParams.get('journeyId') || 'unknown'
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(true)
  const [seats, setSeats] = useState([])
  const [seatError, setSeatError] = useState(null)

  const apiBase = import.meta.env.VITE_API_BASE || ''
  const origin = journeyId.split('-')[0].toLowerCase()

  async function fetchSeats() {
    setLoadingSeats(true)
    setSeatError(null)
    try {
      const resp = await authFetch(`${apiBase}/branch/${origin}/journeys/${encodeURIComponent(journeyId)}/seats`, {
        method: 'GET',
      })
      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        throw new Error(body || `Failed to load seat inventory: ${resp.status}`)
      }
      const data = await resp.json()
      setSeats(data.seats || [])
    } catch (err) {
      setSeatError(err.message || 'Unable to load seat inventory')
    } finally {
      setLoadingSeats(false)
    }
  }

  useEffect(() => {
    if (journeyId !== 'unknown') {
      fetchSeats()
    } else {
      setLoadingSeats(false)
      setSeatError('Invalid journey selected')
    }
  }, [journeyId])

  const selectedSeatData = useMemo(() => seats.find((seat) => seat.id === selectedSeat), [seats, selectedSeat])

  function handleSelect(seat) {
    if (seat.status !== 'available') return
    setSelectedSeat(seat.id === selectedSeat ? null : seat.id)
  }

  async function handleConfirm() {
    if (!selectedSeat) return
    setBookingError(null)
    setBookingLoading(true)
    try {
      const resp = await authFetch(`${apiBase}/branch/${origin}/journeys/${encodeURIComponent(journeyId)}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat: selectedSeat }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        if (resp.status === 409) {
          setSeatError(body.detail || 'Seat already taken. Refreshing inventory.')
          await fetchSeats()
          setSelectedSeat(null)
          return
        }
        throw new Error(body.detail || `Seat hold failed: ${resp.status}`)
      }
      const data = await resp.json()
      navigate(
        `/booking-success?${new URLSearchParams({ ref: data.booking_ref, journeyId: data.journey_id, seat: data.seat, amount: '5000' }).toString()}`
      )
    } catch (e) {
      setBookingError(e.message || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  async function refreshSeats() {
    await fetchSeats()
  }

  return (
    <div className="page-root">
      <section className="page-card">
        <div className="page-header">
          <h2>Seat Selection</h2>
          <div className="muted">Journey: {journeyId}</div>
        </div>

        {loadingSeats ? (
          <div>Loading seats…</div>
        ) : seatError ? (
          <div className="alert alert-error">{seatError}</div>
        ) : (
          <SeatMap seats={seats} selectedSeat={selectedSeat} onSelect={handleSelect} disabled={bookingLoading} />
        )}

        {bookingError && <div className="alert alert-error">{bookingError}</div>}
        <div className="page-actions">
          <button className="secondary" onClick={() => navigate(-1)}>Back</button>
          <button className="primary" onClick={handleConfirm} disabled={!selectedSeat || bookingLoading}>{bookingLoading ? 'Reserving...' : 'Confirm Seat'}</button>
        </div>
      </section>
    </div>
  )
}
