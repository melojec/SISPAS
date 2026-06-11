import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import api from '../services/api'

export default function Ciclos() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos'],
    queryFn: () => api.get('/ciclos/').then(r => r.data.results ?? r.data),
  })

  const criar = useMutation({
    mutationFn: (d) => api.post('/ciclos/', d),
    onSuccess: () => { qc.invalidateQueries(['ciclos']); reset(); setShowForm(false) },
  })

  const alterarSituacao = useMutation({
    mutationFn: ({ id, situacao }) => api.patch(`/ciclos/${id}/`, { situacao }),
    onSuccess: () => qc.invalidateQueries(['ciclos']),
  })

  const inputCls = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Controle de Ciclos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800"
        >
          + Novo Ciclo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(d => criar.mutate(d))}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Ano</label>
            <input type="number" className={`${inputCls} mt-1`} {...register('ano', { required: true })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Quadrimestre</label>
            <select className={`${inputCls} mt-1`} {...register('quadrimestre', { required: true })}>
              <option value="1">1º (Jan–Abr)</option>
              <option value="2">2º (Mai–Ago)</option>
              <option value="3">3º (Set–Dez)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Abertura</label>
            <input type="date" className={`${inputCls} mt-1`} {...register('dt_abertura', { required: true })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Encerramento</label>
            <input type="date" className={`${inputCls} mt-1`} {...register('dt_encerramento', { required: true })} />
          </div>
          <div className="col-span-2 sm:col-span-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800">
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Ciclo','Abertura','Encerramento','Situação','Ação'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {ciclos.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{c.ano} — {c.quadrimestre_display}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.dt_abertura}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.dt_encerramento}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded px-2 py-0.5 ${c.situacao === 'aberto' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {c.situacao === 'aberto' ? 'Aberto' : 'Fechado'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => alterarSituacao.mutate({ id: c.id, situacao: c.situacao === 'aberto' ? 'fechado' : 'aberto' })}
                    className={`text-xs hover:underline ${c.situacao === 'aberto' ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
                  >
                    {c.situacao === 'aberto' ? 'Fechar' : 'Reabrir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
