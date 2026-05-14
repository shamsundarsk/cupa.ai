'use client'

/**
 * Lightweight inline-SVG charting primitives shared across views.
 * No third-party charting dep — everything is computed and rendered here.
 */

import { useMemo } from 'react'

interface LineSeriesProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: string
  className?: string
  showAxis?: boolean
  yMin?: number
  yMax?: number
  yLabels?: number[]
  smoothing?: boolean
}

export function LineChart({
  data,
  width = 600,
  height = 180,
  color = '#22c55e',
  fill = 'rgba(34,197,94,0.12)',
  className,
  showAxis = false,
  yMin,
  yMax,
  yLabels,
  smoothing = true,
}: LineSeriesProps) {
  const points = useMemo(() => {
    if (data.length === 0) return ''
    const min = yMin ?? Math.min(...data, 0)
    const max = yMax ?? Math.max(...data, 1)
    const range = max - min || 1
    const step = data.length > 1 ? width / (data.length - 1) : 0
    if (!smoothing) {
      return data
        .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
        .join(' ')
    }
    return data
      .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
      .join(' ')
  }, [data, width, height, yMin, yMax, smoothing])

  const fillPath = useMemo(() => {
    if (!points || data.length === 0) return ''
    return `M0,${height} L${points} L${width},${height} Z`
  }, [points, height, width, data])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" width="100%" height={height}>
      {showAxis && (
        <>
          <line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
          <line x1={0.5} y1={0} x2={0.5} y2={height} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
          {yLabels?.map((y, i) => (
            <line
              key={i}
              x1={0}
              y1={height - (y / (yMax ?? 1)) * height}
              x2={width}
              y2={height - (y / (yMax ?? 1)) * height}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth={1}
            />
          ))}
        </>
      )}
      {data.length > 1 && (
        <>
          <path d={fillPath} fill={fill} />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {data.length === 0 && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="rgba(148,163,184,0.5)" fontSize="11" fontFamily="monospace">
          waiting for data...
        </text>
      )}
    </svg>
  )
}

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
  formatValue?: (v: number) => string
}

export function HBarChart({ data, height = 180, formatValue }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex items-center gap-3">
          <div className="w-20 text-[11px] text-carbon-400 font-mono truncate">{d.label}</div>
          <div className="flex-1 h-5 rounded bg-carbon-800/60 overflow-hidden relative">
            <div
              className="h-full rounded"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? '#22c55e',
                transition: 'width 600ms ease-out',
              }}
            />
          </div>
          <div className="w-24 text-right text-[11px] text-carbon-300 font-mono">
            {formatValue ? formatValue(d.value) : Math.round(d.value).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RingGauge({
  value,
  max = 100,
  size = 160,
  thickness = 14,
  color = '#22c55e',
  trackColor = 'rgba(71,85,105,0.4)',
  label,
  unit = '',
}: {
  value: number
  max?: number
  size?: number
  thickness?: number
  color?: string
  trackColor?: string
  label?: string
  unit?: string
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  const dash = c * pct
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={thickness} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-white font-mono">
          {Math.round(value)}
          <span className="text-base text-carbon-400 ml-0.5">{unit}</span>
        </div>
        {label && <div className="text-[11px] text-carbon-400 mt-0.5">{label}</div>}
      </div>
    </div>
  )
}

interface StackedBarProps {
  segments: Array<{ label: string; value: number; color: string }>
  height?: number
}

export function StackedBar({ segments, height = 24 }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div>
      <div
        className="w-full rounded overflow-hidden flex"
        style={{ height }}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${Math.round(s.value).toLocaleString()}`}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
              transition: 'width 600ms ease-out',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-carbon-400">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.label}: <span className="text-carbon-300 font-mono">{((s.value / total) * 100).toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({
  data,
  width = 120,
  height = 28,
  color = '#22c55e',
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (data.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
