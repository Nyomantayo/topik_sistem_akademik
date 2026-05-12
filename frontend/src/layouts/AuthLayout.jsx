import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-700 to-secondary flex items-center justify-center p-4">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">KRS Akademik</h1>
          <p className="text-blue-200 text-sm mt-1">Sistem Informasi Akademik Modern</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
