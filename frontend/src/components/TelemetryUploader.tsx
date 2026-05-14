'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Batches recent telemetry from the Zustand store and POSTs it to the
 * backend every 5 seconds for permanent storage in TimescaleDB.
 */
export default function TelemetryUploader() {
  const telemetryData = useStore((s) => s.telemetryData)
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now()
      const points = Object.entries(telemetryData)
        .filter(([_, t]: any) => t && t.timestamp > lastSentRef.current)
        .map(([machineId, t]: any) => ({
          machine_id: machineId,
          timestamp: new Date(t.timestamp).toISOString(),
          temperature: t.temperature ?? 0,
          rpm: t.rpm ?? 0,
          pressure: t.pressure ?? 0,
          throughput: t.throughput ?? 0,
          energy_consumption: t.energyConsumption ?? 0,
          machine_state: t.machineState ?? 'idle',
          failure_probability: t.failureProbability ?? 0,
          maintenance_score: t.maintenanceScore ?? 0,
          material_quantity: t.materialQuantity ?? 0,
          efficiency_score: t.efficiencyScore ?? 0,
          sensor_health: t.sensorHealth ?? 0,
          vibration: t.vibration ?? 0,
        }))

      if (points.length === 0) return

      try {
        await fetch(`${API_URL}/api/telemetry/ingest/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(points),
        })
        lastSentRef.current = now
      } catch {
        // silently skip — next tick will retry
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [telemetryData])

  return null
}
