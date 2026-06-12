import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../services/api'

const PERFIS = ['administrador','asplan','coordenador','usuario','visualizador']

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1'

function ModalUsuario({ usuario, areas, onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm({ defaultValues: usuario ?? {} })
  const [erro, setErro] = useState('')

  const salvar = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, area: d.area || null }
      return usuario ? api.patch(`/usuarios/${usuario.id}/`, payload) : api.post('/usuarios/', payload)
    },
    onSuccess: () => { qc.invalidateQueries(['usuarios']); onClose() },
    onError: (e) => {
      const data = e.response?.data
      if (data?.email) setErro('Este e-mail já está cadastrado.')
      else if (data && typeof data === 'object') setErro(Object.values(data).flat().join(' '))
      else setErro('Erro ao salvar. Tente novamente.')
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{usuario ? 'Editar Usuário' : 'Novo Usuário'}</h3>
        </div>
        <form onSubmit={handleSubmit(d => salvar.mutate(d))} className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nome</label>
              <input className={inputCls} {...register('nome', { required: true })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">E-mail</label>
              <input type="email" className={inputCls} {...register('email', { required: true })} />
            </div>
            {!usuario && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Senha <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span></label>
                <input type="password" className={inputCls} {...register('password', { required: !usuario, minLength: { value: 6, message: 'Mínimo 6 caracteres.' } })} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Perfil</label>
              <select className={inputCls} {...register('perfil')}>
                {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Área</label>
              <select className={inputCls} {...register('area')}>
                <option value="">— nenhuma —</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.sigla}</option>)}
              </select>
            </div>
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios/').then(r => r.data.results ?? r.data),
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas/').then(r => r.data.results ?? r.data),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }) => api.patch(`/usuarios/${id}/`, { ativo }),
    onSuccess: () => qc.invalidateQueries(['usuarios']),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestão de Usuários</h2>
        <button onClick={() => setModal({})}
          className="px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800">
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Nome','E-mail','Perfil','Área','Ativo','Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{u.nome}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 rounded px-2 py-0.5">{u.perfil_display}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.area_nome ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded px-2 py-0.5 ${u.ativo ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                    {u.ativo ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setModal(u)} className="text-xs text-blue-700 dark:text-blue-400 hover:underline">Editar</button>
                    <button onClick={() => toggleAtivo.mutate({ id: u.id, ativo: !u.ativo })}
                      className={`text-xs hover:underline ${u.ativo ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <ModalUsuario
          usuario={modal.id ? modal : null}
          areas={areas}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
