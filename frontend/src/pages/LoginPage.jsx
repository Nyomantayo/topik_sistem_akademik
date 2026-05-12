import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function LoginPage() {
  const { login, loginAsGuest, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary">Masuk</h2>
        <p className="text-slate-500 text-sm mt-1">Masukkan kredensial akun Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <LoadingSpinner size="sm" /> : <><LogIn className="w-4 h-4" /> Masuk</>}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-slate-400">atau lanjutkan tanpa akun</span>
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

      <p className="text-center text-sm text-slate-500 mt-5">
        Belum punya akun?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Daftar sekarang
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 font-medium mb-1">Demo Admin:</p>
        <p className="text-xs text-blue-600">Email: admin2@krs.ac.id</p>
        <p className="text-xs text-blue-600">Password: Admin@123</p>
      </div>
    </div>
  )
}
