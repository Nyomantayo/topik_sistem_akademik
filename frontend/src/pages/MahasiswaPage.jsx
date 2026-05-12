import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

import { mahasiswaService } from '../services/mahasiswaService'
import { dosenService }     from '../services/dosenService'
import { useAuth }          from '../context/AuthContext'

import DataTable    from '../components/DataTable'
import Modal        from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar    from '../components/SearchBar'
import Pagination   from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

function MahasiswaForm({ initial, dosenList, onSubmit, loading }) {
  const [form, setForm] = useState({
    nim:        initial?.nim        || '',
    nama:       initial?.nama       || '',
    email:      initial?.email      || '',
    jurusan:    initial?.jurusan    || '',
    semester:   initial?.semester   || 1,
    dosen_pa_id: initial?.dosen_pa_id || '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      semester:    parseInt(form.semester),
      dosen_pa_id: form.dosen_pa_id ? parseInt(form.dosen_pa_id) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">NIM *</label>
          <input className="input-field" value={form.nim} onChange={set('nim')} placeholder="2305551001" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap *</label>
          <input className="input-field" value={form.nama} onChange={set('nama')} placeholder="Nama mahasiswa" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
          <input type="email" className="input-field" value={form.email} onChange={set('email')} placeholder="mahasiswa@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Jurusan *</label>
          <input className="input-field" value={form.jurusan} onChange={set('jurusan')} placeholder="Teknik Informatika" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester *</label>
          <select className="input-field" value={form.semester} onChange={set('semester')}>
            {SEMESTER_OPTIONS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Dosen PA</label>
          <select className="input-field" value={form.dosen_pa_id} onChange={set('dosen_pa_id')}>
            <option value="">-- Tidak ada --</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>{d.nama} ({d.nidn})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <LoadingSpinner size="sm" /> : 'Simpan'}
        </button>
      </div>
    </form>
  )
}

export default function MahasiswaPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'

  const [data,       setData]       = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [dosenList,  setDosenList]  = useState([])

  const [modalType,  setModalType]  = useState(null) // 'create' | 'edit' | 'detail'
  const [selected,   setSelected]   = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const limit = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mahasiswaService.getAll({ page, limit, search })
      setData(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch {
      toast.error('Gagal memuat data mahasiswa')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    // Ambil daftar dosen untuk dropdown
    dosenService.getAll({ limit: 100 }).then((res) => {
      setDosenList(res.data.data || [])
    }).catch(() => {})
  }, [])

  // Reset ke halaman 1 jika search berubah
  useEffect(() => { setPage(1) }, [search])

  const handleCreate = async (formData) => {
    setFormLoading(true)
    try {
      await mahasiswaService.create(formData)
      toast.success('Mahasiswa berhasil ditambahkan')
      setModalType(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan mahasiswa')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (formData) => {
    setFormLoading(true)
    try {
      await mahasiswaService.update(selected.id, formData)
      toast.success('Mahasiswa berhasil diperbarui')
      setModalType(null)
      setSelected(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui mahasiswa')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await mahasiswaService.delete(deleteTarget.id)
      toast.success('Mahasiswa berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus mahasiswa')
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'nim', label: 'NIM',
      render: (val) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{val}</span>,
    },
    { key: 'nama', label: 'Nama' },
    { key: 'jurusan', label: 'Jurusan' },
    {
      key: 'semester', label: 'Smt',
      render: (val) => <span className="badge-primary">Smt {val}</span>,
    },
    {
      key: 'dosen_pa_nama', label: 'Dosen PA',
      render: (val) => val ? (
        <span className="text-slate-700">{val}</span>
      ) : (
        <span className="text-slate-400 italic text-xs">Belum ada</span>
      ),
    },
    {
      key: 'id', label: 'Aksi', className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => { setSelected(row); setModalType('detail') }}
            className="btn-ghost text-slate-500 p-1.5"
            title="Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => { setSelected(row); setModalType('edit') }}
                className="btn-ghost text-primary p-1.5"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="btn-ghost text-danger p-1.5"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Mahasiswa</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} mahasiswa terdaftar
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalType('create')} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Mahasiswa
          </button>
        )}
      </div>

      {/* Search + Table */}
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, NIM, jurusan..."
            className="max-w-xs"
          />
        </div>

        <DataTable columns={columns} data={data} loading={loading} emptyMessage="Tidak ada mahasiswa ditemukan" />

        {total > limit && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalType === 'create'}
        onClose={() => setModalType(null)}
        title="Tambah Mahasiswa"
        size="lg"
      >
        <MahasiswaForm dosenList={dosenList} onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalType === 'edit'}
        onClose={() => { setModalType(null); setSelected(null) }}
        title="Edit Mahasiswa"
        size="lg"
      >
        <MahasiswaForm initial={selected} dosenList={dosenList} onSubmit={handleUpdate} loading={formLoading} />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={modalType === 'detail'}
        onClose={() => { setModalType(null); setSelected(null) }}
        title="Detail Mahasiswa"
        size="md"
      >
        {selected && (
          <div className="space-y-3">
            {[
              ['NIM',       selected.nim],
              ['Nama',      selected.nama],
              ['Email',     selected.email],
              ['Jurusan',   selected.jurusan],
              ['Semester',  `Semester ${selected.semester}`],
              ['Dosen PA',  selected.dosen_pa_nama || '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex py-2 border-b border-slate-50 last:border-0">
                <span className="w-32 text-sm text-slate-500 flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-secondary">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Hapus Mahasiswa"
        message={`Yakin ingin menghapus mahasiswa "${deleteTarget?.nama}"? Data yang dihapus tidak dapat dikembalikan.`}
      />
    </div>
  )
}
