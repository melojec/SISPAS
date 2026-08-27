import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const ANOS = [2026, 2025, 2024, 2023, 2022, 2021, 2020]

// Nomes oficiais das fontes — Quadro 1 SIOPS estadual (colunas valor1..valor9)
const FONTES = [
  { key: 'valor1', label: 'Recursos Ordinários — Fonte Livre' },
  { key: 'valor2', label: 'Receitas de Impostos e de Transferência de Impostos — Saúde' },
  { key: 'valor3', label: 'Transferências Fundo a Fundo de Recursos do SUS provenientes do Governo Federal' },
  { key: 'valor4', label: 'Transferências Fundo a Fundo de Recursos do SUS provenientes do Governo Estadual' },
  { key: 'valor5', label: 'Transferências de Convênios destinadas à Saúde' },
  { key: 'valor6', label: 'Operações de Crédito vinculadas à Saúde' },
  { key: 'valor7', label: 'Transferências da União — Inciso I do art. 5º da Lei Complementar 173/2020' },
  { key: 'valor8', label: 'Royalties do Petróleo destinados à Saúde' },
  { key: 'valor9', label: 'Outros Recursos Destinados à Saúde' },
]

function fmt(v) {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtAbrev(v) {
  if (!v) return '—'
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export default function ModalOrcamentario({ onFechar }) {
  const [ano, setAno] = useState(2025)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['siops-despesa-subfuncao', ano],
    queryFn: () =>
      api.get('/siops/despesa-subfuncao/', {
        params: { uf: '21', ano, periodo: '12' },
      }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  // Linhas de subfunção (exclui linha TOTAL do API — grupo 17)
  const linhas = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(row => row.grupo !== '17' && row.descricao !== 'TOTAL')
  }, [data])

  // Linha TOTAL vinda da API
  const linhaTotalAPI = useMemo(() => {
    if (!Array.isArray(data)) return null
    return data.find(row => row.grupo === '17' || row.descricao === 'TOTAL') || null
  }, [data])

  // Todas as 9 colunas do Quadro 1 SIOPS — exibidas sempre
  const colunasAtivas = FONTES

  const totalGeral = linhaTotalAPI?.valor10 || 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full flex flex-col" style={{ maxHeight: '92vh', maxWidth: '96vw' }}>

        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 rounded-t-2xl flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold">Despesa Total em Saúde por Fonte e Subfunção</h3>
            </div>
            <p className="text-xs text-blue-300">Estado do Maranhão · Execução Orçamentária · {ano}</p>
          </div>
          <button type="button" onClick={onFechar} className="text-blue-300 hover:text-white mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtro de ano */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 shrink-0 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ano:</span>
          <div className="flex gap-1.5 flex-wrap">
            {ANOS.map(a => (
              <button key={a} type="button" onClick={() => setAno(a)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  a === ano ? 'bg-blue-900 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {a}
              </button>
            ))}
          </div>
          {totalGeral > 0 && (
            <span className="ml-auto text-xs font-bold text-blue-800 dark:text-blue-300">
              Total Geral: {fmtAbrev(totalGeral)}
            </span>
          )}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm text-gray-500">Consultando SIOPS…</span>
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-sm text-red-500">Erro ao consultar o SIOPS. Tente novamente.</p>
            </div>
          )}

          {!isLoading && !isError && linhas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Nenhum dado encontrado para o Maranhão em {ano}.</p>
            </div>
          )}

          {linhas.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="text-xs border-collapse w-full" style={{ minWidth: `${260 + colunasAtivas.length * 150 + 130}px` }}>
                <thead>
                  <tr className="bg-blue-950 text-white">
                    <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-blue-950 z-10 min-w-[260px] border-r border-blue-800">Subfunção</th>
                    <th className="px-2 py-3 text-center font-semibold w-20 text-blue-200 border-r border-blue-800">Natureza</th>
                    {colunasAtivas.map(f => (
                      <th key={f.key} className="px-3 py-3 text-right font-semibold border-r border-blue-800 whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-bold bg-blue-900 whitespace-nowrap">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Agrupa por subfunção (pares Corrente/Capital) */}
                  {(() => {
                    const grupos = {}
                    for (const row of linhas) {
                      // descricao: "301 - Atenção Básica - Corrente"
                      const nat = row.descricao.endsWith('- Corrente') ? 'Corrente'
                               : row.descricao.endsWith('- Capital') ? 'Capital'
                               : 'Corrente'
                      const nome = row.descricao
                        .replace(/ - Corrente$/, '')
                        .replace(/ - Capital$/, '')
                        .trim()
                      if (!grupos[nome]) grupos[nome] = {}
                      grupos[nome][nat] = row
                    }
                    return Object.entries(grupos).map(([nome, nat], gi) => {
                      const rowC = nat['Corrente']
                      const rowA = nat['Capital']
                      return [
                        rowC && (
                          <tr key={`${nome}-C`} className="border-t-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                            <td className="px-3 pt-2 pb-0.5 font-semibold text-gray-800 dark:text-gray-100 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                              {nome}
                            </td>
                            <td className="px-2 pt-2 pb-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                              Corrente
                            </td>
                            {colunasAtivas.map(f => {
                              const v = rowC[f.key] || 0
                              return (
                                <td key={f.key} className="px-3 pt-2 pb-0.5 text-right tabular-nums text-gray-800 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700">
                                  {v ? fmt(v) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                </td>
                              )
                            })}
                            <td className="px-3 pt-2 pb-0.5 text-right tabular-nums font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-950/40">
                              {rowC.valor10 ? fmt(rowC.valor10) : '—'}
                            </td>
                          </tr>
                        ),
                        rowA && (
                          <tr key={`${nome}-A`} className="bg-white dark:bg-gray-800">
                            <td className="px-3 pt-0.5 pb-2 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />
                            <td className="px-2 pt-0.5 pb-2 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700">
                              Capital
                            </td>
                            {colunasAtivas.map(f => {
                              const v = rowA[f.key] || 0
                              return (
                                <td key={f.key} className="px-3 pt-0.5 pb-2 text-right tabular-nums text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                                  {v ? fmt(v) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                </td>
                              )
                            })}
                            <td className="px-3 pt-0.5 pb-2 text-right tabular-nums font-bold text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-950/40">
                              {rowA.valor10 ? fmt(rowA.valor10) : '—'}
                            </td>
                          </tr>
                        ),
                      ]
                    })
                  })()}

                  {/* Linha TOTAL */}
                  {linhaTotalAPI && (
                    <tr className="bg-blue-950 text-white font-bold border-t-2 border-blue-700">
                      <td className="px-3 py-3 sticky left-0 bg-blue-950 z-10 border-r border-blue-800 tracking-wide">TOTAL</td>
                      <td className="border-r border-blue-800" />
                      {colunasAtivas.map(f => (
                        <td key={f.key} className="px-3 py-3 text-right tabular-nums border-r border-blue-800">
                          {linhaTotalAPI[f.key] ? fmt(linhaTotalAPI[f.key]) : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-right tabular-nums bg-blue-900">
                        {fmt(linhaTotalAPI.valor10)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {linhas.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-right">
              Fonte: Sistema de Informações sobre Orçamentos Públicos em Saúde (SIOPS) · Período 12 · {ano}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
