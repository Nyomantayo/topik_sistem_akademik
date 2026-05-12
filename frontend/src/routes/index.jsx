import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout     from '../layouts/AuthLayout'

import LoginPage     from '../pages/LoginPage'
import RegisterPage  from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import MahasiswaPage from '../pages/MahasiswaPage'
import DosenPage     from '../pages/DosenPage'
import ProfilePage   from '../pages/ProfilePage'

// Redirect ke halaman yang sesuai berdasarkan status auth
function RootRedirect() {
  const { isAuthenticated, isGuest } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isGuest) return <Navigate to="/mahasiswa" replace />
  return <Navigate to="/dashboard" replace />
}

// Hanya untuk pengguna yang belum login (atau tamu yang ingin login)
function AuthRoute({ children }) {
  const { isAuthenticated, isGuest } = useAuth()
  if (!isAuthenticated) return children
  if (isGuest) return <Navigate to="/mahasiswa" replace />
  return <Navigate to="/dashboard" replace />
}

// Memastikan pengguna sudah login (termasuk tamu)
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isGuest, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={isGuest ? '/mahasiswa' : '/dashboard'} replace />
  }
  return children
}

// Memblokir akses tamu ke halaman tertentu
function NoGuestRoute({ children }) {
  const { isGuest } = useAuth()
  if (isGuest) return <Navigate to="/mahasiswa" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Auth-only routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
      </Route>

      {/* Protected routes (termasuk tamu) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {/* Dashboard & Profil: tidak untuk tamu */}
        <Route path="/dashboard" element={<NoGuestRoute><DashboardPage /></NoGuestRoute>} />
        <Route path="/profile"   element={<NoGuestRoute><ProfilePage /></NoGuestRoute>} />

        {/* Halaman yang bisa diakses tamu */}
        <Route path="/mahasiswa" element={<MahasiswaPage />} />
        <Route
          path="/dosen"
          element={
            <ProtectedRoute allowedRoles={['admin', 'dosen', 'guest']}>
              <DosenPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
