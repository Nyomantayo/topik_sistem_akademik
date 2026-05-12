import { Menu, LogOut, LogIn, Bell, UserX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Navbar({ onMenuClick }) {
  const { user, logout, isGuest } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left: Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5 text-secondary" />
      </button>

      {/* Center/Left: Page title */}
      <div className="hidden lg:block">
        <p className="text-sm text-slate-500">Selamat datang,</p>
        <p className="font-semibold text-secondary">{isGuest ? 'Tamu' : user?.name}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {!isGuest && (
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-500" />
          </button>
        )}

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {isGuest ? (
          /* Guest: tampilkan ikon tamu + tombol login */
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <UserX className="w-4 h-4 text-slate-500" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-secondary leading-tight">Tamu</p>
              <p className="text-xs text-amber-500">Akses terbatas</p>
            </div>
            <Link
              to="/login"
              onClick={() => logout()}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          </div>
        ) : (
          /* Authenticated user */
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-secondary leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 hover:text-danger rounded-lg transition-colors text-slate-500"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
