import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const ROLES = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'dosen',     label: 'Dosen' },
  { value: 'admin',     label: 'Admin' },
]

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'mahasiswa' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary">Daftar Akun</h2>
        <p className="text-slate-500 text-sm mt-1">Buat akun baru untuk mengakses sistem</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama lengkap"
            className={`input-field ${errors.name ? 'border-danger' : ''}`}
          />
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
        </div>

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
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
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

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <LoadingSpinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Daftar</>}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
