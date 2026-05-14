'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { BATTERY_RECYCLING_MACHINES, TEXTILE_MACHINES } from '@/data/machines'
import { MachineConfig, MachineDefinition } from '@/types'

interface MachineConfiguratorProps {
  onNext: () => void
}

export default function MachineConfigurator({ onNext }: MachineConfiguratorProps) {
  const { selectedIndustry, machines, addMachine, removeMachine, updateMachine } = useStore()
  const [selectedMachineType, setSelectedMachineType] = useState<string>('')
  const [editingMachine, setEditingMachine] = useState<string | null>(null)

  const availableMachines = selectedIndustry === 'battery_recycling'
    ? BATTERY_RECYCLING_MACHINES
    : TEXTILE_MACHINES

  const handleAddMachine = () => {
    const machineDef = availableMachines.find(m => m.type === selectedMachineType)
    if (!machineDef) return

    const newMachine: MachineConfig = {
      id: `${machineDef.type}_${Date.now()}`,
      type: machineDef.type,
      name: machineDef.name,
      position: { x: machines.length * 200, y: 100 },
      parameters: Object.fromEntries(
        machineDef.parameters.map(p => [p.key, p.default])
      ),
      connections: [],
    }

    addMachine(newMachine)
    setSelectedMachineType('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Machine Configuration</h1>
          <p className="text-carbon-400 mt-1">
            Add and configure machines for your {selectedIndustry === 'battery_recycling' ? 'Battery Recycling' : 'Textile'} plant
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={machines.length === 0}
          className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium"
        >
          Start Simulation →
        </button>
      </div>

      {/* Add Machine */}
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
                {machine.icon} {machine.name} — {machine.category}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMachine}
            disabled={!selectedMachineType}
            className="px-6 py-3 bg-industrial-600 hover:bg-industrial-500 disabled:bg-carbon-700 disabled:text-carbon-500 text-white rounded-lg transition-colors font-medium"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Machine List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {machines.map((machine) => {
          const def = availableMachines.find(m => m.type === machine.type)
          if (!def) return null

          return (
            <div key={machine.id} className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{machine.name}</h4>
                    <p className="text-xs text-carbon-400">{def.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMachine(editingMachine === machine.id ? null : machine.id)}
                    className="px-3 py-1 text-xs bg-carbon-700 hover:bg-carbon-600 text-white rounded transition-colors"
                  >
                    {editingMachine === machine.id ? 'Close' : 'Configure'}
                  </button>
                  <button
                    onClick={() => removeMachine(machine.id)}
                    className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Parameter Editor */}
              {editingMachine === machine.id && (
                <div className="space-y-3 pt-4 border-t border-carbon-700/50">
                  {def.parameters.filter(p => p.editable).map((param) => (
                    <div key={param.key} className="flex items-center gap-4">
                      <label className="text-sm text-carbon-300 w-40">{param.label}</label>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        value={machine.parameters[param.key] || param.default}
                        onChange={(e) => updateMachine(machine.id, {
                          parameters: { ...machine.parameters, [param.key]: Number(e.target.value) }
                        })}
                        className="flex-1 accent-industrial-500"
                      />
                      <span className="text-sm font-mono text-industrial-400 w-24 text-right">
                        {machine.parameters[param.key] || param.default} {param.unit}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <p className="text-xs text-carbon-500 font-medium mb-2">Outputs:</p>
                    <div className="flex flex-wrap gap-2">
                      {def.outputs.map((output) => (
                        <span key={output} className="text-xs px-2 py-1 rounded bg-industrial-900/30 text-industrial-400 border border-industrial-700/30">
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

      {/* Production Flow */}
      {machines.length > 1 && (
        <div className="industrial-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Production Flow</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {machines.map((machine, idx) => {
              const def = availableMachines.find(m => m.type === machine.type)
              return (
                <div key={machine.id} className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-carbon-800 border border-carbon-600 text-sm text-white">
                    {def?.icon} {machine.name}
                  </div>
                  {idx < machines.length - 1 && (
                    <span className="text-industrial-400 text-lg">→</span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-carbon-500 mt-3">
            Machines are automatically connected in sequence. Output from each machine feeds into the next.
          </p>
        </div>
      )}
    </div>
  )
}
