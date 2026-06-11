import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, perfis }) {
  const { user, loading } = useAuthStore()

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (perfis && !perfis.includes(user.perfil)) return <Navigate to="/" replace />

  return children
}
