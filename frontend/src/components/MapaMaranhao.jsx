import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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

export default function MapaMaranhao({ municipiosCumulativos = [], municipiosAtivos = [] }) {
  const { data: geo, isLoading: geoLoading, isError: geoError } = useGeoJSON()
  const { data: hierarquia = [] } = useMunicipioMap()
  const [tooltip, setTooltip] = useState(null)

  // Build id → cod_ibge mapping from hierarchy
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

  const { features, bbox, paths } = useMemo(() => {
    if (!geo?.features) return { features: [], bbox: null, paths: [] }
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
    return { features, bbox: { minLon, maxLon, minLat, maxLat }, paths }
  }, [geo])

  const totalCumulativo = municipiosCumulativos.length
  const totalAtivo = municipiosAtivos.length

  if (geoLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-500">
        Carregando mapa…
      </div>
    )
  }
  if (geoError || !geo) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-red-400">
        Não foi possível carregar o mapa do IBGE.
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Legenda */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          Municípios Beneficiados
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
            Quadrimestre atual ({totalAtivo})
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800 inline-block" />
            Cumulativo ({totalCumulativo})
          </span>
        </div>
      </div>

      {/* Mapa SVG */}
      <div className="relative flex justify-center py-3 px-2">
        <svg
          viewBox="0 0 400 350"
          className="w-full max-w-md"
          style={{ aspectRatio: '400/350' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {paths.map(({ codarea, d, nome }) => {
            const isAtivo = ativoSet.has(codarea)
            const isCumulativo = cumulativoSet.has(codarea)
            return (
              <path
                key={codarea}
                d={d}
                className="transition-colors duration-100 cursor-pointer"
                fill={
                  isAtivo
                    ? '#2563eb'
                    : isCumulativo
                    ? '#bfdbfe'
                    : 'transparent'
                }
                stroke={isAtivo ? '#1d4ed8' : isCumulativo ? '#93c5fd' : '#9ca3af'}
                strokeWidth={isAtivo || isCumulativo ? 0.5 : 0.3}
                style={{ opacity: 0.9 }}
                onMouseEnter={e => {
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    nome,
                    ativo: isAtivo,
                    cumulativo: isCumulativo,
                  })
                }}
              />
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <g transform={`translate(${Math.min(tooltip.x + 6, 300)},${Math.max(tooltip.y - 30, 4)})`}>
              <rect x={0} y={0} width={140} height={34} rx={4} fill="#1e293b" opacity={0.92} />
              <text x={8} y={13} fontSize={9} fill="#f1f5f9" fontFamily="system-ui">{tooltip.nome}</text>
              <text x={8} y={26} fontSize={8} fill={tooltip.ativo ? '#93c5fd' : tooltip.cumulativo ? '#bfdbfe' : '#94a3b8'} fontFamily="system-ui">
                {tooltip.ativo ? '● Quadrimestre atual' : tooltip.cumulativo ? '● Cumulativo' : '○ Não beneficiado'}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
