'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Industry } from '@/types'

interface IndustrySelectorProps {
  onNext: () => void
}

const industries = [
  {
    id: 'battery_recycling' as Industry,
    name: 'Battery Recycling',
    description: 'Full battery recycling plant — from intake to material recovery',
    icon: '🔋',
    machines: 10,
    features: ['Shredding', 'Chemical Processing', 'Magnetic Separation', 'Filtration', 'Drying'],
  },
  {
    id: 'apparel_textile' as Industry,
    name: 'Apparel & Textile',
    description: 'Complete textile manufacturing — cutting, dyeing, sewing, finishing',
    icon: '🧵',
    machines: 10,
    features: ['Cutting', 'Dyeing', 'Sewing', 'Heat Press', 'Steam Processing'],
  },
]

const layouts = [
  { id: 'small' as const, name: 'Small Plant', machines: '3-5', description: 'Compact production line' },
  { id: 'medium' as const, name: 'Medium Plant', machines: '5-10', description: 'Standard factory floor' },
  { id: 'enterprise' as const, name: 'Enterprise Plant', machines: '10-20+', description: 'Full-scale production' },
  { id: 'custom' as const, name: 'Custom Layout', machines: 'Any', description: 'Design your own layout' },
]

export default function IndustrySelector({ onNext }: IndustrySelectorProps) {
  const { selectedIndustry, setSelectedIndustry, factoryLayout, setFactoryLayout } = useStore()
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Factory Setup</h1>
        <p className="text-carbon-400 mt-1">Configure your industrial simulation environment</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <StepIndicator step={1} current={step} label="Industry" />
        <div className="flex-1 h-px bg-carbon-700" />
        <StepIndicator step={2} current={step} label="Layout" />
        <div className="flex-1 h-px bg-carbon-700" />
        <StepIndicator step={3} current={step > 2 ? 3 : 0} label="Machines" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Step 1 — Choose Industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`industrial-card p-6 text-left transition-all duration-300 ${
                  selectedIndustry === industry.id
                    ? 'border-industrial-500 industrial-glow'
                    : 'hover:border-carbon-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{industry.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{industry.name}</h3>
                    <p className="text-xs text-carbon-400">{industry.machines} machines available</p>
                  </div>
                </div>
                <p className="text-sm text-carbon-300 mb-3">{industry.description}</p>
                <div className="flex flex-wrap gap-2">
                  {industry.features.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded bg-carbon-800 text-carbon-300">
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!selectedIndustry}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Step 2 — Choose Factory Layout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setFactoryLayout(layout.id)}
                className={`industrial-card p-6 text-left transition-all duration-300 ${
                  factoryLayout === layout.id
                    ? 'border-industrial-500 industrial-glow'
                    : 'hover:border-carbon-500'
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{layout.name}</h3>
                <p className="text-sm text-carbon-400 mt-1">{layout.description}</p>
                <p className="text-xs text-industrial-400 mt-2">{layout.machines} machines</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-carbon-700 hover:bg-carbon-600 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={onNext}
              className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 text-white rounded-lg transition-colors font-medium"
            >
              Configure Machines →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ step, current, label }: { step: number; current: number; label: string }) {
  const isActive = current >= step
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        isActive ? 'bg-industrial-600 text-white' : 'bg-carbon-700 text-carbon-400'
      }`}>
        {step}
      </div>
      <span className={`text-sm ${isActive ? 'text-white' : 'text-carbon-500'}`}>{label}</span>
    </div>
  )
}
