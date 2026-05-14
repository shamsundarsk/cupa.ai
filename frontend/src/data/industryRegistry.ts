import { BUILT_IN_INDUSTRIES, BuiltInIndustryMeta, ALL_MACHINES } from '@/data/machines'
import { CustomIndustry, MachineDefinition } from '@/types'

export interface IndustryEntry {
  id: string
  name: string
  description: string
  icon: string
  features: string[]
  machineCount: number
  machines: MachineDefinition[]
  aiGenerated: boolean
}

export function buildIndustryEntries(custom: CustomIndustry[]): IndustryEntry[] {
  const builtIns: IndustryEntry[] = BUILT_IN_INDUSTRIES.map((b: BuiltInIndustryMeta) => ({
    ...b,
    aiGenerated: false,
  }))
  const customEntries: IndustryEntry[] = custom.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: 'sparkles',
    features: c.features,
    machineCount: c.machines.length,
    machines: c.machines,
    aiGenerated: true,
  }))
  return [...builtIns, ...customEntries]
}

/** Resolve all available machine definitions for a given industry id. */
export function machinesForIndustry(
  industryId: string | null,
  custom: CustomIndustry[]
): MachineDefinition[] {
  if (!industryId) return []
  const entry = buildIndustryEntries(custom).find((e) => e.id === industryId)
  return entry ? entry.machines : []
}

/**
 * Look up a machine definition by type across all known sources.
 * The simulation engine and 3D scene both rely on this for AI-generated types.
 */
export function findMachineDefinition(
  type: string,
  custom: CustomIndustry[]
): MachineDefinition | undefined {
  for (const m of ALL_MACHINES) {
    if (m.type === type) return m
  }
  for (const c of custom) {
    for (const m of c.machines) {
      if (m.type === type) return m
    }
  }
  return undefined
}
