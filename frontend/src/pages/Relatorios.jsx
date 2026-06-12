import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const selectCls = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm'

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

export default function Relatorios() {
  const [cicloId, setCicloId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [loadingFichas, setLoadingFichas] = useState(false)
  const [loadingXLSX, setLoadingXLSX] = useState(false)
  const [erro, setErro] = useState('')

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

  const exportarFichas = async () => {
    setErro(''); setLoadingFichas(true)
    try {
      const r = await api.get(`/relatorios/metas/pdf/${query}`, { responseType: 'blob' })
      baixarArquivo(r.data, 'fichas_metas.pdf')
    } catch { setErro('Erro ao gerar PDF de fichas.') }
    finally { setLoadingFichas(false) }
  }

  const exportarXLSX = async () => {
    setErro(''); setLoadingXLSX(true)
    try {
      const r = await api.get(`/relatorios/xlsx/${query}`, { responseType: 'blob' })
      baixarArquivo(r.data, 'relatorio_pas.xlsx')
    } catch { setErro('Erro ao gerar Excel.') }
    finally { setLoadingXLSX(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relatórios</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciclo</label>
            <select className={selectCls} value={cicloId} onChange={e => setCicloId(e.target.value)}>
              <option value="">Todos os ciclos</option>
              {ciclos.map(c => (
                <option key={c.id} value={c.id}>{c.ano} — {c.quadrimestre_display}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Área</label>
            <select className={selectCls} value={areaId} onChange={e => setAreaId(e.target.value)}>
              <option value="">Todas as áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.sigla} — {a.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={exportarFichas}
          disabled={loadingFichas}
          className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group text-left disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors shrink-0">
            📋
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Exportar Fichas PDF</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{loadingFichas ? 'Gerando...' : 'Fichas individuais de todas as metas'}</p>
          </div>
        </button>

        <button
          onClick={exportarXLSX}
          disabled={loadingXLSX}
          className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group text-left disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-2xl group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors shrink-0">
            📊
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Exportar Excel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{loadingXLSX ? 'Gerando...' : 'Planilha XLSX com todos os dados'}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
