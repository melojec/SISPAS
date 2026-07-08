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

// ─── Ícones inline ────────────────────────────────────────────────────────────
const ChevronRight = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// ─── Checkbox tri-state ───────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange, label, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        ref={el => { if (el) el.indeterminate = indeterminate }}
        onChange={onChange}
      />
      <span className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors
        ${checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'}`}>
        {indeterminate && !checked
          ? <span className="block w-2 h-0.5 bg-white rounded" />
          : checked
            ? <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : null}
      </span>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  )
}

// ─── Linha de município ────────────────────────────────────────────────────────
function MunicipioRow({ mun, selected, onChange }) {
  return (
    <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer select-none">
      <input
        type="checkbox"
        className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
        checked={selected}
        onChange={() => onChange(mun.id)}
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{mun.nome}</span>
    </label>
  )
}

// ─── Bloco de região ──────────────────────────────────────────────────────────
function RegiaoBlock({ regiao, municipios, selectedIds, onToggleAll, onToggleMun, busca }) {
  const [open, setOpen] = useState(false)
  const filtered = municipios.filter(m => m.nome.toLowerCase().includes(busca))
  if (filtered.length === 0) return null
  const totalFil = filtered.length
  const selFil = filtered.filter(m => selectedIds.has(m.id)).length
  const allSel = selFil === totalFil
  const someSel = selFil > 0 && !allSel

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden mb-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
      >
        <ChevronRight open={open} />
        <Checkbox
          checked={allSel}
          indeterminate={someSel}
          onChange={e => { e.stopPropagation(); onToggleAll(filtered.map(m => m.id), !allSel) }}
          onClick={e => e.stopPropagation()}
        />
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex-1">{regiao}</span>
        {selFil > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-semibold">
            {selFil}/{totalFil}
          </span>
        )}
      </button>
      {open && (
        <div className="py-1 px-1">
          {filtered.map(m => (
            <MunicipioRow
              key={m.id}
              mun={m}
              selected={selectedIds.has(m.id)}
              onChange={onToggleMun}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bloco de macrorregião ─────────────────────────────────────────────────────
function MacrorregiaoBlock({ macro, regioes, selectedIds, onToggleAll, onToggleMun, busca }) {
  const [open, setOpen] = useState(false)
  const allMuns = regioes.flatMap(r => r.municipios).filter(m => m.nome.toLowerCase().includes(busca))
  if (allMuns.length === 0) return null
  const selCount = allMuns.filter(m => selectedIds.has(m.id)).length
  const allSel = selCount === allMuns.length
  const someSel = selCount > 0 && !allSel

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-left mb-1"
      >
        <ChevronRight open={open} />
        <Checkbox
          checked={allSel}
          indeterminate={someSel}
          onChange={e => { e.stopPropagation(); onToggleAll(allMuns.map(m => m.id), !allSel) }}
          onClick={e => e.stopPropagation()}
        />
        <span className="text-sm font-bold text-blue-800 dark:text-blue-200 flex-1">{macro}</span>
        {selCount > 0 && (
          <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 font-semibold">
            {selCount}
          </span>
        )}
      </button>
      {open && (
        <div className="pl-4">
          {regioes.map(r => (
            <RegiaoBlock
              key={r.regiao}
              regiao={r.regiao}
              municipios={r.municipios}
              selectedIds={selectedIds}
              onToggleAll={onToggleAll}
              onToggleMun={onToggleMun}
              busca={busca}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function MunicipioSelector({ value = [], onChange, disabled = false }) {
  const { data: hierarquia = [], isLoading } = useMunicipios()
  const [busca, setBusca] = useState('')
  const [showSelected, setShowSelected] = useState(false)

  const selectedIds = useMemo(() => new Set(value), [value])

  const buscaLower = busca.toLowerCase().trim()

  const allMuns = useMemo(
    () => hierarquia.flatMap(m => m.regioes.flatMap(r => r.municipios)),
    [hierarquia]
  )

  function onToggleMun(id) {
    if (disabled) return
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange([...next])
  }

  function onToggleAll(ids, add) {
    if (disabled) return
    const next = new Set(selectedIds)
    ids.forEach(id => add ? next.add(id) : next.delete(id))
    onChange([...next])
  }

  const selectedMuns = useMemo(
    () => allMuns.filter(m => selectedIds.has(m.id)).sort((a, b) => a.nome.localeCompare(b.nome)),
    [allMuns, selectedIds]
  )

  if (isLoading) return <p className="text-sm text-gray-400">Carregando municípios…</p>

  return (
    <div className="flex flex-col gap-2">
      {/* Cabeçalho com contagem e toggle selecionados */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {selectedIds.size} município{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
        </span>
        {selectedIds.size > 0 && !disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSelected(v => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showSelected ? 'Ver árvore' : 'Ver selecionados'}
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-red-500 hover:underline"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Lista de selecionados */}
      {showSelected && !disabled ? (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto p-2">
          {selectedMuns.map(m => (
            <MunicipioRow key={m.id} mun={m} selected onChange={onToggleMun} />
          ))}
        </div>
      ) : (
        <>
          {/* Busca */}
          {!disabled && (
            <input
              type="text"
              placeholder="Buscar município…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          )}

          {/* Árvore */}
          <div className={`border border-gray-200 dark:border-gray-600 rounded-xl overflow-y-auto p-2 ${disabled ? 'opacity-60' : ''}`} style={{ maxHeight: '18rem' }}>
            {disabled ? (
              // Modo leitura: lista flat dos selecionados
              selectedMuns.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Nenhum município registrado</p>
                : selectedMuns.map(m => (
                    <div key={m.id} className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">{m.nome}</div>
                  ))
            ) : (
              hierarquia.map(bloco => (
                <MacrorregiaoBlock
                  key={bloco.macrorregiao}
                  macro={bloco.macrorregiao}
                  regioes={bloco.regioes}
                  selectedIds={selectedIds}
                  onToggleAll={onToggleAll}
                  onToggleMun={onToggleMun}
                  busca={buscaLower}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
