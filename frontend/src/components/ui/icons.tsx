'use client'

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Atom,
  BatteryCharging,
  Beaker,
  Bot,
  Box,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDashed,
  Cog,
  Copy,
  Cpu,
  Droplets,
  Factory,
  Flame,
  Gauge,
  Globe,
  Hammer,
  Hexagon,
  Info,
  LayoutDashboard,
  Lightbulb,
  Magnet,
  PackageOpen,
  PieChart,
  Play,
  Plus,
  Rocket,
  Scissors,
  Settings,
  Shirt,
  ShieldCheck,
  Sparkles,
  Square,
  Thermometer,
  Trash2,
  Truck,
  Wand2,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type {LucideIcon}

/**
 * Maps a machine icon hint (either a built-in name or a free-form keyword
 * from the AI generator) to a Lucide icon component. The lookup is
 * case-insensitive and tries the most specific match first.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  // generic
  default: Cog,
  factory: Factory,
  machine: Cog,
  cog: Cog,
  gear: Cog,
  settings: Settings,

  // battery
  battery: BatteryCharging,
  battery_recycling: BatteryCharging,
  intake: Truck,
  conveyor: Truck,
  sorting: CheckSquare,
  shredder: Hammer,
  magnetic: Magnet,
  separator: Magnet,
  chemical: Beaker,
  beaker: Beaker,
  filter: Wind,
  press: Hammer,
  drying: Wind,
  storage: Box,
  packaging: PackageOpen,
  waste: Wind,
  gas: Wind,

  // textile
  textile: Shirt,
  apparel: Shirt,
  apparel_textile: Shirt,
  fabric: Shirt,
  cutting: Scissors,
  scissors: Scissors,
  dyeing: Droplets,
  dye: Droplets,
  sewing: Shirt,
  steam: Wind,
  boiler: Flame,
  heat: Flame,
  flame: Flame,
  washing: Droplets,
  water: Droplets,
  inspection: ShieldCheck,
  quality: ShieldCheck,
  hazard: AlertTriangle,
  containment: AlertTriangle,
  safety: ShieldCheck,

  // generic processes the AI tends to produce
  mixer: Atom,
  mixing: Atom,
  reactor: Atom,
  oven: Flame,
  furnace: Flame,
  cooler: Wind,
  cooling: Wind,
  pump: Activity,
  compressor: Cpu,
  motor: Cog,
  robot: Bot,
  assembly: Cog,
  print: Box,
  printing: Box,
  laser: Zap,
  electric: Zap,
  power: Zap,
}

const KEYWORD_PRIORITY = [
  'shredder',
  'magnetic',
  'separator',
  'chemical',
  'filter',
  'press',
  'drying',
  'dye',
  'dyeing',
  'cutting',
  'sewing',
  'washing',
  'storage',
  'packaging',
  'inspection',
  'quality',
  'hazard',
  'containment',
  'safety',
  'boiler',
  'steam',
  'heat',
  'oven',
  'furnace',
  'reactor',
  'mixer',
  'mixing',
  'pump',
  'cooler',
  'cooling',
  'compressor',
  'robot',
  'laser',
  'conveyor',
  'intake',
  'sorting',
  'battery',
  'fabric',
  'textile',
  'water',
] as const

export function resolveMachineIcon(hint: string | undefined | null): LucideIcon {
  if (!hint) return ICON_REGISTRY.default
  const normalized = hint.toLowerCase()

  // Exact match
  if (ICON_REGISTRY[normalized]) return ICON_REGISTRY[normalized]

  // Keyword scan in priority order so 'magnetic_separator' picks 'magnetic'
  for (const key of KEYWORD_PRIORITY) {
    if (normalized.includes(key)) return ICON_REGISTRY[key]
  }

  return ICON_REGISTRY.default
}

export function MachineIcon({
  hint,
  className,
  size = 20,
}: {
  hint?: string | null
  className?: string
  size?: number
}) {
  const Icon = resolveMachineIcon(hint)
  return <Icon className={className} size={size} aria-hidden />
}

// Re-export the icons used directly throughout the UI so consumers don't
// have to know about lucide-react.
export {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDashed,
  Cog,
  Copy,
  Cpu,
  Factory,
  Gauge,
  Globe,
  Hexagon,
  Info,
  LayoutDashboard,
  Lightbulb,
  PieChart,
  Play,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  Square,
  Thermometer,
  Trash2,
  Wand2,
  Wrench,
  Zap,
}
