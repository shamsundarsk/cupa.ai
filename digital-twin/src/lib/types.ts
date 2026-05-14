// Type definitions mirrored from the main app — kept local so we don't
// pull in cross-package imports.

export interface MachineConfig {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  parameters: Record<string, number>
  connections: string[]
}

export interface TelemetryData {
  machineId: string
  timestamp: number
  temperature: number
  rpm: number
  pressure: number
  throughput: number
  energyConsumption: number
  machineState: string
  failureProbability: number
  maintenanceScore: number
  materialQuantity: number
  efficiencyScore: number
  sensorHealth: number
  vibration: number
}

export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'stopped'
  key: string | null
  startTime: number | null
  tickRate: number
}

export interface AppState {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
  selectedIndustry: string | null
  simulation: SimulationState
}

export interface FlowStep {
  machineId: string
  action: string
  material: string
  output: string
}

export interface HoveredMachine {
  machine: MachineConfig
  telemetry: TelemetryData
  flowStep: FlowStep
}

export type ViewKey =
  | 'overview'
  | 'plant_twin'
  | 'safety'
  | 'simulation'
  | 'optimize'
  | 'shifts'
  | 'revenue'
  | 'roi'
  | 'esg'
  | 'story'
  | 'reports'

export interface KpiSnapshot {
  ts: number
  revenue: number
  recovered: number
  energy: number
  efficiency: number
  risk: number
  hazardEvents: number
  ticks: number
}
