import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { authFetch, logout } from '../services/auth'

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// ── Route Row ─────────────────────────────────────────────────────
function RouteRow({ code, url }) {
  const active = Boolean(url)
  return (
    <div className="route-row">
      <span className={`status-dot ${active ? 'online' : 'offline'}`} />
      <span className="route-code">{code.toUpperCase()}</span>
      <span className="route-url">{url || '—'}</span>
      <span className={`route-badge ${active ? 'badge-green' : 'badge-gray'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const { payload } = useAuth()
  const navigate = useNavigate()

  const [routes, setRoutes] = useState(null)
  const [routesError, setRoutesError] = useState(null)
  const [routesLoading, setRoutesLoading] = useState(true)

  const [userInfo, setUserInfo] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const role = payload?.role ?? 'unknown'
  const email = payload?.sub ?? '—'
  const branch = payload?.assigned_branch_code ?? null
  const isSuperAdmin = role === 'super_admin' || role === 'admin'

  // ── Fetch /gateway/whoami ─────────────────────────────────────
  const fetchWhoami = useCallback(async () => {
    setUserLoading(true)
    try {
      const r = await authFetch('/gateway/whoami')
      if (r.ok) {
        const data = await r.json()
        setUserInfo(data)
      }
    } catch (_) {
      /* no-op */
    } finally {
      setUserLoading(false)
    }
  }, [])

  // ── Fetch /admin/branch-routes ────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    setRoutesLoading(true)
    setRoutesError(null)
    try {
      const r = await authFetch('/admin/branch-routes')
      if (r.status === 403) {
        setRoutesError('You do not have permission to view branch routes.')
      } else if (!r.ok) {
        setRoutesError(`Failed to load branch routes (HTTP ${r.status}).`)
      } else {
        const data = await r.json()
        setRoutes(data.branch_routes ?? {})
      }
    } catch (err) {
      setRoutesError('Could not reach gateway service. Is it running?')
    } finally {
      setRoutesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWhoami()
    fetchRoutes()
  }, [fetchWhoami, fetchRoutes])

  const routeEntries = routes ? Object.entries(routes) : []
  const activeCount = routeEntries.filter(([, url]) => Boolean(url)).length

  return (
    <div className="dash-root">

      {/* ── Top Nav ── */}
      <header className="dash-nav">
        <div className="dash-nav-brand">
          <span className="dash-logo">🚍</span>
          <span className="dash-nav-title">Afrique<b>Con</b></span>
        </div>
        <div className="dash-nav-right">
          <span className="nav-email">{email}</span>
          <span className={`role-pill role-${role}`}>{role.replace('_', ' ')}</span>
          <button className="btn-ghost" onClick={() => navigate('/search')}>Search</button>
          <button className="btn-danger-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* ── Page Body ── */}
      <main className="dash-body">

        {/* ── Welcome Banner ── */}
        <div className="dash-welcome">
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-subtitle">
            {userLoading ? 'Loading profile…' : `Welcome back, ${userInfo?.email ?? email}`}
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="stats-row">
          <StatCard
            icon="🌍"
            label="Assigned Branch"
            value={branch ?? 'Global'}
            sub={branch ? 'Branch operator' : 'All branches'}
            accent="#B90D0D"
          />
          <StatCard
            icon="🔗"
            label="Active Routes"
            value={routesLoading ? '…' : activeCount}
            sub={routesLoading ? '' : `of ${routeEntries.length} configured`}
            accent="#28A745"
          />
          <StatCard
            icon="🎭"
            label="Access Level"
            value={role.replace('_', ' ')}
            sub={isSuperAdmin ? 'Full admin access' : 'Restricted access'}
            accent={isSuperAdmin ? '#0D6EFD' : '#FF9800'}
          />
        </div>

        {/* ── Identity Card ── */}
        <section className="dash-section">
          <h2 className="section-title">Session Identity</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{userInfo?.email ?? email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">
                <span className={`role-pill role-${role}`}>{role.replace('_', ' ')}</span>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Assigned Branch</span>
              <span className="info-value">
                {userInfo?.assigned_branch_code ?? branch ?? (
                  <em style={{ color: 'var(--muted)' }}>None (global access)</em>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* ── Branch Routes ── */}
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-title">Branch Route Registry</h2>
            <button className="btn-secondary-sm" onClick={fetchRoutes} disabled={routesLoading}>
              {routesLoading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>

          {routesError && (
            <div className="alert alert-warning">{routesError}</div>
          )}

          {!routesError && routesLoading && (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
            </div>
          )}

          {!routesError && !routesLoading && routeEntries.length === 0 && (
            <div className="alert alert-info">No branch routes configured.</div>
          )}

          {!routesError && !routesLoading && routeEntries.length > 0 && (
            <div className="route-list">
              {routeEntries.map(([code, url]) => (
                <RouteRow key={code} code={code} url={url} />
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <section className="dash-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-grid">
            <button className="action-card" onClick={() => navigate('/search')}>
              <span className="action-icon">🔍</span>
              <span className="action-label">Search Journeys</span>
            </button>
            {isSuperAdmin && (
              <button className="action-card" onClick={fetchRoutes}>
                <span className="action-icon">🔄</span>
                <span className="action-label">Refresh Routes</span>
              </button>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
