'use client'

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { AppState, FlowStep, HoveredMachine, TelemetryData } from '@/lib/types'
import { GlobeIcon, AlertIcon, ThermoIcon, ZapIcon, GaugeIcon, CpuIcon } from '../icons'
import MachineTrial from './MachineTrial'

const TwinCanvas = dynamic(() => import('../TwinCanvas3D'), { ssr: false })

interface Props {
  state: AppState
  industry: string | null
}

function getFlowInfo(type: string): { action: string; material: string; output: string } {
  const map: Record<string, { action: string; material: string; output: string }> = {
    battery_intake_conveyor: { action: 'Receiving raw battery scrap', material: 'Mixed battery waste', output: 'Sorted scrap batches' },
    battery_sorting_machine: { action: 'Sorting by chemistry type', material: 'Li-ion, NiMH, Lead-acid', output: 'Categorized cells' },
    battery_shredder: { action: 'Mechanical shredding', material: 'Categorized cells', output: 'Shredded black mass' },
    magnetic_separator: { action: 'Magnetic separation', material: 'Shredded black mass', output: 'Ferrous / Non-ferrous split' },
    heated_chemical_tank: { action: 'Chemical leaching', material: 'Non-ferrous material', output: 'Metal-rich solution' },
    filter_press: { action: 'Pressure filtration', material: 'Metal-rich solution', output: 'Filtered concentrate' },
    drying_unit: { action: 'Thermal drying', material: 'Filtered material', output: 'Recovered metals' },
    waste_gas_filter: { action: 'Gas filtration', material: 'Exhaust gases', output: 'Clean air output' },
    material_storage_tank: { action: 'Material storage', material: 'Processed materials', output: 'Stored product' },
    final_packaging_unit: { action: 'Final packaging', material: 'Recovered metals', output: 'Packaged product' },
    hazard_containment: { action: 'Hazard isolation & cooling', material: 'Damaged or hot cells', output: 'Inerted, contained items' },
    fabric_cutting_machine: { action: 'Fabric cutting', material: 'Raw fabric rolls', output: 'Cut fabric pieces' },
    textile_dyeing_machine: { action: 'Textile dyeing', material: 'Cut fabric', output: 'Dyed fabric' },
    heat_press_machine: { action: 'Heat pressing', material: 'Dyed fabric', output: 'Pressed fabric' },
    industrial_sewing_machine: { action: 'Industrial sewing', material: 'Pressed fabric', output: 'Sewn garments' },
    fabric_conveyor: { action: 'Fabric transport', material: 'In-process fabric', output: 'Transported material' },
    steam_boiler: { action: 'Steam generation', material: 'Water + fuel', output: 'Steam supply' },
    washing_unit: { action: 'Fabric washing', material: 'Sewn garments', output: 'Washed garments' },
    drying_machine: { action: 'Garment drying', material: 'Washed garments', output: 'Dried garments' },
    packaging_unit: { action: 'Packaging', material: 'Finished garments', output: 'Packaged product' },
    quality_inspection: { action: 'Quality inspection', material: 'Finished product', output: 'QC-passed product' },
  }
  return map[type] || { action: 'Processing', material: 'Input material', output: 'Processed output' }
}

const stockVideos = [
  'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/3191584/3191584-uhd_2560_1440_30fps.mp4',
]

