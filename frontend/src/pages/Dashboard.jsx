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

function GraficoMetas({ registros, totalMetas }) {
  const [filtro, setFiltro] = useState('preenchidos')

  const { data: todasMetas = [] } = useQuery({
    queryKey: ['metas-todas'],
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

      <GraficoMetas registros={registros} totalMetas={totalMetas} cicloAtual={cicloAtual} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Bem-vindo, {user?.nome}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Perfil: <span className="font-medium text-blue-900 dark:text-blue-400">{user?.perfil_display}</span>
          {user?.area_nome && <> · Área: <span className="font-medium dark:text-gray-300">{user.area_nome}</span></>}
        </p>
      </div>
    </div>
  )
}
