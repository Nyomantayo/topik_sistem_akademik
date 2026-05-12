import { createContext, useContext, useState, useCallback } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('krs_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('krs_token') || null)
  const [loading, setLoading] = useState(false)

  const _persist = (newToken, newUser) => {
    localStorage.setItem('krs_token', newToken)
    localStorage.setItem('krs_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      const { token: newToken, user: newUser } = res.data.data
      _persist(newToken, newUser)
      toast.success(`Selamat datang, ${newUser.name}!`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal'
      toast.error(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const loginAsGuest = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authService.guestLogin()
      const { token: newToken, user: newUser } = res.data.data
      _persist(newToken, newUser)
      toast.success('Masuk sebagai tamu')
      return { success: true }
    } catch {
      toast.error('Gagal masuk sebagai tamu')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data) => {
    setLoading(true)
    try {
      const res = await authService.register(data)
      const { token: newToken, user: newUser } = res.data.data
      _persist(newToken, newUser)
      toast.success('Registrasi berhasil!')
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal'
      toast.error(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('krs_token')
    localStorage.removeItem('krs_user')
    setToken(null)
    setUser(null)
    toast.success('Berhasil logout')
  }, [])

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('krs_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  const isAuthenticated = !!token && !!user
  const isGuest = user?.role === 'guest'

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated, isGuest,
      login, loginAsGuest, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
