import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import SearchComponent from './components/Search'
import Checkout from './pages/Checkout'
import BookingSuccess from './pages/BookingSuccess'
import SearchPage from './pages/Search'
import { getToken } from './services/auth'
import { AuthProvider } from './context/AuthProvider'

function Protected({ children, role }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  if (role) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload) return <Navigate to="/login" replace />
      if (payload.role !== role && payload.role !== 'super_admin') {
        return <Navigate to="/login" replace />
      }
    } catch (e) {
      return <Navigate to="/login" replace />
    }
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<SearchComponent />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/search"
          element={
            <Protected>
              <SearchPage />
            </Protected>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

