'use client'

import { useStore } from '@/store/useStore'
import { ViewType } from '@/app/page'

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { machines, simulation, alerts, telemetryData } = useStore()

  const activeMachines = machines.length
  const runningSimulation = simulation.status === 'running'
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length
  const avgEfficiency = Object.values(telemetryData).length > 0
    ? Math.round(Object.values(telemetryData).reduce((sum, t) => sum + t.efficiencyScore, 0) / Object.values(telemetryData).length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Factory Dashboard</h1>
          <p className="text-carbon-400 mt-1">Porygon Industrial OS — Real-time factory intelligence</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Machines"
          value={activeMachines.toString()}
          subtitle="Configured"
          icon="⚙️"
          color="industrial"
        />
        <StatCard
          title="Simulation"
          value={runningSimulation ? 'Running' : 'Idle'}
          subtitle={simulation.key || 'No active simulation'}
          icon="▶️"
          color={runningSimulation ? 'green' : 'gray'}
        />
        <StatCard
          title="Alerts"
          value={criticalAlerts.toString()}
          subtitle="Critical issues"
          icon="⚠️"
          color={criticalAlerts > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Efficiency"
          value={`${avgEfficiency}%`}
          subtitle="Average plant efficiency"
          icon="📈"
          color="industrial"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="New Factory Setup"
          description="Choose industry, select machines, configure parameters"
          icon="🏭"
          onClick={() => onNavigate('industry')}
        />
        <QuickAction
          title="Launch Simulation"
          description="Start real-time industrial simulation engine"
          icon="🚀"
          onClick={() => onNavigate('simulation')}
        />
        <QuickAction
          title="Digital Twin"
          description="View 3D factory visualization with live data"
          icon="🌐"
          onClick={() => onNavigate('twin')}
        />
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
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
                <span className={`text-lg ${
                  alert.type === 'critical' ? 'text-alert-critical' :
                  alert.type === 'warning' ? 'text-alert-warning' : 'text-alert-info'
                }`}>
                  {alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white">{alert.message}</p>
                  <p className="text-xs text-carbon-400">{alert.machineName} — {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {machines.length === 0 && (
        <div className="industrial-card p-12 text-center">
          <div className="text-6xl mb-4">🏭</div>
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to Porygon Industrial OS</h3>
          <p className="text-carbon-400 mb-6 max-w-md mx-auto">
            Get started by selecting your industry and configuring your factory machines.
            The simulation engine will generate real-time telemetry and AI-powered insights.
          </p>
          <button
            onClick={() => onNavigate('industry')}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 text-white rounded-lg transition-colors font-medium"
          >
            Start Factory Setup →
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string
  subtitle: string
  icon: string
  color: string
}) {
  const colorClasses = {
    industrial: 'border-industrial-700/50 bg-industrial-900/20',
    green: 'border-green-700/50 bg-green-900/20',
    red: 'border-red-700/50 bg-red-900/20',
    gray: 'border-carbon-700/50 bg-carbon-800/50',
  }[color] || 'border-carbon-700/50 bg-carbon-800/50'

  return (
    <div className={`industrial-card p-5 ${colorClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-carbon-400 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-carbon-400 mt-1">{subtitle}</p>
    </div>
  )
}

function QuickAction({ title, description, icon, onClick }: {
  title: string
  description: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="industrial-card p-6 text-left hover:border-industrial-500/50 transition-all duration-300 group"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-industrial-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-carbon-400 mt-1">{description}</p>
    </button>
  )
}
