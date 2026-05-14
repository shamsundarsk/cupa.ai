'use client'

import { useEffect, useRef, useState } from 'react'
import { AppState, KpiSnapshot, MachineConfig, TelemetryData } from './types'

export interface DerivedKpis {
  totalThroughput: number   // kg/h sum across machines
  totalEnergy: number       // kW sum
  avgEfficiency: number     // %
  warnings: number
  criticals: number
  ticks: number
  shiftElapsedMs: number
  // accumulated totals over the running shift
  cumulativeRecovered: number   // kg
  cumulativeRevenue: number     // $
  cumulativeEnergyKWh: number   // kWh
  hazardEvents: number
  riskScore: number             // 0-100, higher = worse
  itemsProcessing: number
}

const MARKET_PRICE_PER_KG: Record<string, number> = {
  cobalt: 28.0,
  copper: 9.5,
  lead: 2.1,
  lithium: 14.5,
  plastic: 0.85,
}

interface UseTwinStateResult {
  state: AppState
  connectionError: boolean
  derived: DerivedKpis
  kpiHistory: KpiSnapshot[]
}

const DEFAULT_STATE: AppState = {
  machines: [],
  telemetryData: {},
  selectedIndustry: null,
  simulation: { status: 'idle', key: null, startTime: null, tickRate: 1000 },
}

export function useTwinState(pollIntervalMs = 1500): UseTwinStateResult {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [connectionError, setConnectionError] = useState(false)
  const [derived, setDerived] = useState<DerivedKpis>(initialDerived())
  const [kpiHistory, setKpiHistory] = useState<KpiSnapshot[]>([])

  // Accumulators for cumulative metrics (in refs to avoid re-renders).
  const accRef = useRef({
    cumulativeRecovered: 0,
    cumulativeRevenue: 0,
    cumulativeEnergyKWh: 0,
    hazardEvents: 0,
    seenWarnings: new Set<string>(), // dedupes warning events per machine+state
    ticks: 0,
    lastShiftKey: '' as string,
  })

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const mainAppUrl =
          (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAIN_APP_URL) ||
          'http://localhost:3000'
        const res = await fetch(`${mainAppUrl}/api/state`, { cache: 'no-store' })
        if (!res.ok) throw new Error('non-2xx')
        const data = (await res.json()) as Partial<AppState>
        if (cancelled) return

        const next: AppState = {
          machines: Array.isArray(data.machines) ? data.machines : [],
          telemetryData: data.telemetryData ?? {},
          selectedIndustry: data.selectedIndustry ?? null,
          simulation: data.simulation ?? DEFAULT_STATE.simulation,
        }
        setState(next)
        setConnectionError(false)

        const acc = accRef.current
        const shiftKey = next.simulation.key ?? ''
        if (shiftKey !== acc.lastShiftKey) {
          acc.cumulativeRecovered = 0
          acc.cumulativeRevenue = 0
          acc.cumulativeEnergyKWh = 0
          acc.hazardEvents = 0
          acc.seenWarnings.clear()
          acc.ticks = 0
          acc.lastShiftKey = shiftKey
        }

        // Derive per-tick increments from telemetry (we don't have a delta
        // stream, so we approximate using "throughput" * pollInterval and
        // assign price by machine type / industry heuristic).
        if (next.simulation.status === 'running') {
          acc.ticks += 1
          const dtH = pollIntervalMs / 1000 / 3600 // hours
          for (const m of next.machines) {
            const t = next.telemetryData[m.id]
            if (!t) continue
            const kgThisTick = Math.max(0, t.throughput) * dtH
            acc.cumulativeRecovered += kgThisTick
            acc.cumulativeRevenue += kgThisTick * priceForMachineType(m.type, next.selectedIndustry)
            acc.cumulativeEnergyKWh += Math.max(0, t.energyConsumption) * dtH
          }
          // Track unique critical/warning incidents
          for (const [id, tel] of Object.entries(next.telemetryData)) {
            if (tel.machineState === 'critical' || tel.machineState === 'warning') {
              const eventKey = `${id}:${Math.floor(Date.now() / 60000)}` // dedupe per-minute
              if (!acc.seenWarnings.has(eventKey)) {
                acc.seenWarnings.add(eventKey)
                if (tel.machineState === 'critical') acc.hazardEvents += 1
              }
            }
          }
        }

        const tels = Object.values(next.telemetryData)
        const avgEfficiency =
          tels.length > 0
            ? tels.reduce((s, t) => s + t.efficiencyScore, 0) / tels.length
            : 0
        const totalThroughput = tels.reduce((s, t) => s + t.throughput, 0)
        const totalEnergy = tels.reduce((s, t) => s + t.energyConsumption, 0)
        const warnings = tels.filter((t) => t.machineState === 'warning').length
        const criticals = tels.filter((t) => t.machineState === 'critical').length
        const avgFailure =
          tels.length > 0
            ? tels.reduce((s, t) => s + t.failureProbability, 0) / tels.length
            : 0
        const riskScore = Math.min(100, Math.round(avgFailure * 0.7 + criticals * 12 + warnings * 4))
        const startTime = next.simulation.startTime ?? Date.now()
        const elapsed = Math.max(0, Date.now() - startTime)

        const newDerived: DerivedKpis = {
          totalThroughput,
          totalEnergy,
          avgEfficiency,
          warnings,
          criticals,
          ticks: acc.ticks,
          shiftElapsedMs: elapsed,
          cumulativeRecovered: acc.cumulativeRecovered,
          cumulativeRevenue: acc.cumulativeRevenue,
          cumulativeEnergyKWh: acc.cumulativeEnergyKWh,
          hazardEvents: acc.hazardEvents,
          riskScore,
          itemsProcessing: tels.filter((t) => t.machineState !== 'idle').length,
        }
        setDerived(newDerived)

        if (next.simulation.status === 'running') {
          setKpiHistory((prev) => {
            const snap: KpiSnapshot = {
              ts: Date.now(),
              revenue: newDerived.cumulativeRevenue,
              recovered: newDerived.cumulativeRecovered,
              energy: newDerived.cumulativeEnergyKWh,
              efficiency: newDerived.avgEfficiency,
              risk: newDerived.riskScore,
              hazardEvents: newDerived.hazardEvents,
              ticks: newDerived.ticks,
            }
            const next = [...prev, snap]
            // keep last 240 points (≈ 6 min @ 1.5s polls)
            return next.length > 240 ? next.slice(next.length - 240) : next
          })
        } else if (next.simulation.status === 'idle' || next.simulation.status === 'stopped') {
          setKpiHistory([])
        }
      } catch {
        if (!cancelled) setConnectionError(true)
      }
    }

    poll()
    const id = setInterval(poll, pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollIntervalMs])

  return { state, connectionError, derived, kpiHistory }
}

