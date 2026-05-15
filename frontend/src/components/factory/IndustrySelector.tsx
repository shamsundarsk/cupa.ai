'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { buildIndustryEntries, IndustryEntry, machinesForIndustry } from '@/data/industryRegistry'
import { MachineConfig } from '@/types'
import {
  ArrowRight,
  MachineIcon,
  Sparkles,
  Trash2,
  Wand2,
} from '@/components/ui/icons'
import CustomIndustryAI from './CustomIndustryAI'

interface IndustrySelectorProps {
  onNext: () => void
}

const layouts = [
  { id: 'small' as const, name: 'Small Plant', machines: '3-5', description: 'Compact production line', target: 4 },
  { id: 'medium' as const, name: 'Medium Plant', machines: '5-10', description: 'Standard factory floor', target: 7 },
  { id: 'enterprise' as const, name: 'Enterprise Plant', machines: '10-20+', description: 'Full-scale production', target: 12 },
  { id: 'custom' as const, name: 'Custom Layout', machines: 'Any', description: 'Design your own layout', target: 0 },
]

export default function IndustrySelector({ onNext }: IndustrySelectorProps) {
  const {
    selectedIndustry,
    setSelectedIndustry,
    factoryLayout,
    setFactoryLayout,
    customIndustries,
    removeCustomIndustry,
    setMachines,
  } = useStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [aiOpen, setAiOpen] = useState(false)

  const industries: IndustryEntry[] = buildIndustryEntries(customIndustries)

  /** Auto-populate machines based on layout target when proceeding to Step 3. */
  const handleConfigureMachines = () => {
    const layout = layouts.find((l) => l.id === factoryLayout)
    const target = layout?.target ?? 0
    if (target > 0 && selectedIndustry) {
      const available = machinesForIndustry(selectedIndustry, customIndustries)
      const count = Math.min(target, available.length)
      const selected = available.slice(0, count)
      const configs: MachineConfig[] = selected.map((def, idx) => ({
        id: `${def.type}_${Date.now()}_${idx}`,
        type: def.type,
        name: def.name,
        position: { x: idx * 200, y: 100 },
        parameters: Object.fromEntries(def.parameters.map((p) => [p.key, p.default])),
        connections: [],
      }))
      setMachines(configs)
    }
    onNext()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Factory Setup</h1>
        <p className="text-carbon-400 mt-1">Configure your industrial simulation environment</p>
      </div>

      <div className="flex items-center gap-4">
        <StepIndicator step={1} current={step} label="Industry" />
        <div className="flex-1 h-px bg-carbon-700" />
        <StepIndicator step={2} current={step} label="Layout" />
        <div className="flex-1 h-px bg-carbon-700" />
        <StepIndicator step={3} current={step > 2 ? 3 : 0} label="Machines" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Step 1 — Choose Industry</h2>
            <button
              onClick={() => setAiOpen(true)}
              className="px-4 py-2 bg-industrial-900/40 hover:bg-industrial-900/60 border border-industrial-700/50 text-industrial-300 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Wand2 size={14} /> Generate with AI
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`industrial-card p-5 text-left transition-all duration-300 relative group ${
                  selectedIndustry === industry.id
                    ? 'border-industrial-500 industrial-glow'
                    : 'hover:border-carbon-500'
                }`}
              >
                {industry.aiGenerated && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-industrial-900/40 border border-industrial-700/50 text-[10px] text-industrial-300">
                    <Sparkles size={10} /> AI
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-carbon-800 border border-carbon-700/60 flex items-center justify-center text-industrial-400">
                    <MachineIcon hint={industry.icon} size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{industry.name}</h3>
                    <p className="text-xs text-carbon-400">{industry.machineCount} machines available</p>
                  </div>
                </div>
                <p className="text-sm text-carbon-300 mb-3 line-clamp-2">{industry.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {industry.features.slice(0, 5).map((f) => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-carbon-800 text-carbon-300 border border-carbon-700/60">
                      {f}
                    </span>
                  ))}
                </div>
                {industry.aiGenerated && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCustomIndustry(industry.id)
                      if (selectedIndustry === industry.id) setSelectedIndustry('' as any)
                    }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-md text-carbon-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Delete this AI-generated industry"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            ))}

            {/* AI generation card */}
            <button
              onClick={() => setAiOpen(true)}
              className="industrial-card p-5 text-left transition-all duration-300 border-dashed hover:border-industrial-500/60 hover:bg-industrial-900/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-industrial-900/30 border border-industrial-700/50 flex items-center justify-center text-industrial-400">
                  <Wand2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white inline-flex items-center gap-2">
                    Custom industry
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-industrial-900/40 border border-industrial-700/50 text-industrial-300">
                      AI
                    </span>
                  </h3>
                  <p className="text-xs text-carbon-400">Describe it, AI builds it</p>
                </div>
              </div>
              <p className="text-sm text-carbon-300">
                Type any industry name and optional requirements. The AI proposes a tailored set of machines you can checkbox-select.
              </p>
            </button>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedIndustry}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            Continue <ArrowRight size={16} />
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
              Back
            </button>
            <button
              onClick={handleConfigureMachines}
              className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
            >
              Configure Machines <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <CustomIndustryAI
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onSaved={(id) => {
          setSelectedIndustry(id)
          setAiOpen(false)
          setStep(2)
        }}
      />
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
