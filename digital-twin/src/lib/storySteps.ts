'use client'

import { StoryStep } from './storyStore'

// Same-origin proxy — the digital-twin's Next.js server forwards to the
// main dashboard. No NEXT_PUBLIC_* needed in the client bundle.

async function injectHazardOnMainApp(): Promise<void> {
  try {
    await fetch('/api/twin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'inject_hazard' }),
    })
  } catch {
    // Twin should still tell its story even if the action fails.
  }
}

async function resetAlertsOnMainApp(): Promise<void> {
  try {
    await fetch('/api/twin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reset_alerts' }),
    })
  } catch {
    /* ignore */
  }
}

/** 90-second self-running tour. Each step targets a real view in the app. */
export const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    title: 'Plant Boot-Up',
    narration:
      'The twin syncs with the live simulation, sensors phase in, and KPIs populate from the running shift. Watch the SHIFT timer at the top start counting and the status pill turn green.',
    durationMs: 6000,
    view: 'overview',
  },
  {
    id: 2,
    title: 'Scrap Intake',
    narration:
      'New batches arrive at intake. The What\'s Entering panel on the left shows a mix of lead-acid, lithium-ion, plastic, and PCB scrap with weight and condition tagged for routing.',
    durationMs: 8000,
    view: 'overview',
  },
  {
    id: 3,
    title: 'Live Plant Floor',
    narration:
      'We drop into the 3D plant. Each station has its own lighting tied to live state — green when a stage is processing, blue rings on the magnetic separator, the press ram cycling under load.',
    durationMs: 9000,
    view: 'plant_twin',
    action: resetAlertsOnMainApp,
  },
  {
    id: 4,
    title: 'AI Routing',
    narration:
      'The AI inspects each item and picks the right downstream station — ferrous to magnetic separation, lithium cells to chemical leaching, plastics to recycling. Hover any machine to see live throughput and material flow.',
    durationMs: 9000,
    view: 'plant_twin',
  },
  {
    id: 5,
    title: 'Hazard Detected',
    narration:
      'Now we inject a real hazard event into the running plant. Watch the temperature climb and the failure probability spike on Safety — the twin flags it immediately, ahead of any human operator.',
    durationMs: 9000,
    view: 'safety',
    action: injectHazardOnMainApp,
  },
  {
    id: 6,
    title: 'Emergency Reroute',
    narration:
      'The risk score jumps and the affected machine is isolated. Downstream stations keep flowing because the routing model swings around the hazard, not through it.',
    durationMs: 9000,
    view: 'safety',
  },
  {
    id: 7,
    title: 'Predictive Simulation',
    narration:
      'Before changing anything in real life, the operator runs a what-if. The forecasts on the right project revenue and risk over the next 30 sim-minutes given the current state.',
    durationMs: 9000,
    view: 'simulation',
  },
  {
    id: 8,
    title: 'Revenue & Lead Extraction',
    narration:
      'Every kilogram recovered shows up as cash. The Revenue page breaks the shift down by material — lead, copper, lithium, cobalt — at live market prices, with margin after energy and labor.',
    durationMs: 9000,
    view: 'revenue',
  },
  {
    id: 9,
    title: 'AI Optimization',
    narration:
      'The AI reads everything and proposes targeted improvements: adjust batch sizing, stagger high-load machines, throttle a machine running too hot. Each one comes with the projected impact.',
    durationMs: 8000,
    view: 'optimize',
  },
  {
    id: 10,
    title: 'The Circular Economy, Working',
    narration:
      'The story closes with the sustainability story — tonnes of CO₂ avoided, landfill diverted, materials sent back into manufacturing. Every number on this page derives from real cumulative totals, not estimates.',
    durationMs: 10000,
    view: 'esg',
  },
]
