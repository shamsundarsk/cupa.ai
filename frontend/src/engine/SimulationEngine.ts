import { MachineConfig, TelemetryData, Alert, CustomIndustry, MachineDefinition } from '@/types'
import { ALL_MACHINES } from '@/data/machines'
import { findMachineDefinition } from '@/data/industryRegistry'

/**
 * Simulation engine that supports both built-in machine types (with bespoke
 * physics) and AI-generated types (via parameter-driven generic simulation).
 */
export class SimulationEngine {
  private machines: MachineConfig[] = []
  private interval: NodeJS.Timeout | null = null
  private tickRate: number = 1000
  private onTelemetry: (machineId: string, data: TelemetryData) => void
  private onAlert: (alert: Alert) => void
  private machineStates: Map<string, MachineSimState> = new Map()
  private customIndustries: CustomIndustry[]

  constructor(
    machines: MachineConfig[],
    tickRate: number,
    customIndustries: CustomIndustry[],
    onTelemetry: (machineId: string, data: TelemetryData) => void,
    onAlert: (alert: Alert) => void
  ) {
    this.machines = machines
    this.tickRate = tickRate
    this.customIndustries = customIndustries
    this.onTelemetry = onTelemetry
    this.onAlert = onAlert
    this.initializeStates()
  }

  private initializeStates() {
    this.machines.forEach((machine) => {
      this.machineStates.set(machine.id, {
        temperature: 25 + Math.random() * 10,
        rpm: 0,
        pressure: 1,
        throughput: 0,
        energyConsumption: 0,
        efficiency: 85 + Math.random() * 10,
        failureProbability: Math.random() * 5,
        vibration: Math.random() * 3,
        wearLevel: Math.random() * 20,
        materialFlow: 0,
        uptime: 0,
      })
    })
  }

