import { TrendingUp } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colorMap = {
    primary: 'bg-blue-50 text-primary',
    success: 'bg-green-50 text-success',
    warning: 'bg-amber-50 text-warning',
    accent:  'bg-sky-50 text-accent',
    danger:  'bg-red-50 text-danger',
  }

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-secondary">
            {value ?? <span className="text-slate-300 text-xl">—</span>}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
