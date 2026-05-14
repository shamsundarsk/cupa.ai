'use client'

import { AppState, KpiSnapshot } from '@/lib/types'
import { DerivedKpis } from '@/lib/useTwinState'
import { LineChart } from '../charts'
import { ActivityIcon, CubeIcon, FactoryIcon, FlameIcon, ShieldIcon, ZapIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
}

const STAGES = [
  'Scrap Intake',
  'Inspection',
  'Smart Sorting',
  'Conveyor Transfer',
  'Shredding',
  'Magnetic Separation',
  'Density Separation',
  'Lead Furnace',
  'Lithium Recovery',
  'Copper Recovery',
  'Plastic Recycling',
  'Hazard Isolation',
  'Final Storage',
]

const STAGE_DESC: Record<string, string> = {
  'Scrap Intake': 'Receiving incoming batteries & e-waste',
  Inspection: 'Checking condition, weight, type',
  'Smart Sorting': 'AI classifies and routes materials',
  'Conveyor Transfer': 'Moving to processing stations',
  Shredding: 'Breaking down into smaller pieces',
  'Magnetic Separation': 'Extracting ferrous metals',
  'Density Separation': 'Separating by material density',
  'Lead Furnace': 'Smelting lead from batteries',
  'Lithium Recovery': 'Extracting lithium compounds',
  'Copper Recovery': 'Recovering copper from PCBs',
  'Plastic Recycling': 'Processing plastic casings',
  'Hazard Isolation': 'Containing dangerous items',
  'Final Storage': 'Recovered materials ready for sale',
}