function initialDerived(): DerivedKpis {
  return {
    totalThroughput: 0,
    totalEnergy: 0,
    avgEfficiency: 0,
    warnings: 0,
    criticals: 0,
    ticks: 0,
    shiftElapsedMs: 0,
    cumulativeRecovered: 0,
    cumulativeRevenue: 0,
    cumulativeEnergyKWh: 0,
    hazardEvents: 0,
    riskScore: 0,
    itemsProcessing: 0,
  }
}

/** Heuristic dollar value of throughput. */
function priceForMachineType(type: string, industry: string | null): number {
  const t = type.toLowerCase()
  if (industry === 'apparel_textile' || t.includes('fabric') || t.includes('sewing') || t.includes('dyeing')) {
    return 4.5 // generic textile $/kg
  }
  if (t.includes('lithium') || t.includes('chemical')) return MARKET_PRICE_PER_KG.lithium
  if (t.includes('copper')) return MARKET_PRICE_PER_KG.copper
  if (t.includes('cobalt')) return MARKET_PRICE_PER_KG.cobalt
  if (t.includes('plastic')) return MARKET_PRICE_PER_KG.plastic
  if (t.includes('lead')) return MARKET_PRICE_PER_KG.lead
  // mid blended price for unknown stages
  return 7.0
}

/** Recovered material breakdown estimated from per-machine throughput. */
export function estimateMaterialBreakdown(
  machines: MachineConfig[],
  telemetry: Record<string, TelemetryData>,
  cumulativeRecovered: number
): Array<{ key: keyof typeof MARKET_PRICE_PER_KG; recovered: number; revenue: number; price: number }> {
  // Distribute the cumulative recovered total across material classes based
  // on machine "type" hints. If no specific match, distribute evenly into
  // Lead/Copper/Plastic.
  const buckets: Record<string, number> = {
    cobalt: 0,
    copper: 0,
    lead: 0,
    lithium: 0,
    plastic: 0,
  }
  const totalThroughput = Object.values(telemetry).reduce((s, t) => s + t.throughput, 0)
  if (totalThroughput <= 0) {
    return Object.entries(MARKET_PRICE_PER_KG).map(([k, p]) => ({
      key: k as any,
      recovered: 0,
      revenue: 0,
      price: p,
    }))
  }

  for (const m of machines) {
    const t = telemetry[m.id]
    if (!t) continue
    const fraction = t.throughput / totalThroughput
    const portion = cumulativeRecovered * fraction
    const type = m.type.toLowerCase()
    if (type.includes('cobalt') || type.includes('chemical')) buckets.cobalt += portion * 0.2
    if (type.includes('lithium')) buckets.lithium += portion * 0.6
    if (type.includes('copper') || type.includes('magnetic')) buckets.copper += portion * 0.6
    if (type.includes('plastic') || type.includes('shred')) buckets.plastic += portion * 0.3
    if (type.includes('lead') || type.includes('battery') || type.includes('intake'))
      buckets.lead += portion * 0.7
    // Fallback: anything we can't map ends up split lead/copper/plastic
    if (
      !type.includes('cobalt') &&
      !type.includes('lithium') &&
      !type.includes('copper') &&
      !type.includes('plastic') &&
      !type.includes('lead') &&
      !type.includes('chemical') &&
      !type.includes('magnetic') &&
      !type.includes('shred') &&
      !type.includes('battery') &&
      !type.includes('intake')
    ) {
      buckets.lead += portion * 0.4
      buckets.copper += portion * 0.3
      buckets.plastic += portion * 0.3
    }
  }

  // Normalize so bucket sum ≈ cumulativeRecovered.
  const sum = Object.values(buckets).reduce((s, v) => s + v, 0) || 1
  const scale = cumulativeRecovered / sum
  return (Object.keys(MARKET_PRICE_PER_KG) as Array<keyof typeof MARKET_PRICE_PER_KG>).map((k) => {
    const recovered = buckets[k] * scale
    const price = MARKET_PRICE_PER_KG[k]
    return { key: k, recovered, revenue: recovered * price, price }
  })
}
