import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

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
      <h2 className="text-2xl font-bold text-gray-800">Log de Auditoria</h2>

      <div className="bg-white rounded-xl shadow p-4 flex gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Ação</label>
          <select className="border rounded-lg px-3 py-1.5 text-sm"
            value={filtros.acao} onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}>
            <option value="">Todas</option>
            <option value="criacao">Criação</option>
            <option value="edicao">Edição</option>
            <option value="exclusao">Exclusão</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Módulo</label>
          <input className="border rounded-lg px-3 py-1.5 text-sm"
            placeholder="ex: core.Meta"
            value={filtros.modulo} onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value }))} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Data/Hora','Usuário','Ação','Módulo','ID','IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{log.usuario_nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded px-2 py-0.5 ${
                      log.acao === 'criacao' ? 'bg-green-100 text-green-700' :
                      log.acao === 'edicao' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{log.acao_display}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.modulo}</td>
                  <td className="px-4 py-3 text-gray-500">{log.objeto_id}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.ip}</td>
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
