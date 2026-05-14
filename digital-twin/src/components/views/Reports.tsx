'use client'

import { AppState } from '@/lib/types'
import { DerivedKpis, estimateMaterialBreakdown } from '@/lib/useTwinState'
import { FileTextIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
}

const MATERIAL_LABELS: Record<string, string> = {
  cobalt: 'Cobalt',
  copper: 'Copper',
  lead: 'Lead',
  lithium: 'Lithium',
  plastic: 'Plastic',
}

export default function Reports({ state, derived }: Props) {
  const rawBreakdown = estimateMaterialBreakdown(state.machines, state.telemetryData, derived.cumulativeRecovered)
  const rawSum = rawBreakdown.reduce((s, b) => s + b.revenue, 0)
  const breakdown = rawSum > 0
    ? rawBreakdown.map((b) => ({ ...b, revenue: (b.revenue / rawSum) * derived.cumulativeRevenue }))
    : rawBreakdown
  const totalRevenue = derived.cumulativeRevenue
  const totalRecovered = derived.cumulativeRecovered
  const co2 = derived.cumulativeRecovered * 0.0086

  const handleExport = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shift Report</h1>
          <p className="text-sm text-carbon-400 mt-0.5">Generate and export a PDF report of current shift performance</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/40 text-accent-cyan rounded-md text-sm font-medium transition-colors"
        >
          <FileTextIcon size={14} /> Export PDF Report
        </button>
      </div>

      <div className="industrial-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Report Preview</h3>
          <span className="text-[11px] text-carbon-400 font-mono">
            Shift: {(derived.shiftElapsedMs / 3600000).toFixed(1)} hours · {derived.ticks.toLocaleString()} ticks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="REVENUE" value={`$${totalRevenue.toFixed(2)}`} tone="industrial" />
          <Stat label="RECOVERED" value={`${totalRecovered.toFixed(1)} kg`} tone="cyan" />
          <Stat label="CO₂ AVOIDED" value={`${co2.toFixed(3)} t`} tone="industrial" />
          <Stat label="RISK SCORE" value={`${derived.riskScore}/100`} tone={derived.riskScore < 25 ? 'industrial' : derived.riskScore < 60 ? 'amber' : 'rose'} />
        </div>

        <div className="mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-carbon-500 uppercase tracking-widest border-b border-carbon-700/50">
                <th className="text-left py-2 pr-4">Material</th>
                <th className="text-right py-2 pr-4">Recovered</th>
                <th className="text-right py-2 pr-4">Revenue</th>
                <th className="text-right py-2">Share</th>
              </tr>
            </thead>
            <tbody className="text-carbon-200">
              {breakdown.map((b) => (
                <tr key={b.key} className="border-b border-carbon-800/50 last:border-b-0">
                  <td className="py-2.5 pr-4">{MATERIAL_LABELS[b.key]}</td>
                  <td className="py-2.5 pr-4 text-right font-mono">{b.recovered.toFixed(2)} kg</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-industrial-400">${b.revenue.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">{((b.revenue / Math.max(1, totalRevenue)) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-carbon-400">
          <KV label="Energy used" value={`${derived.cumulativeEnergyKWh.toFixed(1)} kWh`} />
          <KV label="Average efficiency" value={`${derived.avgEfficiency.toFixed(1)}%`} />
          <KV label="Hazard events" value={derived.hazardEvents.toString()} />
          <KV label="Active machines" value={state.machines.length.toString()} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'industrial' | 'amber' | 'rose' | 'cyan' }) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400',
    cyan: 'text-accent-cyan',
    amber: 'text-accent-amber',
    rose: 'text-accent-rose',
  }
  return (
    <div className="rounded-md bg-carbon-800/40 border border-carbon-700/40 p-3">
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${tones[tone]}`}>{value}</div>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-carbon-800/30 rounded px-3 py-2">
      <span className="text-carbon-400">{label}</span>
      <span className="text-carbon-200 font-mono">{value}</span>
    </div>
  )
}
