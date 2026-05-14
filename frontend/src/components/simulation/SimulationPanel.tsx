'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { SimulationEngine } from '@/engine/SimulationEngine'

export default function SimulationPanel() {
  const {
    machines, simulation, startSimulation, stopSimulation,
    updateTelemetry, addAlert, telemetryData, selectedIndustry, resetIndustry
  } = useStore()
  const engineRef = useRef<SimulationEngine | null>(null)
  const [tickRate, setTickRate] = useState(1000)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStart = () => {
    if (machines.length === 0) return

    startSimulation()
    startEngine()
  }

  const startEngine = () => {
    // Stop any existing engine
    engineRef.current?.stop()

    const engine = new SimulationEngine(
      machines,
      tickRate,
      (machineId, data) => updateTelemetry(machineId, data),
      (alert) => {
        const store = useStore.getState()
        const recentSimilar = store.alerts.find(
          a => a.machineId === alert.machineId && 
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

  // Auto-restart simulation engine on mount if it was running before reload
  useEffect(() => {
    if (simulation.status === 'running' && machines.length > 0 && !engineRef.current) {
      startEngine()
    }
    return () => {
      engineRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isRunning = simulation.status === 'running'

  return (
    <div className="space-y-6">
      {/* Header */}
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
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 rounded-lg text-sm transition-colors"
              >
                🗑 Delete Industry
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

      {/* Control Panel */}
      <div className="industrial-card p-6">
        <div className="flex items-center gap-6">
          {/* Start/Stop */}
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={machines.length === 0}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-industrial-600 hover:bg-industrial-500 text-white disabled:bg-carbon-700 disabled:text-carbon-500'
            }`}
          >
            {isRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
          </button>

          {/* Tick Rate */}
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

          {/* Status */}
          <div className="flex items-center gap-2 ml-auto">
            <span className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-industrial-400 animate-pulse' : 'bg-carbon-600'
            }`} />
            <span className="text-sm text-carbon-300">
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </div>

        {/* Simulation Key */}
        {simulation.key && (
          <div className="mt-4 p-3 rounded-lg bg-carbon-800/50 border border-carbon-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-carbon-400">Simulation Key</p>
                <p className="text-lg font-mono text-industrial-400 font-bold">{simulation.key}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(simulation.key || '')}
                className="px-3 py-1 text-xs bg-carbon-700 hover:bg-carbon-600 text-white rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              Use this key to connect the Digital Twin viewer
            </p>
          </div>
        )}
      </div>

      {/* Machine States */}
      {machines.length === 0 ? (
        <div className="industrial-card p-12 text-center">
          <p className="text-carbon-400">No machines configured. Go to Machine Configuration to add machines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => {
            const telemetry = telemetryData[machine.id]
            return (
              <MachineStateCard
                key={machine.id}
                name={machine.name}
                type={machine.type}
                telemetry={telemetry}
                isRunning={isRunning}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MachineStateCard({ name, type, telemetry, isRunning }: {
  name: string
  type: string
  telemetry?: any
  isRunning: boolean
}) {
  const stateColor = !telemetry ? 'border-carbon-700' :
    telemetry.machineState === 'critical' ? 'border-alert-critical' :
    telemetry.machineState === 'warning' ? 'border-alert-warning' :
    'border-industrial-500/50'

  return (
    <div className={`industrial-card p-5 ${stateColor} transition-colors duration-500`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white text-sm">{name}</h4>
        <span className={`w-2 h-2 rounded-full ${
          !isRunning ? 'bg-carbon-600' :
          telemetry?.machineState === 'critical' ? 'bg-alert-critical animate-pulse' :
          telemetry?.machineState === 'warning' ? 'bg-alert-warning animate-pulse' :
          'bg-industrial-400 animate-pulse-slow'
        }`} />
      </div>

      {telemetry ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <TelemetryItem label="Temp" value={`${telemetry.temperature.toFixed(1)}°C`} />
          <TelemetryItem label="RPM" value={telemetry.rpm.toFixed(0)} />
          <TelemetryItem label="Pressure" value={`${telemetry.pressure.toFixed(1)} bar`} />
          <TelemetryItem label="Efficiency" value={`${telemetry.efficiencyScore.toFixed(0)}%`} />
          <TelemetryItem label="Energy" value={`${telemetry.energyConsumption.toFixed(1)} kW`} />
          <TelemetryItem label="Failure" value={`${telemetry.failureProbability.toFixed(0)}%`} warn={telemetry.failureProbability > 40} />
        </div>
      ) : (
        <p className="text-xs text-carbon-500">Waiting for data...</p>
      )}
    </div>
  )
}

function TelemetryItem({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-carbon-500">{label}</p>
      <p className={`font-mono font-bold ${warn ? 'text-alert-warning' : 'text-industrial-400'}`}>{value}</p>
    </div>
  )
}
