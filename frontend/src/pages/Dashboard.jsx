import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

  const { data: metas = [] } = useQuery({
    queryKey: ['metas-count'],
    queryFn: () => api.get('/metas/').then(r => r.data.results ?? r.data),
  })

  const totalMetas = metas.length
  const totalRegistros = registros.length
  const validados = registros.filter(r => r.validado_asplan).length
  const pendentes = totalRegistros - validados

  const dadosGrafico = registros.slice(0, 10).map(r => ({
    name: r.meta_codigo,
    previsto: parseFloat(r.meta?.previsto_exercicio ?? 0),
    realizado: parseFloat(r.realizado ?? 0),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">
          {cicloAtual ? `Ciclo ativo: ${cicloAtual.ano} — ${cicloAtual.quadrimestre_display}` : 'Nenhum ciclo aberto'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Metas" valor={totalMetas} cor="bg-blue-900" />
        <StatCard label="Registros no Ciclo" valor={totalRegistros} cor="bg-indigo-700" />
        <StatCard label="Validados (ASPLAN)" valor={validados} cor="bg-green-700" />
        <StatCard label="Pendentes" valor={pendentes} cor="bg-amber-600" />
      </div>

      {dadosGrafico.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Previsto × Realizado (últimas 10 metas)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosGrafico} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="previsto" name="Previsto" fill="#1e3a5f" radius={[3,3,0,0]} />
              <Bar dataKey="realizado" name="Realizado" fill="#16a34a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Bem-vindo, {user?.nome}</h3>
        <p className="text-sm text-gray-500">
          Perfil: <span className="font-medium text-blue-900">{user?.perfil_display}</span>
          {user?.area_nome && <> · Área: <span className="font-medium">{user.area_nome}</span></>}
        </p>
      </div>
    </div>
  )
}
