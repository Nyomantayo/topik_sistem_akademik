import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

import { dosenService }   from '../services/dosenService'
import { useAuth }        from '../context/AuthContext'

import DataTable     from '../components/DataTable'
import Modal         from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar     from '../components/SearchBar'
import Pagination    from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'

function DosenForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState({
    nidn:  initial?.nidn  || '',
    nama:  initial?.nama  || '',
    email: initial?.email || '',
    prodi: initial?.prodi || '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">NIDN *</label>
          <input className="input-field" value={form.nidn} onChange={set('nidn')} placeholder="0123456701" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap *</label>
          <input className="input-field" value={form.nama} onChange={set('nama')} placeholder="Dr. Nama Dosen" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
          <input type="email" className="input-field" value={form.email} onChange={set('email')} placeholder="dosen@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Program Studi *</label>
          <input className="input-field" value={form.prodi} onChange={set('prodi')} placeholder="Teknik Informatika" required />
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

function MahasiswaBimbinganModal({ dosen, isOpen, onClose }) {
  const [data,    setData]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 8

  useEffect(() => {
    if (!isOpen || !dosen) return
    setLoading(true)
    dosenService.getMahasiswaBimbingan(dosen.id, { page, limit })
      .then((res) => {
        setData(res.data.data || [])
        setTotal(res.data.pagination?.total || 0)
      })
      .catch(() => toast.error('Gagal memuat mahasiswa bimbingan'))
      .finally(() => setLoading(false))
  }, [dosen, isOpen, page])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mahasiswa Bimbingan — ${dosen?.nama}`} size="lg">
      <p className="text-sm text-slate-500 mb-4">{total} mahasiswa dibimbing</p>
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-slate-400 py-10">Belum ada mahasiswa bimbingan</p>
      ) : (
        <div className="space-y-2">
          {data.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                {m.nama[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-secondary truncate">{m.nama}</p>
                <p className="text-xs text-slate-500">{m.nim} · {m.jurusan} · Semester {m.semester}</p>
              </div>
            </div>
          ))}
          <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </div>
      )}
    </Modal>
  )
}

export default function DosenPage() {
  const { user }    = useAuth()
  const isAdmin     = user?.role === 'admin'

  const [data,         setData]         = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [modalType,    setModalType]    = useState(null)
  const [selected,     setSelected]     = useState(null)
  const [formLoading,  setFormLoading]  = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bimbinganDosen, setBimbinganDosen] = useState(null)
  const limit = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await dosenService.getAll({ page, limit, search })
      setData(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch {
      toast.error('Gagal memuat data dosen')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [search])

  const handleCreate = async (formData) => {
    setFormLoading(true)
    try {
      await dosenService.create(formData)
      toast.success('Dosen berhasil ditambahkan')
      setModalType(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan dosen')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (formData) => {
    setFormLoading(true)
    try {
      await dosenService.update(selected.id, formData)
      toast.success('Dosen berhasil diperbarui')
      setModalType(null); setSelected(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui dosen')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await dosenService.delete(deleteTarget.id)
      toast.success('Dosen berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus dosen')
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'nidn', label: 'NIDN',
      render: (val) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{val}</span>,
    },
    { key: 'nama', label: 'Nama' },
    { key: 'email', label: 'Email', className: 'hidden md:table-cell' },
    {
      key: 'prodi', label: 'Program Studi',
      render: (val) => <span className="badge-success">{val}</span>,
    },
    {
      key: 'id', label: 'Aksi', className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setBimbinganDosen(row)}
            className="btn-ghost text-slate-500 p-1.5"
            title="Lihat mahasiswa bimbingan"
          >
            <Users className="w-4 h-4" />
          </button>
          {isAdmin && (
            <>
              <button onClick={() => { setSelected(row); setModalType('edit') }} className="btn-ghost text-primary p-1.5" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(row)} className="btn-ghost text-danger p-1.5" title="Hapus">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Dosen</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} dosen terdaftar</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModalType('create')} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Dosen
          </button>
        )}
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, NIDN, prodi..." className="max-w-xs" />
        </div>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="Tidak ada dosen ditemukan" />
        {total > limit && (
          <div className="p-4 border-t border-slate-100">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal isOpen={modalType === 'create'} onClose={() => setModalType(null)} title="Tambah Dosen" size="md">
        <DosenForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <Modal isOpen={modalType === 'edit'} onClose={() => { setModalType(null); setSelected(null) }} title="Edit Dosen" size="md">
        <DosenForm initial={selected} onSubmit={handleUpdate} loading={formLoading} />
      </Modal>

      <MahasiswaBimbinganModal
        dosen={bimbinganDosen}
        isOpen={!!bimbinganDosen}
        onClose={() => setBimbinganDosen(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Hapus Dosen"
        message={`Yakin ingin menghapus dosen "${deleteTarget?.nama}"?`}
      />
    </div>
  )
}
