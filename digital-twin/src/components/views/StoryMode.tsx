'use client'

import { useStoryStore } from '@/lib/storyStore'
import { STORY_STEPS } from '@/lib/storySteps'
import { ViewKey } from '@/lib/types'
import { PlayIcon } from '../icons'

interface Props {
  onNavigate: (v: ViewKey) => void
}

export default function StoryMode({ onNavigate }: Props) {
  const isPlaying = useStoryStore((s) => s.isPlaying)
  const start = useStoryStore((s) => s.start)
  const stop = useStoryStore((s) => s.stop)
  const setSteps = useStoryStore((s) => s.setSteps)

  const handleStart = () => {
    setSteps(STORY_STEPS)
    start()
  }

  const totalSeconds = STORY_STEPS.reduce((s, x) => s + x.durationMs, 0) / 1000

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Story Mode</h1>
          <p className="text-sm text-carbon-400 mt-0.5">
            Self-running guided demo that walks any viewer through the platform end-to-end in {Math.round(totalSeconds)} seconds.
          </p>
        </div>
        <button
          onClick={isPlaying ? stop : handleStart}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${
            isPlaying
              ? 'bg-accent-rose/20 hover:bg-accent-rose/30 border-accent-rose/50 text-accent-rose'
              : 'bg-industrial-900/40 hover:bg-industrial-900/60 border-industrial-700/50 text-industrial-300'
          }`}
        >
          <PlayIcon size={12} />
          {isPlaying ? 'Stop demo' : 'Start Guided Demo'}
        </button>
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white">Demo sequence</h3>
        <p className="text-[11px] text-carbon-400 mt-1">
          {STORY_STEPS.length} steps · narration overlay stays pinned across page changes · step 5 fires a real hazard injection on the live plant.
        </p>

        <div className="mt-4 space-y-1.5">
          {STORY_STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.view)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md border bg-carbon-800/30 border-carbon-700/30 hover:border-carbon-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-carbon-800/60 text-carbon-400 border border-carbon-700/50 flex items-center justify-center text-xs font-mono">
                {s.id}
              </div>
              <span className="text-sm text-white">{s.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-medium border bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan ml-auto uppercase">
                {viewLabel(s.view)}
              </span>
              <span className="text-[10px] text-carbon-500 font-mono">{(s.durationMs / 1000).toFixed(0)}s</span>
            </button>
          ))}
        </div>
      </div>

      <div className="industrial-card p-4">
        <h3 className="text-sm font-semibold text-white">What happens</h3>
        <ul className="mt-3 space-y-1 text-sm text-carbon-300">
          <li>· Every metric is read from live telemetry — no fake formulas.</li>
          <li>· Overlay narration is pinned at the bottom of every page so context stays visible.</li>
          <li>· At step 5 the twin POSTs <code className="font-mono text-industrial-300">inject_hazard</code> to the main app, the alert appears, and Safety reflects the new risk score in the next tick.</li>
          <li>· You can stop the tour at any time — the Stop button on the overlay or sidebar nav keeps working.</li>
        </ul>
      </div>
    </div>
  )
}

function viewLabel(v: ViewKey): string {
  const map: Record<ViewKey, string> = {
    overview: 'Overview',
    plant_twin: 'Plant Twin',
    safety: 'Safety',
    simulation: 'Simulation',
    optimize: 'Optimize',
    shifts: 'Shift History',
    revenue: 'Revenue',
    roi: 'ROI',
    esg: 'Sustainability',
    story: 'Story',
    reports: 'Reports',
  }
  return map[v]
}
