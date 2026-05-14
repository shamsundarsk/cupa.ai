'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { CustomIndustry, MachineDefinition } from '@/types'
import {
  ArrowRight,
  Bot,
  CheckSquare,
  MachineIcon,
  Sparkles,
  Square,
  Wand2,
} from '@/components/ui/icons'

interface Props {
  open: boolean
  onClose: () => void
  /** Called once the user has saved a generated industry — receives the new id. */
  onSaved: (industryId: string) => void
}

interface GeneratedIndustry {
  id: string
  name: string
  description: string
  features: string[]
  machines: MachineDefinition[]
}

type Step = 'describe' | 'select' | 'review'

export default function CustomIndustryAI({ open, onClose, onSaved }: Props) {
  const { addCustomIndustry, customIndustries } = useStore()

  const [step, setStep] = useState<Step>('describe')
  const [name, setName] = useState('')
  const [requirements, setRequirements] = useState('')
  const [machineCount, setMachineCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'openai' | 'deterministic' | null>(null)
  const [generated, setGenerated] = useState<GeneratedIndustry | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  if (!open) return null

  const close = () => {
    if (loading) return
    setStep('describe')
    setError(null)
    setGenerated(null)
    setSelectedTypes(new Set())
    setSource(null)
    onClose()
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/industries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, requirements, machineCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate')
      const ind: GeneratedIndustry = data.industry
      setGenerated(ind)
      setSource(data.source ?? null)
      setSelectedTypes(new Set(ind.machines.map((m) => m.type)))
      setStep('select')
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const save = () => {
    if (!generated) return
    const machines = generated.machines.filter((m) => selectedTypes.has(m.type))
    if (machines.length === 0) return

    // Avoid id collisions with existing custom industries
    let id = generated.id
    let n = 1
    const existing = new Set(customIndustries.map((c) => c.id))
    while (existing.has(id)) {
      id = `${generated.id}_${n++}`
    }

    const industry: CustomIndustry = {
      id,
      name: generated.name,
      description: generated.description,
      features: generated.features,
      requirements: requirements || undefined,
      machines: machines.map((m) => ({ ...m, industry: id })),
      aiGenerated: true,
      createdAt: Date.now(),
    }

    addCustomIndustry(industry)
    onSaved(id)
    close()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="industrial-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-carbon-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-carbon-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-industrial-900/50 flex items-center justify-center text-industrial-400">
              <Wand2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Generate Industry with AI</h3>
              <p className="text-xs text-carbon-400">
                {step === 'describe' && 'Describe what kind of plant you want to simulate.'}
                {step === 'select' && 'Pick which machines to include in the production line.'}
                {step === 'review' && 'Review and save your custom industry template.'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            disabled={loading}
            className="text-carbon-400 hover:text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-carbon-700/30 text-xs">
          <StepDot active={step === 'describe'} done={step !== 'describe'} label="Describe" />
          <span className="text-carbon-700">·</span>
          <StepDot active={step === 'select'} done={step === 'review'} label="Select" />
          <span className="text-carbon-700">·</span>
          <StepDot active={step === 'review'} done={false} label="Review" />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'describe' && (
            <DescribeStep
              name={name}
              setName={setName}
              requirements={requirements}
              setRequirements={setRequirements}
              machineCount={machineCount}
              setMachineCount={setMachineCount}
              loading={loading}
              error={error}
            />
          )}

          {step === 'select' && generated && (
            <SelectStep
              industry={generated}
              source={source}
              selectedTypes={selectedTypes}
              onToggle={toggle}
            />
          )}

          {step === 'review' && generated && (
            <ReviewStep
              industry={generated}
              selectedCount={selectedTypes.size}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-carbon-700/50">
          <div className="text-xs text-carbon-500">
            {source === 'deterministic' && step !== 'describe' && (
              <span className="inline-flex items-center gap-1">
                <Bot size={12} /> Local fallback model (no OPENAI_API_KEY set)
              </span>
            )}
            {source === 'openai' && step !== 'describe' && (
              <span className="inline-flex items-center gap-1 text-industrial-400">
                <Sparkles size={12} /> Generated with OpenAI
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== 'describe' && (
              <button
                onClick={() => setStep(step === 'review' ? 'select' : 'describe')}
                disabled={loading}
                className="px-4 py-2 bg-carbon-800 hover:bg-carbon-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            {step === 'describe' && (
              <button
                onClick={generate}
                disabled={loading || name.trim().length < 2}
                className="px-5 py-2 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles size={14} className="animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} /> Generate
                  </>
                )}
              </button>
            )}
            {step === 'select' && (
              <button
                onClick={() => setStep('review')}
                disabled={selectedTypes.size === 0}
                className="px-5 py-2 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
            {step === 'review' && (
              <button
                onClick={save}
                disabled={selectedTypes.size === 0}
                className="px-5 py-2 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save industry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        active ? 'text-industrial-400' : done ? 'text-carbon-300' : 'text-carbon-500'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          active ? 'bg-industrial-400' : done ? 'bg-carbon-400' : 'bg-carbon-700'
        }`}
      />
      {label}
    </span>
  )
}

function DescribeStep({
  name,
  setName,
  requirements,
  setRequirements,
  machineCount,
  setMachineCount,
  loading,
  error,
}: {
  name: string
  setName: (s: string) => void
  requirements: string
  setRequirements: (s: string) => void
  machineCount: number
  setMachineCount: (n: number) => void
  loading: boolean
  error: string | null
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-carbon-300 block mb-2">Industry name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          placeholder="e.g. Solar panel manufacturing"
          className="w-full bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3 text-white focus:border-industrial-500 focus:outline-none placeholder:text-carbon-500"
        />
      </div>

      <div>
        <label className="text-sm text-carbon-300 block mb-2">
          Requirements <span className="text-carbon-500">(optional)</span>
        </label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          disabled={loading}
          rows={5}
          placeholder={
            'Anything the AI should know.\n\nExamples:\n• Must include a thermal curing oven\n• Throughput target ~500 units/hour\n• Add automated quality inspection at the end'
          }
          className="w-full bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3 text-white focus:border-industrial-500 focus:outline-none placeholder:text-carbon-500 resize-none font-mono text-sm"
        />
        <p className="text-xs text-carbon-500 mt-1">{requirements.length}/2000 characters</p>
      </div>

      <div>
        <label className="text-sm text-carbon-300 block mb-2">
          Suggested machine count: <span className="text-industrial-400 font-semibold">{machineCount}</span>
        </label>
        <input
          type="range"
          min={4}
          max={12}
          value={machineCount}
          onChange={(e) => setMachineCount(Number(e.target.value))}
          disabled={loading}
          className="w-full accent-industrial-500"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

function SelectStep({
  industry,
  source,
  selectedTypes,
  onToggle,
}: {
  industry: GeneratedIndustry
  source: 'openai' | 'deterministic' | null
  selectedTypes: Set<string>
  onToggle: (type: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-industrial-900/20 border border-industrial-700/40">
        <h4 className="text-base font-semibold text-white">{industry.name}</h4>
        <p className="text-sm text-carbon-300 mt-1">{industry.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {industry.features.map((f) => (
            <span key={f} className="text-xs px-2 py-1 rounded bg-carbon-800 text-carbon-300 border border-carbon-700/60">
              {f}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-carbon-400">
        Suggested {industry.machines.length} machines · {selectedTypes.size} selected
      </p>

      <div className="space-y-2">
        {industry.machines.map((m) => {
          const isSelected = selectedTypes.has(m.type)
          return (
            <button
              key={m.type}
              onClick={() => onToggle(m.type)}
              className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${
                isSelected
                  ? 'bg-industrial-900/30 border-industrial-500/50'
                  : 'bg-carbon-800/40 border-carbon-700/50 hover:border-carbon-600'
              }`}
            >
              <div className="pt-0.5">
                {isSelected ? (
                  <CheckSquare size={18} className="text-industrial-400" />
                ) : (
                  <Square size={18} className="text-carbon-500" />
                )}
              </div>
              <div className="w-9 h-9 shrink-0 rounded-md bg-carbon-900/60 border border-carbon-700/60 flex items-center justify-center text-industrial-400">
                <MachineIcon hint={m.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-carbon-900/80 border border-carbon-700/60 text-carbon-400 uppercase tracking-wide">
                    {m.category}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-carbon-400 mt-1">{m.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.parameters.slice(0, 4).map((p) => (
                    <span key={p.key} className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-900/60 text-carbon-400">
                      {p.label}
                    </span>
                  ))}
                  {m.parameters.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-carbon-500">
                      +{m.parameters.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReviewStep({
  industry,
  selectedCount,
}: {
  industry: GeneratedIndustry
  selectedCount: number
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-lg bg-industrial-900/20 border border-industrial-700/40">
        <h4 className="text-base font-semibold text-white">{industry.name}</h4>
        <p className="text-sm text-carbon-300 mt-1">{industry.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Machines selected" value={selectedCount.toString()} />
        <Metric label="Categories" value={industry.features.length.toString()} />
      </div>

      <div className="p-4 rounded-lg bg-carbon-800/50 border border-carbon-700/50">
        <p className="text-xs text-carbon-400 mb-2 uppercase tracking-wide">What happens next</p>
        <ol className="text-sm text-carbon-300 space-y-1 list-decimal list-inside">
          <li>Industry template is saved to your workspace.</li>
          <li>You will land on the Layout step to size your plant.</li>
          <li>Selected machines become available to add and configure.</li>
          <li>The simulation engine and 3D twin will use them automatically.</li>
        </ol>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-carbon-800/50 border border-carbon-700/50">
      <p className="text-xs text-carbon-500">{label}</p>
      <p className="text-lg font-semibold text-industrial-400 font-mono mt-1">{value}</p>
    </div>
  )
}
