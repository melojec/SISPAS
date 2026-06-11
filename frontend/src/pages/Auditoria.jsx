import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const selectCls = 'border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm'

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ acao: '', modulo: '' })

  const params = new URLSearchParams()
  if (filtros.acao) params.append('acao', filtros.acao)
  if (filtros.modulo) params.append('modulo', filtros.modulo)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => api.get(`/auditoria/?${params}`).then(r => r.data.results ?? r.data),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Log de Auditoria</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Ação</label>
          <select className={selectCls}
            value={filtros.acao} onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}>
            <option value="">Todas</option>
            <option value="criacao">Criação</option>
            <option value="edicao">Edição</option>
            <option value="exclusao">Exclusão</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Módulo</label>
          <input className={selectCls}
            placeholder="ex: core.Meta"
            value={filtros.modulo} onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value }))} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Data/Hora','Usuário','Ação','Módulo','ID','IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{log.usuario_nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded px-2 py-0.5 ${
                      log.acao === 'criacao'  ? 'bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-400' :
                      log.acao === 'edicao'   ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                                               'bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-400'
                    }`}>{log.acao_display}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{log.modulo}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{log.objeto_id}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{log.ip}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
