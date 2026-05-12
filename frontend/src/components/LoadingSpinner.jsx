export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeMap[size]} border-2 border-slate-200 border-t-primary rounded-full animate-spin`} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mb-3" />
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    </div>
  )
}
