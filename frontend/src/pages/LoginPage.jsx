import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, LogIn, UserX,
  GraduationCap, BookOpen, Users, BarChart3, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const FEATURES = [
  { icon: BookOpen,  text: 'Kelola Kartu Rencana Studi' },
  { icon: Users,     text: 'Manajemen Data Mahasiswa & Dosen' },
  { icon: BarChart3, text: 'Dashboard Statistik Real-time' },
  { icon: Shield,    text: 'Sistem Keamanan & Otentikasi' },
]

export default function LoginPage() {
  const { login, loginAsGuest, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const errs = {}
    if (!form.email)    errs.email    = 'Email wajib diisi'
    if (!form.password) errs.password = 'Password wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const res = await login(form.email, form.password)
    if (res.success) navigate('/dashboard')
  }

  const handleGuestLogin = async () => {
    const res = await loginAsGuest()
    if (res.success) navigate('/mahasiswa')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Form Panel ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Logo — visible only on mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary">KRS Akademik</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-secondary">Selamat Datang 👋</h2>
            <p className="text-slate-500 text-sm mt-2">
              Masukkan kredensial akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@krs.ac.id"
                className={`input-field ${errors.email ? 'border-danger focus:ring-danger/30' : ''}`}
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`input-field pr-10 ${errors.password ? 'border-danger focus:ring-danger/30' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <LoadingSpinner size="sm" />
                : <><LogIn className="w-4 h-4" /> Masuk</>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">
                atau lanjutkan tanpa akun
              </span>
            </div>
          </div>

          {/* Guest login */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            <UserX className="w-4 h-4" />
            Masuk sebagai Tamu
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Tamu hanya dapat melihat daftar Dosen &amp; Mahasiswa
          </p>

          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold mb-1.5">Akun Demo</p>
            <div className="space-y-0.5">
              <p className="text-xs text-blue-600">Admin — admin2@krs.ac.id · Admin@123</p>
              <p className="text-xs text-blue-600">Dosen — dosen@krs.ac.id · Dosen@123</p>
              <p className="text-xs text-blue-600">Mahasiswa — mahasiswa@krs.ac.id · Mahasiswa@123</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Decorative Panel ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-700 to-secondary relative overflow-hidden flex-col items-center justify-center p-14">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-16 left-16 w-16 h-16 bg-white/10 rounded-2xl rotate-12" />
        <div className="absolute bottom-20 right-16 w-12 h-12 bg-white/10 rounded-xl -rotate-6" />

        {/* Main content */}
        <div className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 shadow-2xl ring-1 ring-white/30">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            KRS Akademik
          </h1>
          <p className="text-blue-200 text-base mb-12 leading-relaxed">
            Sistem Informasi Akademik Modern untuk pengelolaan data kampus yang efisien
          </p>

          {/* Feature list */}
          <div className="space-y-3.5 text-left">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="absolute bottom-8 text-center">
          <p className="text-blue-300/70 text-xs">© 2025 KRS Akademik · Universitas Udayana</p>
        </div>
      </div>

    </div>
  )
}
