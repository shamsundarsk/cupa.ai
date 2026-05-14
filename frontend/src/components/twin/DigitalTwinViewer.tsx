'use client'

import { useState, Suspense } from 'react'
import { useStore } from '@/store/useStore'
import dynamic from 'next/dynamic'
import { Globe } from '@/components/ui/icons'

const TwinCanvas = dynamic(() => import('./TwinCanvas'), { ssr: false })

export default function DigitalTwinViewer() {
  const { simulation, simulationKey, setSimulationKey, machines, telemetryData } = useStore()
  const [inputKey, setInputKey] = useState('')
  const [connected, setConnected] = useState(false)

  const handleConnect = () => {
    if (inputKey || simulation.key) {
      setSimulationKey(inputKey || simulation.key || '')
      setConnected(true)
    }
  }

  const isLive = simulation.status === 'running'

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Digital Twin</h1>
          <p className="text-carbon-400 mt-1">3D factory visualization with real-time synchronization</p>
        </div>
        {connected && isLive && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-industrial-900/30 border border-industrial-700/50">
            <span className="w-2 h-2 rounded-full bg-industrial-400 animate-pulse" />
            <span className="text-sm text-industrial-400">Synced</span>
          </div>
        )}
      </div>

      {/* Connection Panel */}
      {!connected && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Connect to Simulation</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder={simulation.key || 'Enter simulation key (e.g., SIM-BATT-82912-X92)'}
              className="flex-1 bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-3 text-white font-mono placeholder:text-carbon-500 focus:border-industrial-500 focus:outline-none"
            />
            <button
              onClick={handleConnect}
              disabled={!inputKey && !simulation.key}
              className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium"
            >
              Connect
            </button>
          </div>
          {simulation.key && (
            <p className="text-xs text-carbon-400 mt-2">
              Active simulation detected: <span className="text-industrial-400 font-mono">{simulation.key}</span>
            </p>
          )}
        </div>
      )}

      {/* 3D Viewer */}
      {connected && (
        <div className="industrial-card overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Globe size={36} className="text-industrial-400 mx-auto mb-4 animate-pulse" />
                <p className="text-carbon-400">Loading 3D environment...</p>
              </div>
            </div>
          }>
            <TwinCanvas machines={machines} telemetryData={telemetryData} />
          </Suspense>
        </div>
      )}

      {/* Machine Legend */}
      {connected && machines.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {machines.map((machine) => {
            const t = telemetryData[machine.id]
            return (
              <div key={machine.id} className="industrial-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    !t ? 'bg-carbon-600' :
                    t.machineState === 'critical' ? 'bg-alert-critical animate-pulse' :
                    t.machineState === 'warning' ? 'bg-alert-warning' :
                    'bg-industrial-400'
                  }`} />
                  <span className="text-xs text-white truncate">{machine.name}</span>
                </div>
                {t && (
                  <p className="text-xs font-mono text-carbon-400">
                    {t.efficiencyScore.toFixed(0)}% eff · {t.temperature.toFixed(0)}°C
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
