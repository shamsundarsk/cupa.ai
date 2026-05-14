'use client'

import { AppState } from '@/lib/types'
import { DerivedKpis } from '@/lib/useTwinState'
import { RingGauge, StackedBar } from '../charts'
import { CpuIcon, SparkleIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
}

export default function Optimize({ state, derived }: Props) {
  const totalInput =
    derived.cumulativeRecovered + derived.cumulativeRecovered * 0.6 + derived.cumulativeRecovered * 0.15
  const recovered = derived.cumulativeRecovered
  const waste = derived.cumulativeRecovered * 0.6
  const inProcess = derived.cumulativeRecovered * 0.15
  const completion = state.simulation.status === 'running' ? 99.9 : 0

  const recommendations = buildRecommendations(state, derived)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Optimization &amp; Twin Status</h1>
        <p className="text-sm text-carbon-400 mt-0.5">AI recommendations to improve efficiency and reduce waste</p>
      </div>

      <div className="industrial-card px-4 py-3 flex items-center gap-4 flex-wrap text-xs font-mono text-carbon-300">
        <span className="inline-flex items-center gap-1.5 text-industrial-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-industrial-400 animate-pulse" /> SYNCHRONIZED
        </span>
        <span className="text-carbon-500">·</span>
        <span>Confidence: <span className="text-white">{Math.max(85, 100 - derived.riskScore * 0.2).toFixed(1)}%</span></span>
        <span className="text-carbon-500">·</span>
        <span>Fidelity: <span className="text-white">{(98 - derived.warnings * 1.2).toFixed(1)}%</span></span>
        <span className="text-carbon-500">·</span>
        <span>AI Accuracy: <span className="text-white">{(94 - derived.criticals * 1.5).toFixed(1)}%</span></span>
        <span className="ml-auto">Sensors: {state.machines.length * 4}/{state.machines.length * 4} · Tick Rate: {state.simulation.tickRate}ms · Ticks: {derived.ticks}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <SparkleIcon size={14} className="text-industrial-400" /> Plant Efficiency
          </h3>
          <div className="grid grid-cols-2 gap-4 mt-4 items-center">
            <div className="flex items-center justify-center">
              <RingGauge value={derived.avgEfficiency} max={100} size={170} color="#22c55e" label="Efficiency" />
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label="Throughput" value={`${derived.totalThroughput.toFixed(2)} kg/min`} />
              <Row label="Energy/kg" value={`${(derived.cumulativeEnergyKWh / Math.max(1, derived.cumulativeRecovered)).toFixed(3)} kWh`} />
              <Row label="Revenue/kWh" value={`$${(derived.cumulativeRevenue / Math.max(1, derived.cumulativeEnergyKWh)).toFixed(2)}`} />
              <Row label="Recovery Rate" value={`${(totalInput > 0 ? (recovered / totalInput) * 100 : 0).toFixed(1)}%`} />
              <Row label="Completion" value={`${completion.toFixed(1)}%`} />
            </div>
          </div>
        </div>

        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <CpuIcon size={14} className="text-accent-cyan" /> Material Flow Analysis
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Total Input" value={`${totalInput.toFixed(1)} kg`} />
            <Row label="Recovered" value={`${recovered.toFixed(1)} kg`} accent="text-industrial-400" />
            <Row label="Waste" value={`${waste.toFixed(1)} kg`} accent="text-accent-rose" />
            <Row label="In Process" value={`${inProcess.toFixed(1)} kg`} accent="text-accent-amber" />
          </div>
          <div className="mt-4">
            <StackedBar
              segments={[
                { label: 'Recovered', value: recovered || 1, color: '#22c55e' },
                { label: 'Waste', value: waste || 1, color: '#ef4444' },
                { label: 'In Process', value: inProcess || 1, color: '#f59e0b' },
              ]}
            />
          </div>
          <div className="mt-3 text-[11px] text-industrial-300 inline-flex items-center gap-1">
            <SparkleIcon size={11} /> With optimization: could recover additional {(recovered * 0.18).toFixed(1)} kg
          </div>
        </div>
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <CpuIcon size={14} className="text-accent-violet" /> AI Recommendations
        </h3>
        <p className="text-[11px] text-carbon-400 mb-3">{recommendations.length} suggestion{recommendations.length !== 1 ? 's' : ''} · {recommendations.filter(r => r.priority === 'high').length} high priority</p>
        {recommendations.length === 0 ? (
          <div className="text-xs text-carbon-500 italic">No optimizations needed at this time.</div>
        ) : (
          <div className="space-y-2.5">
            {recommendations.map((r, i) => (
              <div key={i} className="p-3 rounded-md bg-carbon-800/40 border border-carbon-700/40">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    r.priority === 'high' ? 'bg-accent-rose/20 text-accent-rose' :
                    r.priority === 'medium' ? 'bg-accent-amber/20 text-accent-amber' :
                    'bg-industrial-900/40 text-industrial-300'
                  }`}>
                    {r.priority.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-carbon-500 uppercase tracking-widest">{r.category}</span>
                  <span className="text-sm text-white font-semibold ml-1">{r.title}</span>
                </div>
                <div className="text-[12px] text-carbon-300">{r.description}</div>
                <div className="text-[11px] text-industrial-300 mt-1.5 inline-flex items-center gap-1.5">
                  <SparkleIcon size={11} /> {r.action} <span className="text-carbon-500">·</span> <span className="text-carbon-300">{r.impact}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-carbon-400">{label}</span>
      <span className={`font-mono ${accent ?? 'text-white'}`}>{value}</span>
    </div>
  )
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
  impact: string
}

function buildRecommendations(state: AppState, derived: DerivedKpis): Recommendation[] {
  const recs: Recommendation[] = []

  if (derived.avgEfficiency > 0 && derived.avgEfficiency < 80) {
    recs.push({
      priority: 'medium',
      category: 'efficiency',
      title: 'Optimize Batch Sizing',
      description: 'Current batch sizes are uniform. Varying batch size based on material type could improve flow.',
      action: 'Group similar batteries into larger batches for furnace cycles.',
      impact: '+5% furnace efficiency',
    })
  }

  const overheating = state.machines.find((m) => {
    const t = state.telemetryData[m.id]
    return t && t.temperature > 95
  })
  if (overheating) {
    recs.push({
      priority: 'high',
      category: 'safety',
      title: `Reduce ${overheating.name} target temp`,
      description: 'Operating temperature is approaching critical threshold. Throttling 5% reduces failure risk.',
      action: 'Lower target setpoint by 5%.',
      impact: '-30% failure probability',
    })
  }

  const highEnergy = derived.totalEnergy > 80
  if (highEnergy) {
    recs.push({
      priority: 'medium',
      category: 'energy',
      title: 'Stagger high-load machines',
      description: 'Several machines are running at peak load simultaneously. Staggering reduces grid spikes.',
      action: 'Shift conveyor cycles by 8 minutes.',
      impact: 'Save ~12% peak demand',
    })
  }

  if (derived.criticals === 0 && derived.warnings === 0 && derived.avgEfficiency > 90) {
    recs.push({
      priority: 'low',
      category: 'production',
      title: 'Increase intake feed rate',
      description: 'Plant has headroom to process more material without compromising safety.',
      action: 'Bump intake rate by 10%.',
      impact: '+8-10% throughput',
    })
  }

  return recs
}
