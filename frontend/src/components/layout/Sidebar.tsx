'use client'

import { ViewType } from '@/app/page'
import { useStore } from '@/store/useStore'

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
}

const navItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'industry', label: 'Industry Setup', icon: '🏭' },
  { id: 'machines', label: 'Machines', icon: '⚙️' },
  { id: 'simulation', label: 'Simulation', icon: '▶️' },
  { id: 'telemetry', label: 'Telemetry', icon: '📡' },
  { id: 'twin', label: 'Digital Twin', icon: '🌐' },
  { id: 'alerts', label: 'AI Alerts', icon: '🤖' },
  { id: 'settings', label: 'Settings', icon: '⚡' },
]

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { simulation, alerts } = useStore()
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length

  return (
    <aside className="w-64 bg-carbon-900/50 border-r border-carbon-700/50 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-carbon-700/50">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">⬡</span>
          <span>
            Porygon<span className="text-industrial-400"> OS</span>
          </span>
        </h1>
        <p className="text-xs text-carbon-400 mt-1">Industrial Intelligence Platform</p>
      </div>

      {/* Simulation Status */}
      {simulation.status === 'running' && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-industrial-900/30 border border-industrial-700/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-industrial-400 animate-pulse" />
            <span className="text-xs text-industrial-400 font-medium">Simulation Active</span>
          </div>
          {simulation.key && (
            <p className="text-xs text-carbon-400 mt-1 font-mono">{simulation.key}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          item.id === 'twin' ? (
            <a
              key={item.id}
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-industrial-900/40 text-industrial-400 border border-industrial-700/50'
                  : 'text-carbon-300 hover:bg-carbon-800/50 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              <span className="ml-auto text-xs text-carbon-500">↗</span>
            </a>
          ) : (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-industrial-900/40 text-industrial-400 border border-industrial-700/50'
                  : 'text-carbon-300 hover:bg-carbon-800/50 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'alerts' && criticalAlerts > 0 && (
                <span className="ml-auto bg-alert-critical text-white text-xs px-2 py-0.5 rounded-full">
                  {criticalAlerts}
                </span>
              )}
            </button>
          )
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-carbon-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-industrial-900/50 flex items-center justify-center text-industrial-400 text-sm">
            A
          </div>
          <div>
            <p className="text-sm text-white">Admin</p>
            <p className="text-xs text-carbon-400">Factory Owner</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
