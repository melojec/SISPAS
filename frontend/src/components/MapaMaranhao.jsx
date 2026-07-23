import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'

const IBGE_GEOJSON_URL =
  'https://servicodados.ibge.gov.br/api/v3/malhas/estados/21' +
  '?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio'

function useGeoJSON() {
  return useQuery({
    queryKey: ['ma-geojson'],
    queryFn: () => fetch(IBGE_GEOJSON_URL).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  })
}

function useMunicipioMap() {
  return useQuery({
    queryKey: ['municipios'],
    queryFn: () => api.get('/municipios/').then(r => r.data),
    staleTime: Infinity,
  })
}

function ringToPath(ring, minLon, maxLon, minLat, maxLat, W, H) {
  return ring
    .map(([lon, lat], i) => {
      const x = ((lon - minLon) / (maxLon - minLon)) * W
      const y = ((maxLat - lat) / (maxLat - minLat)) * H
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ') + ' Z'
}

function featureToPath(geometry, minLon, maxLon, minLat, maxLat, W, H) {
  const rings =
    geometry.type === 'Polygon'
      ? geometry.coordinates
      : geometry.coordinates.flat(1)
  return rings.map(r => ringToPath(r, minLon, maxLon, minLat, maxLat, W, H)).join(' ')
}

function allCoords(features) {
  const pts = []
  for (const f of features) {
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys)
      for (const ring of poly)
        for (const pt of ring) pts.push(pt)
  }
  return pts
}

function MapaSVG({ paths, ativoSet, cumulativoSet, tooltip, setTooltip, strokeWidth = 0.3, svgStyle }) {
  return (
    <svg
      viewBox="0 0 400 350"
      preserveAspectRatio="xMidYMid meet"
      style={svgStyle}
      onMouseLeave={() => setTooltip(null)}
    >
      {paths.map(({ codarea, d, nome }) => {
        const isAtivo = ativoSet.has(codarea)
        const isCumulativo = cumulativoSet.has(codarea)
        return (
          <path
            key={codarea}
            d={d}
            fill={isAtivo ? '#2563eb' : isCumulativo ? '#bfdbfe' : 'transparent'}
            stroke={isAtivo ? '#1d4ed8' : isCumulativo ? '#93c5fd' : '#9ca3af'}
            strokeWidth={isAtivo || isCumulativo ? strokeWidth * 1.5 : strokeWidth}
            style={{ opacity: 0.9 }}
            onMouseEnter={e => {
              const svg = e.currentTarget.closest('svg')
              const rect = svg.getBoundingClientRect()
              const scaleX = 400 / rect.width
              const scaleY = 350 / rect.height
              setTooltip({
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
                nome,
                ativo: isAtivo,
                cumulativo: isCumulativo,
              })
            }}
          />
        )
      })}
      {tooltip && (
        <g transform={`translate(${Math.min(tooltip.x + 4, 250)},${Math.max(tooltip.y - 28, 2)})`}>
          <rect x={0} y={0} width={130} height={30} rx={3} fill="#1e293b" opacity={0.93} />
          <text x={6} y={12} fontSize={8.5} fill="#f1f5f9" fontFamily="system-ui">{tooltip.nome}</text>
          <text x={6} y={23} fontSize={7.5} fill={tooltip.ativo ? '#93c5fd' : tooltip.cumulativo ? '#bfdbfe' : '#94a3b8'} fontFamily="system-ui">
            {tooltip.ativo ? '● Quadrimestre atual' : tooltip.cumulativo ? '● Cumulativo' : '○ Não beneficiado'}
          </text>
        </g>
      )}
    </svg>
  )
}

function ModalTelaCheiaIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
    </svg>
  )
}

export default function MapaMaranhao({ municipiosCumulativos = [], municipiosAtivos = [] }) {
  const { data: geo, isLoading: geoLoading, isError: geoError } = useGeoJSON()
  const { data: hierarquia = [] } = useMunicipioMap()
  const [tooltip, setTooltip] = useState(null)
  const [tooltipFull, setTooltipFull] = useState(null)
  const [telaCheiaAberta, setTelaCheiaAberta] = useState(false)

  const idToCodIbge = useMemo(() => {
    const map = {}
    for (const macro of hierarquia)
      for (const reg of macro.regioes)
        for (const m of reg.municipios)
          map[m.id] = m.cod_ibge
    return map
  }, [hierarquia])

  const cumulativoSet = useMemo(
    () => new Set(municipiosCumulativos.map(id => idToCodIbge[id]).filter(Boolean)),
    [municipiosCumulativos, idToCodIbge]
  )
  const ativoSet = useMemo(
    () => new Set(municipiosAtivos.map(id => idToCodIbge[id]).filter(Boolean)),
    [municipiosAtivos, idToCodIbge]
  )

  const { paths } = useMemo(() => {
    if (!geo?.features) return { paths: [] }
    const features = geo.features
    const coords = allCoords(features)
    const lons = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    const minLon = Math.min(...lons), maxLon = Math.max(...lons)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const W = 400, H = 350
    const paths = features.map(f => ({
      codarea: f.properties?.codarea,
      d: featureToPath(f.geometry, minLon, maxLon, minLat, maxLat, W, H),
      nome: f.properties?.nome || f.properties?.codarea,
    }))
    return { paths }
  }, [geo])

  const totalCumulativo = municipiosCumulativos.length
  const totalAtivo = municipiosAtivos.length

  const shell = (children) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {children}
    </div>
  )

  if (geoLoading) return shell(<span className="text-xs text-gray-400 dark:text-gray-500">Carregando…</span>)
  if (geoError || !geo) return shell(<span className="text-xs text-red-400 text-center px-3">Mapa indisponível</span>)

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shrink-0" style={{ width: 200, height: 200 }}>
        {/* Header */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
            Atual ({totalAtivo})
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 dark:bg-blue-800 inline-block" />
            Total ({totalCumulativo})
          </span>
          <button
            type="button"
            onClick={() => setTelaCheiaAberta(true)}
            title="Ver em tela cheia"
            className="ml-auto text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ModalTelaCheiaIcon />
          </button>
        </div>

        {/* Mini mapa */}
        <div style={{ width: 200, height: 163, overflow: 'hidden' }}>
          <MapaSVG
            paths={paths}
            ativoSet={ativoSet}
            cumulativoSet={cumulativoSet}
            tooltip={tooltip}
            setTooltip={setTooltip}
            strokeWidth={0.3}
            svgStyle={{ width: 200, height: 163 }}
          />
        </div>
      </div>

      {/* Modal tela cheia */}
      {telaCheiaAberta && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={() => setTelaCheiaAberta(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: 'min(90vw, 720px)', height: 'min(90vh, 640px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Municípios Beneficiados — Maranhão</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Acumulado do ano</p>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                  Quadrimestre atual ({totalAtivo})
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800 inline-block" />
                  Cumulativo ({totalCumulativo})
                </span>
                <button
                  type="button"
                  onClick={() => setTelaCheiaAberta(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mapa grande — width:100% height:auto preserva proporção via viewBox */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
              <MapaSVG
                paths={paths}
                ativoSet={ativoSet}
                cumulativoSet={cumulativoSet}
                tooltip={tooltipFull}
                setTooltip={setTooltipFull}
                strokeWidth={0.5}
                svgStyle={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
