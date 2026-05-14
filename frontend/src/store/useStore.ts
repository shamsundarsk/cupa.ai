import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Industry,
  MachineConfig,
  SimulationState,
  TelemetryData,
  Alert,
  CustomIndustry,
} from '@/types'

interface AppState {
  // Auth
  user: { id: string; name: string; role: string } | null
  setUser: (user: AppState['user']) => void

  // Industry & Factory
  selectedIndustry: Industry | null
  setSelectedIndustry: (industry: Industry) => void
  resetIndustry: () => void
  factoryLayout: 'small' | 'medium' | 'enterprise' | 'custom'
  setFactoryLayout: (layout: AppState['factoryLayout']) => void

  // Custom (AI-generated) industries
  customIndustries: CustomIndustry[]
  addCustomIndustry: (industry: CustomIndustry) => void
  removeCustomIndustry: (id: string) => void

  // Machines
  machines: MachineConfig[]
  addMachine: (machine: MachineConfig) => void
  removeMachine: (id: string) => void
  updateMachine: (id: string, updates: Partial<MachineConfig>) => void
  setMachines: (machines: MachineConfig[]) => void

  // Simulation
  simulation: SimulationState
  setSimulation: (state: Partial<SimulationState>) => void
  startSimulation: () => void
  stopSimulation: () => void

  // Telemetry
  telemetryData: Record<string, TelemetryData>
  updateTelemetry: (machineId: string, data: TelemetryData) => void

  // Alerts
  alerts: Alert[]
  addAlert: (alert: Alert) => void
  dismissAlert: (id: string) => void

  // Digital Twin
  twinConnected: boolean
  simulationKey: string | null
  setSimulationKey: (key: string) => void
  connectTwin: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: { id: '1', name: 'Admin', role: 'factory_owner' },
      setUser: (user) => set({ user }),

      // Industry
      selectedIndustry: null,
      setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
      resetIndustry: () =>
        set({
          selectedIndustry: null,
          machines: [],
          telemetryData: {},
          alerts: [],
          simulation: {
            status: 'idle',
            key: null,
            startTime: null,
            tickRate: 1000,
            machineStates: {},
          },
          simulationKey: null,
        }),
      factoryLayout: 'medium',
      setFactoryLayout: (layout) => set({ factoryLayout: layout }),

      // Custom industries
      customIndustries: [],
      addCustomIndustry: (industry) =>
        set((state) => ({ customIndustries: [...state.customIndustries, industry] })),
      removeCustomIndustry: (id) =>
        set((state) => ({
          customIndustries: state.customIndustries.filter((i) => i.id !== id),
        })),

      // Machines
      machines: [],
      addMachine: (machine) => set((state) => ({ machines: [...state.machines, machine] })),
      removeMachine: (id) => set((state) => ({ machines: state.machines.filter((m) => m.id !== id) })),
      updateMachine: (id, updates) =>
        set((state) => ({
          machines: state.machines.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      setMachines: (machines) => set({ machines }),

      // Simulation
      simulation: {
        status: 'idle',
        key: null,
        startTime: null,
        tickRate: 1000,
        machineStates: {},
      },
      setSimulation: (updates) =>
        set((state) => ({ simulation: { ...state.simulation, ...updates } })),
      startSimulation: () => {
        const key = generateSimulationKey(get().selectedIndustry)
        set((state) => ({
          simulation: {
            ...state.simulation,
            status: 'running',
            key,
            startTime: Date.now(),
          },
          simulationKey: key,
        }))
      },
      stopSimulation: () =>
        set((state) => ({ simulation: { ...state.simulation, status: 'stopped' } })),

      // Telemetry
      telemetryData: {},
      updateTelemetry: (machineId, data) =>
        set((state) => ({ telemetryData: { ...state.telemetryData, [machineId]: data } })),

      // Alerts
      alerts: [],
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 100) })),
      dismissAlert: (id) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

      // Digital Twin
      twinConnected: false,
      simulationKey: null,
      setSimulationKey: (key) => set({ simulationKey: key }),
      connectTwin: () => set({ twinConnected: true }),
    }),
    {
      name: 'porygon-os-store',
      partialize: (state) => ({
        user: state.user,
        selectedIndustry: state.selectedIndustry,
        factoryLayout: state.factoryLayout,
        customIndustries: state.customIndustries,
        machines: state.machines,
        simulation: state.simulation,
        simulationKey: state.simulationKey,
        telemetryData: state.telemetryData,
        alerts: state.alerts,
      }),
    }
  )
)

function generateSimulationKey(industry: Industry | null): string {
  let prefix = 'CUST'
  if (industry === 'battery_recycling') prefix = 'BATT'
  else if (industry === 'apparel_textile') prefix = 'TEXT'
  else if (typeof industry === 'string' && industry.length > 0) {
    prefix = industry.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CUST'
  }
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  const suffix =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    Math.floor(Math.random() * 99).toString().padStart(2, '0')
  return `SIM-${prefix}-${num}-${suffix}`
}
