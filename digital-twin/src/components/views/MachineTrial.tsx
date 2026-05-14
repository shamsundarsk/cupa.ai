'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AppState, MachineConfig, TelemetryData } from '@/lib/types'
import { CpuIcon, PlayIcon, SparkleIcon, ThermoIcon, ZapIcon } from '../icons'

interface Props {
  state: AppState
  initialMachineId?: string
}

const MAIN_APP =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAIN_APP_URL) ||
  'http://localhost:3000'

interface TrialKnob {
  key: string
  label: string
  unit: string
  min: number
  max: number
  current: number
  step: number
}

/**
 * "Trial" lets the user upgrade or downgrade a machine in the running plant
 * by tweaking known tunable parameters. Changes are pushed to the main app
 * via the cross-app action queue and the next telemetry tick reflects them.
 *
 * The KPI strip on the right captures a snapshot at the moment the trial
 * starts so we can show a delta against the baseline as the user changes
 * sliders.
 */
export default function MachineTrial({ state, initialMachineId }: Props) {
  const [machineId, setMachineId] = useState<string | null>(initialMachineId ?? null)
  const [knobs, setKnobs] = useState<TrialKnob[]>([])
  const [baseline, setBaseline] = useState<TelemetryData | null>(null)
  const [pending, setPending] = useState(false)
  const lastSentRef = useRef<number>(0)

  // Sync external selection into local state without overriding manual choices.
  useEffect(() => {
    if (initialMachineId && initialMachineId !== machineId) {
      setMachineId(initialMachineId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMachineId])

  // When user picks a machine, derive tunable knobs from the parameters
  // already on the machine config.
  useEffect(() => {
    if (!machineId) {
      setKnobs([])
      setBaseline(null)
      return
    }
    const machine = state.machines.find((m) => m.id === machineId)
    if (!machine) return
    const inferred: TrialKnob[] = inferTunableKnobs(machine)
    setKnobs(inferred)
    setBaseline(state.telemetryData[machineId] ?? null)
  }, [machineId, state.machines, state.telemetryData])

  const machine = useMemo(
    () => state.machines.find((m) => m.id === machineId),
    [state.machines, machineId]
  )
  const liveTelemetry = machineId ? state.telemetryData[machineId] : undefined

  const sendUpdate = async (newKnobs: TrialKnob[]) => {
    if (!machineId) return
    const params: Record<string, number> = {}
    newKnobs.forEach((k) => {
      params[k.key] = Number(k.current.toFixed(2))
    })
    setPending(true)
    lastSentRef.current = Date.now()
    try {
      await fetch(`${MAIN_APP}/api/twin-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tune_machine',
          payload: { machineId, parameters: params },
        }),
      })
    } catch {
      // ignore — UI will show stale state
    } finally {
      // small debounce
      setTimeout(() => setPending(false), 300)
    }
  }

  // Throttle sends so dragging a slider doesn't flood the queue.
  useEffect(() => {
    if (!machineId) return
    const t = setTimeout(() => {
      sendUpdate(knobs)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knobs, machineId])

  const handleKnob = (key: string, value: number) => {
    setKnobs((prev) => prev.map((k) => (k.key === key ? { ...k, current: value } : k)))
  }

  const reset = async () => {
    if (!machineId) return
    const machine = state.machines.find((m) => m.id === machineId)
    if (!machine) return
    const reverted: TrialKnob[] = inferTunableKnobs(machine, /* useDefault */ true)
    setKnobs(reverted)
    await sendUpdate(reverted)
    setBaseline(state.telemetryData[machineId] ?? null)
  }

  const tempDelta = liveTelemetry && baseline ? liveTelemetry.temperature - baseline.temperature : 0
  const effDelta = liveTelemetry && baseline ? liveTelemetry.efficiencyScore - baseline.efficiencyScore : 0
  const energyDelta = liveTelemetry && baseline ? liveTelemetry.energyConsumption - baseline.energyConsumption : 0
  const failureDelta = liveTelemetry && baseline ? liveTelemetry.failureProbability - baseline.failureProbability : 0

  return (
    <div className="industrial-card p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <PlayIcon size={11} className="text-industrial-400" /> Machine Trial
          </h3>
          <p className="text-[11px] text-carbon-400">
            Pick a machine, slide its parameters, see the live telemetry react in seconds. Updates apply to the running simulation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={machineId ?? ''}
            onChange={(e) => setMachineId(e.target.value || null)}
            className="bg-carbon-800 border border-carbon-700 rounded-md px-3 py-1.5 text-xs text-white focus:border-industrial-500 focus:outline-none"
          >
            <option value="">Select machine...</option>
            {state.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {machineId && (
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs bg-carbon-800 hover:bg-carbon-700 border border-carbon-700 text-carbon-300 rounded-md transition-colors"
            >
              Reset
            </button>
          )}
          {pending && <span className="text-[10px] text-accent-cyan font-mono animate-pulse">applying…</span>}
        </div>
      </div>

      {!machineId && (
        <div className="text-xs text-carbon-500 italic px-1 py-3">
          Choose a machine above. The simulation page must be open in the main dashboard for live tuning to take effect.
        </div>
      )}

      {machineId && machine && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {knobs.length === 0 ? (
              <div className="text-xs text-carbon-500 italic">No tunable parameters available for this machine.</div>
            ) : (
              knobs.map((k) => (
                <div key={k.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] text-carbon-300">{k.label}</label>
                    <span className="text-[12px] text-industrial-400 font-mono">
                      {k.current.toFixed(k.step < 1 ? 2 : 0)}
                      <span className="text-carbon-500 ml-1">{k.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={k.min}
                    max={k.max}
                    step={k.step}
                    value={k.current}
                    onChange={(e) => handleKnob(k.key, Number(e.target.value))}
                    className="w-full accent-industrial-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-carbon-600 font-mono">
                    <span>{k.min}</span>
                    <span>{k.max}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-carbon-400 uppercase tracking-widest mb-1">Live Δ vs trial start</div>
            <Stat Icon={ThermoIcon} label="Temperature" value={liveTelemetry ? `${liveTelemetry.temperature.toFixed(1)}°C` : '—'} delta={tempDelta} unit="°C" inverse />
            <Stat Icon={SparkleIcon} label="Efficiency" value={liveTelemetry ? `${liveTelemetry.efficiencyScore.toFixed(1)}%` : '—'} delta={effDelta} unit="%" />
            <Stat Icon={ZapIcon} label="Energy" value={liveTelemetry ? `${liveTelemetry.energyConsumption.toFixed(1)} kW` : '—'} delta={energyDelta} unit=" kW" inverse />
            <Stat Icon={CpuIcon} label="Failure prob" value={liveTelemetry ? `${liveTelemetry.failureProbability.toFixed(0)}%` : '—'} delta={failureDelta} unit="%" inverse />
            <div className="text-[10px] text-carbon-500 mt-2">
              Telemetry updates ~1.5s after each change. Click Reset to revert all parameters to their original defaults.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  Icon,
  label,
  value,
  delta,
  unit = '',
  inverse = false,
}: {
  Icon: (p: any) => JSX.Element
  label: string
  value: string
  delta: number
  unit?: string
  inverse?: boolean
}) {
  const positive = inverse ? delta < 0 : delta > 0
  const tone = Math.abs(delta) < 0.01 ? 'text-carbon-400' : positive ? 'text-industrial-400' : 'text-accent-rose'
  return (
    <div className="flex items-center justify-between p-2 rounded bg-carbon-800/40 border border-carbon-700/40">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-carbon-400" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-carbon-500">{label}</div>
          <div className="text-sm font-mono text-white">{value}</div>
        </div>
      </div>
      <div className={`text-[11px] font-mono ${tone}`}>
        {Math.abs(delta) < 0.01 ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${unit}`}
      </div>
    </div>
  )
}

const KNOB_PRIORITY = [
  // ordered by what's interesting to upgrade/downgrade
  'rpm', 'rotation_speed', 'mixing_speed', 'drum_speed', 'speed', 'cycle_rate',
  'cutting_speed', 'shredding_rate', 'feed_rate', 'intake_rate',
  'pressure_level', 'steam_pressure', 'hydraulic_pressure', 'pressure',
  'tank_temperature', 'press_temperature', 'water_temperature', 'drying_temperature',
  'magnetic_field_strength', 'belt_speed', 'airflow_rate',
  'press_pressure', 'press_time', 'detergent_level', 'mixing_time',
  'particle_size', 'material_thickness',
  'thread_tension',
]

function inferTunableKnobs(machine: MachineConfig, useDefault = false): TrialKnob[] {
  const out: TrialKnob[] = []
  // Rough param metadata: derive sensible (min, max) windows from the existing
  // value alone (twin app doesn't import the main app's machine catalog).
  // For each known parameter key, set bounds.
  const definitions: Record<string, { min: number; max: number; unit: string; label: string }> = {
    rpm: { min: 500, max: 10000, unit: 'rpm', label: 'RPM' },
    rotation_speed: { min: 5, max: 200, unit: 'rpm', label: 'Rotation speed' },
    mixing_speed: { min: 10, max: 500, unit: 'rpm', label: 'Mixing speed' },
    drum_speed: { min: 10, max: 200, unit: 'rpm', label: 'Drum speed' },
    speed: { min: 100, max: 8000, unit: 'spm', label: 'Speed' },
    cycle_rate: { min: 10, max: 240, unit: 'cycles/min', label: 'Cycle rate' },
    cutting_speed: { min: 1, max: 50, unit: 'm/min', label: 'Cutting speed' },
    shredding_rate: { min: 50, max: 4000, unit: 'kg/h', label: 'Shredding rate' },
    feed_rate: { min: 0.5, max: 5000, unit: 'kg/h', label: 'Feed rate' },
    intake_rate: { min: 100, max: 5000, unit: 'kg/h', label: 'Intake rate' },
    pressure_level: { min: 1, max: 30, unit: 'bar', label: 'Pressure level' },
    steam_pressure: { min: 1, max: 15, unit: 'bar', label: 'Steam pressure' },
    hydraulic_pressure: { min: 5, max: 50, unit: 'bar', label: 'Hydraulic pressure' },
    pressure: { min: 1, max: 10, unit: 'bar', label: 'Pressure' },
    tank_temperature: { min: 20, max: 250, unit: '°C', label: 'Tank temperature' },
    press_temperature: { min: 80, max: 250, unit: '°C', label: 'Press temperature' },
    water_temperature: { min: 20, max: 90, unit: '°C', label: 'Water temperature' },
    drying_temperature: { min: 50, max: 350, unit: '°C', label: 'Drying temperature' },
    magnetic_field_strength: { min: 0.1, max: 2.0, unit: 'T', label: 'Field strength' },
    belt_speed: { min: 1, max: 30, unit: 'm/min', label: 'Belt speed' },
    airflow_rate: { min: 100, max: 5000, unit: 'm³/h', label: 'Airflow rate' },
    press_pressure: { min: 1, max: 10, unit: 'bar', label: 'Press pressure' },
    press_time: { min: 5, max: 60, unit: 's', label: 'Press time' },
    detergent_level: { min: 5, max: 30, unit: '%', label: 'Detergent level' },
    mixing_time: { min: 1, max: 120, unit: 'min', label: 'Mixing time' },
    particle_size: { min: 1, max: 50, unit: 'mm', label: 'Particle size' },
    material_thickness: { min: 0.1, max: 20, unit: 'mm', label: 'Material thickness' },
    thread_tension: { min: 0.5, max: 20, unit: 'N', label: 'Thread tension' },
  }

  for (const key of KNOB_PRIORITY) {
    if (machine.parameters[key] !== undefined) {
      const meta = definitions[key]
      if (!meta) continue
      const current = useDefault ? clamp((meta.min + meta.max) / 2, meta.min, meta.max) : machine.parameters[key]
      const step = meta.max - meta.min < 5 ? 0.1 : 1
      out.push({ key, label: meta.label, unit: meta.unit, min: meta.min, max: meta.max, current, step })
      if (out.length >= 6) break
    }
  }

  // Fallback: any numeric parameter we don't recognize, with auto-bounds
  if (out.length === 0) {
    for (const [k, v] of Object.entries(machine.parameters)) {
      const min = Math.max(0, v * 0.4)
      const max = v * 1.6
      const step = max - min < 5 ? 0.1 : 1
      out.push({
        key: k,
        label: prettify(k),
        unit: '',
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        current: v,
        step,
      })
      if (out.length >= 6) break
    }
  }

  return out
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function prettify(k: string) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
