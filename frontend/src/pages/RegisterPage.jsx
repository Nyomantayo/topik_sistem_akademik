import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, GraduationCap, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const ROLES = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'dosen',     label: 'Dosen'     },
]

const BENEFITS = [
  'Akses dashboard akademik secara real-time',
  'Kelola data mahasiswa & dosen dengan mudah',
  'Laporan statistik yang komprehensif',
  'Sistem notifikasi terintegrasi',
]

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'mahasiswa' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name)     errs.name     = 'Nama wajib diisi'
    if (!form.email)    errs.email    = 'Email wajib diisi'
    if (!form.password) errs.password = 'Password wajib diisi'
    else if (form.password.length < 8) errs.password = 'Password minimal 8 karakter'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const res = await register(form)
    if (res.success) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Decorative Panel ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-indigo-800 to-primary relative overflow-hidden flex-col items-center justify-center p-14">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-16 right-16 w-16 h-16 bg-white/10 rounded-2xl -rotate-12" />
        <div className="absolute bottom-20 left-16 w-12 h-12 bg-white/10 rounded-xl rotate-6" />

        {/* Main content */}
        <div className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 shadow-2xl ring-1 ring-white/30">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            Bergabung Sekarang
          </h1>
          <p className="text-blue-200 text-base mb-12 leading-relaxed">
            Buat akun baru dan mulai kelola kegiatan akademik Anda dengan lebih mudah
          </p>

          {/* Benefits */}
          <div className="space-y-4 text-left">
            {BENEFITS.map((text) => (
              <div key={text} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-100 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="absolute bottom-8 text-center">
          <p className="text-blue-300/70 text-xs">© 2025 KRS Akademik · Universitas Udayana</p>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ─────────────────────────────────────── */}
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
            <h2 className="text-3xl font-bold text-secondary">Buat Akun Baru ✨</h2>
            <p className="text-slate-500 text-sm mt-2">
              Lengkapi data berikut untuk mendaftar ke sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap Anda"
                className={`input-field ${errors.name ? 'border-danger' : ''}`}
              />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@domain.com"
                className={`input-field ${errors.email ? 'border-danger' : ''}`}
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
                  placeholder="Min. 8 karakter"
                  className={`input-field pr-10 ${errors.password ? 'border-danger' : ''}`}
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

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Daftar sebagai</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <LoadingSpinner size="sm" />
                : <><UserPlus className="w-4 h-4" /> Daftar Sekarang</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