export default function PlantTwin({ state, industry }: Props) {
  const [activeFlowIndex, setActiveFlowIndex] = useState(0)
  const [hovered, setHovered] = useState<HoveredMachine | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const flowSteps: FlowStep[] = state.machines.map((m) => {
    const info = getFlowInfo(m.type)
    return {
      machineId: m.id,
      action: info.action,
      material: info.material,
      output: info.output,
    }
  })

  useEffect(() => {
    if (state.machines.length === 0 || state.simulation.status !== 'running') return
    const id = setInterval(() => {
      setActiveFlowIndex((p) => (p + 1) % state.machines.length)
    }, 3000)
    return () => clearInterval(id)
  }, [state.machines.length, state.simulation.status])

  const handleHover = useCallback(
    (id: string | null) => {
      if (!id) {
        setHovered(null)
        return
      }
      const m = state.machines.find((x) => x.id === id)
      const t = state.telemetryData[id]
      const flow = flowSteps.find((f) => f.machineId === id)
      if (m && t && flow) setHovered({ machine: m, telemetry: t, flowStep: flow })
    },
    [state.machines, state.telemetryData, flowSteps]
  )

  const selectedMachine = useMemo(
    () => (selectedId ? state.machines.find((m) => m.id === selectedId) : null),
    [selectedId, state.machines]
  )
  const selectedTelemetry = selectedId ? state.telemetryData[selectedId] : undefined
  const selectedFlow = selectedId ? flowSteps.find((f) => f.machineId === selectedId) : undefined
  const selectedVideo = selectedMachine
    ? stockVideos[Math.abs(hashString(selectedMachine.type)) % stockVideos.length]
    : null

  return (
    <div className="space-y-4">
      <div className="flex gap-4 h-[calc(100vh-280px)]">
        {/* Sidebar pipeline */}
        <aside className="w-72 shrink-0 industrial-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-carbon-700/40">
            <h3 className="text-[11px] font-semibold text-white uppercase tracking-widest">Scrap Flow Pipeline</h3>
            <p className="text-[10px] text-carbon-500 mt-0.5">
              {industry === 'battery_recycling' ? 'Battery recycling' : industry === 'apparel_textile' ? 'Apparel & Textile' : 'Industrial'} process
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
            {flowSteps.length === 0 && (
              <div className="text-xs text-carbon-500 italic px-1 py-3">
                No machines configured. Run a simulation from the main dashboard.
              </div>
            )}
            {flowSteps.map((step, index) => {
              const t = state.telemetryData[step.machineId]
              const isActive = index === activeFlowIndex
              const isPast = index < activeFlowIndex
              const isSelected = selectedId === step.machineId
              return (
                <button
                  key={step.machineId}
                  onClick={() => setSelectedId(isSelected ? null : step.machineId)}
                  className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-accent-cyan/10 border-accent-cyan/50'
                      : isActive
                      ? 'bg-industrial-900/30 border-industrial-700/50'
                      : isPast
                      ? 'bg-carbon-800/30 border-carbon-700/40 hover:border-carbon-600'
                      : 'bg-carbon-900/40 border-carbon-700/30 hover:border-carbon-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-industrial-400 animate-pulse' : isPast ? 'bg-industrial-700' : 'bg-carbon-600'
                    }`} />
                    <span className="text-[12px] font-semibold text-white truncate">{state.machines[index]?.name}</span>
                    {isActive && <span className="ml-auto text-[10px] text-industrial-400 font-mono">ACTIVE</span>}
                    {isSelected && <span className="ml-auto text-[10px] text-accent-cyan font-mono">SELECTED</span>}
                  </div>
                  <p className={`text-[11px] ml-4 ${isActive ? 'text-industrial-300' : 'text-carbon-400'}`}>{step.action}</p>
                  <div className="mt-1.5 ml-4 flex items-center justify-between text-[11px]">
                    <span className="text-carbon-500">In: {step.material.split(',')[0]}</span>
                    {t && <span className="text-carbon-300 font-mono">{t.throughput.toFixed(0)} kg/h</span>}
                  </div>
                  <div className="mt-0.5 ml-4 text-[11px] text-carbon-500">
                    Out: <span className="text-carbon-300">{step.output}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 industrial-card overflow-hidden relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <GlobeIcon size={56} className="mx-auto mb-4 animate-pulse text-industrial-400" />
                  <p className="text-carbon-400 text-sm">Loading 3D environment...</p>
                </div>
              </div>
            }
          >
            <TwinCanvas
              machines={state.machines}
              telemetryData={state.telemetryData}
              activeFlowIndex={activeFlowIndex}
              onMachineHover={handleHover}
              selectedMachineId={selectedId}
              onMachineSelect={setSelectedId}
            />
          </Suspense>

          {/* Hint overlay when nothing selected */}
          {!selectedMachine && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-carbon-900/80 border border-carbon-700/60 text-[11px] text-carbon-300 backdrop-blur-sm">
              Click any machine to inspect — drag to rotate, scroll to zoom
            </div>
          )}

          {/* Hover tooltip with live video */}
          {hovered && !selectedMachine && (
            <div className="absolute top-3 right-3 w-72 industrial-card overflow-hidden shadow-2xl pointer-events-none">
              <div className="w-full h-32 bg-carbon-900 relative overflow-hidden">
                <video
                  src={stockVideos[Math.abs(hashString(hovered.machine.type)) % stockVideos.length]}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                  <span className="text-[10px] text-white font-mono">LIVE FEED</span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-semibold text-white">{hovered.machine.name}</h4>
                <p className="text-[11px] text-industrial-300 mb-2">{hovered.flowStep.action}</p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <KV label="Temp" value={`${hovered.telemetry.temperature.toFixed(1)}°C`} />
                  <KV label="RPM" value={hovered.telemetry.rpm.toFixed(0)} />
                  <KV label="Eff" value={`${hovered.telemetry.efficiencyScore.toFixed(0)}%`} />
                  <KV label="Throughput" value={`${hovered.telemetry.throughput.toFixed(0)} kg/h`} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedMachine && (
          <aside className="w-80 shrink-0 industrial-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-700/40 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-accent-cyan font-mono">Selected machine</div>
                <h3 className="text-sm font-bold text-white truncate">{selectedMachine.name}</h3>
                <p className="text-[11px] text-carbon-400 mt-0.5">{selectedFlow?.action ?? '—'}</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[11px] text-carbon-400 hover:text-white px-2 py-1 rounded transition-colors"
              >
                Close
              </button>
            </div>

            {selectedVideo && (
              <div className="w-full h-32 bg-carbon-900 relative overflow-hidden border-b border-carbon-700/40 shrink-0">
                <video
                  key={selectedMachine.id}
                  src={selectedVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                  <span className="text-[10px] text-white font-mono">LIVE FEED</span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {selectedTelemetry ? (
                <>
                  <DetailRow Icon={ThermoIcon} label="Temperature" value={`${selectedTelemetry.temperature.toFixed(1)} °C`} hot={selectedTelemetry.temperature > 95} />
                  <DetailRow Icon={GaugeIcon} label="Pressure" value={`${selectedTelemetry.pressure.toFixed(2)} bar`} hot={selectedTelemetry.pressure > 8} />
                  <DetailRow Icon={CpuIcon} label="RPM" value={selectedTelemetry.rpm.toFixed(0)} />
                  <DetailRow Icon={ZapIcon} label="Energy" value={`${selectedTelemetry.energyConsumption.toFixed(1)} kW`} />
                  <DetailRow Icon={GaugeIcon} label="Throughput" value={`${selectedTelemetry.throughput.toFixed(1)} kg/h`} />
                  <DetailRow Icon={GaugeIcon} label="Efficiency" value={`${selectedTelemetry.efficiencyScore.toFixed(1)} %`} />
                  <DetailRow Icon={AlertIcon} label="Failure prob" value={`${selectedTelemetry.failureProbability.toFixed(0)} %`} hot={selectedTelemetry.failureProbability > 40} />
                  <DetailRow Icon={GaugeIcon} label="Vibration" value={`${selectedTelemetry.vibration.toFixed(1)} mm/s`} hot={selectedTelemetry.vibration > 12} />
                  <DetailRow Icon={GaugeIcon} label="Maintenance" value={`${selectedTelemetry.maintenanceScore.toFixed(0)} %`} />
                  <DetailRow Icon={GaugeIcon} label="Sensor health" value={`${selectedTelemetry.sensorHealth.toFixed(0)} %`} />
                </>
              ) : (
                <div className="text-xs text-carbon-500 italic">Waiting for live telemetry…</div>
              )}

              <div className="pt-3 border-t border-carbon-700/40 text-[11px] text-carbon-400 space-y-1">
                <div><span className="text-carbon-500">Input:</span> {selectedFlow?.material ?? '—'}</div>
                <div><span className="text-carbon-500">Output:</span> <span className="text-industrial-300">{selectedFlow?.output ?? '—'}</span></div>
                <div className="pt-2">
                  <span className="text-carbon-500">Type:</span> <span className="font-mono">{selectedMachine.type}</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <MachineTrial state={state} initialMachineId={selectedId ?? undefined} />
    </div>
  )
}

function DetailRow({
  Icon,
  label,
  value,
  hot,
}: {
  Icon: (p: any) => JSX.Element
  label: string
  value: string
  hot?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-carbon-800/40 border border-carbon-700/40">
      <span className="inline-flex items-center gap-2 text-[11px] text-carbon-400">
        <Icon size={13} className={hot ? 'text-accent-rose' : 'text-carbon-400'} />
        {label}
      </span>
      <span className={`text-sm font-mono ${hot ? 'text-accent-rose' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-carbon-800/50 rounded p-1.5">
      <div className="text-[10px] text-carbon-500">{label}</div>
      <div className="text-white font-mono">{value}</div>
    </div>
  )
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}