export default function Overview({ state, derived, kpiHistory }: Props) {
  const intakeBatch = generateIntakeBatch(state.machines.length)
  const isRunning = state.simulation.status === 'running'
  const events = recentEvents(kpiHistory, derived)

  const revenueSeries = kpiHistory.map((p) => p.revenue)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Plant Overview</h1>
        <p className="text-sm text-carbon-400 mt-0.5">Real-time summary of all recycling operations</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total Revenue" value={`$${derived.cumulativeRevenue.toFixed(2)}`} hint="From recovered materials" Icon={ZapIcon} accent="industrial" />
        <Kpi label="Items Processing" value={derived.itemsProcessing.toString()} hint="Is waiting at intake" Icon={CubeIcon} accent="amber" />
        <Kpi label="Plant Risk" value={`${derived.riskScore}/100`} hint={derived.riskScore < 30 ? 'Normal operations' : 'Monitoring closely'} Icon={ShieldIcon} accent={derived.riskScore < 30 ? 'industrial' : derived.riskScore < 60 ? 'amber' : 'rose'} />
        <Kpi label="Hazards Isolated" value={derived.hazardEvents.toString()} hint="Batteries in containment" Icon={FlameIcon} accent={derived.hazardEvents > 0 ? 'rose' : 'industrial'} />
      </div>

      {/* Two-column: Intake + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="What's Entering the Plant" subtitle="Materials currently at intake and inspection" Icon={FactoryIcon}>
          <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
            {intakeBatch.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-md bg-carbon-800/40 border border-carbon-700/40">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${b.danger === 'normal' ? 'bg-industrial-400' : b.danger === 'degraded' ? 'bg-accent-amber' : 'bg-accent-rose'}`} />
                  <div>
                    <div className="text-xs font-mono text-white">{b.id}</div>
                    <div className="text-[11px] text-carbon-400">{b.kind}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-carbon-300">{b.weight.toFixed(1)} kg</div>
                  <div className={`text-[10px] ${b.danger === 'normal' ? 'text-industrial-400' : b.danger === 'degraded' ? 'text-accent-amber' : 'text-accent-rose'}`}>
                    {b.danger}
                  </div>
                </div>
              </div>
            ))}
            {intakeBatch.length === 0 && <Empty msg="No items at intake" />}
          </div>
        </Section>

        <Section title="Processing Pipeline" subtitle="What's happening at each stage right now" Icon={ActivityIcon}>
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
            {STAGES.map((s, i) => {
              const machineActive =
                isRunning &&
                state.machines.length > 0 &&
                i < state.machines.length
              return (
                <div key={s} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-carbon-800/30">
                  <div className="w-7 h-7 rounded-md bg-carbon-800/60 border border-carbon-700/50 flex items-center justify-center text-xs font-mono text-carbon-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{s}</div>
                    <div className="text-[11px] text-carbon-400">{STAGE_DESC[s]}</div>
                  </div>
                  {machineActive && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />}
                </div>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Trend + events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Revenue Trend" subtitle="Cumulative income from material recovery">
          <LineChart data={revenueSeries} height={180} color="#22c55e" fill="rgba(34,197,94,0.10)" />
        </Section>
        <Section title="Recent Events" subtitle="What just happened in the plant">
          <div className="font-mono text-[11px] text-carbon-300 space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
            {events.length === 0 && <Empty msg="No events yet" />}
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-carbon-500">{e.time}</span>
                <span className={`px-1 rounded text-[10px] ${
                  e.kind === 'REV' ? 'bg-industrial-900/40 text-industrial-400' :
                  e.kind === 'INFO' ? 'bg-accent-cyan/10 text-accent-cyan' :
                  'bg-accent-amber/10 text-accent-amber'
                }`}>{e.kind}</span>
                <span>{e.text}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  Icon,
  accent = 'industrial',
}: {
  label: string
  value: string
  hint: string
  Icon: (p: any) => JSX.Element
  accent?: 'industrial' | 'amber' | 'rose' | 'cyan'
}) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400 bg-industrial-900/30 border-industrial-700/40',
    amber: 'text-accent-amber bg-accent-amber/10 border-accent-amber/30',
    rose: 'text-accent-rose bg-accent-rose/10 border-accent-rose/30',
    cyan: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
  }
  return (
    <div className="industrial-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
        <div className={`w-7 h-7 rounded-md border flex items-center justify-center ${tones[accent]}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-2xl font-bold font-mono text-white tracking-tight">{value}</div>
      <div className="text-[11px] text-carbon-500 mt-1">{hint}</div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  Icon,
  children,
}: {
  title: string
  subtitle?: string
  Icon?: (p: any) => JSX.Element
  children: React.ReactNode
}) {
  return (
    <div className="industrial-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          {Icon && <Icon size={14} className="text-industrial-400" />}
          {title}
        </h3>
        {subtitle && <p className="text-[11px] text-carbon-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-xs text-carbon-500 italic px-1 py-2">{msg}</div>
}

const ITEM_KINDS = [
  'Lead-Acid Battery',
  'Lithium-ion Battery',
  'Plastic Waste',
  'Hazardous Material',
  'Circuit Board (PCB)',
  'Copper-Rich Scrap',
] as const

function generateIntakeBatch(seed: number) {
  // deterministic-ish list so it doesn't jitter; varies with machine count
  const n = Math.max(6, Math.min(12, 6 + seed))
  const items: Array<{ id: string; kind: string; weight: number; danger: 'normal' | 'degraded' | 'damaged' }> = []
  for (let i = 0; i < n; i++) {
    const k = ITEM_KINDS[(i + seed) % ITEM_KINDS.length]
    const id = `B-${(((i + 1) * 9173 + seed * 7) % 0xfffff).toString(16).toUpperCase().padStart(5, '0')}`
    const weight = ((i * 37 + seed * 11) % 250) / 10 + 2
    const dangerRoll = (i + seed) % 7
    const danger = dangerRoll === 0 ? 'damaged' : dangerRoll < 3 ? 'degraded' : 'normal'
    items.push({ id, kind: k, weight, danger })
  }
  return items
}

function recentEvents(kpiHistory: KpiSnapshot[], derived: DerivedKpis) {
  if (kpiHistory.length < 2) return []
  const last = kpiHistory[kpiHistory.length - 1]
  const prev = kpiHistory[kpiHistory.length - 2]
  const dRev = last.revenue - prev.revenue
  const dRecov = last.recovered - prev.recovered
  const ts = new Date(last.ts)
  const time = `[${ts.toLocaleTimeString('en-GB', { hour12: false })}]`
  const items: Array<{ time: string; kind: 'REV' | 'INFO' | 'WARN'; text: string }> = []
  if (dRecov > 0) items.push({ time, kind: 'REV', text: `Material recovered: ${dRecov.toFixed(2)} kg ($${dRev.toFixed(2)})` })
  items.push({ time, kind: 'INFO', text: `Throughput steady at ${derived.totalThroughput.toFixed(0)} kg/h` })
  if (derived.criticals > 0) items.push({ time, kind: 'WARN', text: `${derived.criticals} machine(s) in critical state` })
  if (derived.warnings > 0) items.push({ time, kind: 'WARN', text: `${derived.warnings} warning condition(s) active` })
  return items.reverse()
}
