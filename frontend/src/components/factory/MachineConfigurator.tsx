'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { machinesForIndustry } from '@/data/industryRegistry'
import { MachineConfig } from '@/types'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MachineIcon,
  Plus,
  Settings,
  Trash2,
} from '@/components/ui/icons'

interface MachineConfiguratorProps {
  onNext: () => void
}

export default function MachineConfigurator({ onNext }: MachineConfiguratorProps) {
  const {
    selectedIndustry,
    machines,
    addMachine,
    removeMachine,
    updateMachine,
    setMachines,
    customIndustries,
  } = useStore()

  const availableMachines = useMemo(
    () => machinesForIndustry(selectedIndustry, customIndustries),
    [selectedIndustry, customIndustries]
  )

  const industryName = useMemo(() => {
    const all = customIndustries.find((c) => c.id === selectedIndustry)
    if (all) return all.name
    if (selectedIndustry === 'battery_recycling') return 'Battery Recycling'
    if (selectedIndustry === 'apparel_textile') return 'Apparel & Textile'
    return 'Custom'
  }, [selectedIndustry, customIndustries])

  const [selectedMachineType, setSelectedMachineType] = useState<string>('')
  const [editingMachine, setEditingMachine] = useState<string | null>(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const handleAddMachine = () => {
    const machineDef = availableMachines.find((m) => m.type === selectedMachineType)
    if (!machineDef) return

    const newMachine: MachineConfig = {
      id: `${machineDef.type}_${Date.now()}`,
      type: machineDef.type,
      name: machineDef.name,
      position: { x: machines.length * 200, y: 100 },
      parameters: Object.fromEntries(
        machineDef.parameters.map((p) => [p.key, p.default])
      ),
      connections: [],
    }

    addMachine(newMachine)
    setSelectedMachineType('')
  }

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta
    if (target < 0 || target >= machines.length) return
    const next = [...machines]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setMachines(next)
  }

  const onDragStart = (id: string) => setDragId(id)
  const onDragOver = (e: React.DragEvent) => {
    if (reorderMode && dragId) e.preventDefault()
  }
  const onDrop = (targetIdx: number) => {
    if (!dragId) return
    const fromIdx = machines.findIndex((m) => m.id === dragId)
    if (fromIdx < 0 || fromIdx === targetIdx) {
      setDragId(null)
      return
    }
    const next = [...machines]
    const [removed] = next.splice(fromIdx, 1)
    next.splice(targetIdx, 0, removed)
    setMachines(next)
    setDragId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Machine Configuration</h1>
          <p className="text-carbon-400 mt-1">
            Add, configure, and reorder machines for your {industryName} plant
          </p>
        </div>
        <div className="flex items-center gap-2">
          {machines.length > 1 && (
            <button
              onClick={() => setReorderMode((v) => !v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-2 ${
                reorderMode
                  ? 'bg-industrial-900/40 border-industrial-700/50 text-industrial-300'
                  : 'bg-carbon-800 hover:bg-carbon-700 border-carbon-700 text-carbon-300'
              }`}
            >
              <Settings size={14} /> {reorderMode ? 'Done reordering' : 'Reorder'}
            </button>
          )}
          <button
            onClick={onNext}
            disabled={machines.length === 0}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            Start Simulation <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="industrial-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add Machine</h3>
        <div className="flex gap-3">
          <select
            value={selectedMachineType}
            onChange={(e) => setSelectedMachineType(e.target.value)}
            className="flex-1 bg-carbon-800 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-industrial-500 focus:outline-none"
          >
            <option value="">Select a machine...</option>
            {availableMachines.map((machine) => (
              <option key={machine.type} value={machine.type}>
                {machine.name} — {machine.category}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMachine}
            disabled={!selectedMachineType}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {reorderMode && machines.length > 1 && (
        <div className="p-3 rounded-lg bg-industrial-900/20 border border-industrial-700/40 text-xs text-industrial-300 inline-flex items-center gap-2">
          <Settings size={12} /> Drag a machine, or use the up/down buttons, to change its order in the production flow.
        </div>
      )}

      <div className={`grid gap-4 ${reorderMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {machines.map((machine, idx) => {
          const def = availableMachines.find((m) => m.type === machine.type)
          if (!def) return null

          const isDragging = dragId === machine.id

          return (
            <div
              key={machine.id}
              draggable={reorderMode}
              onDragStart={() => onDragStart(machine.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              onDragEnd={() => setDragId(null)}
              className={`industrial-card p-5 transition-all ${
                isDragging ? 'opacity-50 ring-2 ring-industrial-500/60' : ''
              } ${reorderMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {reorderMode && (
                    <div className="flex flex-col gap-1 mr-1">
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded bg-carbon-800 hover:bg-carbon-700 disabled:opacity-30 disabled:cursor-not-allowed text-carbon-300 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === machines.length - 1}
                        className="p-1 rounded bg-carbon-800 hover:bg-carbon-700 disabled:opacity-30 disabled:cursor-not-allowed text-carbon-300 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  )}
                  <div className="w-9 h-9 rounded-md bg-carbon-800 border border-carbon-700/50 flex items-center justify-center text-industrial-400 shrink-0">
                    <MachineIcon hint={def.icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-800 border border-carbon-700/60 text-carbon-400 font-mono">
                        #{idx + 1}
                      </span>
                      <h4 className="font-semibold text-white truncate">{machine.name}</h4>
                    </div>
                    <p className="text-xs text-carbon-400">{def.category}</p>
                  </div>
                </div>
                {!reorderMode && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingMachine(editingMachine === machine.id ? null : machine.id)}
                      className="px-3 py-1 text-xs bg-carbon-700 hover:bg-carbon-600 text-white rounded transition-colors"
                    >
                      {editingMachine === machine.id ? 'Close' : 'Configure'}
                    </button>
                    <button
                      onClick={() => removeMachine(machine.id)}
                      className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {!reorderMode && editingMachine === machine.id && (
                <div className="space-y-3 pt-4 border-t border-carbon-700/50">
                  {def.parameters.filter((p) => p.editable).map((param) => (
                    <div key={param.key} className="flex items-center gap-4">
                      <label className="text-sm text-carbon-300 w-40">{param.label}</label>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.max - param.min < 5 ? 0.1 : 1}
                        value={machine.parameters[param.key] ?? param.default}
                        onChange={(e) =>
                          updateMachine(machine.id, {
                            parameters: { ...machine.parameters, [param.key]: Number(e.target.value) },
                          })
                        }
                        className="flex-1 accent-industrial-500"
                      />
                      <span className="text-sm font-mono text-industrial-400 w-24 text-right">
                        {(machine.parameters[param.key] ?? param.default).toFixed(2)} {param.unit}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <p className="text-xs text-carbon-500 font-medium mb-2">Outputs:</p>
                    <div className="flex flex-wrap gap-2">
                      {def.outputs.map((output) => (
                        <span
                          key={output}
                          className="text-xs px-2 py-1 rounded bg-industrial-900/30 text-industrial-400 border border-industrial-700/30"
                        >
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {machines.length > 1 && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Production Flow</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {machines.map((machine, idx) => {
              const def = availableMachines.find((m) => m.type === machine.type)
              return (
                <div key={machine.id} className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-carbon-800 border border-carbon-600 text-sm text-white inline-flex items-center gap-2">
                    <span className="text-[10px] text-carbon-400 font-mono">{idx + 1}</span>
                    <MachineIcon hint={def?.icon} size={14} />
                    {machine.name}
                  </div>
                  {idx < machines.length - 1 && (
                    <ArrowRight size={16} className="text-industrial-400" />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-carbon-500 mt-3">
            Machines are connected in this exact sequence. Use Reorder above to change the flow.
          </p>
        </div>
      )}
    </div>
  )
}