  start() {
    this.interval = setInterval(() => this.tick(), this.tickRate)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private tick() {
    this.machines.forEach((machine) => {
      const state = this.machineStates.get(machine.id)
      if (!state) return

      const updatedState = this.simulateMachine(machine, state)
      this.machineStates.set(machine.id, updatedState)

      const telemetry: TelemetryData = {
        machineId: machine.id,
        timestamp: Date.now(),
        temperature: updatedState.temperature,
        rpm: updatedState.rpm,
        pressure: updatedState.pressure,
        throughput: updatedState.throughput,
        energyConsumption: updatedState.energyConsumption,
        machineState: this.getMachineState(updatedState),
        failureProbability: updatedState.failureProbability,
        maintenanceScore: 100 - updatedState.wearLevel,
        materialQuantity: updatedState.materialFlow,
        efficiencyScore: updatedState.efficiency,
        sensorHealth: 95 + Math.random() * 5,
        vibration: updatedState.vibration,
      }

      this.onTelemetry(machine.id, telemetry)
      this.checkAlerts(machine, updatedState)
    })
  }

  private simulateMachine(machine: MachineConfig, state: MachineSimState): MachineSimState {
    const params = machine.parameters
    const newState = { ...state }
    newState.uptime += this.tickRate / 1000

    // Built-in physics first
    switch (machine.type) {
      case 'battery_shredder':
        return this.simulateShredder(params, newState)
      case 'heated_chemical_tank':
        return this.simulateChemicalTank(params, newState)
      case 'filter_press':
        return this.simulateFilterPress(params, newState)
      case 'steam_boiler':
        return this.simulateBoiler(params, newState)
      case 'textile_dyeing_machine':
        return this.simulateDyeingMachine(params, newState)
      case 'fabric_cutting_machine':
        return this.simulateCuttingMachine(params, newState)
    }

    // AI-generated or unknown — derive a plausible model from parameters
    return this.simulateParameterDriven(machine, newState)
  }

  /**
   * Derives temperature, rpm, pressure, throughput, and energy targets from
   * parameter names so AI-generated machines produce useful telemetry.
   */
  private simulateParameterDriven(
    machine: MachineConfig,
    state: MachineSimState
  ): MachineSimState {
    const def = findMachineDefinition(machine.type, this.customIndustries)
    const p = machine.parameters
    const has = (key: string) => p[key] !== undefined

    // Lookup helpers
    const get = (keys: string[], fallback: number) => {
      for (const k of keys) {
        if (p[k] !== undefined) return p[k]
        // fuzzy match
        const found = Object.keys(p).find((pk) => pk.includes(k))
        if (found) return p[found]
      }
      return fallback
    }

    // Temperature target
    const tempTarget = get(['temperature', 'tank_temperature', 'press_temperature', 'water_temperature'], 30)
    state.temperature += (tempTarget - state.temperature) * 0.08 + (Math.random() - 0.5) * 1.2

    // RPM
    const rpmTarget = get(['rpm', 'rotation_speed', 'drum_speed', 'mixing_speed', 'speed', 'cycle_rate'], 500)
    state.rpm = rpmTarget + (Math.random() - 0.5) * (rpmTarget * 0.05)

    // Pressure
    const pressureTarget = get(['pressure', 'pressure_level', 'steam_pressure', 'hydraulic_pressure'], 1)
    state.pressure = pressureTarget + (Math.random() - 0.5) * 0.4

    // Energy
    const energyTarget = get(['energy_usage', 'energy_consumption', 'power_consumption', 'heating_load', 'fuel_consumption'], 20)
    state.energyConsumption = energyTarget * (0.9 + Math.random() * 0.2)

    // Throughput target — try several
    const throughputTarget = get(['throughput', 'shredding_rate', 'feed_rate', 'intake_rate', 'cutting_speed', 'inspection_speed', 'packaging_rate'], 200)

    // Wear & efficiency progression
    state.wearLevel = Math.min(100, state.wearLevel + 0.012 + (state.rpm > rpmTarget * 1.2 ? 0.04 : 0))
    state.efficiency = Math.max(45, 95 - state.wearLevel * 0.4 + (Math.random() - 0.5) * 4)

    state.throughput = throughputTarget * (state.efficiency / 100)
    state.materialFlow = state.throughput

    // Vibration grows with wear, especially for rotating machines
    const rotating = state.rpm > 100
    state.vibration = (rotating ? 2 : 1) + state.wearLevel * (rotating ? 0.18 : 0.05) + (Math.random() - 0.5) * 1.2

    // Failure probability
    const overheating = state.temperature > tempTarget * 1.4 + 20
    const overpressure = state.pressure > pressureTarget * 1.5 + 1
    if (overheating) state.failureProbability = Math.min(95, state.failureProbability + 0.6)
    if (overpressure) state.failureProbability = Math.min(95, state.failureProbability + 0.4)
    if (state.wearLevel > 70) state.failureProbability = Math.min(95, state.failureProbability + 0.25)

    void def // currently unused but kept for future per-output customization
    return state
  }

  private simulateShredder(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const rpm = params.rpm || 5000
    const targetTemp = 40 + (rpm / 10000) * 80

    state.temperature += (targetTemp - state.temperature) * 0.1 + (Math.random() - 0.5) * 2
    state.rpm = rpm + (Math.random() - 0.5) * 100

    state.wearLevel = Math.min(100, state.wearLevel + 0.01 + (rpm > 7000 ? 0.05 : 0))
    state.vibration = 2 + state.wearLevel * 0.3 + (Math.random() - 0.5) * 2
    state.efficiency = Math.max(40, 95 - state.wearLevel * 0.5)
    state.energyConsumption = 30 + (rpm / 10000) * 100 + Math.random() * 5
    state.throughput = (params.shredding_rate || 800) * (state.efficiency / 100)
    state.materialFlow = state.throughput

    if (rpm > 7000) state.failureProbability = Math.min(95, state.failureProbability + 0.5)
    if (state.temperature > 100) state.failureProbability = Math.min(95, state.failureProbability + 1)
    if (state.vibration > 20) state.failureProbability = Math.min(95, state.failureProbability + 0.3)

    state.pressure = 1 + Math.random() * 0.5
    return state
  }

  private simulateChemicalTank(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const targetTemp = params.tank_temperature || 85
    const pressure = params.pressure || 3

    state.temperature += (targetTemp - state.temperature) * 0.05 + (Math.random() - 0.5) * 1
    state.pressure = pressure + (Math.random() - 0.5) * 0.3
    state.rpm = params.mixing_speed || 120

    const tempEfficiency = state.temperature > 70 && state.temperature < 100 ? 90 : 70
    state.efficiency = tempEfficiency + (Math.random() - 0.5) * 5

    state.energyConsumption = (params.heating_coil_power || 45) + Math.random() * 5
    state.throughput = (params.tank_volume || 2000) * 0.01 * (state.efficiency / 100)
    state.materialFlow = state.throughput

    if (state.temperature > 150) state.failureProbability = Math.min(90, state.failureProbability + 2)

    state.vibration = 1 + Math.random() * 2
    return state
  }

  private simulateFilterPress(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const pressure = params.pressure_level || 8
    state.pressure = pressure + (Math.random() - 0.5) * 1
    state.temperature = 30 + Math.random() * 10
    state.wearLevel = Math.min(100, state.wearLevel + 0.02)
    state.efficiency = Math.max(50, 95 - state.wearLevel * 0.4)
    state.energyConsumption = 15 + pressure * 2 + Math.random() * 3
    state.throughput = (params.slurry_input || 500) * (state.efficiency / 100)
    state.materialFlow = state.throughput * 0.85
    state.rpm = 0
    state.vibration = 1 + Math.random()
    if (state.wearLevel > 70) state.failureProbability = Math.min(80, state.failureProbability + 0.5)
    return state
  }

  private simulateBoiler(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const targetPressure = params.steam_pressure || 6
    const safetyLimit = params.safety_pressure || 12
    state.pressure = targetPressure + (Math.random() - 0.5) * 0.5
    state.temperature = 100 + state.pressure * 15 + (Math.random() - 0.5) * 5
    state.energyConsumption = (params.fuel_consumption || 30) * 0.8 + Math.random() * 5
    state.efficiency = 85 + (Math.random() - 0.5) * 10
    state.throughput = (params.heat_output || 200) * (state.efficiency / 100)
    state.rpm = 0
    state.vibration = 2 + Math.random() * 3
    state.materialFlow = state.throughput
    if (state.pressure > safetyLimit * 0.8) state.failureProbability = Math.min(90, state.failureProbability + 1)
    return state
  }

  private simulateDyeingMachine(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const targetTemp = params.dye_temperature || 80
    state.temperature += (targetTemp - state.temperature) * 0.08 + (Math.random() - 0.5) * 1.5
    state.rpm = (params.rotation_speed || 30) + (Math.random() - 0.5) * 5
    state.pressure = 1 + Math.random() * 0.3
    state.energyConsumption = (params.heating_load || 35) + Math.random() * 3
    state.efficiency = 80 + (Math.random() - 0.5) * 10
    state.throughput = 50 + state.efficiency * 0.5
    state.materialFlow = state.throughput
    state.vibration = 1 + Math.random() * 2
    if (state.temperature > 120) state.failureProbability = Math.min(70, state.failureProbability + 0.5)
    return state
  }

  private simulateCuttingMachine(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const speed = params.cutting_speed || 15
    state.temperature = 25 + speed * 1.5 + (Math.random() - 0.5) * 3
    state.rpm = speed * 100 + (Math.random() - 0.5) * 50
    state.wearLevel = Math.min(100, state.wearLevel + 0.015)
    state.efficiency = Math.max(60, 95 - state.wearLevel * 0.3)
    state.energyConsumption = (params.power_consumption || 8) + speed * 0.3 + Math.random() * 2
    state.throughput = speed * (state.efficiency / 100) * 10
    state.materialFlow = state.throughput
    state.pressure = 1
    state.vibration = 2 + state.wearLevel * 0.1 + Math.random() * 2
    return state
  }

  private getMachineState(state: MachineSimState): string {
    if (state.failureProbability > 70) return 'critical'
    if (state.failureProbability > 40 || state.temperature > 100) return 'warning'
    if (state.efficiency < 50) return 'degraded'
    return 'running'
  }

  private checkAlerts(machine: MachineConfig, state: MachineSimState) {
    const def: MachineDefinition | undefined =
      ALL_MACHINES.find((m) => m.type === machine.type) ||
      findMachineDefinition(machine.type, this.customIndustries)
    const machineName = def?.name || machine.name

    if (state.temperature > 120) {
      this.onAlert({
        id: `alert_${machine.id}_temp_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'critical',
        category: 'temperature',
        message: `Overheating detected: ${state.temperature.toFixed(1)}°C exceeds safe threshold`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    } else if (state.temperature > 90) {
      this.onAlert({
        id: `alert_${machine.id}_temp_warn_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'warning',
        category: 'temperature',
        message: `High temperature: ${state.temperature.toFixed(1)}°C approaching limit`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    if (state.vibration > 25) {
      this.onAlert({
        id: `alert_${machine.id}_vib_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'critical',
        category: 'vibration',
        message: `Abnormal vibration: ${state.vibration.toFixed(1)} mm/s — possible mechanical failure`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    if (state.failureProbability > 60) {
      this.onAlert({
        id: `alert_${machine.id}_fail_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'critical',
        category: 'failure',
        message: `High failure probability: ${state.failureProbability.toFixed(0)}% — immediate maintenance recommended`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    if (state.wearLevel > 80) {
      this.onAlert({
        id: `alert_${machine.id}_maint_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'warning',
        category: 'maintenance',
        message: `Component wear at ${state.wearLevel.toFixed(0)}% — schedule maintenance`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }

    if (state.pressure > 10) {
      this.onAlert({
        id: `alert_${machine.id}_press_${Date.now()}`,
        machineId: machine.id,
        machineName,
        type: 'critical',
        category: 'pressure',
        message: `Pressure anomaly: ${state.pressure.toFixed(1)} bar exceeds safety threshold`,
        timestamp: Date.now(),
        acknowledged: false,
      })
    }
  }
}

interface MachineSimState {
  temperature: number
  rpm: number
  pressure: number
  throughput: number
  energyConsumption: number
  efficiency: number
  failureProbability: number
  vibration: number
  wearLevel: number
  materialFlow: number
  uptime: number
}
