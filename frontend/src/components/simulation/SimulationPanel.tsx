'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { SimulationEngine } from '@/engine/SimulationEngine'
import { findMachineDefinition } from '@/data/industryRegistry'
import { MachineConfig, MachineDefinition } from '@/types'
import {
  AlertTriangle,
  Copy,
  MachineIcon,
  Play,
  Settings,
  Square,
  Trash2,
} from '@/components/ui/icons'

export default function SimulationPanel() {
  const {
    machines,
    simulation,
    startSimulation,
    stopSimulation,
    updateTelemetry,
    addAlert,
    telemetryData,
    resetIndustry,
    customIndustries,
    updateMachine,
  } = useStore()
  const engineRef = useRef<SimulationEngine | null>(null)
  const [tickRate, setTickRate] = useState(1000)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null)

  const handleStart = () => {
    if (machines.length === 0) return
    startSimulation()
    startEngine()
  }

  const startEngine = () => {
    engineRef.current?.stop()

    const engine = new SimulationEngine(
      machines,
      tickRate,
      customIndustries,
      (machineId, data) => updateTelemetry(machineId, data),
      (alert) => {
        const store = useStore.getState()
        const recentSimilar = store.alerts.find(
          (a) =>
            a.machineId === alert.machineId &&
            a.category === alert.category &&
            Date.now() - a.timestamp < 5000
        )
        if (!recentSimilar) {
          addAlert(alert)
        }
      }
    )
    engine.start()
    engineRef.current = engine
  }

  const handleStop = () => {
    engineRef.current?.stop()
    engineRef.current = null
    stopSimulation()
  }

  const handleDeleteIndustry = () => {
    engineRef.current?.stop()
    engineRef.current = null
    resetIndustry()
    setShowDeleteConfirm(false)
  }

  // Auto-restart engine on mount if it was running before reload
  useEffect(() => {
    if (simulation.status === 'running' && machines.length > 0 && !engineRef.current) {
      startEngine()
    }
    return () => {
      engineRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When machines list changes during a run (e.g. parameters tweaked), the
  // running engine still holds a stale snapshot. We piggy-back on the live
  // store update below — see EditableMachineCard which writes directly to the
  // store; that re-runs this effect and we restart the engine.
  useEffect(() => {
    if (simulation.status !== 'running') return
    startEngine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines, tickRate])

  const isRunning = simulation.status === 'running'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Simulation Control</h1>
          <p className="text-carbon-400 mt-1">Industrial simulation engine — real-time machine telemetry</p>
        </div>
        {machines.length > 0 && !isRunning && (
          <div className="relative">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete Industry
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                <span className="text-xs text-red-300">Delete all machines &amp; data?</span>
                <button
                  onClick={handleDeleteIndustry}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-carbon-700 hover:bg-carbon-600 text-white text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="industrial-card p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={machines.length === 0}
            className={`px-7 py-4 rounded-xl font-bold text-base transition-all duration-300 inline-flex items-center gap-3 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-industrial-600 hover:bg-industrial-500 text-white disabled:bg-carbon-700 disabled:text-carbon-500'
            }`}
          >
            {isRunning ? (
              <>
                <Square size={18} /> Stop Simulation
              </>
            ) : (
              <>
                <Play size={18} /> Start Simulation
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <label className="text-sm text-carbon-400">Update Rate:</label>
            <select
              value={tickRate}
              onChange={(e) => setTickRate(Number(e.target.value))}
              disabled={isRunning}
              className="bg-carbon-800 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={500}>500ms (Fast)</option>
              <option value={1000}>1s (Normal)</option>
              <option value={2000}>2s (Slow)</option>
              <option value={5000}>5s (Economy)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-industrial-400 animate-pulse' : 'bg-carbon-600'
              }`}
            />
            <span className="text-sm text-carbon-300">{isRunning ? 'Running' : 'Idle'}</span>
          </div>
        </div>

        {simulation.key && (
          <div className="mt-4 p-3 rounded-lg bg-carbon-800/50 border border-carbon-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-carbon-400">Simulation Key</p>
                <p className="text-lg font-mono text-industrial-400 font-bold">{simulation.key}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(simulation.key || '')}
                className="px-3 py-1 text-xs bg-carbon-700 hover:bg-carbon-600 text-white rounded transition-colors inline-flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              Use this key to connect the Digital Twin viewer
            </p>
          </div>
        )}
      </div>

      {machines.length === 0 ? (
        <div className="industrial-card p-12 text-center">
          <p className="text-carbon-400">
            No machines configured. Go to Machine Configuration to add machines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => {
            const def = findMachineDefinition(machine.type, customIndustries)
            const telemetry = telemetryData[machine.id]
            const editing = editingMachineId === machine.id
            return (
              <EditableMachineCard
                key={machine.id}
                machine={machine}
                def={def}
                telemetry={telemetry}
                isRunning={isRunning}
                editing={editing}
                onToggleEdit={() => setEditingMachineId(editing ? null : machine.id)}
                onChangeParam={(key, value) =>
                  updateMachine(machine.id, {
                    parameters: { ...machine.parameters, [key]: value },
                  })
                }
                onResetDefaults={() => {
                  if (!def) return
                  const defaults = Object.fromEntries(
                    def.parameters.map((p) => [p.key, p.default])
                  )
                  updateMachine(machine.id, { parameters: defaults })
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditableMachineCard({
  machine,
  def,
  telemetry,
  isRunning,
  editing,
  onToggleEdit,
  onChangeParam,
  onResetDefaults,
}: {
  machine: MachineConfig
  def?: MachineDefinition
  telemetry?: any
  isRunning: boolean
  editing: boolean
  onToggleEdit: () => void
  onChangeParam: (key: string, value: number) => void
  onResetDefaults: () => void
}) {
  const stateColor = !telemetry
    ? 'border-carbon-700'
    : telemetry.machineState === 'critical'
    ? 'border-alert-critical'
    : telemetry.machineState === 'warning'
    ? 'border-alert-warning'
    : 'border-industrial-500/50'

  const editableParams = useMemo(() => def?.parameters.filter((p) => p.editable) ?? [], [def])

  return (
    <div className={`industrial-card p-5 ${stateColor} transition-colors duration-500`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {def && (
            <div className="w-7 h-7 rounded-md bg-carbon-800 border border-carbon-700/50 flex items-center justify-center text-industrial-400 shrink-0">
              <MachineIcon hint={def.icon} size={15} />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-semibold text-white text-sm truncate inline-flex items-center gap-1.5">
              {(telemetry?.machineState === 'critical' || telemetry?.machineState === 'warning') && (
                <AlertTriangle size={13} className="text-alert-warning shrink-0" />
              )}
              {machine.name}
            </h4>
            {def?.category && (
              <p className="text-[10px] text-carbon-500 uppercase tracking-wider">{def.category}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              !isRunning
                ? 'bg-carbon-600'
                : telemetry?.machineState === 'critical'
                ? 'bg-alert-critical animate-pulse'
                : telemetry?.machineState === 'warning'
                ? 'bg-alert-warning animate-pulse'
                : 'bg-industrial-400 animate-pulse-slow'
            }`}
          />
          <button
            onClick={onToggleEdit}
            className={`px-2 py-1 rounded text-[10px] inline-flex items-center gap-1 transition-colors ${
              editing
                ? 'bg-industrial-900/40 border border-industrial-700/50 text-industrial-300'
                : 'bg-carbon-800 hover:bg-carbon-700 border border-carbon-700 text-carbon-300'
            }`}
          >
            <Settings size={10} />
            {editing ? 'Close' : 'Tune'}
          </button>
        </div>
      </div>

      {telemetry ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <TelemetryItem label="Temp" value={`${telemetry.temperature.toFixed(1)}°C`} />
          <TelemetryItem label="RPM" value={telemetry.rpm.toFixed(0)} />
          <TelemetryItem label="Pressure" value={`${telemetry.pressure.toFixed(1)} bar`} />
          <TelemetryItem label="Efficiency" value={`${telemetry.efficiencyScore.toFixed(0)}%`} />
          <TelemetryItem label="Energy" value={`${telemetry.energyConsumption.toFixed(1)} kW`} />
          <TelemetryItem
            label="Failure"
            value={`${telemetry.failureProbability.toFixed(0)}%`}
            warn={telemetry.failureProbability > 40}
          />
        </div>
      ) : (
        <p className="text-xs text-carbon-500">Waiting for data...</p>
      )}

      {editing && (
        <div className="mt-4 pt-4 border-t border-carbon-700/40">
          {editableParams.length === 0 ? (
            <p className="text-xs text-carbon-500 italic">No tunable parameters for this machine.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-carbon-400 uppercase tracking-widest">
                  Live parameters {isRunning && <span className="text-industrial-400">· applies immediately</span>}
                </p>
                <button
                  onClick={onResetDefaults}
                  className="text-[10px] text-carbon-400 hover:text-white transition-colors"
                >
                  Reset to defaults
                </button>
              </div>
              {editableParams.map((p) => {
                const current = machine.parameters[p.key] ?? p.default
                const step = p.max - p.min < 5 ? 0.1 : 1
                return (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-carbon-300">{p.label}</label>
                      <span className="text-[11px] text-industrial-400 font-mono">
                        {current.toFixed(step < 1 ? 2 : 0)} <span className="text-carbon-500">{p.unit}</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={step}
                      value={current}
                      onChange={(e) => onChangeParam(p.key, Number(e.target.value))}
                      className="w-full accent-industrial-500"
                    />
                    <div className="flex items-center justify-between text-[9px] text-carbon-600 font-mono">
                      <span>{p.min}</span>
                      <span>default {p.default}</span>
                      <span>{p.max}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TelemetryItem({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div>
      <p className="text-carbon-500">{label}</p>
      <p className={`font-mono font-bold ${warn ? 'text-alert-warning' : 'text-industrial-400'}`}>
        {value}
      </p>
    </div>
  )
}
