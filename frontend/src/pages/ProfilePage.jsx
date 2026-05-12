import { useState, useEffect } from 'react'
import { User, Lock, Save, GraduationCap, BookOpen, Hash, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

import { authService }       from '../services/authService'
import { mahasiswaService }  from '../services/mahasiswaService'
import { useAuth }           from '../context/AuthContext'
import LoadingSpinner        from '../components/LoadingSpinner'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })
  const [profileLoading, setProfileLoading] = useState(false)

  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', confirm: '' })

  // Data akademik untuk role mahasiswa
  const [myData,    setMyData]    = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (user?.role !== 'mahasiswa') return
    setDataLoading(true)
    mahasiswaService.getMe()
      .then((res) => setMyData(res.data.data))
      .catch(() => {}) // tidak semua mahasiswa sudah di-link
      .finally(() => setDataLoading(false))
  }, [user?.role])
  const [passLoading, setPassLoading] = useState(false)
  const [passErrors, setPassErrors] = useState({})

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await authService.updateProfile({ name: profileForm.name })
      updateUser(res.data.data)
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil')
    } finally {
      setProfileLoading(false)
    }
  }

  const validatePass = () => {
    const errs = {}
    if (!passForm.old_password) errs.old_password = 'Wajib diisi'
    if (!passForm.new_password) errs.new_password = 'Wajib diisi'
    else if (passForm.new_password.length < 8) errs.new_password = 'Minimal 8 karakter'
    if (passForm.new_password !== passForm.confirm) errs.confirm = 'Konfirmasi password tidak sesuai'
    setPassErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePassSubmit = async (e) => {
    e.preventDefault()
    if (!validatePass()) return
    setPassLoading(true)
    try {
      await authService.changePassword({
        old_password: passForm.old_password,
        new_password: passForm.new_password,
      })
      toast.success('Password berhasil diubah')
      setPassForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password')
    } finally {
      setPassLoading(false)
    }
  }

  const ROLE_LABEL = { admin: 'Administrator', mahasiswa: 'Mahasiswa', dosen: 'Dosen' }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Profil Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* User info card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className="badge-primary mt-1">{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h3 className="font-semibold text-secondary flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Informasi Akun
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ name: e.target.value })}
              className="input-field"
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={user?.email} readOnly className="input-field bg-slate-50 text-slate-500 cursor-not-allowed" />
            <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4" /> Simpan</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change password card */}
      <div className="card p-6">
        <form onSubmit={handlePassSubmit} className="space-y-4">
          <h3 className="font-semibold text-secondary flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Ubah Password
          </h3>
          {[
            { key: 'old_password', label: 'Password Lama' },
            { key: 'new_password', label: 'Password Baru' },
            { key: 'confirm',      label: 'Konfirmasi Password Baru' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type="password"
                value={passForm[key]}
                onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                className={`input-field ${passErrors[key] ? 'border-danger' : ''}`}
                placeholder="••••••••"
              />
              {passErrors[key] && <p className="text-danger text-xs mt-1">{passErrors[key]}</p>}
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" disabled={passLoading} className="btn-primary">
              {passLoading ? <LoadingSpinner size="sm" /> : <><Lock className="w-4 h-4" /> Ubah Password</>}
            </button>
          </div>
        </form>
      </div>

      {/* Card Data Akademik — hanya muncul untuk mahasiswa */}
      {user?.role === 'mahasiswa' && (
        <div className="card p-6">
          <h3 className="font-semibold text-secondary flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-primary" /> Data Akademik
          </h3>

          {dataLoading ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="lg" /></div>
          ) : myData ? (
            <div className="space-y-0">
              {/* Info mahasiswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { icon: Hash,         label: 'NIM',      value: myData.nim },
                  { icon: User,         label: 'Nama',     value: myData.nama },
                  { icon: BookOpen,     label: 'Jurusan',  value: myData.jurusan },
                  { icon: Calendar,     label: 'Semester', value: `Semester ${myData.semester}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-semibold text-secondary">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dosen Pembimbing Akademik */}
              <div className="border border-primary/20 rounded-xl p-4 bg-blue-50">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Dosen Pembimbing Akademik
                </p>
                {myData.dosen_pa_nama ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {myData.dosen_pa_nama[0]}
                    </div>
                    <div>
                      <p className="font-bold text-secondary">{myData.dosen_pa_nama}</p>
                      <span className="badge-primary text-xs mt-1">Dosen PA</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">Belum ada Dosen PA yang ditugaskan</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Data akademik belum terhubung ke akun ini.</p>
              <p className="text-xs mt-1">Hubungi admin untuk menghubungkan data Anda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
