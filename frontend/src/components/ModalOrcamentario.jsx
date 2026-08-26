import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const ANOS = [2026, 2025, 2024, 2023, 2022, 2021, 2020]

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

// Monta estrutura de pivot a partir dos fundos agregados
function buildPivot(fundos) {
  // Colunas = fundos
  const colunas = fundos.map(f => ({ co_fundo: f.co_fundo, ds_fundo: f.ds_fundo }))

  // Linhas = subfunções únicas
  const subfMap = {}
  for (const fundo of fundos) {
    for (const sub of fundo.subfuncoes ?? []) {
      const key = sub.nu_codigo_interno
      if (!subfMap[key]) subfMap[key] = { codigo: sub.nu_codigo_interno, nome: sub.ds_subfuncao }
    }
  }
  const subfuncoes = Object.values(subfMap).sort((a, b) => a.codigo.localeCompare(b.codigo))

  // Célula: { [co_fundo]: { O: valor, A: valor } }
  const celulas = {}
  for (const fundo of fundos) {
    for (const sub of fundo.subfuncoes ?? []) {
      const key = sub.nu_codigo_interno
      if (!celulas[key]) celulas[key] = {}
      if (!celulas[key][fundo.co_fundo]) celulas[key][fundo.co_fundo] = { O: 0, A: 0 }
      for (const op of sub.operacoes ?? []) {
        celulas[key][fundo.co_fundo][op.st_natureza] =
          (celulas[key][fundo.co_fundo][op.st_natureza] || 0) + (op.vl_receita || 0)
      }
    }
  }

  return { colunas, subfuncoes, celulas }
}

export default function ModalOrcamentario({ onFechar }) {
  const [ano, setAno] = useState(2025)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dgmp-orcamentario-estadual', ano],
    queryFn: () =>
      api.get('/dgmp/orcamentario/', {
        params: { co_esfera: 2, nu_ano_exercicio: ano, sg_uf: 'MA' },
      }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  // Agrega fundos de todos os registros retornados para o estado
  const fundos = useMemo(() => {
    if (!data) return []
    const root = Array.isArray(data) ? data[0] : data
    const municipios = root?.estados?.[0]?.municipios ?? []
    const map = {}
    for (const mun of municipios) {
      for (const f of mun.fundos ?? []) {
        if (!map[f.co_fundo]) map[f.co_fundo] = { ...f, subfuncoes: [] }
        for (const sub of f.subfuncoes ?? []) {
          const existing = map[f.co_fundo].subfuncoes.find(s => s.nu_codigo_interno === sub.nu_codigo_interno)
          if (existing) {
            for (const op of sub.operacoes ?? []) {
              const eo = existing.operacoes.find(o => o.st_natureza === op.st_natureza)
              if (eo) eo.vl_receita = (eo.vl_receita || 0) + (op.vl_receita || 0)
              else existing.operacoes.push({ ...op })
            }
          } else {
            map[f.co_fundo].subfuncoes.push({ ...sub, operacoes: sub.operacoes.map(o => ({ ...o })) })
          }
        }
      }
    }
    return Object.values(map)
  }, [data])

  const { colunas, subfuncoes, celulas } = useMemo(() => buildPivot(fundos), [fundos])

  const totalGeral = useMemo(() =>
    subfuncoes.reduce((s, sub) =>
      s + colunas.reduce((ss, col) => {
        const c = celulas[sub.codigo]?.[col.co_fundo]
        return ss + (c?.O || 0) + (c?.A || 0)
      }, 0), 0)
  , [subfuncoes, colunas, celulas])

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
            <p className="text-xs text-blue-300">Estado do Maranhão · PAS Estadual · {ano}</p>
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
              <span className="text-sm text-gray-500">Consultando DGMP…</span>
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-sm text-red-500">Erro ao consultar o DGMP. Tente novamente.</p>
            </div>
          )}

          {!isLoading && !isError && subfuncoes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Nenhum dado encontrado para o Maranhão em {ano}.</p>
            </div>
          )}

          {subfuncoes.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="text-xs border-collapse w-full" style={{ minWidth: `${180 + colunas.length * 140 + 140}px` }}>
                <thead>
                  <tr className="bg-blue-950 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold sticky left-0 bg-blue-950 z-10 min-w-[180px]">Subfunções</th>
                    <th className="px-2 py-2.5 text-center font-semibold w-20">Natureza</th>
                    {colunas.map(col => (
                      <th key={col.co_fundo} className="px-3 py-2 text-right font-semibold leading-tight max-w-[140px]">
                        {col.ds_fundo}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-semibold bg-blue-900">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {subfuncoes.map((sub, si) => {
                    const rowTotalC = colunas.reduce((s, col) => s + (celulas[sub.codigo]?.[col.co_fundo]?.O || 0), 0)
                    const rowTotalA = colunas.reduce((s, col) => s + (celulas[sub.codigo]?.[col.co_fundo]?.A || 0), 0)
                    const rowBase = si % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                    return [
                      // Linha Corrente
                      <tr key={`${sub.codigo}-C`} className={`${rowBase} border-b border-gray-100 dark:border-gray-700`}>
                        <td className={`px-3 py-1.5 font-semibold sticky left-0 z-10 ${rowBase}`}>
                          {sub.codigo} — {sub.nome}
                        </td>
                        <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">Corrente</td>
                        {colunas.map(col => {
                          const v = celulas[sub.codigo]?.[col.co_fundo]?.O || 0
                          return (
                            <td key={col.co_fundo} className="px-3 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                              {v ? fmt(v) : '—'}
                            </td>
                          )
                        })}
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                          {rowTotalC ? fmt(rowTotalC) : '—'}
                        </td>
                      </tr>,
                      // Linha Capital
                      <tr key={`${sub.codigo}-A`} className={`${rowBase} border-b border-gray-200 dark:border-gray-600`}>
                        <td className={`px-3 py-1.5 sticky left-0 z-10 ${rowBase}`} />
                        <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">Capital</td>
                        {colunas.map(col => {
                          const v = celulas[sub.codigo]?.[col.co_fundo]?.A || 0
                          return (
                            <td key={col.co_fundo} className="px-3 py-1.5 text-right tabular-nums text-gray-600 dark:text-gray-400">
                              {v ? fmt(v) : '—'}
                            </td>
                          )
                        })}
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                          {rowTotalA ? fmt(rowTotalA) : '—'}
                        </td>
                      </tr>,
                    ]
                  })}

                  {/* Linha TOTAL */}
                  <tr className="bg-blue-950 text-white font-bold border-t-2 border-blue-800">
                    <td className="px-3 py-2.5 sticky left-0 bg-blue-950 z-10">TOTAL</td>
                    <td />
                    {colunas.map(col => {
                      const total = subfuncoes.reduce((s, sub) => {
                        const c = celulas[sub.codigo]?.[col.co_fundo]
                        return s + (c?.O || 0) + (c?.A || 0)
                      }, 0)
                      return (
                        <td key={col.co_fundo} className="px-3 py-2.5 text-right tabular-nums">
                          {total ? fmt(total) : '—'}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-right tabular-nums bg-blue-900">
                      {fmt(totalGeral)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {subfuncoes.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-right">
              Fonte: DigiSUS Gestor (DGMP) · Programação Anual de Saúde
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
