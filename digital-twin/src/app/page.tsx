'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const TwinCanvas = dynamic(() => import('@/components/TwinCanvas3D'), { ssr: false })

// Types matching the main app
interface MachineConfig {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  parameters: Record<string, number>
  connections: string[]
}

interface TelemetryData {
  machineId: string
  timestamp: number
  temperature: number
  rpm: number
  pressure: number
  throughput: number
  energyConsumption: number
  machineState: string
  failureProbability: number
  maintenanceScore: number
  materialQuantity: number
  efficiencyScore: number
  sensorHealth: number
  vibration: number
}

interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'stopped'
  key: string | null
  startTime: number | null
  tickRate: number
}

interface FlowStep {
  machineId: string
  action: string
  material: string
  output: string
  video: string
}

interface HoveredMachine {
  machine: MachineConfig
  telemetry: TelemetryData
  flowStep: FlowStep
}

interface AppState {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
  selectedIndustry: string | null
  simulation: SimulationState
}

// Machine type to flow description mapping
function getFlowInfo(type: string): { action: string; material: string; output: string } {
  const map: Record<string, { action: string; material: string; output: string }> = {
    battery_intake_conveyor: { action: 'Receiving raw battery scrap', material: 'Mixed battery waste', output: 'Sorted scrap batches' },
    battery_sorting_machine: { action: 'Sorting by chemistry type', material: 'Li-ion, NiMH, Lead-acid', output: 'Categorized cells' },
    battery_shredder: { action: 'Mechanical shredding', material: 'Categorized cells', output: 'Shredded black mass' },
    magnetic_separator: { action: 'Magnetic separation', material: 'Shredded black mass', output: 'Ferrous / Non-ferrous split' },
    heated_chemical_tank: { action: 'Chemical leaching', material: 'Non-ferrous material', output: 'Metal-rich solution' },
    filter_press: { action: 'Pressure filtration', material: 'Metal-rich solution', output: 'Filtered concentrate' },
    drying_unit: { action: 'Thermal drying', material: 'Filtered material', output: 'Recovered metals (Co, Li, Ni)' },
    waste_gas_filter: { action: 'Gas filtration', material: 'Exhaust gases', output: 'Clean air output' },
    material_storage_tank: { action: 'Material storage', material: 'Processed materials', output: 'Stored product' },
    final_packaging_unit: { action: 'Final packaging', material: 'Recovered metals', output: 'Packaged product' },
    fabric_cutting_machine: { action: 'Fabric cutting', material: 'Raw fabric rolls', output: 'Cut fabric pieces' },
    textile_dyeing_machine: { action: 'Textile dyeing', material: 'Cut fabric', output: 'Dyed fabric' },
    heat_press_machine: { action: 'Heat pressing', material: 'Dyed fabric', output: 'Pressed fabric' },
    industrial_sewing_machine: { action: 'Industrial sewing', material: 'Pressed fabric', output: 'Sewn garments' },
    fabric_conveyor: { action: 'Fabric transport', material: 'In-process fabric', output: 'Transported material' },
    steam_boiler: { action: 'Steam generation', material: 'Water + fuel', output: 'Steam supply' },
    washing_unit: { action: 'Fabric washing', material: 'Sewn garments', output: 'Washed garments' },
    drying_machine: { action: 'Garment drying', material: 'Washed garments', output: 'Dried garments' },
    packaging_unit: { action: 'Packaging', material: 'Finished garments', output: 'Packaged product' },
    quality_inspection: { action: 'Quality inspection', material: 'Finished product', output: 'QC-passed product' },
  }
  return map[type] || { action: 'Processing', material: 'Input material', output: 'Processed output' }
}

const stockVideos = [
  'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/3191584/3191584-uhd_2560_1440_30fps.mp4',
]

