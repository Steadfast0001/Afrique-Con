import React, { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'

const KNOWN_TERMINALS = [
  'BUEA',
  'DOUALA',
  'LAGOS',
  'ABUJA',
  'YAOUNDE',
  'KIGALI',
  'Nairobi',
  'Accra',
  'Dar es Salaam',
]

export default function Search() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const originOptions = useMemo(
    () => KNOWN_TERMINALS.filter((item) => item.toLowerCase().startsWith(origin.toLowerCase())),
    [origin]
  )

  const destinationOptions = useMemo(
    () => KNOWN_TERMINALS.filter((item) => item.toLowerCase().startsWith(destination.toLowerCase())),
    [destination]
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    setLoading(true)
    setError(null)
    setResults([])

    const searchParams = new URLSearchParams({
      origin,
      destination,
      date,
    })

    try {
      const resp = await fetch(`/api/search?${searchParams.toString()}`)
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail || 'Search request failed')
      }
      const data = await resp.json()
      setResults(data.journeys || [])
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleOriginSelect(value) {
    setOrigin(value)
  }

  function handleDestinationSelect(value) {
    setDestination(value)
  }

  return (
    <div className="page-root">
      <section className="page-card">
        <div className="page-header">
          <h2>Passenger Search</h2>
          <p className="page-description">Search journeys by origin, destination, and travel date.</p>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Origin terminal</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Enter origin"
              required
              autoComplete="off"
            />
            {origin && originOptions.length > 0 && (
              <ul className="autocomplete-list">
                {originOptions.map((option) => (
                  <li key={option} onClick={() => handleOriginSelect(option)}>
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label>Destination terminal</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              required
              autoComplete="off"
            />
            {destination && destinationOptions.length > 0 && (
              <ul className="autocomplete-list">
                {destinationOptions.map((option) => (
                  <li key={option} onClick={() => handleDestinationSelect(option)}>
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label>Travel date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search Journeys'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {submitted && !loading && !error && (
          <div className="search-results-section">
            {results.length === 0 ? (
              <div className="alert alert-info">No journeys found for the selected route and date.</div>
            ) : (
              <div>
                <p className="results-summary">{results.length} journey(s) found</p>
                <div className="search-results-grid">
                  {results.map((journey) => (
                    <article key={journey.journey_code} className="search-card">
                      <div className="search-card-header">
                        <h3>{journey.journey_code}</h3>
                        <span className="badge">{journey.price.toFixed(2)} USD</span>
                      </div>
                      <p>
                        {journey.origin_location} → {journey.destination_location}
                      </p>
                      <p>Departure: {format(parseISO(journey.departure_at), 'PPP p')}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
