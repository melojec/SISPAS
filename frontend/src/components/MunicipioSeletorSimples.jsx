import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

function useMunicipios() {
  return useQuery({
    queryKey: ['municipios'],
    queryFn: () => api.get('/municipios/').then(r => r.data),
    staleTime: Infinity,
  })
}

export default function MunicipioSeletorSimples({ value, onChange, disabled = false }) {
  const { data: hierarquia = [], isLoading } = useMunicipios()
  const [busca, setBusca] = useState('')

  const todos = useMemo(
    () => hierarquia.flatMap(m => m.regioes.flatMap(r =>
      r.municipios.map(mun => ({ ...mun, regiao: r.regiao, macrorregiao: m.macrorregiao }))
    )),
    [hierarquia]
  )

  const selecionado = todos.find(m => m.id === value)

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase().trim()
    return b ? todos.filter(m => m.nome.toLowerCase().includes(b)) : todos
  }, [todos, busca])

  // Agrupado por macrorregião > região para o <optgroup>
  const grupos = useMemo(() => {
    const map = {}
    filtrados.forEach(m => {
      const k = `${m.macrorregiao}|||${m.regiao}`
      if (!map[k]) map[k] = { macrorregiao: m.macrorregiao, regiao: m.regiao, muns: [] }
      map[k].muns.push(m)
    })
    return Object.values(map).sort((a, b) => a.macrorregiao.localeCompare(b.macrorregiao) || a.regiao.localeCompare(b.regiao))
  }, [filtrados])

  if (isLoading) return <p className="text-sm text-gray-400">Carregando…</p>

  if (disabled) {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {selecionado ? selecionado.nome : <span className="text-gray-400 italic">Não informado</span>}
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        placeholder="Filtrar município…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">— Selecione um município —</option>
        {grupos.map(g => (
          <optgroup key={`${g.macrorregiao}-${g.regiao}`} label={`${g.macrorregiao} › ${g.regiao}`}>
            {g.muns.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
