import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DOMI from './pages/DOMI'
import Relatorios from './pages/Relatorios'
import Ciclos from './pages/Ciclos'
import Usuarios from './pages/Usuarios'
import Auditoria from './pages/Auditoria'
import AnexoIndicadores from './pages/AnexoIndicadores'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

function AppRoutes() {
  const { fetchMe } = useAuthStore()
  useEffect(() => { fetchMe() }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="domi" element={<DOMI />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="ciclos" element={
          <ProtectedRoute perfis={['administrador','asplan']}><Ciclos /></ProtectedRoute>
        } />
        <Route path="usuarios" element={
          <ProtectedRoute perfis={['administrador']}><Usuarios /></ProtectedRoute>
        } />
        <Route path="analise-indicadores" element={<AnexoIndicadores />} />
        <Route path="auditoria" element={
          <ProtectedRoute perfis={['administrador','asplan']}><Auditoria /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
