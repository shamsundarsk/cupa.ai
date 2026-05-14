'use client'

import { ViewType } from '@/app/page'
import { useStore } from '@/store/useStore'
import {
  Activity,
  ArrowRight,
  Bot,
  Cog,
  Factory,
  Gauge,
  Globe,
  Hexagon,
  LayoutDashboard,
  Play,
  Settings,
  type LucideIcon,
} from '@/components/ui/icons'

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
}

const navItems: { id: ViewType; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'industry', label: 'Industry Setup', icon: Factory },
  { id: 'machines', label: 'Machines', icon: Cog },
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'telemetry', label: 'Telemetry', icon: Activity },
  { id: 'twin', label: 'Digital Twin', icon: Globe },
  { id: 'alerts', label: 'AI Alerts', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { simulation, alerts } = useStore()
  const criticalAlerts = alerts.filter((a) => a.type === 'critical' && !a.acknowledged).length

  return (
    <aside className="w-64 bg-carbon-900/50 border-r border-carbon-700/50 flex flex-col h-full">
      <div className="p-6 border-b border-carbon-700/50">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Hexagon size={22} className="text-industrial-400" />
          <span>
            Porygon<span className="text-industrial-400"> OS</span>
          </span>
        </h1>
        <p className="text-xs text-carbon-400 mt-1">Industrial Intelligence Platform</p>
      </div>

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

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          if (item.id === 'twin') {
            return (
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
                <Icon size={18} />
                <span>{item.label}</span>
                <ArrowRight size={12} className="ml-auto text-carbon-500" />
              </a>
            )
          }
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-industrial-900/40 text-industrial-400 border border-industrial-700/50'
                  : 'text-carbon-300 hover:bg-carbon-800/50 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'alerts' && criticalAlerts > 0 && (
                <span className="ml-auto bg-alert-critical text-white text-xs px-2 py-0.5 rounded-full">
                  {criticalAlerts}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-carbon-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-industrial-900/50 flex items-center justify-center text-industrial-400 text-sm font-semibold">
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
