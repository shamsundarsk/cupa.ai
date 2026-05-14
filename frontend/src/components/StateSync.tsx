'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

/**
 * Syncs the Zustand store to the API route every 2 seconds
 * so the Digital Twin app (port 3001) can read it.
 */
export default function StateSync() {
  const machines = useStore((s) => s.machines)
  const telemetryData = useStore((s) => s.telemetryData)
  const selectedIndustry = useStore((s) => s.selectedIndustry)
  const simulation = useStore((s) => s.simulation)

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
        }),
      }).catch(() => {
        // Silently fail - not critical
      })
    }

    // Sync immediately
    sync()

    // Then sync every 1.5 seconds
    const interval = setInterval(sync, 1500)
    return () => clearInterval(interval)
  }, [machines, telemetryData, selectedIndustry, simulation])

  return null
}
