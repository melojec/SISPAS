import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../services/api'

const ANOS = [2024, 2023, 2022, 2021, 2020]

const CORES_FUNDO = [
  '#1e40af', '#0369a1', '#0f766e', '#6d28d9', '#b45309', '#be123c',
]

function fmt(v) {
  if (v == null) return '—'
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function fmtLong(v) {
  if (v == null) return '—'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { subfuncao, total } = payload[0].payload
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-[220px]">
      <p className="font-semibold mb-1">{subfuncao}</p>
      <p className="text-blue-300">{fmtLong(total)}</p>
    </div>
  )
}

function GraficoSubfuncoes({ dados }) {
  const chartData = useMemo(() => {
    const map = {}
    for (const fundo of dados) {
      for (const sub of fundo.subfuncoes) {
        const key = sub.ds_subfuncao
        if (!map[key]) map[key] = { subfuncao: key, total: 0 }
        for (const op of sub.operacoes) map[key].total += op.vl_receita || 0
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10)
  }, [dados])

  if (!chartData.length) return null

  const maxVal = Math.max(...chartData.map(d => d.total))

  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Total por Subfunção
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="subfuncao" tick={{ fontSize: 10, fill: '#6b7280' }} width={140} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`hsl(${210 + i * 8}, 70%, ${55 - i * 2}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TabelaFundos({ fundos }) {
  const [fundoAberto, setFundoAberto] = useState(null)

  return (
    <div className="space-y-3">
      {fundos.map((fundo, fi) => {
        const isOpen = fundoAberto === fi
        const totalFundo = fundo.subfuncoes.reduce(
          (s, sub) => s + sub.operacoes.reduce((ss, op) => ss + (op.vl_receita || 0), 0), 0
        )
        return (
          <div key={fi} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setFundoAberto(isOpen ? null : fi)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-left gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: CORES_FUNDO[fi % CORES_FUNDO.length] }}
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {fundo.ds_fundo}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                  {fmt(totalFundo)}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold">Subfunção</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-semibold">Corrente</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-semibold">Capital</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundo.subfuncoes.map((sub, si) => {
                      const corrente = sub.operacoes.find(o => o.st_natureza === 'O')?.vl_receita ?? 0
                      const capital = sub.operacoes.find(o => o.st_natureza === 'A')?.vl_receita ?? 0
                      const total = corrente + capital
                      return (
                        <tr key={si} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                            <span className="font-mono text-gray-400 mr-1.5">{sub.nu_codigo_interno}</span>
                            {sub.ds_subfuncao}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                            {corrente ? fmtLong(corrente) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                            {capital ? fmtLong(capital) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                            {fmtLong(total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ModalOrcamentario({ municipio, onFechar }) {
  // municipio: { nome, cod_ibge }
  const [ano, setAno] = useState(ANOS[0])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dgmp-orcamentario', municipio.cod_ibge, ano],
    queryFn: () =>
      api.get('/dgmp/orcamentario/', {
        params: {
          co_esfera: 1,
          nu_ano_exercicio: ano,
          co_municipio_ibge: municipio.cod_ibge,
        },
      }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const municipioData = useMemo(() => {
    if (!data) return null
    const estado = data?.[0]?.estados?.[0]
    return estado?.municipios?.[0] ?? null
  }, [data])

  const totalGeral = useMemo(() => {
    if (!municipioData) return 0
    return municipioData.fundos.reduce(
      (s, f) => s + f.subfuncoes.reduce(
        (ss, sub) => ss + sub.operacoes.reduce((sss, op) => sss + (op.vl_receita || 0), 0), 0
      ), 0
    )
  }, [municipioData])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 rounded-t-2xl flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold">Dados Orçamentários — DGMP</h3>
            </div>
            <p className="text-xs text-blue-300">{municipio.nome} · PAS Municipal · {ano}</p>
          </div>
          <button type="button" onClick={onFechar} className="text-blue-300 hover:text-white mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtro de ano */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ano:</span>
          <div className="flex gap-1.5">
            {ANOS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAno(a)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  a === ano
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {municipioData && (
            <span className="ml-auto text-xs font-bold text-blue-800 dark:text-blue-300">
              Total: {fmtLong(totalGeral)}
            </span>
          )}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
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

          {!isLoading && !isError && !municipioData && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">
                Nenhum dado orçamentário encontrado para {municipio.nome} em {ano}.
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                O município pode não ter registrado PAS neste ano.
              </p>
            </div>
          )}

          {municipioData && (
            <>
              <GraficoSubfuncoes dados={municipioData.fundos} />
              <TabelaFundos fundos={municipioData.fundos} />
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-right">
                Fonte: DigiSUS Gestor (DGMP) · Programação Anual de Saúde
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
