'use client'

import { AppState, KpiSnapshot } from '@/lib/types'
import { DerivedKpis, estimateMaterialBreakdown } from '@/lib/useTwinState'
import { HBarChart, LineChart } from '../charts'

interface Props {
  state: AppState
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
}

const MATERIAL_COLORS: Record<string, string> = {
  cobalt: '#3b82f6',
  copper: '#f97316',
  lead: '#9ca3af',
  lithium: '#a855f7',
  plastic: '#22c55e',
}

export default function Revenue({ state, derived, kpiHistory }: Props) {
  // Normalize so the breakdown's revenue column sums to derived.cumulativeRevenue exactly.
  const rawBreakdown = estimateMaterialBreakdown(state.machines, state.telemetryData, derived.cumulativeRecovered)
  const rawSum = rawBreakdown.reduce((s, b) => s + b.revenue, 0)
  const breakdown = rawSum > 0
    ? rawBreakdown.map((b) => ({ ...b, revenue: (b.revenue / rawSum) * derived.cumulativeRevenue }))
    : rawBreakdown
  const total = derived.cumulativeRevenue
  const lead = breakdown.find((b) => b.key === 'lead')?.revenue ?? 0
  const energyCost = derived.cumulativeEnergyKWh * 0.08
  const labourCost = derived.cumulativeRevenue * 0.01
  const consumablesCost = derived.cumulativeRevenue * 0.01
  const margin = derived.cumulativeRevenue === 0
    ? 0
    : ((derived.cumulativeRevenue - energyCost - labourCost - consumablesCost) / derived.cumulativeRevenue) * 100

  const revenueSeries = kpiHistory.map((k) => k.revenue)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue &amp; Material Recovery</h1>
        <p className="text-sm text-carbon-400 mt-0.5">How the plant makes money — recovered materials sold at market prices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="TOTAL REVENUE" value={`$${derived.cumulativeRevenue.toFixed(2)}`} hint="From all recovered materials" tone="industrial" />
        <Stat label="LEAD REVENUE" value={`$${lead.toFixed(2)}`} hint={`${total > 0 ? ((lead / total) * 100).toFixed(0) : 0}% of total`} tone="cyan" />
        <Stat label="ENERGY COST" value={`$${energyCost.toFixed(2)}`} hint={`${derived.cumulativeEnergyKWh.toFixed(1)} kWh consumed`} tone="amber" />
        <Stat label="NET MARGIN" value={`${margin.toFixed(1)}%`} hint="After energy + labour" tone={margin > 80 ? 'industrial' : margin > 50 ? 'amber' : 'rose'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white">Revenue Growth</h3>
          <p className="text-[11px] text-carbon-400 mb-3">Cumulative revenue this shift</p>
          <LineChart data={revenueSeries} color="#22c55e" fill="rgba(34,197,94,0.10)" height={200} />
        </div>
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white">Revenue by Material</h3>
          <p className="text-[11px] text-carbon-400 mb-3">Which materials generate the most income</p>
          <HBarChart
            data={breakdown
              .map((b) => ({
                label: titleCase(b.key),
                value: b.revenue,
                color: MATERIAL_COLORS[b.key] ?? '#22c55e',
              }))
              .sort((a, b) => b.value - a.value)}
            formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
          />
        </div>
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white">Material Recovery Breakdown</h3>
        <p className="text-[11px] text-carbon-400 mb-3">Detailed view of what's been recovered and its market value</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-carbon-500 uppercase tracking-widest border-b border-carbon-700/50">
              <th className="text-left py-2 pr-4">Material</th>
              <th className="text-right py-2 pr-4">Recovered (kg)</th>
              <th className="text-right py-2 pr-4">Market Price ($/kg)</th>
              <th className="text-right py-2 pr-4">Revenue ($)</th>
              <th className="text-right py-2">% of Total</th>
            </tr>
          </thead>
          <tbody className="text-carbon-200">
            {breakdown.map((b) => (
              <tr key={b.key} className="border-b border-carbon-800/50 last:border-b-0">
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: MATERIAL_COLORS[b.key] }} />
                    {titleCase(b.key)} <span className="text-carbon-500 text-xs">({symbol(b.key)})</span>
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right font-mono">{b.recovered.toFixed(2)}</td>
                <td className="py-2.5 pr-4 text-right font-mono text-carbon-400">${b.price.toFixed(2)}</td>
                <td className="py-2.5 pr-4 text-right font-mono text-industrial-400">${b.revenue.toFixed(2)}</td>
                <td className="py-2.5 text-right font-mono">{((b.revenue / Math.max(1, total)) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 pr-4 font-bold">Total</td>
              <td className="py-2.5 pr-4 text-right font-mono font-bold">{breakdown.reduce((s, b) => s + b.recovered, 0).toFixed(2)}</td>
              <td className="py-2.5 pr-4 text-right text-carbon-500">—</td>
              <td className="py-2.5 pr-4 text-right font-mono text-industrial-400 font-bold">${total.toFixed(2)}</td>
              <td className="py-2.5 text-right font-mono font-bold">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: 'industrial' | 'cyan' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400',
    cyan: 'text-accent-cyan',
    amber: 'text-accent-amber',
    rose: 'text-accent-rose',
  }
  return (
    <div className="industrial-card p-4">
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${tones[tone]}`}>{value}</div>
      <div className="text-[11px] text-carbon-500 mt-1">{hint}</div>
    </div>
  )
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function symbol(s: string) {
  return ({ cobalt: 'Co', copper: 'Cu', lead: 'Pb', lithium: 'Li', plastic: 'PE' } as Record<string, string>)[s] ?? ''
}
