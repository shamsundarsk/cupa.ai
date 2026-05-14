'use client'

import { AppState, KpiSnapshot } from '@/lib/types'
import { DerivedKpis } from '@/lib/useTwinState'
import { LineChart } from '../charts'
import { ActivityIcon, AlertIcon, FlameIcon, ShieldIcon, ThermoIcon, WindIcon, ZapIcon } from '../icons'

interface Props {
  state: AppState
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
  hazardLog: HazardLogEntry[]
}

export interface HazardLogEntry {
  ts: number
  machineName: string
  message: string
}

const SIGNALS = [
  { Icon: ThermoIcon, name: 'Temperature', desc: 'Battery cell temperature rising above 70°C', threshold: 'Critical at 85°C', color: '#ef4444' },
  { Icon: WindIcon, name: 'Gas Levels', desc: 'Toxic gas emissions from battery electrolyte', threshold: 'Alert at 30 ppm', color: '#f59e0b' },
  { Icon: ZapIcon, name: 'Voltage Anomaly', desc: 'Sudden voltage drops indicate cell failure', threshold: 'Below 2.5V', color: '#a78bfa' },
  { Icon: ActivityIcon, name: 'Vibration', desc: 'Abnormal machine vibration patterns', threshold: 'Above 10 Hz', color: '#22d3ee' },
]

export default function Safety({ state, derived, kpiHistory, hazardLog }: Props) {
  const riskSeries = kpiHistory.map((k) => k.risk)
  const tone = derived.riskScore < 25 ? 'safe' : derived.riskScore < 60 ? 'warn' : 'danger'

  const monitored = state.machines.map((m) => {
    const t = state.telemetryData[m.id]
    return {
      name: m.name,
      temp: t?.temperature ?? 25,
      vibration: t?.vibration ?? 0,
      failure: t?.failureProbability ?? 0,
      machineState: t?.machineState ?? 'idle',
    }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Safety &amp; Hazard Monitoring</h1>
        <p className="text-sm text-carbon-400 mt-0.5">AI-powered thermal runaway prediction and safety alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Plant Risk Score" big={derived.riskScore.toString()} sub={tone === 'safe' ? 'LOW — Normal operations' : tone === 'warn' ? 'MEDIUM — Monitor closely' : 'HIGH — Take action'} tone={tone} />
        <Card title="Active Alerts" big={(derived.criticals + derived.warnings).toString()} sub={derived.criticals + derived.warnings === 0 ? 'No active threats' : `${derived.criticals} critical, ${derived.warnings} warning`} tone={derived.criticals + derived.warnings === 0 ? 'safe' : derived.criticals > 0 ? 'danger' : 'warn'} />
        <Card title="At-Risk Batteries" big={derived.hazardEvents.toString()} sub={derived.hazardEvents > 0 ? 'Elevated hazard score' : 'No isolations needed'} tone={derived.hazardEvents > 0 ? 'warn' : 'safe'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white">Risk Score Trend</h3>
          <p className="text-[11px] text-carbon-400 mb-3">How plant risk has changed over time</p>
          <LineChart
            data={riskSeries}
            color="#ef4444"
            fill="rgba(239,68,68,0.15)"
            height={200}
            yMin={0}
            yMax={100}
          />
        </div>

        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <ShieldIcon size={14} className="text-accent-cyan" /> How AI Detection Works
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">Our system monitors these signals</p>
          <div className="space-y-3">
            {SIGNALS.map((s) => (
              <div key={s.name} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${s.color}1a`, color: s.color }}>
                  <s.Icon size={15} />
                </div>
                <div>
                  <div className="text-sm text-white">{s.name}</div>
                  <div className="text-[11px] text-carbon-400">{s.desc}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: s.color }}>{s.threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <FlameIcon size={14} className="text-accent-rose" /> Batteries Being Monitored
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">All batteries within safe parameters</p>
          {monitored.length === 0 ? (
            <div className="text-xs text-carbon-500 italic">No machines under simulation</div>
          ) : (
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
              {monitored.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2.5 rounded bg-carbon-800/40 border border-carbon-700/40">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      m.machineState === 'critical' ? 'bg-accent-rose animate-pulse' :
                      m.machineState === 'warning' ? 'bg-accent-amber' :
                      'bg-industrial-400'
                    }`} />
                    <span className="text-sm text-white">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-carbon-300">
                    <span>{m.temp.toFixed(1)}°C</span>
                    <span>{m.vibration.toFixed(1)} mm/s</span>
                    <span className={m.failure > 50 ? 'text-accent-rose' : m.failure > 25 ? 'text-accent-amber' : 'text-industrial-400'}>
                      {m.failure.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="industrial-card p-4">
          <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <AlertIcon size={14} className="text-accent-amber" /> Safety Event Log
          </h3>
          <p className="text-[11px] text-carbon-400 mb-3">Hazard events recorded this shift</p>
          {hazardLog.length === 0 ? (
            <div className="text-xs text-carbon-500 italic">No hazard events recorded</div>
          ) : (
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
              {hazardLog.slice().reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded bg-accent-rose/10 border border-accent-rose/30">
                  <div className="text-[11px] font-mono text-accent-rose w-20 shrink-0">
                    {new Date(h.ts).toLocaleTimeString('en-GB', { hour12: false })}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{h.message}</div>
                    <div className="text-[11px] text-carbon-400">{h.machineName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, big, sub, tone }: { title: string; big: string; sub: string; tone: 'safe' | 'warn' | 'danger' }) {
  const palette: Record<string, { color: string; bg: string; border: string }> = {
    safe: { color: 'text-industrial-400', bg: 'bg-industrial-900/30', border: 'border-industrial-700/40' },
    warn: { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/40' },
    danger: { color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/40' },
  }
  const p = palette[tone]
  return (
    <div className={`industrial-card p-4 border ${p.border} ${p.bg}`}>
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{title}</div>
      <div className={`text-3xl font-bold mt-1 font-mono ${p.color}`}>{big}</div>
      <div className="text-[11px] text-carbon-300 mt-2 inline-flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${p.color.replace('text-', 'bg-')}`} />
        {sub}
      </div>
    </div>
  )
}
