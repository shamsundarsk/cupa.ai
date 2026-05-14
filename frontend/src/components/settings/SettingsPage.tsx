'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'

export default function SettingsPage() {
  const { simulation } = useStore()
  const [mqttHost, setMqttHost] = useState('localhost')
  const [mqttPort, setMqttPort] = useState('1883')
  const [opcuaEndpoint, setOpcuaEndpoint] = useState('opc.tcp://localhost:4840')
  const [wsEndpoint, setWsEndpoint] = useState('ws://localhost:8000/ws')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-carbon-400 mt-1">Platform configuration and protocol settings</p>
      </div>

      {/* MQTT Configuration */}
      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">MQTT Broker</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-carbon-400 block mb-1">Host</label>
              <input
                type="text"
                value={mqttHost}
                onChange={(e) => setMqttHost(e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-industrial-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-carbon-400 block mb-1">Port</label>
              <input
                type="text"
                value={mqttPort}
                onChange={(e) => setMqttPort(e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-industrial-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-carbon-500">
              MQTT Topics: <code className="text-industrial-400">factory/[industry]/[machine]/[metric]</code>
            </p>
            <p className="text-xs text-carbon-500 mt-1">
              Example: <code className="text-carbon-300">factory/battery/shredder01/temp</code>
            </p>
          </div>
        </div>
      </div>

      {/* OPC UA Configuration */}
      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">OPC UA Server</h3>
        <div>
          <label className="text-sm text-carbon-400 block mb-1">Endpoint</label>
          <input
            type="text"
            value={opcuaEndpoint}
            onChange={(e) => setOpcuaEndpoint(e.target.value)}
            className="w-full bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-industrial-500 focus:outline-none"
          />
        </div>
        <p className="text-xs text-carbon-500 mt-2">
          Exposes machine tags, sensor values, and industrial endpoints via OPC UA protocol
        </p>
      </div>

      {/* WebSocket Configuration */}
      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">WebSocket Stream</h3>
        <div>
          <label className="text-sm text-carbon-400 block mb-1">Endpoint</label>
          <input
            type="text"
            value={wsEndpoint}
            onChange={(e) => setWsEndpoint(e.target.value)}
            className="w-full bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-industrial-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Simulation Info */}
      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Simulation</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-carbon-400">Status</span>
            <span className={`text-sm font-medium ${
              simulation.status === 'running' ? 'text-industrial-400' : 'text-carbon-500'
            }`}>
              {simulation.status}
            </span>
          </div>
          {simulation.key && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-carbon-400">Simulation Key</span>
              <span className="text-sm font-mono text-industrial-400">{simulation.key}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-carbon-400">Tick Rate</span>
            <span className="text-sm text-carbon-300">{simulation.tickRate}ms</span>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Platform</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-carbon-400">Version</span>
            <span className="text-carbon-300">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-carbon-400">Platform</span>
            <span className="text-carbon-300">Porygon Industrial OS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-carbon-400">Frontend</span>
            <span className="text-carbon-300">Next.js 14 + React Three Fiber</span>
          </div>
          <div className="flex justify-between">
            <span className="text-carbon-400">Backend</span>
            <span className="text-carbon-300">FastAPI + WebSockets</span>
          </div>
        </div>
      </div>
    </div>
  )
}
