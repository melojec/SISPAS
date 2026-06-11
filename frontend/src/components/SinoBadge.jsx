import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const ICONE = {
  ciclo_aberto:     '🟢',
  ciclo_fechado:    '🔴',
  registro_enviado: '📋',
  validado_coord:   '✅',
  validado_asplan:  '🎉',
}

export default function SinoBadge() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(v => !v)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        title="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
            {notificacoes.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-400 text-center">Nenhuma notificação</li>
            )}
            {notificacoes.map(n => (
              <li
                key={n.id}
                onClick={() => !n.lida && marcarLida.mutate(n.id)}
                className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${
                  n.lida
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                }`}
              >
                <span className="text-base mt-0.5 shrink-0">{ICONE[n.tipo] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.lida ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>
                    {n.mensagem}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
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
