'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'

/**
 * Bidirectional bridge between the main app and the digital-twin app.
 *
 * 1. Pushes the Zustand store snapshot to /api/state every ~1.5s so the
 *    twin can read it cross-origin.
 * 2. Drains /api/twin-action on the same cadence to pick up commands the
 *    twin wants to run inside the main store (e.g. inject hazard).
 */
export default function StateSync() {
  const machines = useStore((s) => s.machines)
  const telemetryData = useStore((s) => s.telemetryData)
  const selectedIndustry = useStore((s) => s.selectedIndustry)
  const simulation = useStore((s) => s.simulation)
  const customIndustries = useStore((s) => s.customIndustries)

  // Track applied action IDs so we never re-apply the same one.
  const appliedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const sync = () => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machines,
          telemetryData,
          selectedIndustry,
          simulation,
          customIndustries,
        }),
      }).catch(() => {})
    }
    sync()
    const id = setInterval(sync, 1500)
    return () => clearInterval(id)
  }, [machines, telemetryData, selectedIndustry, simulation, customIndustries])

  useEffect(() => {
    let cancelled = false
    const drain = async () => {
      try {
        const res = await fetch('/api/twin-action', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !Array.isArray(data?.actions)) return

        for (const a of data.actions) {
          if (!a?.id || appliedRef.current.has(a.id)) continue
          appliedRef.current.add(a.id)
          applyAction(a.type, a.payload)
        }
      } catch {
        // ignore polling failures
      }
    }
    drain()
    const id = setInterval(drain, 1500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return null
}

function applyAction(type: string, payload: any) {
  const store = useStore.getState()
  if (type === 'inject_hazard') {
    // Pick a random running machine and inject a critical thermal alert.
    const running = store.machines
    const target = payload?.machineId
      ? running.find((m) => m.id === payload.machineId)
      : running[Math.floor(Math.random() * Math.max(1, running.length))]
    if (!target) return

    // Mutate the live telemetry to spike temperature & failure probability,
    // so downstream graphs reflect the event in the next tick.
    const current = store.telemetryData[target.id]
    if (current) {
      store.updateTelemetry(target.id, {
        ...current,
        temperature: Math.max(current.temperature + 35, 130),
        failureProbability: Math.max(current.failureProbability + 35, 75),
        machineState: 'critical',
        timestamp: Date.now(),
      })
    }

    store.addAlert({
      id: `alert_inject_${target.id}_${Date.now()}`,
      machineId: target.id,
      machineName: target.name,
      type: 'critical',
      category: 'temperature',
      message: `Hazard injected: thermal anomaly on ${target.name}`,
      timestamp: Date.now(),
      acknowledged: false,
    })
  } else if (type === 'reset_alerts') {
    // Dismiss every current alert.
    for (const a of store.alerts) {
      store.dismissAlert(a.id)
    }
  } else if (type === 'tune_machine') {
    // payload: { machineId, parameters: { key: value, ... } }
    const id: string | undefined = payload?.machineId
    const params: Record<string, number> | undefined = payload?.parameters
    if (!id || !params) return
    const target = store.machines.find((m) => m.id === id)
    if (!target) return
    store.updateMachine(id, {
      parameters: { ...target.parameters, ...params },
    })
  }
}
