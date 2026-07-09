import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

function useMunicipios() {
  return useQuery({
    queryKey: ['municipios'],
    queryFn: () => api.get('/municipios/').then(r => r.data),
    staleTime: Infinity,
  })
}

const ChevronRight = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

function TriCheckbox({ checked, indeterminate, onChange }) {
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={e => { e.stopPropagation(); onChange() }}
      className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center cursor-pointer transition-colors
        ${checked || indeterminate ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'}`}
    >
      {indeterminate && !checked
        ? <span className="block w-2 h-0.5 bg-white rounded" />
        : checked
          ? <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : null}
    </span>
  )
}

function RegiaoBlock({ regiao, municipios, selectedIds, onToggleAll, onToggleMun, busca }) {
  const [open, setOpen] = useState(false)
  const filtered = busca ? municipios.filter(m => m.nome.toLowerCase().includes(busca)) : municipios
  if (filtered.length === 0) return null
  const sel = filtered.filter(m => selectedIds.has(m.id)).length
  const allSel = sel === filtered.length
  const someSel = sel > 0 && !allSel

  return (
    <div className="mb-1 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
        <ChevronRight open={open || !!busca} />
        <TriCheckbox checked={allSel} indeterminate={someSel} onChange={() => onToggleAll(filtered.map(m => m.id), !allSel)} />
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex-1">{regiao}</span>
        {sel > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-semibold">{sel}/{filtered.length}</span>
        )}
      </button>
      {(open || !!busca) && (
        <div className="py-1 px-1">
          {filtered.map(m => (
            <label key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer select-none">
              <input type="checkbox" className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                checked={selectedIds.has(m.id)} onChange={() => onToggleMun(m.id)} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{m.nome}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function MacrorregiaoBlock({ macro, regioes, selectedIds, onToggleAll, onToggleMun, busca }) {
  const [open, setOpen] = useState(false)
  const allMuns = regioes.flatMap(r => r.municipios).filter(m => !busca || m.nome.toLowerCase().includes(busca))
  if (allMuns.length === 0) return null
  const sel = allMuns.filter(m => selectedIds.has(m.id)).length
  const allSel = sel === allMuns.length
  const someSel = sel > 0 && !allSel

  return (
    <div className="mb-2">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-left mb-1">
        <ChevronRight open={open || !!busca} />
        <TriCheckbox checked={allSel} indeterminate={someSel} onChange={() => onToggleAll(allMuns.map(m => m.id), !allSel)} />
        <span className="text-sm font-bold text-blue-800 dark:text-blue-200 flex-1">{macro}</span>
        {sel > 0 && <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 font-semibold">{sel}</span>}
      </button>
      {(open || !!busca) && (
        <div className="pl-4">
          {regioes.map(r => (
            <RegiaoBlock key={r.regiao} regiao={r.regiao} municipios={r.municipios}
              selectedIds={selectedIds} onToggleAll={onToggleAll} onToggleMun={onToggleMun} busca={busca} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal interno ─────────────────────────────────────────────────────────────
function ModalSeletor({ value, onConfirmar, onFechar }) {
  const { data: hierarquia = [], isLoading } = useMunicipios()
  const [busca, setBusca] = useState('')
  const [draft, setDraft] = useState(() => new Set(value))
  const [aba, setAba] = useState('arvore') // 'arvore' | 'selecionados'

  const buscaLower = busca.toLowerCase().trim()

  const allMuns = useMemo(
    () => hierarquia.flatMap(m => m.regioes.flatMap(r => r.municipios)),
    [hierarquia]
  )

  const selectedMuns = useMemo(
    () => allMuns.filter(m => draft.has(m.id)).sort((a, b) => a.nome.localeCompare(b.nome)),
    [allMuns, draft]
  )

  function toggle(id) {
    setDraft(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll(ids, add) {
    setDraft(prev => {
      const n = new Set(prev)
      ids.forEach(id => add ? n.add(id) : n.delete(id))
      return n
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold">Municípios Beneficiados</h3>
            <p className="text-xs text-blue-300 mt-0.5">{draft.size} município{draft.size !== 1 ? 's' : ''} selecionado{draft.size !== 1 ? 's' : ''}</p>
          </div>
          <button type="button" onClick={onFechar} className="text-blue-300 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
          {[['arvore', 'Selecionar por Região'], ['selecionados', `Selecionados (${draft.size})`]].map(([k, label]) => (
            <button key={k} type="button" onClick={() => setAba(k)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${aba === k ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Carregando municípios…</p>
          ) : aba === 'arvore' ? (
            <>
              <input type="text" placeholder="Buscar município…" value={busca} onChange={e => setBusca(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3" />
              {hierarquia.map(bloco => (
                <MacrorregiaoBlock key={bloco.macrorregiao} macro={bloco.macrorregiao} regioes={bloco.regioes}
                  selectedIds={draft} onToggleAll={toggleAll} onToggleMun={toggle} busca={buscaLower} />
              ))}
            </>
          ) : (
            selectedMuns.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">Nenhum município selecionado.</p>
              : <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {selectedMuns.map(m => (
                    <label key={m.id} className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer select-none">
                      <input type="checkbox" className="accent-blue-600 w-4 h-4" checked onChange={() => toggle(m.id)} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{m.nome}</span>
                    </label>
                  ))}
                </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
          {draft.size > 0 && (
            <button type="button" onClick={() => setDraft(new Set())}
              className="text-xs text-red-500 hover:underline">
              Limpar seleção
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button type="button" onClick={onFechar}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancelar
            </button>
            <button type="button" onClick={() => onConfirmar([...draft])}
              className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium">
              Confirmar ({draft.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Export: botão + modal ─────────────────────────────────────────────────────
export default function MunicipioSelector({ value = [], onChange, disabled = false }) {
  const [aberto, setAberto] = useState(false)
  const { data: hierarquia = [] } = useMunicipios()

  const allMuns = useMemo(
    () => hierarquia.flatMap(m => m.regioes.flatMap(r => r.municipios)),
    [hierarquia]
  )

  const selectedMuns = useMemo(
    () => allMuns.filter(m => value.includes(m.id)),
    [allMuns, value]
  )

  function confirmar(ids) {
    onChange(ids)
    setAberto(false)
  }

  return (
    <>
      {/* Botão / resumo */}
      <div className="flex items-center gap-3">
        {!disabled && (
          <button type="button" onClick={() => setAberto(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {value.length === 0 ? 'Selecionar municípios' : `${value.length} município${value.length !== 1 ? 's' : ''} selecionado${value.length !== 1 ? 's' : ''}`}
          </button>
        )}
        {disabled && value.length > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value.length} município{value.length !== 1 ? 's' : ''} beneficiado{value.length !== 1 ? 's' : ''}
          </span>
        )}
        {value.length > 0 && !disabled && (
          <button type="button" onClick={() => onChange([])} className="text-xs text-red-500 hover:underline">Limpar</button>
        )}
      </div>

      {/* Nomes dos selecionados (somente leitura) */}
      {disabled && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedMuns.sort((a,b) => a.nome.localeCompare(b.nome)).map(m => (
            <span key={m.id} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">{m.nome}</span>
          ))}
        </div>
      )}

      {/* Modal */}
      {aberto && <ModalSeletor value={value} onConfirmar={confirmar} onFechar={() => setAberto(false)} />}
    </>
  )
}
