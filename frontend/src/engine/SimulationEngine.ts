import { MachineConfig, TelemetryData, Alert, MachineType } from '@/types'
import { BATTERY_RECYCLING_MACHINES, TEXTILE_MACHINES, ALL_MACHINES } from '@/data/machines'

export class SimulationEngine {
  private machines: MachineConfig[] = []
  private interval: NodeJS.Timeout | null = null
  private tickRate: number = 1000
  private onTelemetry: (machineId: string, data: TelemetryData) => void
  private onAlert: (alert: Alert) => void
  private machineStates: Map<string, MachineSimState> = new Map()

  constructor(
    machines: MachineConfig[],
    tickRate: number,
    onTelemetry: (machineId: string, data: TelemetryData) => void,
    onAlert: (alert: Alert) => void
  ) {
    this.machines = machines
    this.tickRate = tickRate
    this.onTelemetry = onTelemetry
    this.onAlert = onAlert
    this.initializeStates()
  }

  private initializeStates() {
    this.machines.forEach(machine => {
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
    this.machines.forEach((machine, index) => {
      const state = this.machineStates.get(machine.id)
      if (!state) return

      // Apply simulation rules based on machine type
      const updatedState = this.simulateMachine(machine, state, index)
      this.machineStates.set(machine.id, updatedState)

      // Generate telemetry
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

      // Check for alerts
      this.checkAlerts(machine, updatedState)
    })
  }

  private simulateMachine(machine: MachineConfig, state: MachineSimState, index: number): MachineSimState {
    const params = machine.parameters
    const newState = { ...state }
    newState.uptime += this.tickRate / 1000

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
      default:
        return this.simulateGeneric(params, newState)
    }
  }

  private simulateShredder(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const rpm = params.rpm || 5000
    const targetTemp = 40 + (rpm / 10000) * 80 // Higher RPM = higher temp
    
    // Temperature dynamics
    state.temperature += (targetTemp - state.temperature) * 0.1 + (Math.random() - 0.5) * 2
    state.rpm = rpm + (Math.random() - 0.5) * 100
    
    // Blade wear increases over time
    state.wearLevel = Math.min(100, state.wearLevel + 0.01 + (rpm > 7000 ? 0.05 : 0))
    
    // Vibration correlates with wear
    state.vibration = 2 + state.wearLevel * 0.3 + (Math.random() - 0.5) * 2
    
    // Efficiency decreases with wear
    state.efficiency = Math.max(40, 95 - state.wearLevel * 0.5)
    
    // Energy consumption
    state.energyConsumption = 30 + (rpm / 10000) * 100 + Math.random() * 5
    
    // Throughput
    state.throughput = (params.shredding_rate || 800) * (state.efficiency / 100)
    state.materialFlow = state.throughput
    
    // Failure probability
    if (rpm > 7000) {
      state.failureProbability = Math.min(95, state.failureProbability + 0.5)
    }
    if (state.temperature > 100) {
      state.failureProbability = Math.min(95, state.failureProbability + 1)
    }
    if (state.vibration > 20) {
      state.failureProbability = Math.min(95, state.failureProbability + 0.3)
    }
    
    state.pressure = 1 + Math.random() * 0.5
    return state
  }

  private simulateChemicalTank(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const targetTemp = params.tank_temperature || 85
    const pressure = params.pressure || 3
    
    state.temperature += (targetTemp - state.temperature) * 0.05 + (Math.random() - 0.5) * 1
    state.pressure = pressure + (Math.random() - 0.5) * 0.3
    state.rpm = params.mixing_speed || 120
    
    // Extraction efficiency based on temperature
    const tempEfficiency = state.temperature > 70 && state.temperature < 100 ? 90 : 70
    state.efficiency = tempEfficiency + (Math.random() - 0.5) * 5
    
    state.energyConsumption = (params.heating_coil_power || 45) + Math.random() * 5
    state.throughput = (params.tank_volume || 2000) * 0.01 * (state.efficiency / 100)
    state.materialFlow = state.throughput
    
    // Hazard from overheating
    if (state.temperature > 150) {
      state.failureProbability = Math.min(90, state.failureProbability + 2)
    }
    
    state.vibration = 1 + Math.random() * 2
    return state
  }

  private simulateFilterPress(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const pressure = params.pressure_level || 8
    
    state.pressure = pressure + (Math.random() - 0.5) * 1
    state.temperature = 30 + Math.random() * 10
    
    // Filter clogging increases over time
    state.wearLevel = Math.min(100, state.wearLevel + 0.02)
    
    // Efficiency drops with clogging
    state.efficiency = Math.max(50, 95 - state.wearLevel * 0.4)
    
    state.energyConsumption = 15 + pressure * 2 + Math.random() * 3
    state.throughput = (params.slurry_input || 500) * (state.efficiency / 100)
    state.materialFlow = state.throughput * 0.85 // Recovery rate
    
    state.rpm = 0
    state.vibration = 1 + Math.random()
    
    if (state.wearLevel > 70) {
      state.failureProbability = Math.min(80, state.failureProbability + 0.5)
    }
    
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
    
    // Pressure safety
    if (state.pressure > safetyLimit * 0.8) {
      state.failureProbability = Math.min(90, state.failureProbability + 1)
    }
    
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
    
    if (state.temperature > 120) {
      state.failureProbability = Math.min(70, state.failureProbability + 0.5)
    }
    
    return state
  }

  private simulateCuttingMachine(params: Record<string, number>, state: MachineSimState): MachineSimState {
    const speed = params.cutting_speed || 15
    
    state.temperature = 25 + speed * 1.5 + (Math.random() - 0.5) * 3
    state.rpm = speed * 100 + (Math.random() - 0.5) * 50
    
    // Blade sharpness degrades
    state.wearLevel = Math.min(100, state.wearLevel + 0.015)
    
    state.efficiency = Math.max(60, 95 - state.wearLevel * 0.3)
    state.energyConsumption = (params.power_consumption || 8) + speed * 0.3 + Math.random() * 2
    state.throughput = speed * (state.efficiency / 100) * 10
    state.materialFlow = state.throughput
    
    state.pressure = 1
    state.vibration = 2 + state.wearLevel * 0.1 + Math.random() * 2
    
    return state
  }

  private simulateGeneric(params: Record<string, number>, state: MachineSimState): MachineSimState {
    state.temperature += (Math.random() - 0.5) * 3
    state.temperature = Math.max(20, Math.min(120, state.temperature))
    state.rpm = 1000 + Math.random() * 500
    state.pressure = 1 + Math.random() * 2
    state.efficiency = 80 + (Math.random() - 0.5) * 10
    state.energyConsumption = 20 + Math.random() * 30
    state.throughput = 100 + Math.random() * 50
    state.materialFlow = state.throughput
    state.vibration = 2 + Math.random() * 3
    state.wearLevel = Math.min(100, state.wearLevel + 0.01)
    return state
  }

  private getMachineState(state: MachineSimState): string {
    if (state.failureProbability > 70) return 'critical'
    if (state.failureProbability > 40 || state.temperature > 100) return 'warning'
    if (state.efficiency < 50) return 'degraded'
    return 'running'
  }

  private checkAlerts(machine: MachineConfig, state: MachineSimState) {
    const def = ALL_MACHINES.find(m => m.type === machine.type)
    const machineName = def?.name || machine.name

    // Temperature alerts
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

    // Vibration alerts
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

    // Failure probability
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

    // Maintenance alerts
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

    // Pressure alerts
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
