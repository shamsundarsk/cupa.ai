'use client'

import { useMemo, useState } from 'react'
import { DerivedKpis } from '@/lib/useTwinState'
import { KpiSnapshot } from '@/lib/types'

interface Props {
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
  shiftHistory: ShiftRecord[]
}

export interface ShiftRecord {
  id: string
  label: string
  revenue: number
  recovered: number
  co2: number
  energy: number
  efficiency: number
  hazards: number
  endedAt: number
}

export default function ShiftHistory({ derived, kpiHistory, shiftHistory }: Props) {
  const baseline: ShiftRecord[] = useMemo(() => {
    if (shiftHistory.length > 0) return shiftHistory
    // Synthesize a few prior shifts so the page has useful comparators
    return [
      { id: 'mon-08', label: 'Mon 08:00', revenue: 8450, recovered: 3500, co2: 12.25, energy: 4998, efficiency: 92, hazards: 4, endedAt: Date.now() - 1000 * 60 * 60 * 18 },
      { id: 'mon-14', label: 'Mon 14:00', revenue: 9150, recovered: 3760, co2: 13.40, energy: 5202, efficiency: 93, hazards: 3, endedAt: Date.now() - 1000 * 60 * 60 * 12 },
      { id: 'mon-22', label: 'Mon 22:00', revenue: 7820, recovered: 3260, co2: 11.10, energy: 4876, efficiency: 89, hazards: 5, endedAt: Date.now() - 1000 * 60 * 60 * 6 },
      { id: 'tue-08', label: 'Tue 08:00', revenue: 9230, recovered: 3855, co2: 14.10, energy: 5320, efficiency: 94, hazards: 2, endedAt: Date.now() - 1000 * 60 * 60 * 4 },
      { id: 'tue-14', label: 'Tue 14:00', revenue: 9900, recovered: 4020, co2: 14.95, energy: 5645, efficiency: 95, hazards: 2, endedAt: Date.now() - 1000 * 60 * 60 * 1 },
    ]
  }, [shiftHistory])

  const [compareId, setCompareId] = useState(baseline[baseline.length - 1].id)
  const compare = baseline.find((s) => s.id === compareId) || baseline[0]

  const current = {
    revenue: derived.cumulativeRevenue,
    recovered: derived.cumulativeRecovered,
    co2: derived.cumulativeRecovered * 0.0086, // tonnes
    energy: derived.cumulativeEnergyKWh,
    efficiency: derived.avgEfficiency,
    hazards: derived.hazardEvents,
  }

  const series = [...baseline, { id: 'current', label: 'Now', revenue: current.revenue, recovered: current.recovered, co2: current.co2, energy: current.energy, efficiency: current.efficiency, hazards: current.hazards, endedAt: Date.now() }]

  const max = Math.max(1, ...series.map((s) => s.revenue))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Shift Comparison</h1>
        <p className="text-sm text-carbon-400 mt-0.5">
          Compare current performance against historical shifts — the twin remembers
        </p>
      </div>

      <div className="industrial-card p-4">
        <div className="text-[11px] text-carbon-400 uppercase tracking-widest mb-2">Compare current shift to:</div>
        <div className="flex flex-wrap gap-2">
          {baseline.map((s) => (
            <button
              key={s.id}
              onClick={() => setCompareId(s.id)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                compareId === s.id
                  ? 'bg-industrial-900/50 border-industrial-500 text-industrial-300'
                  : 'bg-carbon-800 border-carbon-700 text-carbon-300 hover:border-carbon-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DeltaCard title="REVENUE" value={`$${Math.round(current.revenue).toLocaleString()}`} delta={current.revenue - compare.revenue} prefix="$" />
        <DeltaCard title="RECOVERY" value={`${Math.round(current.recovered).toLocaleString()} kg`} delta={current.recovered - compare.recovered} unit=" kg" />
        <DeltaCard title="EFFICIENCY" value={`${current.efficiency.toFixed(1)}%`} delta={current.efficiency - compare.efficiency} unit=" %" />
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white">Revenue Across Shifts</h3>
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
          {series.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: 200 }}>
                <div
                  className={`rounded-t ${s.id === 'current' ? 'bg-accent-cyan' : 'bg-carbon-700'}`}
                  style={{ height: `${(s.revenue / max) * 100}%`, minHeight: 4, transition: 'height 600ms ease-out' }}
                />
              </div>
              <div className="text-[10px] text-carbon-400 font-mono">{s.label}</div>
              <div className="text-[10px] text-carbon-500 font-mono">${Math.round(s.revenue).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white">Detailed Comparison</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-carbon-500 uppercase tracking-widest border-b border-carbon-700/50">
                <th className="text-left py-2 pr-4">Metric</th>
                <th className="text-right py-2 pr-4">Current Shift</th>
                <th className="text-right py-2 pr-4">{compare.label}</th>
                <th className="text-right py-2">Change</th>
              </tr>
            </thead>
            <tbody className="text-carbon-200">
              <CompareRow label="Revenue" curr={`$${Math.round(current.revenue).toLocaleString()}`} prev={`$${Math.round(compare.revenue).toLocaleString()}`} delta={current.revenue - compare.revenue} prefix="$" />
              <CompareRow label="Material Recovered" curr={`${Math.round(current.recovered).toLocaleString()} kg`} prev={`${Math.round(compare.recovered).toLocaleString()} kg`} delta={current.recovered - compare.recovered} unit=" kg" />
              <CompareRow label="CO₂ Avoided" curr={`${current.co2.toFixed(2)} t`} prev={`${compare.co2.toFixed(2)} t`} delta={current.co2 - compare.co2} unit=" t" />
              <CompareRow label="Energy Used" curr={`${Math.round(current.energy).toLocaleString()} kWh`} prev={`${Math.round(compare.energy).toLocaleString()} kWh`} delta={current.energy - compare.energy} unit=" kWh" inverse />
              <CompareRow label="Efficiency" curr={`${current.efficiency.toFixed(1)}%`} prev={`${compare.efficiency.toFixed(1)}%`} delta={current.efficiency - compare.efficiency} unit=" %" />
              <CompareRow label="Hazard Events" curr={current.hazards.toString()} prev={compare.hazards.toString()} delta={current.hazards - compare.hazards} unit="" inverse />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DeltaCard({ title, value, delta, prefix = '', unit = '' }: { title: string; value: string; delta: number; prefix?: string; unit?: string }) {
  const positive = delta >= 0
  return (
    <div className="industrial-card p-4">
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-bold font-mono mt-1 text-white">{value}</div>
      <div className={`text-[11px] mt-1 ${positive ? 'text-industrial-400' : 'text-accent-rose'}`}>
        {positive ? '+' : ''}{prefix}{Math.round(Math.abs(delta) * 100) / 100}{unit}
      </div>
    </div>
  )
}

function CompareRow({ label, curr, prev, delta, prefix = '', unit = '', inverse = false }: { label: string; curr: string; prev: string; delta: number; prefix?: string; unit?: string; inverse?: boolean }) {
  const positive = inverse ? delta < 0 : delta >= 0
  return (
    <tr className="border-b border-carbon-800/50 last:border-b-0">
      <td className="py-2.5 pr-4">{label}</td>
      <td className="py-2.5 pr-4 text-right font-mono">{curr}</td>
      <td className="py-2.5 pr-4 text-right font-mono text-carbon-400">{prev}</td>
      <td className={`py-2.5 text-right font-mono ${positive ? 'text-industrial-400' : 'text-accent-rose'}`}>
        {delta >= 0 ? '+' : ''}{prefix}{Math.round(Math.abs(delta) * 100) / 100}{unit}
      </td>
    </tr>
  )
}
