import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import searchService from '../services/search'

export default function Search() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('relevance')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [minSeats, setMinSeats] = useState(1)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setResults(null)
    setLoading(true)
    try {
      const res = await searchService.search({ origin, destination, date })
      setResults(res || [])
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const displayed = useMemo(() => {
    if (!results) return null
    let list = Array.isArray(results) ? results.slice() : []
    if (onlyAvailable) {
      list = list.filter(r => (r.seats_left ?? r.available_seats ?? 0) >= (minSeats || 1))
    }
    if (sortKey === 'price') {
      list.sort((a,b) => (a.price||a.fare||0) - (b.price||b.fare||0))
    } else if (sortKey === 'time') {
      list.sort((a,b) => {
        const ta = a.departure_time || a.time || ''
        const tb = b.departure_time || b.time || ''
        return ta.localeCompare(tb)
      })
    } else if (sortKey === 'seats') {
      list.sort((a,b) => (b.seats_left||b.available_seats||0) - (a.seats_left||a.available_seats||0))
    }
    return list
  }, [results, sortKey, onlyAvailable, minSeats])

  return (
    <div className="page-root">
      <section className="page-card">
        <div className="page-header">
          <h2>Passenger Search</h2>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Origin</label>
              <input list="terminals" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
            </div>
            <div className="field">
              <label>Destination</label>
              <input list="terminals" value={destination} onChange={(e) => setDestination(e.target.value)} required />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <datalist id="terminals">
            <option value="Lagos" />
            <option value="Accra" />
            <option value="Abidjan" />
            <option value="Dakar" />
            <option value="Nairobi" />
          </datalist>

          <div className="page-actions">
            <button className="primary" type="submit" disabled={loading}>Search</button>
          </div>
        </form>

        {loading && <div className="alert alert-info">Searching...</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {displayed && (
          <div>
            <div className="search-controls">
              <label>Sort:
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  <option value="relevance">Relevance</option>
                  <option value="price">Price (low → high)</option>
                  <option value="time">Departure time</option>
                  <option value="seats">Seats available</option>
                </select>
              </label>

              <label className="filter-available">
                <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
                Only show journeys with at least
                <input type="number" min="1" value={minSeats} onChange={(e) => setMinSeats(Number(e.target.value) || 1)} className="min-seats" /> seats
              </label>
            </div>

            <div className="results">
              {displayed.length === 0 ? (
                <div className="alert">No journeys found for the selected criteria.</div>
              ) : (
                displayed.map((r, idx) => {
                  const seats = r.seats_left ?? r.available_seats ?? 0
                  const price = r.price ?? r.fare ?? '—'
                  const id = r.id || r.journey_id || r.route_id || idx
                  return (
                    <div key={id} className="result-item">
                      <div className="result-main">
                        <strong>{r.route_name || `${r.origin} → ${r.destination}`}</strong>
                        <div className="muted">{r.departure_time || r.time || ''}</div>
                        <div className="muted">{r.operator || r.company || ''}</div>
                      </div>
                      <div className="result-right">
                        <div className="result-meta">£{price}</div>
                        <div className="seats">{seats} seats left</div>
                        <div className="cta-row">
                          <button className="primary" onClick={() => navigate(`/checkout?journeyId=${encodeURIComponent(id)}`)}>Select Seat</button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
