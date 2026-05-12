import LoadingSpinner from './LoadingSpinner'
import { FileX } from 'lucide-react'

export default function DataTable({ columns, data, loading, emptyMessage = 'Tidak ada data' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-slate-500 mt-3 text-sm">Memuat data...</p>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <FileX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors group">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
