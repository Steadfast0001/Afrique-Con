import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [remember, setRemember] = useState(true)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password, remember)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Afr ique Con</h1>
        <p className="subtitle">Global Authentication Service</p>
        <label>Admin Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="form-row">
          <label className="checkbox-label">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember my device
          </label>
        </div>

        <button className="primary" type="submit">Authenticate</button>

        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}
