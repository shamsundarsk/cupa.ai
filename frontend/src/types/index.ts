// Industries can now be either built-in or AI-generated.
// Keeping known IDs available for autocompletion while allowing arbitrary strings.
export type BuiltInIndustry = 'battery_recycling' | 'apparel_textile'
export type Industry = BuiltInIndustry | (string & {})

// Same approach for machine types — built-ins still autocomplete, AI types are accepted.
export type BuiltInMachineType =
  // Battery Recycling
  | 'battery_intake_conveyor'
  | 'battery_sorting_machine'
  | 'battery_shredder'
  | 'magnetic_separator'
  | 'heated_chemical_tank'
  | 'filter_press'
  | 'drying_unit'
  | 'waste_gas_filter'
  | 'material_storage_tank'
  | 'final_packaging_unit'
  // Apparel & Textile
  | 'fabric_cutting_machine'
  | 'textile_dyeing_machine'
  | 'heat_press_machine'
  | 'industrial_sewing_machine'
  | 'fabric_conveyor'
  | 'steam_boiler'
  | 'washing_unit'
  | 'drying_machine'
  | 'packaging_unit'
  | 'quality_inspection'

export type MachineType = BuiltInMachineType | (string & {})

export interface MachineDefinition {
  type: MachineType
  name: string
  industry: Industry
  category: string
  parameters: MachineParameter[]
  outputs: string[]
  /** Lucide icon name. Falls back to a default when unknown. */
  icon: string
  /** True when produced by the AI industry generator. */
  aiGenerated?: boolean
  /** Short description shown in pickers. */
  description?: string
}

export interface MachineParameter {
  key: string
  label: string
  unit: string
  min: number
  max: number
  default: number
  editable: boolean
}

export interface MachineConfig {
  id: string
  type: MachineType
  name: string
  position: { x: number; y: number }
  parameters: Record<string, number>
  connections: string[] // IDs of downstream machines
}

export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'stopped'
  key: string | null
  startTime: number | null
  tickRate: number
  machineStates: Record<string, MachineRuntimeState>
}

export interface MachineRuntimeState {
  status: 'idle' | 'running' | 'warning' | 'critical' | 'maintenance'
  efficiency: number
  throughput: number
  failureProbability: number
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

export interface Alert {
  id: string
  machineId: string
  machineName: string
  type: 'critical' | 'warning' | 'info'
  category: 'temperature' | 'pressure' | 'vibration' | 'efficiency' | 'maintenance' | 'failure'
  message: string
  timestamp: number
  acknowledged: boolean
}

export interface FactoryConfig {
  id: string
  name: string
  industry: Industry
  layout: 'small' | 'medium' | 'enterprise' | 'custom'
  machines: MachineConfig[]
  productionLines: ProductionLine[]
}

export interface ProductionLine {
  id: string
  name: string
  machineIds: string[]
}

export interface AIRecommendation {
  id: string
  type: 'maintenance' | 'energy' | 'production' | 'throughput'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  machineId: string
  estimatedImpact: string
  timestamp: number
}

/**
 * A custom industry created by the generative AI flow.
 * Gets persisted in the store and merged with built-in industries.
 */
export interface CustomIndustry {
  id: string
  name: string
  description: string
  features: string[]
  /** Free-form requirements the expert provided when generating. */
  requirements?: string
  machines: MachineDefinition[]
  aiGenerated: true
  createdAt: number
}
