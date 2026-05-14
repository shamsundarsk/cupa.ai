'use client'

import { useEffect, useRef } from 'react'
import { useStoryStore } from '@/lib/storyStore'
import { ViewKey } from '@/lib/types'
import { DerivedKpis } from '@/lib/useTwinState'
import { AlertIcon, CubeIcon, DollarIcon, ShieldIcon } from './icons'

interface Props {
  derived: DerivedKpis
  onNavigate: (view: ViewKey) => void
  alertsCount: number
}

/**
 * Persistent overlay rendered at the shell level so it survives view
 * navigation. Drives the story step timer and triggers each step's action
 * exactly once at the start of the step.
 */
export default function StoryOverlay({ derived, onNavigate, alertsCount }: Props) {
  const isPlaying = useStoryStore((s) => s.isPlaying)
  const currentStep = useStoryStore((s) => s.currentStep)
  const progress = useStoryStore((s) => s.progress)
  const steps = useStoryStore((s) => s.steps)
  const setProgress = useStoryStore((s) => s.setProgress)
  const next = useStoryStore((s) => s.next)
  const stop = useStoryStore((s) => s.stop)

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const actionRanRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!isPlaying) {
      if (tickRef.current) clearInterval(tickRef.current)
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
      tickRef.current = null
      stepTimerRef.current = null
      actionRanRef.current.clear()
      return
    }

    const step = steps[currentStep]
    if (!step) {
      stop()
      return
    }

    onNavigate(step.view)

    // Action fires exactly once at the START of the step.
    if (!actionRanRef.current.has(step.id) && step.action) {
      actionRanRef.current.add(step.id)
      Promise.resolve(step.action()).catch(() => {})
    }

    // Smooth progress: tick every 50ms, advance by 100/(duration_ms/50) per tick.
    const tickIntervalMs = 50
    const increment = 100 / (step.durationMs / tickIntervalMs)
    let local = 0
    setProgress(0)
    tickRef.current = setInterval(() => {
      local = Math.min(100, local + increment)
      setProgress(local)
    }, tickIntervalMs)

    stepTimerRef.current = setTimeout(() => {
      next()
    }, step.durationMs)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
      tickRef.current = null
      stepTimerRef.current = null
    }
  }, [isPlaying, currentStep, steps, onNavigate, next, stop, setProgress])

  if (!isPlaying || steps.length === 0) return null
  const step = steps[currentStep]
  if (!step) return null

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[860px] px-4"
      style={{ paddingLeft: 240 - 16 }} // matches sidebar width offset for visual centering
    >
      <div className="pointer-events-auto industrial-card backdrop-blur-md bg-carbon-900/90 border-industrial-700/50 shadow-2xl shadow-industrial-900/30 px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan font-mono">
            {step.id}/{steps.length}
          </span>
          <h4 className="text-sm font-semibold text-white">{step.title}</h4>
          <button
            onClick={stop}
            className="ml-auto text-[11px] px-3 py-1 rounded-md bg-accent-rose/15 hover:bg-accent-rose/25 border border-accent-rose/40 text-accent-rose transition-colors"
          >
            Stop
          </button>
        </div>

        <p className="text-[12px] text-carbon-300 leading-relaxed">{step.narration}</p>

        <div className="mt-3 h-px w-full bg-carbon-700/50 relative overflow-hidden rounded">
          <div
            className="absolute inset-y-0 left-0 bg-accent-cyan"
            style={{ width: `${progress}%`, transition: 'none' }}
          />
        </div>

        <div className="mt-3 pt-3 border-t border-carbon-700/40 grid grid-cols-4 gap-3 text-[11px]">
          <Kv Icon={DollarIcon} label="REVENUE" value={`$${derived.cumulativeRevenue.toFixed(0)}`} tone="industrial" />
          <Kv Icon={ShieldIcon} label="RISK" value={`${derived.riskScore}`} tone={
            derived.riskScore < 25 ? 'industrial' : derived.riskScore < 60 ? 'amber' : 'rose'
          } />
          <Kv Icon={CubeIcon} label="ITEMS" value={`${derived.itemsProcessing}`} tone="cyan" />
          <Kv Icon={AlertIcon} label="ALERTS" value={`${alertsCount}`} tone={alertsCount > 0 ? 'rose' : 'industrial'} />
        </div>
      </div>
    </div>
  )
}

function Kv({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: (p: any) => JSX.Element
  label: string
  value: string
  tone: 'industrial' | 'cyan' | 'amber' | 'rose'
}) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400',
    cyan: 'text-accent-cyan',
    amber: 'text-accent-amber',
    rose: 'text-accent-rose',
  }
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} className={tones[tone]} />
      <div>
        <div className="text-[9px] uppercase tracking-widest text-carbon-500">{label}</div>
        <div className={`font-mono ${tones[tone]}`}>{value}</div>
      </div>
    </div>
  )
}
