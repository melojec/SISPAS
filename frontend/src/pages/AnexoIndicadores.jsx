import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function AnexoIndicadores() {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')

  const { data: anexos = [], isLoading } = useQuery({
    queryKey: ['anexos-indicadores'],
    queryFn: () => api.get('/anexos-indicadores/').then(r => r.data.results ?? r.data),
  })

  const enviar = async (file) => {
    setUploading(true)
    setErro('')
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      await api.post('/anexos-indicadores/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      qc.invalidateQueries({ queryKey: ['anexos-indicadores'] })
    } catch {
      setErro('Erro ao enviar o arquivo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const remover = async (id) => {
    try {
      await api.delete(`/anexos-indicadores/${id}/`)
      qc.invalidateQueries({ queryKey: ['anexos-indicadores'] })
    } catch {
      setErro('Erro ao remover o arquivo.')
    }
  }

  const fmtData = (iso) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Análise de Indicadores</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Documentos .docx de análise dos indicadores</p>
      </div>

      {/* Área de upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Enviar novo arquivo</p>
        <label className={`flex flex-col items-center justify-center gap-3 w-full py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none border-gray-300 dark:border-gray-600' : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {uploading ? 'Enviando...' : 'Clique para selecionar um arquivo .docx'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Somente arquivos .docx</p>
          </div>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            disabled={uploading}
            onChange={e => { if (e.target.files[0]) enviar(e.target.files[0]) }}
          />
        </label>
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>

      {/* Lista de arquivos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Arquivos enviados</p>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">Carregando...</p>
        ) : anexos.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-10">Nenhum arquivo enviado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl border border-gray-100 dark:border-gray-700">
            {anexos.map(a => (
              <li key={a.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-700 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{a.nome_original}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtData(a.enviado_em)} · {a.enviado_por_nome}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={a.arquivo}
                    download={a.nome_original}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition-colors"
                  >
                    Baixar
                  </a>
                  <button
                    onClick={() => remover(a.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
