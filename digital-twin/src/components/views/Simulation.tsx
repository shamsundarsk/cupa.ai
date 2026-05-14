'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppState, KpiSnapshot } from '@/lib/types'
import { DerivedKpis } from '@/lib/useTwinState'
import { LineChart } from '../charts'
import { AlertIcon, ArrowDownRightIcon, ArrowUpRightIcon, CpuIcon, GaugeIcon, PlayIcon, SparkleIcon, ZapIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
}

interface UpgradeProfile {
  multiplier: number
  paramScale: number
  energyScale: number
  riskBias: number
  efficiencyDelta: number
  costMultiplier: number
}

const PROFILES: Record<'upgrade' | 'baseline' | 'downgrade', UpgradeProfile> = {
  // Upgrade: better hardware → less load, lower energy/kg, lower risk, +eff
  upgrade: { multiplier: 1.15, paramScale: 1.0, energyScale: 0.85, riskBias: -10, efficiencyDelta: 6, costMultiplier: 1.0 },
  baseline: { multiplier: 1.0, paramScale: 1.0, energyScale: 1.0, riskBias: 0, efficiencyDelta: 0, costMultiplier: 1.0 },
  // Downgrade: cheaper components → throughput drops slightly, energy a bit higher, risk creeps up
  downgrade: { multiplier: 0.85, paramScale: 1.0, energyScale: 1.12, riskBias: +12, efficiencyDelta: -8, costMultiplier: 1.0 },
}

const UPGRADE_PARAM_SCALE = 1.15 // bumps tunable knobs up 15%
const DOWNGRADE_PARAM_SCALE = 0.85 // pulls tunable knobs down 15%

const TUNABLE_HINTS = [
  'rpm', 'rotation_speed', 'mixing_speed', 'drum_speed', 'speed', 'cycle_rate',
  'cutting_speed', 'shredding_rate', 'feed_rate', 'intake_rate',
  'pressure_level', 'steam_pressure', 'hydraulic_pressure', 'pressure',
  'tank_temperature', 'press_temperature', 'water_temperature', 'drying_temperature',
  'magnetic_field_strength', 'belt_speed', 'airflow_rate',
  'press_pressure', 'press_time', 'mixing_time', 'sorting_speed',
  'cooling_power', 'inert_gas_pressure', 'ventilation_rate',
]

