'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'

export default function TelemetryDashboard() {
  const { machines, telemetryData, simulation } = useStore()
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, number[]>>({})

  // Track telemetry history for charts
  useEffect(() => {
    if (selectedMachine && telemetryData[selectedMachine]) {
      const data = telemetryData[selectedMachine]
      setHistory(prev => ({
        temperature: [...(prev.temperature || []).slice(-30), data.temperature],
        rpm: [...(prev.rpm || []).slice(-30), data.rpm],
        pressure: [...(prev.pressure || []).slice(-30), data.pressure],
        efficiency: [...(prev.efficiency || []).slice(-30), data.efficiencyScore],
        energy: [...(prev.energy || []).slice(-30), data.energyConsumption],
        vibration: [...(prev.vibration || []).slice(-30), data.vibration],
      }))
    }
  }, [telemetryData, selectedMachine])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Telemetry</h1>
          <p className="text-carbon-400 mt-1">Real-time machine sensor data and performance metrics</p>
        </div>
        {simulation.status === 'running' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-industrial-900/30 border border-industrial-700/50">
            <span className="w-2 h-2 rounded-full bg-industrial-400 animate-pulse" />
            <span className="text-sm text-industrial-400">Live Data</span>
          </div>
        )}
      </div>

      {/* Machine Selector */}
      <div className="flex gap-2 flex-wrap">
        {machines.map((machine) => {
          const telemetry = telemetryData[machine.id]
          const stateClass = !telemetry ? 'bg-carbon-800 text-carbon-400' :
            telemetry.machineState === 'critical' ? 'bg-red-900/50 text-red-300 border-red-700/50' :
            telemetry.machineState === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50' :
            selectedMachine === machine.id ? 'bg-industrial-900/50 text-industrial-300 border-industrial-500' :
            'bg-carbon-800 text-carbon-300 border-carbon-600'

          return (
            <button
              key={machine.id}
              onClick={() => setSelectedMachine(machine.id)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${stateClass}`}
            >
              {machine.name}
            </button>
          )
        })}
      </div>

      {/* Telemetry Table */}
      <div className="industrial-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon-700/50">
                <th className="text-left p-4 text-carbon-400 font-medium">Machine</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Temp (°C)</th>
                <th className="text-right p-4 text-carbon-400 font-medium">RPM</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Pressure (bar)</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Throughput</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Energy (kW)</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Efficiency</th>
                <th className="text-right p-4 text-carbon-400 font-medium">Failure %</th>
                <th className="text-center p-4 text-carbon-400 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => {
                const t = telemetryData[machine.id]
                if (!t) return (
                  <tr key={machine.id} className="border-b border-carbon-800/50">
                    <td className="p-4 text-white">{machine.name}</td>
                    <td colSpan={8} className="p-4 text-center text-carbon-500">No data</td>
                  </tr>
                )

                return (
                  <tr
                    key={machine.id}
                    onClick={() => setSelectedMachine(machine.id)}
                    className="border-b border-carbon-800/50 hover:bg-carbon-800/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-white font-medium">{machine.name}</td>
                    <td className={`p-4 text-right font-mono ${t.temperature > 100 ? 'text-alert-critical' : 'text-industrial-400'}`}>
                      {t.temperature.toFixed(1)}
                    </td>
                    <td className="p-4 text-right font-mono text-industrial-400">{t.rpm.toFixed(0)}</td>
                    <td className={`p-4 text-right font-mono ${t.pressure > 8 ? 'text-alert-warning' : 'text-industrial-400'}`}>
                      {t.pressure.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono text-industrial-400">{t.throughput.toFixed(1)}</td>
                    <td className="p-4 text-right font-mono text-industrial-400">{t.energyConsumption.toFixed(1)}</td>
                    <td className={`p-4 text-right font-mono ${t.efficiencyScore < 70 ? 'text-alert-warning' : 'text-industrial-400'}`}>
                      {t.efficiencyScore.toFixed(0)}%
                    </td>
                    <td className={`p-4 text-right font-mono ${t.failureProbability > 50 ? 'text-alert-critical' : t.failureProbability > 30 ? 'text-alert-warning' : 'text-industrial-400'}`}>
                      {t.failureProbability.toFixed(0)}%
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        t.machineState === 'critical' ? 'bg-red-900/50 text-red-300' :
                        t.machineState === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {t.machineState}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Machine Detail */}
      {selectedMachine && telemetryData[selectedMachine] && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {machines.find(m => m.id === selectedMachine)?.name} — Detailed Telemetry
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard label="Temperature" value={`${telemetryData[selectedMachine].temperature.toFixed(1)}°C`} />
            <MetricCard label="RPM" value={telemetryData[selectedMachine].rpm.toFixed(0)} />
            <MetricCard label="Pressure" value={`${telemetryData[selectedMachine].pressure.toFixed(2)} bar`} />
            <MetricCard label="Throughput" value={telemetryData[selectedMachine].throughput.toFixed(1)} />
            <MetricCard label="Energy" value={`${telemetryData[selectedMachine].energyConsumption.toFixed(1)} kW`} />
            <MetricCard label="Vibration" value={`${telemetryData[selectedMachine].vibration.toFixed(1)} mm/s`} />
            <MetricCard label="Efficiency" value={`${telemetryData[selectedMachine].efficiencyScore.toFixed(0)}%`} />
            <MetricCard label="Failure Risk" value={`${telemetryData[selectedMachine].failureProbability.toFixed(0)}%`} />
            <MetricCard label="Maintenance" value={`${telemetryData[selectedMachine].maintenanceScore.toFixed(0)}%`} />
            <MetricCard label="Sensor Health" value={`${telemetryData[selectedMachine].sensorHealth.toFixed(0)}%`} />
            <MetricCard label="Material Flow" value={telemetryData[selectedMachine].materialQuantity.toFixed(1)} />
            <MetricCard label="State" value={telemetryData[selectedMachine].machineState} />
          </div>

          {/* Mini Sparklines */}
          {history.temperature && history.temperature.length > 2 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <SparklineChart label="Temperature" data={history.temperature} unit="°C" color="#22c55e" />
              <SparklineChart label="Efficiency" data={history.efficiency} unit="%" color="#3b82f6" />
              <SparklineChart label="Energy" data={history.energy} unit="kW" color="#f59e0b" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-carbon-800/50 border border-carbon-700/30">
      <p className="text-xs text-carbon-500">{label}</p>
      <p className="text-sm font-mono font-bold text-industrial-400 mt-1">{value}</p>
    </div>
  )
}

function SparklineChart({ label, data, unit, color }: { label: string; data: number[]; unit: string; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const height = 60
  const width = 200

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="p-3 rounded-lg bg-carbon-800/50 border border-carbon-700/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-carbon-400">{label}</p>
        <p className="text-xs font-mono text-industrial-400">{data[data.length - 1]?.toFixed(1)} {unit}</p>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
