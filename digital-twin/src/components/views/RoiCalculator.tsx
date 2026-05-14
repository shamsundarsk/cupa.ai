'use client'

import { useMemo, useState } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (n: number) => void
}

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-carbon-300">{label}</label>
        <span className="text-sm font-mono text-white">
          {value} <span className="text-carbon-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-industrial-500"
      />
    </div>
  )
}

export default function RoiCalculator() {
  const [batteries, setBatteries] = useState(500)
  const [weight, setWeight] = useState(12)
  const [leadPct, setLeadPct] = useState(35)
  const [lithiumPct, setLithiumPct] = useState(25)
  const [hours, setHours] = useState(16)
  const [energyCost, setEnergyCost] = useState(0.08)

  const numbers = useMemo(() => {
    const dailyKg = batteries * weight
    const dailyLeadKg = dailyKg * (leadPct / 100) * 0.6
    const dailyLithiumKg = dailyKg * (lithiumPct / 100) * 0.55
    const dailyCopperKg = dailyKg * 0.05
    const dailyCobaltKg = dailyKg * 0.025
    const dailyPlasticKg = dailyKg * 0.08

    const PRICES = { lead: 2.1, lithium: 14.5, copper: 9.5, cobalt: 28, plastic: 0.85 }
    const dailyRevenue =
      dailyLeadKg * PRICES.lead +
      dailyLithiumKg * PRICES.lithium +
      dailyCopperKg * PRICES.copper +
      dailyCobaltKg * PRICES.cobalt +
      dailyPlasticKg * PRICES.plastic

    const dailyEnergy = hours * 75 // kWh average plant load
    const dailyEnergyCost = dailyEnergy * energyCost
    const dailyLabour = 720
    const dailyConsumables = 175
    const dailyProfit = dailyRevenue - dailyEnergyCost - dailyLabour - dailyConsumables
    const margin = dailyRevenue ? (dailyProfit / dailyRevenue) * 100 : 0

    return {
      dailyRevenue,
      monthlyRevenue: dailyRevenue * 30,
      annualRevenue: dailyRevenue * 365,
      breakdown: {
        lead: dailyLeadKg * PRICES.lead,
        lithium: dailyLithiumKg * PRICES.lithium,
        copper: dailyCopperKg * PRICES.copper,
        cobalt: dailyCobaltKg * PRICES.cobalt,
      },
      dailyProfit,
      annualProfit: dailyProfit * 365,
      margin,
      dailyEnergy,
      dailyEnergyCost,
      dailyLabour,
      dailyConsumables,
    }
  }, [batteries, weight, leadPct, lithiumPct, hours, energyCost])

  const efficiencyGain = 313_000 // $/yr — baseline platform claim
  const hazardPrevention = 1_000_000 // $/yr
  const platformCostMonth = 10_000
  const totalAnnualBenefit = efficiencyGain + hazardPrevention
  const platformAnnual = platformCostMonth * 12
  const roi = ((totalAnnualBenefit - platformAnnual) / platformAnnual) * 100
  const paybackMonths = Math.max(1, Math.round((platformAnnual / totalAnnualBenefit) * 12))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Cost-Benefit Calculator</h1>
        <p className="text-sm text-carbon-400 mt-0.5">Input your plant parameters to see projected revenue and platform ROI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="industrial-card p-5 lg:col-span-1 space-y-5">
          <h3 className="text-sm font-semibold text-white">Plant Parameters</h3>
          <Slider label="Batteries processed per day" value={batteries} min={100} max={2000} step={10} unit="units" onChange={setBatteries} />
          <Slider label="Average battery weight" value={weight} min={1} max={40} step={0.5} unit="kg" onChange={setWeight} />
          <Slider label="Lead-acid battery %" value={leadPct} min={0} max={100} step={1} unit="%" onChange={setLeadPct} />
          <Slider label="Lithium-ion battery %" value={lithiumPct} min={0} max={100} step={1} unit="%" onChange={setLithiumPct} />
          <Slider label="Operating hours per day" value={hours} min={8} max={24} step={1} unit="hrs" onChange={setHours} />
          <Slider label="Energy cost" value={Number(energyCost.toFixed(2))} min={0.05} max={0.4} step={0.01} unit="$/kWh" onChange={setEnergyCost} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="industrial-card p-5">
            <h3 className="text-sm font-semibold text-white">Revenue Projection</h3>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Stat label="Daily" value={`$${Math.round(numbers.dailyRevenue).toLocaleString()}`} tone="industrial" />
              <Stat label="Monthly" value={`$${formatK(numbers.monthlyRevenue)}`} tone="industrial" />
              <Stat label="Annual" value={`$${formatM(numbers.annualRevenue)}`} tone="industrial" />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-carbon-400">
              <KV label="Lead" value={`$${Math.round(numbers.breakdown.lead).toLocaleString()}/day`} />
              <KV label="Lithium" value={`$${Math.round(numbers.breakdown.lithium).toLocaleString()}/day`} />
              <KV label="Copper" value={`$${Math.round(numbers.breakdown.copper).toLocaleString()}/day`} />
              <KV label="Cobalt" value={`$${Math.round(numbers.breakdown.cobalt).toLocaleString()}/day`} />
            </div>
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-sm font-semibold text-white">Profitability</h3>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Stat label="Daily Profit" value={`$${Math.round(numbers.dailyProfit).toLocaleString()}`} tone="industrial" />
              <Stat label="Annual Profit" value={`$${formatM(numbers.annualProfit)}`} tone="industrial" />
              <Stat label="Margin" value={`${numbers.margin.toFixed(1)}%`} tone={numbers.margin > 80 ? 'industrial' : numbers.margin > 50 ? 'amber' : 'rose'} />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-carbon-400">
              <KV label="Energy cost" value={`$${Math.round(numbers.dailyEnergyCost).toLocaleString()}/day`} />
              <KV label="Labor cost" value={`$${numbers.dailyLabour.toLocaleString()}/day`} />
              <KV label="Consumables" value={`$${numbers.dailyConsumables.toLocaleString()}/day`} />
            </div>
          </div>

          <div className="industrial-card p-5 border border-industrial-700/40 bg-industrial-900/20">
            <h3 className="text-sm font-semibold text-white">CUPA AI Platform ROI</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Stat label="Efficiency Gain (10%)" value={`+$${formatK(efficiencyGain)}/yr`} tone="industrial" />
              <Stat label="Hazard Prevention" value={`+$${formatK(hazardPrevention)}/yr`} tone="industrial" />
            </div>
            <div className="mt-4 flex items-center justify-between p-3 rounded-md bg-carbon-900/40 border border-carbon-700/40">
              <div className="text-xs text-carbon-300">
                <span className="text-carbon-400">Platform cost:</span> <span className="font-mono">$10K/month</span>
                <span className="mx-2 text-carbon-600">·</span>
                <span className="text-carbon-400">Payback period:</span> <span className="font-mono">{paybackMonths} months</span>
              </div>
              <div className="text-xl font-bold text-industrial-300 font-mono">{Math.round(roi).toLocaleString()}% ROI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'industrial' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    industrial: 'text-industrial-400',
    amber: 'text-accent-amber',
    rose: 'text-accent-rose',
  }
  return (
    <div className="rounded-md bg-carbon-800/40 border border-carbon-700/40 p-3">
      <div className="text-[10px] text-carbon-400 uppercase tracking-widest">{label}</div>
      <div className={`text-xl font-bold font-mono mt-1 ${tones[tone]}`}>{value}</div>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-carbon-800/30 rounded px-2 py-1.5">
      <span className="text-carbon-400">{label}</span>
      <span className="text-carbon-200 font-mono">{value}</span>
    </div>
  )
}

function formatK(n: number) {
  if (n >= 1_000_000) return formatM(n)
  return `${(n / 1_000).toFixed(1)}K`
}
function formatM(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  return `${(n / 1_000_000).toFixed(2)}M`
}