export default function Simulation({ state, derived, kpiHistory }: Props) {
  const [machineId, setMachineId] = useState<string | null>(null)
  const [mode, setMode] = useState<'upgrade' | 'baseline' | 'downgrade'>('baseline')
  const [pending, setPending] = useState(false)

  // Auto-pick first machine
  useEffect(() => {
    if (!machineId && state.machines.length > 0) setMachineId(state.machines[0].id)
  }, [machineId, state.machines])

  const machine = useMemo(
    () => (machineId ? state.machines.find((m) => m.id === machineId) : null),
    [machineId, state.machines]
  )
  const liveTelemetry = machineId ? state.telemetryData[machineId] : undefined

  // Forecasts for the whole plant
  const revenueForecast = useMemo(() => forecast(kpiHistory.map((k) => k.revenue), 30), [kpiHistory])
  const riskForecast = useMemo(() => forecast(kpiHistory.map((k) => k.risk), 30, 100), [kpiHistory])

  const peakRisk = riskForecast.length ? Math.round(Math.max(...riskForecast)) : derived.riskScore

  const profile = PROFILES[mode]

  // Predicted per-machine state with the chosen profile applied (purely local
  // projection — does not mutate the running plant unless user hits Apply).
  const projection = useMemo(() => {
    if (!machine || !liveTelemetry) return null
    const energy = liveTelemetry.energyConsumption * profile.energyScale
    const throughput = liveTelemetry.throughput * profile.multiplier
    const efficiency = clamp(liveTelemetry.efficiencyScore + profile.efficiencyDelta, 0, 100)
    const failure = clamp(liveTelemetry.failureProbability + profile.riskBias, 0, 100)
    const temp = liveTelemetry.temperature + (mode === 'downgrade' ? 6 : mode === 'upgrade' ? -4 : 0)

    // Plant-wide effect: weight by this machine's throughput share.
    const tels = Object.values(state.telemetryData)
    const totalThroughput = tels.reduce((s, t) => s + t.throughput, 0) || 1
    const share = liveTelemetry.throughput / totalThroughput
    const projectedTotalRevenue =
      derived.cumulativeRevenue * (1 + (profile.multiplier - 1) * share)
    const projectedTotalEnergy =
      derived.cumulativeEnergyKWh * (1 + (profile.energyScale - 1) * share)
    const projectedRisk = clamp(derived.riskScore + profile.riskBias * share, 0, 100)

    return {
      machine: { energy, throughput, efficiency, failure, temp },
      plant: {
        revenueDelta: projectedTotalRevenue - derived.cumulativeRevenue,
        energyDelta: projectedTotalEnergy - derived.cumulativeEnergyKWh,
        riskDelta: projectedRisk - derived.riskScore,
        efficiencyDelta: profile.efficiencyDelta * share,
      },
    }
  }, [machine, liveTelemetry, profile, mode, derived, state.telemetryData])

  const apply = async () => {
    if (!machine || !machineId) return
    const scale = mode === 'upgrade' ? UPGRADE_PARAM_SCALE : mode === 'downgrade' ? DOWNGRADE_PARAM_SCALE : 1
    if (scale === 1) return
    const params: Record<string, number> = {}
    for (const key of TUNABLE_HINTS) {
      if (machine.parameters[key] === undefined) continue
      const next = machine.parameters[key] * scale
      params[key] = Number(next.toFixed(2))
      if (Object.keys(params).length >= 6) break
    }
    if (Object.keys(params).length === 0) return
    setPending(true)
    try {
      await fetch('/api/twin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tune_machine', payload: { machineId, parameters: params } }),
      })
    } catch {
      // ignore
    } finally {
      setTimeout(() => setPending(false), 400)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulation &amp; Prediction</h1>
        <p className="text-sm text-carbon-400 mt-0.5">Predict future outcomes and try upgrade or downgrade scenarios on individual machines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Pill label="REVENUE NEXT 30 MIN" value={`$${(derived.cumulativeRevenue + (revenueForecast[revenueForecast.length - 1] - revenueForecast[0] || 0) * 0.1).toFixed(2)}`} accent="industrial" />
        <Pill label="REVENUE RATE" value={`$${(derived.cumulativeRevenue / Math.max(1, derived.shiftElapsedMs / 3600000)).toFixed(0)}/hr`} accent="cyan" />
        <Pill label="PEAK RISK FORECAST" value={`${peakRisk}/100`} accent={peakRisk > 60 ? 'rose' : peakRisk > 30 ? 'amber' : 'industrial'} />
        <Pill label="PREDICTED EFFICIENCY" value={`${derived.avgEfficiency.toFixed(1)}%`} accent="industrial" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <SparkleIcon size={14} className="text-industrial-400" /> Revenue Forecast
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">Predicted revenue trajectory over next 30 sim-minutes</p>
          <LineChart data={revenueForecast} color="#22c55e" fill="rgba(34,197,94,0.12)" height={200} />
        </div>
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <AlertIcon size={14} className="text-accent-rose" /> Risk Forecast
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">Predicted plant risk over next 30 sim-minutes</p>
          <LineChart data={riskForecast} color="#ef4444" fill="rgba(239,68,68,0.15)" height={200} yMin={0} yMax={100} />
        </div>
      </div>

      {/* Machine upgrade/downgrade scenario */}
      <div className="industrial-card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
              <CpuIcon size={14} className="text-accent-cyan" /> Machine Upgrade / Downgrade Scenario
            </h3>
            <p className="text-[11px] text-carbon-400 mt-1">
              Pick a machine, choose Upgrade or Downgrade, and see the projected impact before applying it. Apply pushes new parameters to the live plant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={machineId ?? ''}
              onChange={(e) => setMachineId(e.target.value || null)}
              className="bg-carbon-800 border border-carbon-700 rounded-md px-3 py-2 text-sm text-white focus:border-industrial-500 focus:outline-none"
            >
              <option value="">Select machine…</option>
              {state.machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!machine && (
          <div className="text-xs text-carbon-500 italic mt-4">
            Choose a machine to see upgrade and downgrade projections.
          </div>
        )}

        {machine && projection && liveTelemetry && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mode selector */}
            <div className="lg:col-span-1 space-y-2">
              <ModeButton
                active={mode === 'upgrade'}
                onClick={() => setMode('upgrade')}
                tone="industrial"
                title="Upgrade"
                Icon={ArrowUpRightIcon}
                lines={['+15% throughput target', '−15% energy/kg', '+6% efficiency', 'Lower failure risk']}
              />
              <ModeButton
                active={mode === 'baseline'}
                onClick={() => setMode('baseline')}
                tone="cyan"
                title="Baseline"
                Icon={GaugeIcon}
                lines={['Current configuration', 'No projected change', 'Use to compare scenarios']}
              />
              <ModeButton
                active={mode === 'downgrade'}
                onClick={() => setMode('downgrade')}
                tone="rose"
                title="Downgrade"
                Icon={ArrowDownRightIcon}
                lines={['−15% throughput target', '+12% energy/kg', '−8% efficiency', 'Higher failure risk']}
              />

              <button
                onClick={apply}
                disabled={mode === 'baseline' || pending}
                className={`w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${
                  mode === 'baseline' || pending
                    ? 'bg-carbon-800 border-carbon-700 text-carbon-500 cursor-not-allowed'
                    : 'bg-industrial-600 hover:bg-industrial-500 border-industrial-700 text-white'
                }`}
              >
                <PlayIcon size={11} />
                {pending ? 'Applying…' : mode === 'baseline' ? 'Pick Upgrade or Downgrade' : `Apply ${mode === 'upgrade' ? 'upgrade' : 'downgrade'}`}
              </button>
            </div>

            {/* Per-machine projection */}
            <div className="industrial-card p-3 bg-carbon-900/40 border-carbon-700/40">
              <div className="text-[10px] uppercase tracking-widest text-carbon-400 mb-2">{machine.name} — projected</div>
              <Compare label="Throughput" baseline={liveTelemetry.throughput} projected={projection.machine.throughput} unit=" kg/h" inverse={false} />
              <Compare label="Efficiency" baseline={liveTelemetry.efficiencyScore} projected={projection.machine.efficiency} unit=" %" inverse={false} />
              <Compare label="Energy" baseline={liveTelemetry.energyConsumption} projected={projection.machine.energy} unit=" kW" inverse />
              <Compare label="Temperature" baseline={liveTelemetry.temperature} projected={projection.machine.temp} unit=" °C" inverse />
              <Compare label="Failure prob" baseline={liveTelemetry.failureProbability} projected={projection.machine.failure} unit=" %" inverse />
            </div>

            {/* Plant-wide projection */}
            <div className="industrial-card p-3 bg-carbon-900/40 border-carbon-700/40">
              <div className="text-[10px] uppercase tracking-widest text-carbon-400 mb-2">Plant-wide impact</div>
              <PlantStat Icon={SparkleIcon} label="Revenue Δ" value={projection.plant.revenueDelta} unit=" $" tone={projection.plant.revenueDelta >= 0 ? 'industrial' : 'rose'} />
              <PlantStat Icon={ZapIcon} label="Energy Δ" value={projection.plant.energyDelta} unit=" kWh" tone={projection.plant.energyDelta <= 0 ? 'industrial' : 'rose'} />
              <PlantStat Icon={AlertIcon} label="Risk Δ" value={projection.plant.riskDelta} unit=" pts" tone={projection.plant.riskDelta <= 0 ? 'industrial' : 'rose'} />
              <PlantStat Icon={GaugeIcon} label="Efficiency Δ" value={projection.plant.efficiencyDelta} unit=" %" tone={projection.plant.efficiencyDelta >= 0 ? 'industrial' : 'rose'} />
              <p className="text-[10px] text-carbon-500 mt-3 leading-relaxed">
                Plant-wide deltas weight this machine&apos;s throughput share. Apply to push the new parameter values to the live plant — telemetry will update within a tick.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ label, value, accent }: { label: string; value: string; accent: 'industrial' | 'cyan' | 'amber' | 'rose' }) {
  const tone: Record<string, string> = {
    industrial: 'text-industrial-400',
    cyan: 'text-accent-cyan',
    amber: 'text-accent-amber',
    rose: 'text-accent-rose',
  }
  return (
    <div className="industrial-card p-3">
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${tone[accent]}`}>{value}</div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  tone,
  title,
  Icon,
  lines,
}: {
  active: boolean
  onClick: () => void
  tone: 'industrial' | 'cyan' | 'rose'
  title: string
  Icon: (p: any) => JSX.Element
  lines: string[]
}) {
  const tones: Record<string, { bg: string; border: string; text: string }> = {
    industrial: { bg: 'bg-industrial-900/30', border: 'border-industrial-700/50', text: 'text-industrial-300' },
    cyan: { bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/40', text: 'text-accent-cyan' },
    rose: { bg: 'bg-accent-rose/10', border: 'border-accent-rose/40', text: 'text-accent-rose' },
  }
  const t = tones[tone]
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md border transition-colors ${
        active
          ? `${t.bg} ${t.border}`
          : 'bg-carbon-800/40 border-carbon-700/40 hover:border-carbon-600'
      }`}
    >
      <div className={`flex items-center gap-2 mb-1.5 ${active ? t.text : 'text-white'}`}>
        <Icon size={14} />
        <span className="text-sm font-semibold">{title}</span>
        {active && <span className="ml-auto text-[10px] font-mono">SELECTED</span>}
      </div>
      <ul className="space-y-0.5 ml-6 list-disc text-[11px] text-carbon-400">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </button>
  )
}

