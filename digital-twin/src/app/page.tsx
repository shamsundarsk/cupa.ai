'use client'

import { useEffect, useState } from 'react'
import { GlobeIcon, PlugZapIcon } from '@/components/icons'
import { Shell, TopBar } from '@/components/Shell'
import StoryOverlay from '@/components/StoryOverlay'
import { useTwinState } from '@/lib/useTwinState'
import { ViewKey } from '@/lib/types'

import Overview from '@/components/views/Overview'
import PlantTwin from '@/components/views/PlantTwin'
import Safety, { HazardLogEntry } from '@/components/views/Safety'
import Simulation from '@/components/views/Simulation'
import Optimize from '@/components/views/Optimize'
import ShiftHistory from '@/components/views/ShiftHistory'
import Revenue from '@/components/views/Revenue'
import RoiCalculator from '@/components/views/RoiCalculator'
import Esg from '@/components/views/Esg'
import StoryMode from '@/components/views/StoryMode'
import Reports from '@/components/views/Reports'

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000'

export default function DigitalTwinPage() {
  const { state, connectionError, derived, kpiHistory } = useTwinState(1500)
  const [connected, setConnected] = useState(false)
  const [inputKey, setInputKey] = useState('')
  const [keyError, setKeyError] = useState('')
  const [view, setView] = useState<ViewKey>('overview')
  const [hazardLog, setHazardLog] = useState<HazardLogEntry[]>([])

  const status = state.simulation.status

  // Auto-disconnect when sim stops (effect, not during render)
  useEffect(() => {
    if (connected && status !== 'running') {
      setConnected(false)
    }
  }, [connected, status])

  if (connectionError) {
    return (
      <div className="h-screen w-screen bg-carbon-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <PlugZapIcon className="mx-auto mb-6 text-accent-rose" size={64} />
          <h1 className="text-2xl font-bold text-white mb-3">Cannot Connect to Dashboard</h1>
          <p className="text-carbon-400 mb-6">
            The main dashboard is not reachable. Make sure it is running.
          </p>
          <p className="text-xs text-carbon-500 animate-pulse">Retrying automatically...</p>
        </div>
      </div>
    )
  }

  if (!connected) {
    const handleConnect = () => {
      const k = inputKey.trim()
      if (!k) {
        setKeyError('Please enter a simulation key')
        return
      }
      if (k !== state.simulation.key) {
        setKeyError('Invalid key. The key does not match the running simulation.')
        return
      }
      if (status !== 'running') {
        setKeyError('Simulation is not running. Start it from the main dashboard first.')
        return
      }
      setKeyError('')
      setConnected(true)
      setView('overview')
    }

    return (
      <div className="min-h-screen bg-carbon-950 flex items-center justify-center bg-grid p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <GlobeIcon size={56} className="mx-auto mb-4 text-industrial-400" />
            <h1 className="text-3xl font-bold text-white mb-1">Digital Twin</h1>
            <p className="text-carbon-400 text-sm">Connect to a running simulation to view the live plant</p>
          </div>

          <div className="industrial-card p-6">
            <h3 className="text-white font-semibold mb-4">Connect to Simulation</h3>
            <label className="text-[11px] text-carbon-400 block mb-1.5">Simulation Key</label>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value)
                setKeyError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="e.g. SIM-TEXT-37031-S96"
              className="w-full bg-carbon-900/60 border border-carbon-700 rounded-md px-4 py-3 text-white font-mono placeholder:text-carbon-600 focus:border-industrial-500 focus:outline-none transition-colors"
            />
            {keyError && <p className="text-accent-rose text-xs mt-2">{keyError}</p>}

            <button
              onClick={handleConnect}
              className="mt-4 w-full px-6 py-3 bg-industrial-600 hover:bg-industrial-500 text-white rounded-md transition-colors font-medium"
            >
              Connect
            </button>

            <div className="mt-6 pt-4 border-t border-carbon-700/40 space-y-1.5 text-xs">
              <Row label="Dashboard" value={<span className="inline-flex items-center gap-1.5 text-industrial-400"><span className="w-1.5 h-1.5 rounded-full bg-industrial-400" />Connected</span>} />
              <Row label="Machines" value={`${state.machines.length} configured`} />
              <Row label="Simulation" value={
                <span className={status === 'running' ? 'text-industrial-400' : 'text-accent-amber'}>
                  {status === 'running' ? '● Running' : status === 'idle' ? '○ Idle' : '◻ Stopped'}
                </span>
              } />
              {state.simulation.key && status === 'running' && (
                <Row label="Active Key" value={<span className="font-mono">{state.simulation.key}</span>} />
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-carbon-500 mt-4">
            Get the simulation key from the Simulation page in the{' '}
            <a href={MAIN_APP_URL} target="_blank" rel="noopener noreferrer" className="text-industrial-400 hover:text-industrial-300">main dashboard</a>.
          </p>
        </div>
      </div>
    )
  }

  const onInjectHazard = async () => {
    const target = state.machines[Math.floor(Math.random() * Math.max(1, state.machines.length))]
    setHazardLog((prev) => [
      ...prev,
      {
        ts: Date.now(),
        machineName: target?.name ?? 'Unknown',
        message: `Manually injected hazard${target ? `: thermal anomaly at ${target.name}` : ''}`,
      },
    ])
    // Trigger a real action on the running plant via the cross-app endpoint.
    try {
      await fetch('/api/twin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inject_hazard', payload: target ? { machineId: target.id } : undefined }),
      })
    } catch {
      // network failures are non-fatal for the local UI
    }
  }

  const Body = (() => {
    switch (view) {
      case 'overview':
        return <Overview state={state} derived={derived} kpiHistory={kpiHistory} />
      case 'plant_twin':
        return <PlantTwin state={state} industry={state.selectedIndustry} />
      case 'safety':
        return <Safety state={state} derived={derived} kpiHistory={kpiHistory} hazardLog={hazardLog} />
      case 'simulation':
        return <Simulation state={state} derived={derived} kpiHistory={kpiHistory} />
      case 'optimize':
        return <Optimize state={state} derived={derived} />
      case 'shifts':
        return <ShiftHistory derived={derived} kpiHistory={kpiHistory} shiftHistory={[]} />
      case 'revenue':
        return <Revenue state={state} derived={derived} kpiHistory={kpiHistory} />
      case 'roi':
        return <RoiCalculator />
      case 'esg':
        return <Esg state={state} derived={derived} />
      case 'story':
        return <StoryMode onNavigate={setView} />
      case 'reports':
        return <Reports state={state} derived={derived} />
    }
  })()

  return (
    <>
      <Shell
        current={view}
        onNavigate={setView}
        onDisconnect={() => setConnected(false)}
        status={status === 'running' ? 'running' : status === 'paused' ? 'paused' : 'idle'}
        riskScore={derived.riskScore}
        topBar={
          <TopBar
            shiftElapsedMs={derived.shiftElapsedMs}
            itemsProcessing={derived.itemsProcessing}
            cumulativeRevenue={derived.cumulativeRevenue}
            riskScore={derived.riskScore}
            ticks={derived.ticks}
            status={status === 'running' ? 'running' : 'idle'}
            onInjectHazard={onInjectHazard}
          />
        }
      >
        {Body}
      </Shell>
      <StoryOverlay
        derived={derived}
        onNavigate={setView}
        alertsCount={derived.criticals + derived.warnings}
      />
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-carbon-500">{label}</span>
      <span className="text-carbon-300">{value}</span>
    </div>
  )
}
