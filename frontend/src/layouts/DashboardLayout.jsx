import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { Info, LogIn } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar  from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isGuest, logout } = useAuth()

  const handleGuestLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Guest banner */}
        {isGuest && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-800 text-sm min-w-0">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <span className="truncate">
                Anda masuk sebagai <strong>Tamu</strong> — hanya dapat melihat daftar Dosen &amp; Mahasiswa.
              </span>
            </div>
            <Link
              to="/login"
              onClick={handleGuestLogout}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login sekarang
            </Link>
          </div>
        )}

        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
