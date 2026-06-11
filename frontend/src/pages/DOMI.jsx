import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'

// ── Modal de preenchimento da meta ────────────────────────────────────────────
const soNumeros = (e) => {
  if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

function GraficoProgresso({ meta, ciclo, onClose }) {
  const { data: registro } = useQuery({
    queryKey: ['registro', meta.id, ciclo?.id],
    queryFn: () => ciclo
      ? api.get(`/registros/?meta=${meta.id}&ciclo=${ciclo.id}`)
          .then(r => (r.data.results ?? r.data)[0] ?? null)
      : null,
    enabled: !!ciclo,
  })

  const previsto = parseFloat(meta.previsto_exercicio ?? 0)
  const realizado = parseFloat(registro?.realizado ?? 0)
  const pct = previsto > 0 ? Math.round((realizado / previsto) * 100) : null
  const corReal = pct !== null && pct >= 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'

  const dados = [
    { name: 'Previsto', valor: previsto },
    { name: 'Realizado', valor: realizado },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{meta.codigo}</p>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{meta.descricao}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">✕</button>
        </div>

        {pct !== null && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Execução:{' '}
            <span className="font-bold text-base" style={{ color: corReal }}>{pct}%</span>
            {' '}do previsto · {meta.unidade || 'unidade'}
          </p>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dados} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => v.toLocaleString('pt-BR')} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
              <Cell fill="#1e3a5f" />
              <Cell fill={corReal} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {!registro && ciclo && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Nenhum registro preenchido neste ciclo.
          </p>
        )}
      </div>
    </div>
  )
}

