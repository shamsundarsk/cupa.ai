'use client'

import { useStore } from '@/store/useStore'
import { ViewType } from '@/app/page'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Cog,
  Factory,
  Globe,
  Info,
  PieChart,
  Play,
  Rocket,
  type LucideIcon,
} from '@/components/ui/icons'

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { machines, simulation, alerts, telemetryData } = useStore()

  const activeMachines = machines.length
  const runningSimulation = simulation.status === 'running'
  const criticalAlerts = alerts.filter((a) => a.type === 'critical').length
  const avgEfficiency = Object.values(telemetryData).length > 0
    ? Math.round(
        Object.values(telemetryData).reduce((sum, t) => sum + t.efficiencyScore, 0) /
          Object.values(telemetryData).length
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Factory Dashboard</h1>
          <p className="text-carbon-400 mt-1">Porygon Industrial OS — real-time factory intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {runningSimulation && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-industrial-900/30 border border-industrial-700/50">
              <span className="w-2 h-2 rounded-full bg-industrial-400 animate-pulse" />
              <span className="text-sm text-industrial-400">Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Machines"
          value={activeMachines.toString()}
          subtitle="Configured"
          Icon={Cog}
          tone="industrial"
        />
        <StatCard
          title="Simulation"
          value={runningSimulation ? 'Running' : 'Idle'}
          subtitle={simulation.key || 'No active simulation'}
          Icon={Play}
          tone={runningSimulation ? 'green' : 'gray'}
        />
        <StatCard
          title="Alerts"
          value={criticalAlerts.toString()}
          subtitle="Critical issues"
          Icon={AlertTriangle}
          tone={criticalAlerts > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Efficiency"
          value={`${avgEfficiency}%`}
          subtitle="Average plant efficiency"
          Icon={PieChart}
          tone="industrial"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="New Factory Setup"
          description="Choose industry, select machines, configure parameters"
          Icon={Factory}
          onClick={() => onNavigate('industry')}
        />
        <QuickAction
          title="Launch Simulation"
          description="Start real-time industrial simulation engine"
          Icon={Rocket}
          onClick={() => onNavigate('simulation')}
        />
        <QuickAction
          title="Digital Twin"
          description="View 3D factory visualization with live data"
          Icon={Globe}
          onClick={() => onNavigate('twin')}
        />
      </div>

      {alerts.length > 0 && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const AlertIcon =
                alert.type === 'critical'
                  ? AlertCircle
                  : alert.type === 'warning'
                  ? AlertTriangle
                  : Info
              const tone =
                alert.type === 'critical'
                  ? 'text-alert-critical'
                  : alert.type === 'warning'
                  ? 'text-alert-warning'
                  : 'text-alert-info'
              return (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    alert.type === 'critical'
                      ? 'bg-red-900/20 border-red-700/50'
                      : alert.type === 'warning'
                      ? 'bg-yellow-900/20 border-yellow-700/50'
                      : 'bg-blue-900/20 border-blue-700/50'
                  }`}
                >
                  <AlertIcon size={18} className={tone} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{alert.message}</p>
                    <p className="text-xs text-carbon-400">
                      {alert.machineName} — {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {machines.length === 0 && (
        <div className="industrial-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-industrial-900/40 border border-industrial-700/40 text-industrial-400 mb-4">
            <Factory size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to Porygon Industrial OS</h3>
          <p className="text-carbon-400 mb-6 max-w-md mx-auto">
            Get started by selecting an industry and configuring your factory machines.
            The simulation engine will generate real-time telemetry and AI-powered insights.
          </p>
          <button
            onClick={() => onNavigate('industry')}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            Start Factory Setup
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  Icon,
  tone,
}: {
  title: string
  value: string
  subtitle: string
  Icon: LucideIcon
  tone: string
}) {
  const toneClasses =
    {
      industrial: 'border-industrial-700/50 bg-industrial-900/20 text-industrial-400',
      green: 'border-green-700/50 bg-green-900/20 text-green-400',
      red: 'border-red-700/50 bg-red-900/20 text-red-400',
      gray: 'border-carbon-700/50 bg-carbon-800/50 text-carbon-300',
    }[tone] || 'border-carbon-700/50 bg-carbon-800/50 text-carbon-300'

  return (
    <div className={`industrial-card p-5 ${toneClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} />
        <span className="text-xs text-carbon-400 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-carbon-400 mt-1">{subtitle}</p>
    </div>
  )
}

function QuickAction({
  title,
  description,
  Icon,
  onClick,
}: {
  title: string
  description: string
  Icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="industrial-card p-6 text-left hover:border-industrial-500/50 transition-all duration-300 group"
    >
      <div className="w-11 h-11 rounded-lg bg-industrial-900/30 border border-industrial-700/40 flex items-center justify-center text-industrial-400">
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-industrial-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-carbon-400 mt-1">{description}</p>
    </button>
  )
}
