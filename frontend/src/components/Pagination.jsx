import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 1
  const left  = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)

  for (let i = left; i <= right; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {left > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-lg text-sm border border-slate-200 hover:bg-slate-50 transition-colors">1</button>
          {left > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm border transition-colors ${
            p === page
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
              : 'border-slate-200 hover:bg-slate-50 text-secondary'
          }`}
        >
          {p}
        </button>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-lg text-sm border border-slate-200 hover:bg-slate-50 transition-colors">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
