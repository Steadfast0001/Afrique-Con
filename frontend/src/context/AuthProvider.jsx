import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getToken as storageGetToken, getTokenPayload as storageGetPayload, refresh as authRefresh, logout as authLogout } from '../services/auth'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storageGetToken())
  const [payload, setPayload] = useState(storageGetPayload())
  const [refreshing, setRefreshing] = useState(false)

  const runRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await authRefresh()
      if (data?.access_token) {
        setToken(data.access_token)
        setPayload(storageGetPayload())
      }
    } catch (e) {
      // failed refresh -> force logout
      authLogout()
      setToken(null)
      setPayload(null)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // schedule periodic refresh based on token expiry
  useEffect(() => {
    if (!token || !payload) return
    try {
      const exp = payload.exp ? payload.exp * 1000 : null
      if (!exp) return
      const now = Date.now()
      // refresh 60 seconds before expiry
      const msUntilRefresh = Math.max(0, exp - now - 60000)
      const t = setTimeout(() => {
        runRefresh()
      }, msUntilRefresh)
      return () => clearTimeout(t)
    } catch (e) {
      // ignore
    }
  }, [token, payload, runRefresh])

  // expose a small API
  const api = {
    token,
    payload,
    refreshing,
    forceRefresh: runRefresh,
    setToken: (t) => {
      setToken(t)
      setPayload(storageGetPayload())
    },
    logout: () => {
      authLogout()
      setToken(null)
      setPayload(null)
    },
  }

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
