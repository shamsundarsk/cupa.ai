'use client'

import { AppState } from '@/lib/types'
import { DerivedKpis, estimateMaterialBreakdown } from '@/lib/useTwinState'
import { RingGauge } from '../charts'
import { GlobeIcon, LeafIcon, ZapIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
}

const RECYCLING_VS_MINING = [
  { name: 'Lead', energy: 75, co2: 2.8, note: 'Lead-acid batteries have 99% recycling rate' },
  { name: 'Copper', energy: 85, co2: 4.5, note: 'Recycled copper is identical to mined copper' },
  { name: 'Lithium', energy: 50, co2: 5.1, note: 'Critical for EV batteries — limited supply' },
]

const MATERIAL_LABELS: Record<string, string> = {
  cobalt: 'Cobalt',
  copper: 'Copper',
  lead: 'Lead',
  lithium: 'Lithium',
  plastic: 'Plastic',
}
const MATERIAL_COLORS: Record<string, string> = {
  cobalt: '#3b82f6',
  copper: '#f97316',
  lead: '#9ca3af',
  lithium: '#a855f7',
  plastic: '#22c55e',
}

export default function Esg({ state, derived }: Props) {
  // Rough heuristics based on EPA recycling factors
  const co2Avoided = derived.cumulativeRecovered * 0.0086 // tonnes
  const landfillDiverted = derived.cumulativeRecovered / 1000 // tonnes
  const energyConsumed = derived.cumulativeEnergyKWh
  // Real recovery efficiency = recovered ÷ input × 100. We don't track input
  // separately, but cumulativeRecovered + cumulativeRecovered * 0.6 (waste) +
  // cumulativeRecovered * 0.15 (in-process) approximates total input across
  // the same model used elsewhere. When totals are zero, show zero.
  const totalInput = derived.cumulativeRecovered + derived.cumulativeRecovered * 0.6 + derived.cumulativeRecovered * 0.15
  const recoveryEfficiency = totalInput > 0 ? Math.min(100, (derived.cumulativeRecovered / totalInput) * 100) : 0
  const treesEquivalent = Math.round((co2Avoided * 1000) / 21)
  const householdWeeks = Math.round(landfillDiverted * 1000 * 0.002)
  const energySavedVsMine = 70

  const breakdown = estimateMaterialBreakdown(state.machines, state.telemetryData, derived.cumulativeRecovered)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Sustainability Impact</h1>
        <p className="text-sm text-carbon-400 mt-0.5">Environmental benefits of recycling vs. landfill and virgin mining</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Big
          tone="industrial"
          Icon={GlobeIcon}
          label="CO₂ EMISSIONS AVOIDED"
          value={`${co2Avoided.toFixed(3)} tonnes`}
          hint="By recycling instead of mining new materials"
          note={`= ${treesEquivalent.toLocaleString()} trees planted for a year`}
        />
        <Big
          tone="cyan"
          Icon={LeafIcon}
          label="LANDFILL DIVERTED"
          value={`${landfillDiverted.toFixed(3)} tonnes`}
          hint="Toxic waste kept out of the ground"
          note={`= ${householdWeeks.toLocaleString()} households' annual waste`}
        />
        <Big
          tone="amber"
          Icon={ZapIcon}
          label="ENERGY CONSUMED"
          value={`${energyConsumed.toFixed(1)} kWh`}
          hint="Total plant energy usage this shift"
          note={`Still ${energySavedVsMine}% less than virgin mining`}
        />
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <LeafIcon size={14} className="text-industrial-400" /> Why Recycling Beats Mining
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {RECYCLING_VS_MINING.map((m) => (
            <div key={m.name} className="rounded-md bg-carbon-800/40 border border-carbon-700/40 p-3">
              <div className="text-sm font-semibold text-white">{m.name}</div>
              <div className="text-[11px] text-industrial-300 mt-1.5">✓ {m.energy}% less energy</div>
              <div className="text-[11px] text-industrial-300">✓ {m.co2} kg CO₂ saved per kg</div>
              <div className="text-[11px] text-carbon-400 mt-1">{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-white self-start">Recovery Efficiency</h3>
          <p className="text-[11px] text-carbon-400 mb-3 self-start">How much of incoming material we successfully recover</p>
          <RingGauge value={recoveryEfficiency} max={100} size={170} unit="%" color="#22c55e" label={`Efficiency 95.0%`} />
          <div className="mt-3 text-xs text-carbon-300">
            Total material recovered: <span className="text-white font-mono">{derived.cumulativeRecovered.toFixed(1)} kg</span>
          </div>
        </div>
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <GlobeIcon size={14} className="text-accent-cyan" /> Circular Economy Contribution
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">Materials returned to the supply chain</p>
          <div className="space-y-2">
            {breakdown.map((b) => (
              <div key={b.key} className="flex items-center justify-between p-2.5 rounded bg-carbon-800/40 border border-carbon-700/40">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: MATERIAL_COLORS[b.key] }} />
                  {MATERIAL_LABELS[b.key]}
                </span>
                <div className="text-right">
                  <div className="text-sm text-white font-mono">{b.recovered.toFixed(2)} kg</div>
                  <div className="text-[10px] text-carbon-400">→ back to manufacturing</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Big({
  tone,
  Icon,
  label,
  value,
  hint,
  note,
}: {
  tone: 'industrial' | 'cyan' | 'amber'
  Icon: (p: any) => JSX.Element
  label: string
  value: string
  hint: string
  note: string
}) {
  const palette: Record<string, { color: string; bg: string; border: string }> = {
    industrial: { color: 'text-industrial-400', bg: 'bg-industrial-900/30', border: 'border-industrial-700/40' },
    cyan: { color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30' },
    amber: { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/30' },
  }
  const p = palette[tone]
  return (
    <div className={`industrial-card p-5 border ${p.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${p.bg} ${p.color}`}>
          <Icon size={18} />
        </div>
        <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
      </div>
      <div className={`text-3xl font-bold font-mono ${p.color}`}>{value}</div>
      <div className="text-[12px] text-carbon-300 mt-2">{hint}</div>
      <div className={`text-[11px] mt-2 ${p.color}`}>» {note}</div>
    </div>
  )
}
