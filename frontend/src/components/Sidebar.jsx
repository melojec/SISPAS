import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const NAV = [
  { to: '/',           label: 'Dashboard',  icone: '📊', perfis: null },
  { to: '/domi',       label: 'DOMI',       icone: '🗂️', perfis: null },
  { to: '/relatorios', label: 'Relatórios', icone: '📄', perfis: null },
  { to: '/ciclos',     label: 'Ciclos',     icone: '🔄', perfis: ['administrador','asplan'] },
  { to: '/usuarios',   label: 'Usuários',   icone: '👥', perfis: ['administrador'] },
  { to: '/auditoria',  label: 'Auditoria',  icone: '🔍', perfis: ['administrador','asplan'] },
]

function SinoBadge() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const qc = useQueryClient()

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => api.get('/notificacoes/').then(r => r.data.results ?? r.data),
    refetchInterval: 30000,
  })

  const naoLidas = notificacoes.filter(n => !n.lida).length

  const marcarLida = useMutation({
    mutationFn: (id) => api.patch(`/notificacoes/${id}/`, { lida: true }),
    onSuccess: () => qc.invalidateQueries(['notificacoes']),
  })

  const marcarTodas = useMutation({
    mutationFn: () => api.post('/notificacoes/marcar_todas_lidas/'),
    onSuccess: () => qc.invalidateQueries(['notificacoes']),
  })

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const ICONE = {
    ciclo_aberto:     '🟢',
    ciclo_fechado:    '🔴',
    registro_enviado: '📋',
    validado_coord:   '✅',
    validado_asplan:  '🎉',
  }

  return (
    <div ref={ref} className="relative px-4 pb-2">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-800 transition-colors text-sm"
      >
        <span className="flex items-center gap-2">
          <span>🔔</span> Notificações
        </span>
        {naoLidas > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute bottom-full left-0 mb-1 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notificacoes.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-400 text-center">Nenhuma notificação</li>
            )}
            {notificacoes.map(n => (
              <li
                key={n.id}
                onClick={() => !n.lida && marcarLida.mutate(n.id)}
                className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${
                  n.lida ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <span className="text-base mt-0.5 shrink-0">{ICONE[n.tipo] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.lida ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                    {n.mensagem}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.criada_em).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!n.lida && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  const links = NAV.filter(n => !n.perfis || n.perfis.includes(user?.perfil))

  return (
    <aside className="w-64 min-h-screen bg-blue-950 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-blue-800">
        <h1 className="text-xl font-bold tracking-wide">SISPAS</h1>
        <p className="text-xs text-blue-300 mt-1">SESA-MA</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-700 text-white font-semibold' : 'text-blue-200 hover:bg-blue-800'
              }`
            }
          >
            <span>{icone}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-blue-800 pt-2">
        <SinoBadge />
      </div>

      <div className="px-4 py-4 border-t border-blue-800">
        <p className="text-xs text-blue-300 truncate">{user?.nome}</p>
        <p className="text-xs text-blue-400">{user?.perfil_display}</p>
        <button
          onClick={logout}
          className="mt-2 w-full text-xs text-red-300 hover:text-red-100 text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
