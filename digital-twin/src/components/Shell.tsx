'use client'

import { ReactNode } from 'react'
import {
  ActivityIcon,
  AlertIcon,
  CalculatorIcon,
  CircleIcon,
  ClockIcon,
  CpuIcon,
  CubeIcon,
  DollarIcon,
  FactoryIcon,
  FileTextIcon,
  FilmIcon,
  GaugeIcon,
  GlobeIcon,
  HistoryIcon,
  LeafIcon,
  ShieldIcon,
  SparkleIcon,
  ZapIcon,
  type IconProps,
} from './icons'
import { ViewKey } from '@/lib/types'

type IconType = (props: IconProps) => JSX.Element

interface SidebarItem {
  id: ViewKey
  label: string
  icon: IconType
  group: 'OPERATIONS' | 'INTELLIGENCE' | 'BUSINESS' | 'TOOLS'
}

const items: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: GaugeIcon, group: 'OPERATIONS' },
  { id: 'plant_twin', label: 'Plant Twin', icon: CubeIcon, group: 'OPERATIONS' },
  { id: 'safety', label: 'Safety', icon: ShieldIcon, group: 'OPERATIONS' },

  { id: 'simulation', label: 'Simulation', icon: CpuIcon, group: 'INTELLIGENCE' },
  { id: 'optimize', label: 'Optimize', icon: SparkleIcon, group: 'INTELLIGENCE' },
  { id: 'shifts', label: 'Shift History', icon: HistoryIcon, group: 'INTELLIGENCE' },

  { id: 'revenue', label: 'Revenue', icon: DollarIcon, group: 'BUSINESS' },
  { id: 'roi', label: 'ROI Calculator', icon: CalculatorIcon, group: 'BUSINESS' },
  { id: 'esg', label: 'ESG', icon: LeafIcon, group: 'BUSINESS' },

  { id: 'story', label: 'Story Mode', icon: FilmIcon, group: 'TOOLS' },
  { id: 'reports', label: 'Reports', icon: FileTextIcon, group: 'TOOLS' },
]

const GROUPS: Array<SidebarItem['group']> = ['OPERATIONS', 'INTELLIGENCE', 'BUSINESS', 'TOOLS']

interface ShellProps {
  current: ViewKey
  onNavigate: (v: ViewKey) => void
  onDisconnect: () => void
  topBar: ReactNode
  status: 'running' | 'paused' | 'idle' | 'stopped'
  riskScore: number
  children: ReactNode
}

export function Shell({
  current,
  onNavigate,
  onDisconnect,
  topBar,
  status,
  riskScore,
  children,
}: ShellProps) {
  return (
    <div className="h-screen w-screen flex bg-carbon-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-carbon-900/80 border-r border-carbon-700/50 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-carbon-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-industrial-400 to-industrial-700 flex items-center justify-center text-carbon-950 font-bold text-sm">
              C
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">CUPA AI</div>
              <div className="text-[10px] text-carbon-400 uppercase tracking-widest">Digital Twin</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-carbon-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'running' ? 'bg-industrial-400 animate-pulse' :
                status === 'paused' ? 'bg-accent-amber' :
                'bg-carbon-600'
              }`}
            />
            <span className="text-xs text-carbon-300">
              {status === 'running' ? 'Synchronized' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <span className={`text-[10px] font-mono ${
            riskScore < 25 ? 'text-industrial-400' :
            riskScore < 60 ? 'text-accent-amber' :
            'text-accent-rose'
          }`}>
            Risk: {riskScore}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <div className="px-4 py-1.5 text-[10px] font-bold text-carbon-500 uppercase tracking-widest">
                {g}
              </div>
              <div className="space-y-0.5 px-2">
                {items
                  .filter((i) => i.group === g)
                  .map((item) => {
                    const Icon = item.icon
                    const active = current === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                          active
                            ? 'bg-industrial-900/40 text-industrial-300 border border-industrial-700/40'
                            : 'text-carbon-300 hover:bg-carbon-800/60 hover:text-white border border-transparent'
                        }`}
                      >
                        <Icon size={15} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-carbon-700/40 text-[11px] text-carbon-500">
          <div className="flex items-center justify-between">
            <span>v1.0 — 14 sectors</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-industrial-400" /> live
            </span>
          </div>
          <button
            onClick={onDisconnect}
            className="mt-2 w-full px-2 py-1.5 rounded bg-carbon-800/60 hover:bg-carbon-800 text-carbon-300 hover:text-white text-xs transition-colors"
          >
            Disconnect
          </button>
        </div>
      </aside>

      {/* Right pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-6 px-6 py-3 border-b border-carbon-700/40 bg-carbon-900/60 backdrop-blur-sm">
          {topBar}
        </div>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 max-w-[1500px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

interface TopBarProps {
  shiftElapsedMs: number
  itemsProcessing: number
  cumulativeRevenue: number
  riskScore: number
  ticks: number
  status: 'running' | 'paused' | 'idle' | 'stopped'
  onInjectHazard?: () => void
}

export function TopBar({
  shiftElapsedMs,
  itemsProcessing,
  cumulativeRevenue,
  riskScore,
  ticks,
  status,
  onInjectHazard,
}: TopBarProps) {
  const formatted = formatHHMMSS(shiftElapsedMs)
  return (
    <div className="flex items-center justify-between gap-6 w-full">
      <div className="flex items-center gap-6">
        <Pill icon={<ClockIcon size={13} />} label="SHIFT" value={formatted} />
        <Pill icon={<CubeIcon size={13} />} label="ITEMS" value={itemsProcessing.toString()} />
        <Pill icon={<DollarIcon size={13} />} label="REVENUE" value={`$${cumulativeRevenue.toFixed(2)}`} valueClass="text-industrial-300" />
        <Pill icon={<AlertIcon size={13} />} label="RISK" value={riskScore.toString()} valueClass={
          riskScore < 25 ? 'text-industrial-300' :
          riskScore < 60 ? 'text-accent-amber' :
          'text-accent-rose'
        } />
        <Pill icon={<ActivityIcon size={13} />} label="TICK" value={ticks.toString()} />
      </div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono ${
          status === 'running'
            ? 'bg-industrial-900/40 border border-industrial-700/50 text-industrial-300'
            : 'bg-carbon-800 border border-carbon-700 text-carbon-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-industrial-400 animate-pulse' : 'bg-carbon-500'}`} />
          {status === 'running' ? 'LIVE' : status.toUpperCase()}
        </span>
        {onInjectHazard && (
          <button
            onClick={onInjectHazard}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-rose/20 hover:bg-accent-rose/30 border border-accent-rose/40 text-accent-rose rounded-md text-xs font-medium transition-colors"
          >
            <AlertIcon size={13} /> Inject Hazard
          </button>
        )}
      </div>
    </div>
  )
}

function Pill({ icon, label, value, valueClass }: { icon: ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="text-[10px] text-carbon-500 uppercase tracking-widest flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-sm font-mono font-semibold ${valueClass ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

function formatHHMMSS(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
