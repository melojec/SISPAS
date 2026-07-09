import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import MunicipioSeletorSimples from './MunicipioSeletorSimples'

const CAMPOS = [
  { key: 'demandante',        label: 'Demandante' },
  { key: 'orgao_responsavel', label: 'Órgão Responsável pela Auditoria' },
  { key: 'unidade_auditada',  label: 'Unidade Auditada' },
  { key: 'finalidade',        label: 'Finalidade',       textarea: true },
  { key: 'recomendacoes',     label: 'Recomendações',    textarea: true },
  { key: 'encaminhamentos',   label: 'Encaminhamentos',  textarea: true },
]

const VAZIO = { demandante: '', orgao_responsavel: '', unidade_auditada: '', finalidade: '', recomendacoes: '', encaminhamentos: '', municipio: null }

function FormAuditoria({ inicial, onSalvar, onCancelar, salvando }) {
  const [form, setForm] = useState(inicial)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Município</label>
        <MunicipioSeletorSimples
          value={form.municipio}
          onChange={id => set('municipio', id)}
        />
      </div>
      {CAMPOS.map(({ key, label, textarea }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
          {textarea ? (
            <textarea
              rows={2}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          ) : (
            <input
              type="text"
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancelar
        </button>
        <button type="button" onClick={() => onSalvar(form)} disabled={salvando}
          className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60 font-medium">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function LinhaAuditoria({ aud, onEditar, onRemover, podeEditar }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setExpandido(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandido ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {aud.unidade_auditada || <span className="text-gray-400 italic">Unidade não informada</span>}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {[aud.municipio_nome, aud.demandante, aud.orgao_responsavel].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        {podeEditar && (
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => onEditar(aud)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button type="button" onClick={() => onRemover(aud.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </button>

      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 grid grid-cols-1 gap-2">
          {CAMPOS.map(({ key, label }) => aud[key] ? (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{aud[key]}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

export default function ModalAuditorias({ meta, ano, podeEditar, onFechar }) {
  const qc = useQueryClient()
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

  const { data: auditorias = [], isLoading } = useQuery({
    queryKey: ['auditorias-sus', meta.id, ano],
    queryFn: () => api.get(`/auditorias-sus/?meta=${meta.id}&ano=${ano}&page_size=200`).then(r => r.data.results ?? r.data),
    enabled: !!ano,
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['auditorias-sus', meta.id, ano] })

  const criar = useMutation({
    mutationFn: dados => api.post('/auditorias-sus/', { ...dados, meta: meta.id, ano }),
    onSuccess: () => { invalidar(); setFormAberto(false) },
  })

  const atualizar = useMutation({
    mutationFn: ({ id, ...dados }) => api.patch(`/auditorias-sus/${id}/`, dados),
    onSuccess: () => { invalidar(); setEditando(null) },
  })

  const remover = useMutation({
    mutationFn: id => api.delete(`/auditorias-sus/${id}/`),
    onSuccess: () => { invalidar(); setConfirmandoId(null) },
  })

  function salvarForm(form) {
    if (editando) {
      atualizar.mutate({ id: editando.id, ...form })
    } else {
      criar.mutate(form)
    }
  }

  function iniciarEdicao(aud) {
    setFormAberto(false)
    setEditando(aud)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold">Auditorias do SUS</h3>
            <p className="text-xs text-blue-300 mt-0.5">{meta.codigo} · {ano} · {auditorias.length} registro{auditorias.length !== 1 ? 's' : ''}</p>
          </div>
          <button type="button" onClick={onFechar} className="text-blue-300 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Carregando…</p>
          ) : (
            <>
              {auditorias.length === 0 && !formAberto && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma auditoria registrada para {ano}.</p>
              )}
              {auditorias.map(aud => (
                editando?.id === aud.id ? (
                  <FormAuditoria
                    key={aud.id}
                    inicial={{ demandante: aud.demandante, orgao_responsavel: aud.orgao_responsavel, unidade_auditada: aud.unidade_auditada, finalidade: aud.finalidade, recomendacoes: aud.recomendacoes, encaminhamentos: aud.encaminhamentos, municipio: aud.municipio }}
                    onSalvar={salvarForm}
                    onCancelar={() => setEditando(null)}
                    salvando={atualizar.isPending}
                  />
                ) : confirmandoId === aud.id ? (
                  <div key={aud.id} className="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-700 dark:text-red-400">Remover esta auditoria?</p>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => setConfirmandoId(null)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Cancelar
                      </button>
                      <button type="button" onClick={() => remover.mutate(aud.id)} disabled={remover.isPending}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                        {remover.isPending ? 'Removendo…' : 'Remover'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <LinhaAuditoria
                    key={aud.id}
                    aud={aud}
                    podeEditar={podeEditar}
                    onEditar={iniciarEdicao}
                    onRemover={id => setConfirmandoId(id)}
                  />
                )
              ))}

              {formAberto && (
                <FormAuditoria
                  inicial={VAZIO}
                  onSalvar={salvarForm}
                  onCancelar={() => setFormAberto(false)}
                  salvando={criar.isPending}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {podeEditar && !formAberto && !editando && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button type="button" onClick={() => setFormAberto(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Auditoria
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
