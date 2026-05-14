'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MachineConfig, TelemetryData } from '@/types'
import { Globe } from '@/components/ui/icons'

const TwinCanvas = dynamic(() => import('@/components/twin/TwinCanvas3D'), { ssr: false })

// Demo machines for standalone Digital Twin view
const demoMachines: MachineConfig[] = [
  {
    id: 'machine-1',
    type: 'battery_intake_conveyor',
    name: 'Intake Conveyor',
    position: { x: 0, y: 0 },
    parameters: { speed: 2.5, capacity: 100 },
    connections: ['machine-2'],
  },
  {
    id: 'machine-2',
    type: 'battery_sorting_machine',
    name: 'Sorting Unit',
    position: { x: 1, y: 0 },
    parameters: { speed: 1.8, accuracy: 95 },
    connections: ['machine-3'],
  },
  {
    id: 'machine-3',
    type: 'battery_shredder',
    name: 'Shredder',
    position: { x: 2, y: 0 },
    parameters: { rpm: 3000, torque: 500 },
    connections: ['machine-4'],
  },
  {
    id: 'machine-4',
    type: 'magnetic_separator',
    name: 'Mag Separator',
    position: { x: 3, y: 0 },
    parameters: { fieldStrength: 1.2, speed: 1.5 },
    connections: ['machine-5'],
  },
  {
    id: 'machine-5',
    type: 'heated_chemical_tank',
    name: 'Chemical Tank',
    position: { x: 4, y: 0 },
    parameters: { temperature: 85, volume: 500 },
    connections: ['machine-6'],
  },
  {
    id: 'machine-6',
    type: 'drying_unit',
    name: 'Drying Unit',
    position: { x: 5, y: 0 },
    parameters: { temperature: 120, airflow: 50 },
    connections: [],
  },
]

