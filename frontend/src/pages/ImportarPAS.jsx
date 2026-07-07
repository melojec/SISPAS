import { useState } from 'react'
import api from '../services/api'

const anoAtual = new Date().getFullYear()
const anos = [anoAtual - 1, anoAtual, anoAtual + 1]

export default function ImportarPAS() {
  const [arquivo, setArquivo] = useState(null)
  const [ano, setAno] = useState(String(anoAtual))
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  const importar = async () => {
    if (!arquivo) return setErro('Selecione a planilha Base PAS (.xlsx).')
    setCarregando(true)
    setErro('')
    setResultado(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      fd.append('ano', ano)
      const { data } = await api.post('/importar-pas/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultado(data)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao importar a planilha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importar Base PAS</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Carrega Diretrizes, Objetivos, Metas e Atividades a partir da planilha Base PAS.xlsx.
          Registros existentes serão atualizados; novos serão criados.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">

        {/* Seleção do ano */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Ano da PAS
          </label>
          <select
            value={ano}
            onChange={e => setAno(e.target.value)}
            className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {anos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Planilha Base PAS (.xlsx)
          </label>
          <label className={`flex flex-col items-center justify-center gap-3 w-full py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors
            ${carregando
              ? 'opacity-50 pointer-events-none border-gray-300 dark:border-gray-600'
              : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {arquivo ? arquivo.name : 'Clique para selecionar a planilha'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Apenas .xlsx</p>
            </div>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={e => { setArquivo(e.target.files[0] || null); setResultado(null); setErro('') }}
            />
          </label>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {erro}
          </div>
        )}

        <button
          onClick={importar}
          disabled={carregando || !arquivo}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {carregando ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Importação concluída — PAS {resultado.ano}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Diretrizes', dados: resultado.resultado.diretrizes, chaves: ['criadas', 'atualizadas'] },
              { label: 'Objetivos', dados: resultado.resultado.objetivos, chaves: ['criados', 'atualizados'] },
              { label: 'Metas', dados: resultado.resultado.metas, chaves: ['criadas', 'atualizadas', 'ignoradas'] },
              { label: 'Atividades', dados: resultado.resultado.atividades, chaves: ['criadas', 'atualizadas', 'ignoradas'] },
            ].map(({ label, dados, chaves }) => (
              <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                {chaves.map(k => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 capitalize">{k}</span>
                    <span className={`font-semibold ${k === 'ignoradas' || k === 'ignorados' ? 'text-amber-500' : 'text-gray-800 dark:text-gray-100'}`}>
                      {dados[k] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