function Compare({
  label,
  baseline,
  projected,
  unit,
  inverse,
}: {
  label: string
  baseline: number
  projected: number
  unit: string
  inverse: boolean
}) {
  const delta = projected - baseline
  const positive = inverse ? delta < 0 : delta > 0
  const tone = Math.abs(delta) < 0.01 ? 'text-carbon-400' : positive ? 'text-industrial-400' : 'text-accent-rose'
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-carbon-800/60 last:border-b-0">
      <span className="text-carbon-400 text-[12px]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-carbon-500 line-through">
          {baseline.toFixed(1)}{unit}
        </span>
        <span className="text-[12px] font-mono text-white">
          {projected.toFixed(1)}{unit}
        </span>
        <span className={`text-[10px] font-mono ${tone}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

function PlantStat({
  Icon,
  label,
  value,
  unit,
  tone,
}: {
  Icon: (p: any) => JSX.Element
  label: string
  value: number
  unit: string
  tone: 'industrial' | 'rose'
}) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400',
    rose: 'text-accent-rose',
  }
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-carbon-800/60 last:border-b-0">
      <span className="inline-flex items-center gap-2 text-[12px] text-carbon-400">
        <Icon size={12} className="text-carbon-400" />
        {label}
      </span>
      <span className={`text-[12px] font-mono ${tones[tone]}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}{unit}
      </span>
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Naive forecast: extend a series by extrapolating the latest gradient. */
function forecast(series: number[], extra: number, clampMax?: number) {
  if (series.length === 0) return Array(extra).fill(0)
  const slice = series.slice(-Math.min(20, series.length))
  if (slice.length < 2) {
    return [...slice, ...Array(extra).fill(slice[slice.length - 1] ?? 0)]
  }
  const slope = (slice[slice.length - 1] - slice[0]) / Math.max(1, slice.length - 1)
  const last = slice[slice.length - 1]
  const out: number[] = [...slice]
  for (let i = 1; i <= extra; i++) {
    let v = last + slope * i + Math.sin(i * 0.3) * (slope * 0.4 || 0.05)
    if (clampMax !== undefined) v = Math.max(0, Math.min(clampMax, v))
    out.push(v)
  }
  return out
}