async function fetchStateFromMainApp(): Promise<AppState> {
  try {
    const res = await fetch('http://localhost:3000/api/state')
    if (res.ok) {
      const data = await res.json()
      return {
        machines: data.machines || [],
        telemetryData: data.telemetryData || {},
        selectedIndustry: data.selectedIndustry || null,
        simulation: data.simulation || { status: 'idle', key: null, startTime: null, tickRate: 1000 },
      }
    }
  } catch {
    // Main app might not be running
  }
  return {
    machines: [],
    telemetryData: {},
    selectedIndustry: null,
    simulation: { status: 'idle', key: null, startTime: null, tickRate: 1000 },
  }
}

export default function DigitalTwinPage() {
  const [mounted, setMounted] = useState(false)
  const [machines, setMachines] = useState<MachineConfig[]>([])
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryData>>({})
  const [hoveredMachine, setHoveredMachine] = useState<HoveredMachine | null>(null)
  const [activeFlowIndex, setActiveFlowIndex] = useState(0)
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([])
  const [industry, setIndustry] = useState<string | null>(null)
  const [simulationStatus, setSimulationStatus] = useState<string>('idle')
  const [remoteSimKey, setRemoteSimKey] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState(false)

  // Connection state - user must enter the key to connect
  const [connected, setConnected] = useState(false)
  const [inputKey, setInputKey] = useState('')
  const [keyError, setKeyError] = useState('')

  // Load from main app API on mount and poll for changes
  useEffect(() => {
    async function loadState() {
      const state = await fetchStateFromMainApp()

      if (state.machines.length === 0 && state.simulation.status === 'idle') {
        try {
          const res = await fetch('http://localhost:3000/api/state')
          if (!res.ok) setConnectionError(true)
          else setConnectionError(false)
        } catch {
          setConnectionError(true)
        }
      } else {
        setConnectionError(false)
      }

      setMachines(state.machines)
      setIndustry(state.selectedIndustry)
      setSimulationStatus(state.simulation.status)
      setRemoteSimKey(state.simulation.key)

      // Build flow steps from actual machines
      const steps: FlowStep[] = state.machines.map((m, i) => {
        const info = getFlowInfo(m.type)
        return {
          machineId: m.id,
          action: info.action,
          material: info.material,
          output: info.output,
          video: stockVideos[i % stockVideos.length],
        }
      })
      setFlowSteps(steps)

      // Only use live telemetry when connected and simulation is running
      if (state.simulation.status === 'running' && Object.keys(state.telemetryData).length > 0) {
        setTelemetry(state.telemetryData)
      }

      // If simulation stopped while we're connected, disconnect
      if (state.simulation.status !== 'running' && connected) {
        setConnected(false)
      }
    }

    loadState()
    setMounted(true)

    const pollInterval = setInterval(loadState, 1500)
    return () => clearInterval(pollInterval)
  }, [connected])

  // Animate flow index only when connected and simulation is running
  useEffect(() => {
    if (machines.length === 0 || !connected || simulationStatus !== 'running') return
    const interval = setInterval(() => {
      setActiveFlowIndex((prev) => (prev + 1) % machines.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [machines.length, simulationStatus, connected])

  const handleConnect = () => {
    const keyToCheck = inputKey.trim()
    if (!keyToCheck) {
      setKeyError('Please enter a simulation key')
      return
    }
    if (keyToCheck !== remoteSimKey) {
      setKeyError('Invalid key. The key does not match the running simulation.')
      return
    }
    if (simulationStatus !== 'running') {
      setKeyError('Simulation is not running. Start it from the main dashboard first.')
      return
    }
    setKeyError('')
    setConnected(true)
  }

  const handleDisconnect = () => {
    setConnected(false)
    setInputKey('')
  }

  const handleMachineHover = useCallback((machineId: string | null) => {
    if (!machineId) {
      setHoveredMachine(null)
      return
    }
    const machine = machines.find(m => m.id === machineId)
    const t = telemetry[machineId]
    const flow = flowSteps.find(f => f.machineId === machineId)
    if (machine && t && flow) {
      setHoveredMachine({ machine, telemetry: t, flowStep: flow })
    }
  }, [telemetry, machines, flowSteps])

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌐</div>
          <p className="text-gray-400 text-lg">Connecting to main dashboard...</p>
        </div>
      </div>
    )
  }

  // Connection error state
  if (connectionError) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔌</div>
          <h1 className="text-2xl font-bold text-white mb-3">Cannot Connect to Dashboard</h1>
          <p className="text-gray-400 mb-6">
            The main dashboard (localhost:3000) is not reachable. Make sure it is running.
          </p>
          <p className="text-xs text-gray-600 mt-4 animate-pulse">Retrying automatically...</p>
        </div>
      </div>
    )
  }

  // Not connected - show the key entry screen
  if (!connected) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="w-full max-w-lg p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🌐</div>
            <h1 className="text-3xl font-bold text-white mb-2">Digital Twin</h1>
            <p className="text-gray-400">Connect to a running simulation to view the factory floor</p>
          </div>

          <div className="bg-[#0d1321] border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Connect to Simulation</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Simulation Key</label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => { setInputKey(e.target.value); setKeyError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="e.g. SIM-TEXT-37031-S96"
                  className="w-full bg-[#0a0f1a] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono placeholder:text-gray-600 focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {keyError && (
                <p className="text-red-400 text-xs">{keyError}</p>
              )}

              <button
                onClick={handleConnect}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
              >
                Connect
              </button>
            </div>

            {/* Status info */}
            <div className="mt-6 pt-4 border-t border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Dashboard</span>
                <span className="text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Machines</span>
                <span className="text-gray-300">{machines.length} configured</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Simulation</span>
                <span className={simulationStatus === 'running' ? 'text-green-400' : 'text-yellow-400'}>
                  {simulationStatus === 'running' ? '● Running' : simulationStatus === 'idle' ? '○ Idle' : '◻ Stopped'}
                </span>
              </div>
              {remoteSimKey && simulationStatus === 'running' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Active Key</span>
                  <span className="text-gray-400 font-mono">{remoteSimKey}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            Get the simulation key from the Simulation page in the{' '}
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
              main dashboard
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Connected and simulation running - show the full 3D Digital Twin
  return (
    <div className="h-screen w-screen bg-[#0a0f1a] flex overflow-hidden">
      {/* Left Sidebar - Flow Info */}
      <aside className="w-80 bg-[#0d1321] border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Scrap Flow Pipeline</h2>
          <p className="text-xs text-gray-500 mt-1">
            {industry === 'battery_recycling' ? 'Battery recycling' : industry === 'apparel_textile' ? 'Apparel & Textile' : 'Industrial'} process
          </p>
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
                    <span className="text-xs font-semibold text-white">{machines[index]?.name}</span>
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
              <p className="text-sm font-mono text-green-400">{machines.length}/{machines.length}</p>
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
            <span className="text-xs text-green-400 ml-2 font-mono bg-green-900/30 border border-green-700/50 px-2 py-0.5 rounded">RUNNING</span>
          </div>
          <div className="flex items-center gap-4">
            {remoteSimKey && (
              <span className="text-xs text-gray-500 font-mono">{remoteSimKey}</span>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>{machines.length} machines</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </header>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-[#0a0f1a]">
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-pulse">🌐</div>
                  <p className="text-gray-400 text-lg">Loading 3D environment...</p>
                </div>
              </div>
            }
          >
            <TwinCanvas
              machines={machines}
              telemetryData={telemetry}
              activeFlowIndex={activeFlowIndex}
              onMachineHover={handleMachineHover}
            />
          </Suspense>

          {/* Hover Tooltip with Live Video */}
          {hoveredMachine && (
            <div className="absolute top-4 right-4 w-80 bg-[#0d1321]/95 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-2xl pointer-events-none z-10">
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
            {machines.map((machine, index) => {
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