function ModalMeta({ meta, ciclo, onClose, onSalvo }) {
  const qc = useQueryClient()
  const [verGrafico, setVerGrafico] = useState(false)

  const ano = ciclo?.ano

  const { data: registroExistente } = useQuery({
    queryKey: ['registro', meta.id, ciclo?.id],
    queryFn: () => ciclo
      ? api.get(`/registros/?meta=${meta.id}&ciclo=${ciclo.id}`)
          .then(r => (r.data.results ?? r.data)[0] ?? null)
      : null,
    enabled: !!ciclo,
  })

  const { data: ciclosAno = [] } = useQuery({
    queryKey: ['ciclos-ano', ano],
    queryFn: () => api.get(`/ciclos/?ano=${ano}`).then(r => r.data.results ?? r.data),
    enabled: !!ano,
  })
  const ciclosByQ = Object.fromEntries(ciclosAno.map(c => [c.quadrimestre, c]))

  const { data: execucoes = [] } = useQuery({
    queryKey: ['execucoes', meta.id, ano],
    queryFn: () => api.get(`/execucoes/?atividade__meta=${meta.id}&ciclo__ano=${ano}`)
      .then(r => r.data.results ?? r.data),
    enabled: !!ano,
  })
  const execMap = Object.fromEntries(execucoes.map(e => [`${e.atividade}_${e.ciclo}`, e]))

  const buildDefaults = () => {
    const d = {
      realizado: registroExistente?.realizado ?? 0,
      problema:  registroExistente?.problema ?? '',
      acao:      registroExistente?.acao ?? '',
      analise:   registroExistente?.analise ?? '',
    }
    meta.atividades?.forEach(a => {
      [1, 2, 3].forEach(q => {
        const cId = ciclosByQ[q]?.id
        const key = `exec_${a.id}_q${q}`
        d[key] = cId ? (execMap[`${a.id}_${cId}`]?.valor_realizado ?? 0) : 0
      })
    })
    return d
  }

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ values: buildDefaults() })

  const salvarTudo = useMutation({
    mutationFn: async (dados) => {
      const registroPayload = {
        realizado: dados.realizado,
        problema:  dados.problema,
        acao:      dados.acao,
        analise:   dados.analise,
      }
      if (registroExistente) {
        await api.patch(`/registros/${registroExistente.id}/`, registroPayload)
      } else {
        await api.post('/registros/', { ...registroPayload, meta: meta.id, ciclo: ciclo.id })
      }
      const saves = []
      meta.atividades?.forEach(a => {
        [1, 2, 3].forEach(q => {
          const cicloQ = ciclosByQ[q]
          if (!cicloQ) return
          const valor = parseFloat(dados[`exec_${a.id}_q${q}`] ?? 0)
          const existente = execMap[`${a.id}_${cicloQ.id}`]
          if (existente) {
            saves.push(api.patch(`/execucoes/${existente.id}/`, { valor_realizado: valor }))
          } else if (valor > 0) {
            saves.push(api.post('/execucoes/', { atividade: a.id, ciclo: cicloQ.id, valor_realizado: valor }))
          }
        })
      })
      await Promise.all(saves)
    },
    onSuccess: () => {
      qc.invalidateQueries(['registro', meta.id])
      qc.invalidateQueries(['execucoes', meta.id])
      qc.invalidateQueries(['registros-dashboard'])
      onSalvo()
      onClose()
    },
  })

  const fmt = (v) => Number(v ?? 0).toLocaleString('pt-BR')
  const cicloQ = ciclo?.quadrimestre
  const podeEditar = !registroExistente?.validado_asplan && ciclo?.esta_aberto

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[96rem] my-6">

        {/* Cabeçalho */}
        <div className="bg-blue-950 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-mono bg-blue-800 px-2 py-0.5 rounded">{meta.codigo}</span>
              <h2 className="text-base font-semibold mt-2 leading-snug">{meta.descricao}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={() => setVerGrafico(true)}
                className="text-blue-300 hover:text-white text-xs px-3 py-1 rounded border border-blue-700 hover:border-blue-400 transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Gráficos
              </button>
              <button onClick={onClose} className="text-blue-300 hover:text-white text-xl leading-none">✕</button>
            </div>
          </div>
        </div>

        {verGrafico && (
          <GraficoProgresso meta={meta} ciclo={ciclo} onClose={() => setVerGrafico(false)} />
        )}

        <div className="px-6 py-5 space-y-6">

          {/* Indicador */}
          {meta.indicador && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1">Indicador da Meta</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{meta.indicador}</p>
              {meta.unidade && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unidade: <strong>{meta.unidade}</strong></p>
              )}
            </div>
          )}

          {/* Valores planejados */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Valores Planejados</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'PES',      valor: meta.previsto_ppa },
                { label: 'Ano',      valor: meta.previsto_exercicio },
                { label: '1º Quad.', valor: meta.previsto_q1, destaque: cicloQ === 1 },
                { label: '2º Quad.', valor: meta.previsto_q2, destaque: cicloQ === 2 },
                { label: '3º Quad.', valor: meta.previsto_q3, destaque: cicloQ === 3 },
              ].map(({ label, valor, destaque }) => (
                <div key={label}
                  className={`rounded-lg px-3 py-2 text-center border ${
                    destaque
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}>
                  <p className={`text-xs ${destaque ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
                  <p className={`text-base font-bold mt-0.5 ${destaque ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{fmt(valor)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Atividades com campos Q1/Q2/Q3 */}
          {meta.atividades?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Atividades Planejadas</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Atividade</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Indicador</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 w-24">Unidade</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">Meta</th>
                      <th className={`px-3 py-2.5 text-center text-xs font-semibold w-24 ${cicloQ===1 ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400'}`}>Q1 Realiz.</th>
                      <th className={`px-3 py-2.5 text-center text-xs font-semibold w-24 ${cicloQ===2 ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400'}`}>Q2 Realiz.</th>
                      <th className={`px-3 py-2.5 text-center text-xs font-semibold w-24 ${cicloQ===3 ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400'}`}>Q3 Realiz.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {meta.atividades.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 leading-snug">{a.descricao}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs leading-snug">{a.indicador || '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400 text-xs">{a.unidade || '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400 text-xs">{fmt(a.valor_previsto)}</td>
                        {[1, 2, 3].map(q => {
                          const cicloQ_ = ciclosByQ[q]
                          const isAtivo = cicloQ === q
                          const podePreencher = podeEditar && isAtivo && !!cicloQ_
                          return (
                            <td
                              key={q}
                              title={!cicloQ_ ? 'Quadrimestre não disponível para preenchimento' : undefined}
                              className={`px-3 py-3 text-center ${isAtivo ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                              <input
                                type="number"
                                step="1"
                                min="0"
                                disabled={!podePreencher}
                                className={`w-20 text-center border rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                  isAtivo && cicloQ_
                                    ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                    : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                                onKeyDown={soNumeros}
                                {...register(`exec_${a.id}_q${q}`)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Registro qualitativo + botões */}
          {ciclo ? (
            <form onSubmit={handleSubmit(d => salvarTudo.mutate(d))}>
              <div className="border-t dark:border-gray-700 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Registro — {ciclo.ano} · {ciclo.quadrimestre_display}
                  </p>
                  {registroExistente?.validado_asplan && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-2 py-0.5 font-medium">Validado pela ASPLAN</span>
                  )}
                  {registroExistente?.validado_coord && !registroExistente?.validado_asplan && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded px-2 py-0.5">Validado pelo Coordenador</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade Realizada <span className="text-gray-400 font-normal">({meta.unidade || 'unidade'})</span>
                  </label>
                  <input
                    type="number" step="1" min="0"
                    disabled={!podeEditar}
                    onKeyDown={soNumeros}
                    className="w-40 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400"
                    {...register('realizado')}
                  />
                </div>

                {[
                  { name: 'problema', label: 'Problemas Encontrados no Quadrimestre' },
                  { name: 'acao',     label: 'Ações Realizadas para o Enfrentamento dos Problemas' },
                  { name: 'analise',  label: 'Análises e Considerações' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <textarea
                      rows={3}
                      disabled={!podeEditar}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400"
                      {...register(name)}
                    />
                  </div>
                ))}

                {salvarTudo.isError && (
                  <p className="text-red-500 text-xs">
                    {salvarTudo.error?.response?.data?.detail || 'Erro ao salvar.'}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    Fechar
                  </button>
                  {podeEditar && (
                    <button type="submit" disabled={isSubmitting}
                      className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 font-medium">
                      {isSubmitting ? 'Salvando...' : registroExistente ? 'Atualizar Registro' : 'Salvar Registro'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="border-t dark:border-gray-700 pt-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
              Nenhum ciclo aberto — preenchimento indisponível.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página DOMI ───────────────────────────────────────────────────────────────
export default function DOMI() {
  const [diretrizSel, setDiretrizSel] = useState(null)
  const [objetivoSel, setObjetivoSel] = useState(null)
  const [metaSel, setMetaSel] = useState(null)
  const [toast, setToast] = useState(false)

  const mostrarToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 4000)
  }

  const { data: cicloAtual } = useQuery({
    queryKey: ['ciclo-atual'],
    queryFn: () => api.get('/ciclos/atual/').then(r => r.data).catch(() => null),
  })

  const { data: diretrizes = [] } = useQuery({
    queryKey: ['diretrizes'],
    queryFn: () => api.get('/diretrizes/').then(r => r.data.results ?? r.data),
  })

  const { data: objetivos = [] } = useQuery({
    queryKey: ['objetivos', diretrizSel],
    queryFn: () => api.get(`/objetivos/?diretriz=${diretrizSel}`).then(r => r.data.results ?? r.data),
    enabled: !!diretrizSel,
  })

  const { data: metas = [] } = useQuery({
    queryKey: ['metas', objetivoSel],
    queryFn: () => api.get(`/metas/?objetivo=${objetivoSel}`).then(r => r.data.results ?? r.data),
    enabled: !!objetivoSel,
  })

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-domi', objetivoSel, cicloAtual?.id],
    queryFn: () => cicloAtual && objetivoSel
      ? api.get(`/registros/?ciclo=${cicloAtual.id}&meta__objetivo=${objetivoSel}`)
          .then(r => r.data.results ?? r.data)
      : [],
    enabled: !!cicloAtual && !!objetivoSel,
  })

  const statusPorMeta = Object.fromEntries(registros.map(r => [r.meta, r]))

  const diretrizAtual = diretrizes.find(d => d.id === diretrizSel)
  const objetivoAtual = objetivos.find(o => o.id === objetivoSel)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">DOMI</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Diretrizes, Objetivos, Metas e Indicadores</p>
        {cicloAtual && (
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
            Ciclo ativo: <strong>{cicloAtual.ano} — {cicloAtual.quadrimestre_display}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Coluna Diretrizes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
          <div className="bg-blue-900 text-white px-4 py-3 text-sm font-semibold">Diretrizes</div>
          <ul className="flex-1 divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[32rem]">
            {diretrizes.map(d => (
              <li
                key={d.id}
                onClick={() => { setDiretrizSel(d.id); setObjetivoSel(null) }}
                className={`px-4 py-3 cursor-pointer text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                  diretrizSel === d.id ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-600 font-semibold' : ''
                }`}
              >
                <span className="inline-block font-mono text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 rounded px-1.5 py-0.5 mr-2">{d.codigo}</span>
                <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{d.descricao}</span>
              </li>
            ))}
            {diretrizes.length === 0 && (
              <li className="px-4 py-8 text-sm text-gray-400 text-center">Nenhuma diretriz cadastrada</li>
            )}
          </ul>
        </div>

        {/* Coluna Objetivos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
          <div className="bg-indigo-700 text-white px-4 py-3 text-sm font-semibold">
            Objetivos
            {diretrizAtual && <span className="ml-2 text-indigo-200 font-normal text-xs">— Dir. {diretrizAtual.codigo}</span>}
          </div>
          <ul className="flex-1 divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[32rem]">
            {objetivos.map(o => (
              <li
                key={o.id}
                onClick={() => setObjetivoSel(o.id)}
                className={`px-4 py-3 cursor-pointer text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                  objetivoSel === o.id ? 'bg-indigo-100 dark:bg-indigo-900/40 border-l-4 border-indigo-600 font-semibold' : ''
                }`}
              >
                <span className="inline-block font-mono text-indigo-700 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-900/30 rounded px-1.5 py-0.5 mr-2">{o.codigo}</span>
                <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{o.descricao}</span>
              </li>
            ))}
            {!diretrizSel && (
              <li className="px-4 py-8 text-sm text-gray-400 text-center">← Selecione uma diretriz</li>
            )}
            {diretrizSel && objetivos.length === 0 && (
              <li className="px-4 py-8 text-sm text-gray-400 text-center">Nenhum objetivo cadastrado</li>
            )}
          </ul>
        </div>

        {/* Coluna Metas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
          <div className="bg-teal-700 text-white px-4 py-3 text-sm font-semibold flex items-center justify-between">
            <span>
              Metas
              {objetivoAtual && <span className="ml-2 text-teal-200 font-normal text-xs">— Obj. {objetivoAtual.codigo}</span>}
            </span>
            {metas.length > 0 && <span className="text-teal-200 text-xs">{metas.length} metas</span>}
          </div>
          <ul className="flex-1 divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[32rem]">
            {metas.map(m => {
              const reg = statusPorMeta[m.id]
              return (
                <li
                  key={m.id}
                  onClick={() => setMetaSel(m)}
                  className="px-4 py-3 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block font-mono text-teal-700 dark:text-teal-400 text-xs bg-teal-50 dark:bg-teal-900/30 rounded px-1.5 py-0.5 mr-1.5">{m.codigo}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{m.descricao}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!reg && cicloAtual && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5">Pendente</span>
                      )}
                      {reg && !reg.validado_coord && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded px-1.5 py-0.5">Aguard. Coord.</span>
                      )}
                      {reg && reg.validado_coord && !reg.validado_asplan && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded px-1.5 py-0.5">Aguard. ASPLAN</span>
                      )}
                      {reg && reg.validado_asplan && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-1.5 py-0.5">✓ Validado</span>
                      )}
                      <span className="text-xs text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Abrir →
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
            {!objetivoSel && (
              <li className="px-4 py-8 text-sm text-gray-400 text-center">← Selecione um objetivo</li>
            )}
            {objetivoSel && metas.length === 0 && (
              <li className="px-4 py-8 text-sm text-gray-400 text-center">Nenhuma meta cadastrada</li>
            )}
          </ul>
        </div>
      </div>

      {metaSel && (
        <ModalMeta
          meta={metaSel}
          ciclo={cicloAtual}
          onClose={() => setMetaSel(null)}
          onSalvo={mostrarToast}
        />
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold">Meta salva com sucesso!</p>
            <p className="text-xs text-green-100">Os dados foram registrados no sistema.</p>
          </div>
        </div>
      )}
    </div>
  )
}
