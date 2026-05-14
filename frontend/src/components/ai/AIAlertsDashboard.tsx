'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Alert, AIRecommendation } from '@/types'
import { AlertCircle, AlertTriangle, Bot, Info, Lightbulb } from '@/components/ui/icons'

export default function AIAlertsDashboard() {
  const { alerts, dismissAlert, telemetryData, machines } = useStore()
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts
    return alerts.filter(a => a.type === filter)
  }, [alerts, filter])

  // Generate AI recommendations based on telemetry
  const recommendations = useMemo((): AIRecommendation[] => {
    const recs: AIRecommendation[] = []
    
    Object.entries(telemetryData).forEach(([machineId, data]) => {
      const machine = machines.find(m => m.id === machineId)
      if (!machine) return

      // High temperature recommendation
      if (data.temperature > 90) {
        recs.push({
          id: `rec_temp_${machineId}`,
          type: 'maintenance',
          priority: data.temperature > 110 ? 'high' : 'medium',
          title: 'Cooling System Check Required',
          description: `${machine.name} is running at ${data.temperature.toFixed(1)}°C. Consider reducing load or checking cooling systems.`,
          machineId,
          estimatedImpact: 'Prevent thermal damage, extend component life by 20%',
          timestamp: Date.now(),
        })
      }

      // Low efficiency recommendation
      if (data.efficiencyScore < 70) {
        recs.push({
          id: `rec_eff_${machineId}`,
          type: 'production',
          priority: data.efficiencyScore < 50 ? 'high' : 'medium',
          title: 'Efficiency Optimization Needed',
          description: `${machine.name} efficiency at ${data.efficiencyScore.toFixed(0)}%. Calibration or maintenance may restore performance.`,
          machineId,
          estimatedImpact: 'Potential 15-30% throughput improvement',
          timestamp: Date.now(),
        })
      }

      // High energy consumption
      if (data.energyConsumption > 80) {
        recs.push({
          id: `rec_energy_${machineId}`,
          type: 'energy',
          priority: 'medium',
          title: 'Energy Optimization Available',
          description: `${machine.name} consuming ${data.energyConsumption.toFixed(1)} kW. Load balancing could reduce consumption by 10-15%.`,
          machineId,
          estimatedImpact: 'Estimated $200-500/month savings',
          timestamp: Date.now(),
        })
      }

      // High failure probability
      if (data.failureProbability > 40) {
        recs.push({
          id: `rec_fail_${machineId}`,
          type: 'maintenance',
          priority: 'high',
          title: 'Predictive Maintenance Alert',
          description: `${machine.name} failure probability at ${data.failureProbability.toFixed(0)}%. Schedule preventive maintenance within 24 hours.`,
          machineId,
          estimatedImpact: 'Avoid unplanned downtime (est. 4-8 hours)',
          timestamp: Date.now(),
        })
      }

      // Vibration anomaly
      if (data.vibration > 15) {
        recs.push({
          id: `rec_vib_${machineId}`,
          type: 'maintenance',
          priority: 'high',
          title: 'Abnormal Vibration Detected',
          description: `${machine.name} vibration at ${data.vibration.toFixed(1)} mm/s. Possible bearing wear or misalignment.`,
          machineId,
          estimatedImpact: 'Prevent catastrophic failure, save $5,000-15,000 in repairs',
          timestamp: Date.now(),
        })
      }
    })

    return recs.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 }
      return priority[a.priority] - priority[b.priority]
    })
  }, [telemetryData, machines])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Intelligence</h1>
        <p className="text-carbon-400 mt-1">Anomaly detection, predictive maintenance, and optimization recommendations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <p className="text-xs text-carbon-400">Total Alerts</p>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </div>
        <div className="industrial-card p-4 border-red-700/30">
          <p className="text-xs text-carbon-400">Critical</p>
          <p className="text-2xl font-bold text-alert-critical">
            {alerts.filter(a => a.type === 'critical').length}
          </p>
        </div>
        <div className="industrial-card p-4 border-yellow-700/30">
          <p className="text-xs text-carbon-400">Warnings</p>
          <p className="text-2xl font-bold text-alert-warning">
            {alerts.filter(a => a.type === 'warning').length}
          </p>
        </div>
        <div className="industrial-card p-4 border-blue-700/30">
          <p className="text-xs text-carbon-400">AI Recommendations</p>
          <p className="text-2xl font-bold text-alert-info">{recommendations.length}</p>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bot size={18} className="text-industrial-400" /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 6).map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-900/10 border-red-700/30' :
                  rec.priority === 'medium' ? 'bg-yellow-900/10 border-yellow-700/30' :
                  'bg-blue-900/10 border-blue-700/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        rec.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                        rec.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-carbon-700 text-carbon-300">
                        {rec.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                    <p className="text-xs text-carbon-400 mt-1">{rec.description}</p>
                    <p className="text-xs text-industrial-400 mt-2 inline-flex items-center gap-1">
                      <Lightbulb size={12} /> Impact: {rec.estimatedImpact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Filters */}
      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === f
                ? 'bg-industrial-900/50 text-industrial-400 border border-industrial-700/50'
                : 'bg-carbon-800 text-carbon-400 border border-carbon-700/50 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-2 text-xs">
                ({alerts.filter(a => a.type === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="industrial-card p-12 text-center">
            <p className="text-carbon-400">No alerts. Start a simulation to generate real-time alerts.</p>
          </div>
        ) : (
          filteredAlerts.slice(0, 50).map((alert) => {
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
              className={`industrial-card p-4 flex items-center gap-4 ${
                alert.type === 'critical' ? 'border-red-700/30' :
                alert.type === 'warning' ? 'border-yellow-700/30' :
                'border-blue-700/30'
              }`}
            >
              <AlertIcon size={18} className={tone} />
              <div className="flex-1">
                <p className="text-sm text-white">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-carbon-400">{alert.machineName}</span>
                  <span className="text-xs text-carbon-500">•</span>
                  <span className="text-xs text-carbon-400">{alert.category}</span>
                  <span className="text-xs text-carbon-500">•</span>
                  <span className="text-xs text-carbon-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="px-3 py-1 text-xs bg-carbon-700 hover:bg-carbon-600 text-carbon-300 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}
