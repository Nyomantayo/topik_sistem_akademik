import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Konfirmasi'} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-danger" />
        </div>
        <p className="text-slate-600 mb-6">{message || 'Apakah Anda yakin?'}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} disabled={loading} className="btn-secondary flex-1">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1">
            {loading ? <LoadingSpinner size="sm" /> : 'Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
