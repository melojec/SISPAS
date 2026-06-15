import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'

function StatCard({ label, valor, cor }) {
  return (
    <div className={`rounded-xl p-5 text-white ${cor}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{valor ?? '—'}</p>
    </div>
  )
}

function fmt(val) {
  if (val == null || val === '') return '—'
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function pct(realizado, previsto) {
  const r = parseFloat(realizado)
  const p = parseFloat(previsto)
  if (!p || isNaN(r) || isNaN(p)) return null
  return Math.round((r / p) * 100)
}

function BarProgresso({ valor }) {
  if (valor == null) return <span className="text-xs text-gray-400">—</span>
  const clamped = Math.min(valor, 100)
  const cor = valor >= 100 ? 'bg-green-500' : valor >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{valor}%</span>
    </div>
  )
}

const selectCls = "text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"

function exportarPDF(linhas, cicloLabel, diretrizLabel, objetivoLabel) {
  const corBarra = pct => pct == null ? '' : pct >= 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#ef4444'

  const filtroDesc = [diretrizLabel, objetivoLabel].filter(Boolean).join(' › ') || 'Todas as metas'

  const linhasHtml = linhas.map(l => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:#6b7280;white-space:nowrap;padding:6px 8px;border-bottom:1px solid #f3f4f6">${l.codigo ?? ''}</td>
      <td style="font-size:12px;color:#374151;padding:6px 8px;border-bottom:1px solid #f3f4f6">${l.descricao ?? ''}</td>
      <td style="font-size:11px;color:#6b7280;text-align:center;padding:6px 8px;border-bottom:1px solid #f3f4f6;white-space:nowrap">${l.unidade || '—'}</td>
      <td style="font-size:12px;font-weight:500;text-align:right;padding:6px 8px;border-bottom:1px solid #f3f4f6;white-space:nowrap">${fmt(l.previsto)}</td>
      <td style="font-size:12px;font-weight:500;text-align:right;padding:6px 8px;border-bottom:1px solid #f3f4f6;white-space:nowrap;color:${l.preenchida ? '#111827' : '#9ca3af'}">
        ${l.preenchida ? fmt(l.realizado) : '<em>não preenchida</em>'}
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;white-space:nowrap">
        ${l.progresso != null
          ? `<div style="display:flex;align-items:center;gap:6px">
               <div style="flex:1;height:6px;background:#e5e7eb;border-radius:9999px;overflow:hidden;min-width:50px">
                 <div style="width:${Math.min(l.progresso,100)}%;height:100%;background:${corBarra(l.progresso)};border-radius:9999px"></div>
               </div>
               <span style="font-size:11px;color:#6b7280;min-width:30px;text-align:right">${l.progresso}%</span>
             </div>`
          : '<span style="font-size:11px;color:#9ca3af">—</span>'
        }
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Planejado × Realizado</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; padding: 32px; }
    h1 { font-size: 16px; font-weight: 700; color: #172554; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #A2B1D9; }
    thead th { font-size: 11px; font-weight: 600; color: #172554; text-transform: uppercase; letter-spacing: .05em; padding: 8px; text-align: left; }
    thead th.r { text-align: right; }
    thead th.c { text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Planejado × Realizado — Metas</h1>
  <p class="sub">${cicloLabel} &nbsp;|&nbsp; ${filtroDesc} &nbsp;|&nbsp; ${linhas.length} meta${linhas.length !== 1 ? 's' : ''}</p>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th class="c">Unidade</th>
        <th class="r">Planejado</th>
        <th class="r">Realizado</th>
        <th>Progresso</th>
      </tr>
    </thead>
    <tbody>${linhasHtml}</tbody>
  </table>
</body>
</html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

function TabelaMetas({ registros, todasMetas, diretrizes, cicloLabel }) {
  const [busca, setBusca] = useState('')
  const [apenasPreenchidas, setApenasPreenchidas] = useState(false)
  const [diretrizId, setDiretrizId] = useState('')
  const [objetivoId, setObjetivoId] = useState('')

  const regPorMeta = Object.fromEntries(registros.map(r => [r.meta, r]))

  // Objetivos únicos derivados das metas, filtrados pela diretriz selecionada
  const objetivosDisponiveis = [...new Map(
    todasMetas
      .filter(m => !diretrizId || String(m.objetivo_diretriz) === diretrizId)
      .map(m => [m.objetivo, { id: m.objetivo, codigo: m.objetivo_codigo }])
  ).values()]

  const linhas = todasMetas
    .filter(m => {
      if (apenasPreenchidas && !regPorMeta[m.id]) return false
      if (diretrizId && String(m.objetivo_diretriz) !== diretrizId) return false
      if (objetivoId && String(m.objetivo) !== objetivoId) return false
      const q = busca.toLowerCase()
      return !q || m.codigo?.toLowerCase().includes(q) || m.descricao?.toLowerCase().includes(q)
    })
    .map(m => {
      const reg = regPorMeta[m.id]
      return {
        id: m.id,
        codigo: m.codigo,
        descricao: m.descricao,
        unidade: m.unidade,
        previsto: m.previsto_exercicio,
        realizado: reg?.realizado ?? null,
        progresso: pct(reg?.realizado, m.previsto_exercicio),
        preenchida: !!reg,
      }
    })

  const diretrizLabel = diretrizes.find(d => String(d.id) === diretrizId)?.codigo
  const objetivoLabel = objetivosDisponiveis.find(o => String(o.id) === objetivoId)?.codigo

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Planejado × Realizado — Todas as Metas</h3>
        <button
          onClick={() => exportarPDF(linhas, cicloLabel, diretrizLabel, objetivoLabel)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select
          value={diretrizId}
          onChange={e => { setDiretrizId(e.target.value); setObjetivoId('') }}
          className={`${selectCls} w-full truncate`}
        >
          <option value="">Todas as diretrizes</option>
          {diretrizes.map(d => (
            <option key={d.id} value={d.id}>{d.codigo} — {d.descricao}</option>
          ))}
        </select>

        <select
          value={objetivoId}
          onChange={e => setObjetivoId(e.target.value)}
          disabled={objetivosDisponiveis.length === 0}
          className={`${selectCls} w-full`}
        >
          <option value="">Todos os objetivos</option>
          {objetivosDisponiveis.map(o => (
            <option key={o.id} value={o.id}>{o.codigo}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar meta..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className={`${selectCls} w-full`}
        />

        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none px-1">
          <input
            type="checkbox"
            checked={apenasPreenchidas}
            onChange={e => setApenasPreenchidas(e.target.checked)}
            className="rounded"
          />
          Apenas preenchidas
        </label>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[32rem] rounded-lg border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide sticky top-0 z-10">
              <th className="text-left px-3 py-2.5 font-medium">Código</th>
              <th className="text-left px-3 py-2.5 font-medium">Descrição</th>
              <th className="text-center px-3 py-2.5 font-medium">Unidade</th>
              <th className="text-right px-3 py-2.5 font-medium">Planejado</th>
              <th className="text-right px-3 py-2.5 font-medium">Realizado</th>
              <th className="text-left px-3 py-2.5 font-medium w-36">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8 text-xs">Nenhuma meta encontrada.</td>
              </tr>
            )}
            {linhas.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{l.codigo}</td>
                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 max-w-xs">
                  <span className="line-clamp-2">{l.descricao}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{l.unidade || '—'}</td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmt(l.previsto)}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {l.preenchida
                    ? <span className="font-medium text-gray-800 dark:text-gray-200">{fmt(l.realizado)}</span>
                    : <span className="text-xs text-gray-400 italic">não preenchida</span>
                  }
                </td>
                <td className="px-3 py-2.5"><BarProgresso valor={l.progresso} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-right">{linhas.length} meta{linhas.length !== 1 ? 's' : ''} exibida{linhas.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

function GraficoMetas({ registros, totalMetas, todasMetas }) {
  const [filtro, setFiltro] = useState('preenchidos')

  const preenchidos = registros.length
  const metasPreenchidasIds = new Set(registros.map(r => r.meta))
  const naoPreenchidasLista = todasMetas.filter(m => !metasPreenchidasIds.has(m.id))

  const pizza = [
    { name: 'Preenchidas', value: preenchidos, cor: '#16a34a' },
    { name: 'Não preenchidas', value: Math.max(0, totalMetas - preenchidos), cor: '#e5e7eb' },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preenchimento de Metas — Ciclo Atual</h3>

      {totalMetas === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma meta cadastrada.</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Rosca */}
          <div className="lg:w-56 shrink-0 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pizza} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={2}>
                  {pizza.map(d => <Cell key={d.name} fill={d.cor} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} metas`, name]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center -mt-2">
              <span className="font-bold text-green-600 text-lg">{Math.round((preenchidos / totalMetas) * 100)}%</span> preenchido
            </p>
          </div>

          {/* Lista */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Abas */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'preenchidos', label: `✓ Preenchidas (${preenchidos})` },
                { key: 'nao', label: `✗ Não preenchidas (${naoPreenchidasLista.length || Math.max(0, totalMetas - preenchidos)})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFiltro(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtro === key ? 'bg-blue-900 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Lista preenchidas */}
            {filtro === 'preenchidos' && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                {registros.map(r => (
                  <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="text-green-600 shrink-0">✓</span>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400 shrink-0">{r.meta_codigo}</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{r.meta_descricao}</span>
                  </li>
                ))}
                {registros.length === 0 && (
                  <li className="px-3 py-6 text-sm text-gray-400 text-center">Nenhuma meta preenchida ainda.</li>
                )}
              </ul>
            )}

            {/* Lista não preenchidas */}
            {filtro === 'nao' && (
              naoPreenchidasLista.length === 0 ? (
                <p className="text-xs text-green-600 text-center py-4">Todas as metas foram preenchidas!</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                  {naoPreenchidasLista.map(m => (
                    <li key={m.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="text-red-400 shrink-0">✗</span>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 shrink-0">{m.codigo}</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{m.descricao}</span>
                      {m.area_nome && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-blue-900/10 dark:bg-blue-300/10 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                          {m.area_nome}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: todasMetas = [] } = useQuery({
    queryKey: ['metas-todas-v2'],
    queryFn: async () => {
      const results = []
      let page = 1
      while (true) {
        const r = await api.get(`/metas/?page=${page}&page_size=100`)
        results.push(...(r.data.results ?? []))
        if (!r.data.next) break
        page++
      }
      return results
    },
  })

  const { data: diretrizes = [] } = useQuery({
    queryKey: ['diretrizes-lista'],
    queryFn: () => api.get('/diretrizes/?page_size=200').then(r => r.data.results ?? r.data),
  })

  const { data: cicloAtual } = useQuery({
    queryKey: ['ciclo-atual'],
    queryFn: () => api.get('/ciclos/atual/').then(r => r.data).catch(() => null),
  })

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-dashboard', cicloAtual?.id],
    queryFn: () => cicloAtual
      ? api.get(`/registros/?ciclo=${cicloAtual.id}`).then(r => r.data.results ?? r.data)
      : [],
    enabled: !!cicloAtual,
  })

  const { data: totalMetas = 0 } = useQuery({
    queryKey: ['metas-count'],
    queryFn: () => api.get('/metas/?page_size=1').then(r => r.data.count ?? 0),
  })

  const totalRegistros = registros.length
  const validados = registros.filter(r => r.validado_asplan).length
  const pendentes = totalRegistros - validados

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cicloAtual ? `Ciclo ativo: ${cicloAtual.ano} — ${cicloAtual.quadrimestre_display}` : 'Nenhum ciclo aberto'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Metas"      valor={totalMetas}      cor="bg-blue-900" />
        <StatCard label="Registros no Ciclo"  valor={totalRegistros}  cor="bg-indigo-700" />
        <StatCard label="Validados (ASPLAN)"  valor={validados}       cor="bg-green-700" />
        <StatCard label="Pendentes"           valor={pendentes}       cor="bg-amber-600" />
      </div>

      <GraficoMetas registros={registros} totalMetas={totalMetas} todasMetas={todasMetas} />
      <TabelaMetas
        registros={registros}
        todasMetas={todasMetas}
        diretrizes={diretrizes}
        cicloLabel={cicloAtual ? `Ciclo ${cicloAtual.ano} — ${cicloAtual.quadrimestre_display}` : ''}
      />

    </div>
  )
}
