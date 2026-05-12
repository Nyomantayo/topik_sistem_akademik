import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, UserCircle, X, BookOpen, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  roles: ['admin', 'mahasiswa', 'dosen'] },
  { to: '/mahasiswa', icon: Users,           label: 'Mahasiswa',  roles: ['admin', 'dosen', 'guest'] },
  { to: '/dosen',     icon: GraduationCap,   label: 'Dosen',      roles: ['admin', 'guest'] },
  { to: '/profile',   icon: UserCircle,      label: 'Profil',     roles: ['admin', 'mahasiswa', 'dosen'] },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isGuest } = useAuth()
  const navigate = useNavigate()

  const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
    onClose()
  }

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-secondary text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">KRS Akademik</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sistem Informasi</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {allowedItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: guest CTA atau user info */}
      {isGuest ? (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 mb-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Anda masuk sebagai</p>
            <p className="text-sm font-semibold text-white">Tamu</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Akses terbatas</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login untuk Akses Penuh
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
