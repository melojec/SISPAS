import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function Relatorios() {
  const [cicloId, setCicloId] = useState('')
  const [areaId, setAreaId] = useState('')

  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos'],
    queryFn: () => api.get('/ciclos/').then(r => r.data.results ?? r.data),
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas/').then(r => r.data.results ?? r.data),
  })

  const params = new URLSearchParams()
  if (cicloId) params.append('ciclo', cicloId)
  if (areaId) params.append('area', areaId)
  const query = params.toString() ? `?${params}` : ''

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ciclo</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={cicloId}
              onChange={e => setCicloId(e.target.value)}
            >
              <option value="">Todos os ciclos</option>
              {ciclos.map(c => (
                <option key={c.id} value={c.id}>{c.ano} — {c.quadrimestre_display}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={areaId}
              onChange={e => setAreaId(e.target.value)}
            >
              <option value="">Todas as áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.sigla} — {a.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`/api/relatorios/pdf/${query}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 bg-white rounded-xl shadow p-6 hover:bg-red-50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-2xl group-hover:bg-red-200 transition-colors">
            📄
          </div>
          <div>
            <p className="font-semibold text-gray-800">Exportar PDF</p>
            <p className="text-xs text-gray-500">Relatório da PAS formatado</p>
          </div>
        </a>

        <a
          href={`/api/relatorios/xlsx/${query}`}
          className="flex items-center gap-4 bg-white rounded-xl shadow p-6 hover:bg-green-50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-2xl group-hover:bg-green-200 transition-colors">
            📊
          </div>
          <div>
            <p className="font-semibold text-gray-800">Exportar Excel</p>
            <p className="text-xs text-gray-500">Planilha XLSX com todos os dados</p>
          </div>
        </a>
      </div>
    </div>
  )
}
