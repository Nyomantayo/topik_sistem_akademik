import { useState, useEffect } from 'react'
import { Users, GraduationCap, BookOpen, BarChart3 } from 'lucide-react'
import StatCard from '../components/StatCard'
import { PageLoader } from '../components/LoadingSpinner'
import { dashboardService } from '../services/dashboardService'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats()
        setStats(res.data.data)
      } catch {
        toast.error('Gagal memuat statistik')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan data akademik sistem KRS</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Mahasiswa"
          value={stats?.total_mahasiswa}
          icon={Users}
          color="primary"
          subtitle="Data mahasiswa terdaftar"
        />
        <StatCard
          title="Total Dosen"
          value={stats?.total_dosen}
          icon={GraduationCap}
          color="success"
          subtitle="Dosen aktif"
        />
        <StatCard
          title="Program Studi"
          value={stats?.dosen_per_prodi?.length || 0}
          icon={BookOpen}
          color="warning"
          subtitle="Prodi tersedia"
        />
        <StatCard
          title="Jurusan"
          value={stats?.mahasiswa_per_jurusan?.length || 0}
          icon={BarChart3}
          color="accent"
          subtitle="Jurusan aktif"
        />
      </div>

      {/* Charts / breakdown section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mahasiswa per Jurusan */}
        <div className="card p-6">
          <h2 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mahasiswa per Jurusan
          </h2>
          {stats?.mahasiswa_per_jurusan?.length > 0 ? (
            <div className="space-y-3">
              {stats.mahasiswa_per_jurusan.map((item) => {
                const percentage = stats.total_mahasiswa > 0
                  ? Math.round((item.count / stats.total_mahasiswa) * 100)
                  : 0
                return (
                  <div key={item.jurusan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-secondary">{item.jurusan}</span>
                      <span className="text-slate-500">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">Belum ada data mahasiswa</p>
          )}
        </div>

        {/* Dosen per Prodi */}
        <div className="card p-6">
          <h2 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-success" />
            Dosen per Program Studi
          </h2>
          {stats?.dosen_per_prodi?.length > 0 ? (
            <div className="space-y-3">
              {stats.dosen_per_prodi.map((item) => {
                const percentage = stats.total_dosen > 0
                  ? Math.round((item.count / stats.total_dosen) * 100)
                  : 0
                return (
                  <div key={item.prodi}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-secondary">{item.prodi}</span>
                      <span className="text-slate-500">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">Belum ada data dosen</p>
          )}
        </div>
      </div>
    </div>
  )
}