// Flow steps describing what happens at each machine
const flowSteps = [
  { machineId: 'machine-1', action: 'Receiving raw battery scrap', material: 'Mixed battery waste', output: 'Sorted scrap batches', video: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4' },
  { machineId: 'machine-2', action: 'Sorting by chemistry type', material: 'Li-ion, NiMH, Lead-acid', output: 'Categorized cells', video: 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4' },
  { machineId: 'machine-3', action: 'Mechanical shredding', material: 'Categorized cells', output: 'Shredded black mass', video: 'https://videos.pexels.com/video-files/3191584/3191584-uhd_2560_1440_30fps.mp4' },
  { machineId: 'machine-4', action: 'Magnetic separation', material: 'Shredded black mass', output: 'Ferrous / Non-ferrous split', video: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4' },
  { machineId: 'machine-5', action: 'Chemical leaching', material: 'Non-ferrous material', output: 'Metal-rich solution', video: 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4' },
  { machineId: 'machine-6', action: 'Thermal drying', material: 'Metal-rich solution', output: 'Recovered metals (Co, Li, Ni)', video: 'https://videos.pexels.com/video-files/3191584/3191584-uhd_2560_1440_30fps.mp4' },
]

function generateTelemetry(machineId: string, index: number): TelemetryData {
  const states = ['running', 'running', 'running', 'warning', 'running', 'running']
  return {
    machineId,
    timestamp: Date.now(),
    temperature: 45 + index * 12,
    rpm: 800 + index * 200,
    pressure: 1.2 + index * 0.3,
    throughput: 80 + index * 2,
    energyConsumption: 12 + index * 3,
    machineState: states[index] || 'running',
    failureProbability: 0.02 + index * 0.01,
    maintenanceScore: 92 - index * 2,
    materialQuantity: 200 + index * 50,
    efficiencyScore: 88 - index * 3,
    sensorHealth: 95 - index,
    vibration: 0.3 + index * 0.05,
  }
}

interface HoveredMachine {
  machine: MachineConfig
  telemetry: TelemetryData
  flowStep: typeof flowSteps[0]
}

export default function DigitalTwinPage() {
  const [mounted, setMounted] = useState(false)
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryData>>({})
  const [hoveredMachine, setHoveredMachine] = useState<HoveredMachine | null>(null)
  const [activeFlowIndex, setActiveFlowIndex] = useState(0)

  useEffect(() => {
    const initial: Record<string, TelemetryData> = {}
    demoMachines.forEach((m, i) => {
      initial[m.id] = generateTelemetry(m.id, i)
    })
    setTelemetry(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlowIndex((prev) => (prev + 1) % demoMachines.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const updated: Record<string, TelemetryData> = {}
        demoMachines.forEach((m, i) => {
          const base = prev[m.id]
          if (base) {
            updated[m.id] = {
              ...base,
              timestamp: Date.now(),
              temperature: base.temperature + (Math.random() - 0.5) * 2,
              rpm: base.rpm + (Math.random() - 0.5) * 20,
              throughput: base.throughput + (Math.random() - 0.5) * 3,
              efficiencyScore: Math.max(60, Math.min(99, base.efficiencyScore + (Math.random() - 0.5) * 2)),
              vibration: Math.max(0.1, base.vibration + (Math.random() - 0.5) * 0.05),
            }
          } else {
            updated[m.id] = generateTelemetry(m.id, i)
          }
        })
        return updated
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [mounted])

  const handleMachineHover = useCallback((machineId: string | null) => {
    if (!machineId) {
      setHoveredMachine(null)
      return
    }
    const machine = demoMachines.find(m => m.id === machineId)
    const t = telemetry[machineId]
    const flow = flowSteps.find(f => f.machineId === machineId)
    if (machine && t && flow) {
      setHoveredMachine({ machine, telemetry: t, flowStep: flow })
    }
  }, [telemetry])

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Globe size={56} className="mx-auto mb-4 animate-pulse text-emerald-400" />
          <p className="text-gray-400 text-lg">Loading Digital Twin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0a0f1a] flex overflow-hidden" suppressHydrationWarning>
      {/* Left Sidebar - Flow Info */}
      <aside className="w-80 bg-[#0d1321] border-r border-gray-800 flex flex-col overflow-hidden" suppressHydrationWarning>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Scrap Flow Pipeline</h2>
          <p className="text-xs text-gray-500 mt-1">Battery recycling process</p>
        </div>

        {/* Flow Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {flowSteps.map((step, index) => {
            const t = telemetry[step.machineId]
            const isActive = index === activeFlowIndex
            const isPast = index < activeFlowIndex
            return (
              <div key={step.machineId}>
                <div
                  className={`p-3 rounded-lg border transition-all duration-500 ${
                    isActive
                      ? 'bg-green-900/20 border-green-600/50 shadow-lg shadow-green-900/20'
                      : isPast
                      ? 'bg-gray-800/20 border-gray-600/30'
                      : 'bg-gray-900/30 border-gray-700/30 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-green-400 animate-pulse' : isPast ? 'bg-green-600' : 'bg-gray-600'
                    }`} />
                    <span className="text-xs font-semibold text-white">{demoMachines[index].name}</span>
                    {isActive && <span className="ml-auto text-xs text-green-400 font-mono">ACTIVE</span>}
                  </div>
                  <p className={`text-xs ml-4 ${isActive ? 'text-green-300' : 'text-gray-400'}`}>{step.action}</p>
                  <div className="mt-2 ml-4 flex items-center justify-between text-xs">
                    <span className="text-gray-500">In: {step.material.split(',')[0]}</span>
                    {t && (
                      <span className="text-gray-400 font-mono">{t.throughput.toFixed(0)} kg/h</span>
                    )}
                  </div>
                  <div className="mt-1 ml-4 text-xs text-gray-500">
                    Out: <span className="text-gray-300">{step.output}</span>
                  </div>
                </div>
                {/* Flow arrow */}
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-0.5 h-3 ${isActive ? 'bg-green-500' : isPast ? 'bg-green-700' : 'bg-gray-700'} transition-colors duration-500`} />
                      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${
                        isActive ? 'border-t-green-500' : isPast ? 'border-t-green-700' : 'border-t-gray-700'
                      } transition-colors duration-500`} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-gray-800 bg-[#0a0f1a]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Total Throughput</p>
              <p className="text-sm font-mono text-white">
                {Object.values(telemetry).reduce((sum, t) => sum + t.throughput, 0).toFixed(0)} kg/h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Efficiency</p>
              <p className="text-sm font-mono text-white">
                {(Object.values(telemetry).reduce((sum, t) => sum + t.efficiencyScore, 0) / Math.max(1, Object.values(telemetry).length)).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Machines</p>
              <p className="text-sm font-mono text-green-400">{demoMachines.length}/{demoMachines.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Warnings</p>
              <p className="text-sm font-mono text-yellow-400">
                {Object.values(telemetry).filter(t => t.machineState === 'warning').length}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-[#0d1321]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-xl font-bold text-white">Digital Twin — Factory Floor</h1>
            <span className="text-xs text-gray-400 ml-2 font-mono bg-gray-800 px-2 py-0.5 rounded">LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>{demoMachines.length} machines online</span>
            </div>
            <a href="/" className="text-sm text-green-400 hover:text-green-300 transition-colors">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-[#0a0f1a]">
                <div className="text-center">
                  <Globe size={56} className="mx-auto mb-4 animate-pulse text-emerald-400" />
                  <p className="text-gray-400 text-lg">Loading 3D environment...</p>
                </div>
              </div>
            }
          >
            <TwinCanvas
              machines={demoMachines}
              telemetryData={telemetry}
              activeFlowIndex={activeFlowIndex}
              onMachineHover={handleMachineHover}
            />
          </Suspense>

          {/* Hover Tooltip with Live Video */}
          {hoveredMachine && (
            <div className="absolute top-4 right-4 w-80 bg-[#0d1321]/95 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-2xl pointer-events-none z-10">
              {/* Machine Live Video */}
              <div className="w-full h-40 bg-gray-900 relative overflow-hidden">
                <video
                  src={hoveredMachine.flowStep.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-white font-mono">LIVE FEED</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0d1321] to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm">{hoveredMachine.machine.name}</h3>
                <p className="text-xs text-green-400 mb-3">{hoveredMachine.flowStep.action}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800/50 rounded p-2">
                    <span className="text-gray-500">Temp</span>
                    <p className="text-white font-mono">{hoveredMachine.telemetry.temperature.toFixed(1)}°C</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <span className="text-gray-500">RPM</span>
                    <p className="text-white font-mono">{hoveredMachine.telemetry.rpm.toFixed(0)}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <span className="text-gray-500">Efficiency</span>
                    <p className="text-white font-mono">{hoveredMachine.telemetry.efficiencyScore.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <span className="text-gray-500">Throughput</span>
                    <p className="text-white font-mono">{hoveredMachine.telemetry.throughput.toFixed(0)} kg/h</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs">
                  <p className="text-gray-400">Input: <span className="text-gray-300">{hoveredMachine.flowStep.material}</span></p>
                  <p className="text-gray-400 mt-1">Output: <span className="text-green-300">{hoveredMachine.flowStep.output}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Machine Status Bar */}
        <footer className="px-6 py-3 border-t border-gray-800 bg-[#0d1321]">
          <div className="flex gap-4 overflow-x-auto">
            {demoMachines.map((machine, index) => {
              const t = telemetry[machine.id]
              if (!t) return null
              const isActive = index === activeFlowIndex
              return (
                <div
                  key={machine.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border min-w-fit transition-all duration-500 ${
                    isActive
                      ? 'bg-green-900/20 border-green-600/40'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      t.machineState === 'warning'
                        ? 'bg-yellow-400'
                        : t.machineState === 'critical'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-green-400'
                    }`}
                  />
                  <span className="text-xs text-white font-medium">{machine.name}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {t.efficiencyScore.toFixed(0)}%
                  </span>
                  {isActive && <span className="text-xs text-green-400">●</span>}
                </div>
              )
            })}
          </div>
        </footer>
      </div>
    </div>
  )
}
