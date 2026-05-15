'use client'

/**
 * Reusable 3D machine geometries for the digital twin.
 *
 * Architecture:
 *   - 13 distinct mesh families covering the full ALLOWED_ICON_HINTS taxonomy
 *     in industryGenerator.ts (battery, textile, paper, food, metal, pharma,
 *     plastics, electronics, power, storage, generic, and a few others).
 *   - An ICON_TO_FAMILY lookup maps every allowed icon to one of those
 *     families.
 *   - `MachineMesh` is a single dispatcher that takes a machine + telemetry
 *     and renders the right family component with telemetry-driven visuals
 *     applied uniformly: heat glow, pulse, vibration shake, RPM rotation,
 *     warning light, smoke when critical.
 *
 * No external textures or models are loaded — everything is procedural so
 * the scene boots instantly.
 */

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared palette                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const STEEL = '#9aa3ad'
const STEEL_DARK = '#5a6470'
const STEEL_LIGHT = '#cfd6dd'
const PAINT = '#d8a52b' // industrial yellow
const PAINT_BLUE = '#3b82f6'
const PAINT_RED = '#dc2626'
const PAINT_GREEN = '#16a34a'
const PANEL = '#1f2937'
const ACCENT = '#22d3ee'
const RUBBER = '#1f2937'
const GLASS = '#7dd3fc'
const COPPER = '#c87533'

/* ────────────────────────────────────────────────────────────────────────── */
/* Public types                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export interface MachineLike {
  id: string
  type: string
  name: string
  parameters: Record<string, number>
}

export interface TelemetryLike {
  temperature: number
  rpm: number
  pressure: number
  throughput: number
  energyConsumption: number
  machineState: string
  failureProbability: number
  vibration: number
}

export type MeshFamily =
  | 'conveyor'
  | 'crusher'
  | 'tank'
  | 'furnace'
  | 'press'
  | 'rotational'
  | 'liquid'
  | 'cutting'
  | 'sorting'
  | 'textile'
  | 'power'
  | 'storage'
  | 'generic'

/* Legacy variant alias kept for any callers that still import the old type. */
export type MeshVariant = MeshFamily | 'shredder' | 'mixer' | 'sewing' | 'oven' | 'separator' | 'inspection' | 'packaging' | 'robot' | 'pump' | 'boiler' | 'hazard'

/* ────────────────────────────────────────────────────────────────────────── */
/* Icon → family mapping                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export const ICON_TO_FAMILY: Record<string, MeshFamily> = {
  // Conveyor family
  conveyor: 'conveyor', intake: 'conveyor',

  // Crusher family
  shredder: 'crusher', grinder: 'crusher', pulper: 'crusher',
  refiner: 'crusher', granulator: 'crusher', deinker: 'crusher',
  pelletizer: 'crusher',

  // Tank family
  chemical: 'tank', reactor: 'tank', dyeing: 'tank',
  fermenter: 'tank', lyophilizer: 'tank', autoclave: 'tank',
  pasteurizer: 'tank', mixer: 'tank', mixing: 'tank',
  beaker: 'tank',

  // Furnace family
  furnace: 'furnace', oven: 'furnace', reflow_oven: 'furnace',
  fryer: 'furnace', cooker: 'furnace', heating: 'furnace',
  drying: 'furnace', kiln: 'furnace', heat: 'furnace',
  flame: 'furnace', boiler: 'furnace',

  // Press family
  press: 'press', press_paper: 'press', forge: 'press',
  stamping: 'press', tablet_press: 'press', calender: 'press',
  injection_molder: 'press', blow_molder: 'press',
  thermoformer: 'press', forming: 'press', extruder: 'press',
  kneader: 'press', ironing: 'press',

  // Rotational family
  lathe: 'rotational', cnc: 'rotational', milling: 'rotational',
  spinning: 'rotational', centrifuge: 'rotational',
  rolling_mill: 'rotational', reel: 'rotational',
  weaving: 'rotational', motor: 'rotational',

  // Liquid handling family
  bottling: 'liquid', capper: 'liquid', labeler: 'liquid',
  filter: 'liquid', pump: 'liquid', compressor: 'liquid',
  capsule_filler: 'liquid', coater: 'liquid', water: 'liquid',

  // Cutting / tool family
  cutting: 'cutting', laser: 'cutting', welder: 'cutting',
  soldering: 'cutting', pick_and_place: 'cutting',
  pcb_etch: 'cutting', casting: 'cutting',

  // Sorting / inspection family
  sorting: 'sorting', inspection: 'sorting', magnetic: 'sorting',
  separator: 'sorting', quality: 'sorting',

  // Textile family
  sewing: 'textile', fabric: 'textile', washing: 'textile',
  printing: 'textile',

  // Power / utility family
  turbine: 'power', generator: 'power', transformer: 'power',
  cooling_tower: 'power', electric: 'power', power: 'power',
  cooling: 'power', cooler: 'power', freezer: 'power',

  // Storage / packaging family
  storage: 'storage', waste: 'storage', packaging: 'storage',

  // Battery / catch-all
  battery: 'tank',

  // Generic
  cog: 'generic', factory: 'generic', assembly: 'generic',
  hazard: 'generic',
  // Special-case textile assembly
  robot: 'rotational',
}

export function familyFor(icon: string | undefined): MeshFamily {
  if (!icon) return 'generic'
  return ICON_TO_FAMILY[icon.toLowerCase()] ?? 'generic'
}

/**
 * Legacy keyword picker, kept so the older code paths that imported
 * `pickMeshVariant(machine.type)` keep working. New code should prefer the
 * icon → family path via `familyFor(machine.icon)`.
 */
export function pickMeshVariant(type: string): MeshFamily {
  const t = (type || '').toLowerCase()
  if (t.includes('conveyor') || t.includes('intake') || t.includes('belt')) return 'conveyor'
  if (t.includes('shredder') || t.includes('grind') || t.includes('crush') || t.includes('mill') || t.includes('pulper') || t.includes('refiner') || t.includes('granulat')) return 'crusher'
  if (t.includes('cutting') || t.includes('cut') || t.includes('laser') || t.includes('weld') || t.includes('solder') || t.includes('pick_and_place')) return 'cutting'
  if (t.includes('separator') || t.includes('magnet') || t.includes('inspection') || t.includes('quality') || t.includes('sorting') || t.includes('sort')) return 'sorting'
  if (t.includes('press') || t.includes('forge') || t.includes('stamp') || t.includes('mold') || t.includes('thermoform') || t.includes('extrude') || t.includes('calender')) return 'press'
  if (t.includes('lathe') || t.includes('cnc') || t.includes('centrifuge') || t.includes('rolling') || t.includes('spin') || t.includes('weav')) return 'rotational'
  if (t.includes('oven') || t.includes('furnace') || t.includes('drying') || t.includes('dry') || t.includes('kiln') || t.includes('cook') || t.includes('fry') || t.includes('pasteur') || t.includes('boiler')) return 'furnace'
  if (t.includes('tank') || t.includes('chemical') || t.includes('reactor') || t.includes('mixer') || t.includes('mix') || t.includes('blend') || t.includes('ferment') || t.includes('autoclave') || t.includes('lyophil') || t.includes('dyeing')) return 'tank'
  if (t.includes('storage') || t.includes('silo') || t.includes('packaging') || t.includes('pack') || t.includes('waste')) return 'storage'
  if (t.includes('sewing') || t.includes('stitch') || t.includes('fabric') || t.includes('washing') || t.includes('iron')) return 'textile'
  if (t.includes('turbine') || t.includes('generator') || t.includes('transformer') || t.includes('cooling') || t.includes('cooler') || t.includes('freezer') || t.includes('power')) return 'power'
  if (t.includes('pump') || t.includes('compressor') || t.includes('bottling') || t.includes('capper') || t.includes('label') || t.includes('filter')) return 'liquid'
  return 'generic'
}

/**
 * Approximate height of the largest visible feature for label placement.
 */
export function meshHeight(family: MeshFamily): number {
  switch (family) {
    case 'conveyor': return 1.6
    case 'crusher': return 3.4
    case 'tank': return 4.0
    case 'furnace': return 3.6
    case 'press': return 3.6
    case 'rotational': return 2.4
    case 'liquid': return 2.6
    case 'cutting': return 2.5
    case 'sorting': return 2.8
    case 'textile': return 2.4
    case 'power': return 3.2
    case 'storage': return 4.5
    case 'generic': return 2.4
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Telemetry → visual derivation                                               */
/* ────────────────────────────────────────────────────────────────────────── */

interface DerivedVisuals {
  active: boolean
  /** 0..1 normalized heat factor used for emissive glow. */
  heat: number
  /** Whether to pulse the heat (very hot / over threshold). */
  heatPulse: boolean
  /** 0..1 vibration intensity, > 0.7 triggers visible shake. */
  vibration: number
  /** RPM normalized to a sensible spin speed in radians/second. */
  spinSpeed: number
  /** Show critical warning light (red, pulsing). */
  warning: boolean
  /** Show smoke particles. */
  smoke: boolean
  /** Status / tone color used by indicators. */
  statusColor: string
}

function deriveVisuals(t: TelemetryLike | undefined, isActiveFlow: boolean): DerivedVisuals {
  if (!t) {
    return {
      active: isActiveFlow,
      heat: 0,
      heatPulse: false,
      vibration: 0,
      spinSpeed: 0,
      warning: false,
      smoke: false,
      statusColor: '#94a3b8',
    }
  }

  const state = t.machineState
  const heat = Math.min(1, Math.max(0, (t.temperature - 30) / 110)) // 30→0, 140→1
  const heatPulse = t.temperature > 110
  const vibration = Math.min(1, Math.max(0, t.vibration / 30))
  const spinSpeed = Math.min(8, Math.max(0, t.rpm / 1500))
  const warning = t.failureProbability > 80 || state === 'critical'
  const smoke = state === 'critical'
  const active = state === 'running' || state === 'warning' || isActiveFlow

  const statusColor =
    state === 'critical' ? '#ef4444' :
    state === 'warning' ? '#f59e0b' :
    state === 'running' ? '#22c55e' :
    '#94a3b8'

  return { active, heat, heatPulse, vibration, spinSpeed, warning, smoke, statusColor }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared sub-components                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function Frame({ size, color = STEEL_DARK }: { size: [number, number, number]; color?: string }) {
  const [w, h, d] = size
  const t = 0.06
  const y = h / 2
  const posts: [number, number, number][] = [
    [-w / 2 + t / 2, y, -d / 2 + t / 2],
    [w / 2 - t / 2, y, -d / 2 + t / 2],
    [-w / 2 + t / 2, y, d / 2 - t / 2],
    [w / 2 - t / 2, y, d / 2 - t / 2],
  ]
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[t, h, t]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, h, 0]}>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ControlPanel({
  position = [0, 1.1, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  active,
  statusColor,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  active: boolean
  statusColor: string
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.5, 0.08]} />
        <meshStandardMaterial color={PANEL} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.08, 0.045]}>
        <planeGeometry args={[0.55, 0.22]} />
        <meshStandardMaterial
          color="#020617"
          emissive={active ? ACCENT : '#0f172a'}
          emissiveIntensity={active ? 0.9 : 0.2}
          toneMapped={false}
        />
      </mesh>
      {[-0.18, 0, 0.18].map((x, i) => {
        const colors = ['#22c55e', '#f59e0b', statusColor]
        return (
          <mesh key={i} position={[x, -0.13, 0.05]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={colors[i]}
              emissiveIntensity={active ? 1.1 : 0.3}
              metalness={0.4}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Pipe({
  from,
  to,
  radius = 0.07,
  color = STEEL,
}: {
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  color?: string
}) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = new THREE.Vector3().subVectors(b, a)
  const length = dir.length()
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  )
  return (
    <group position={mid.toArray()} quaternion={orientation}>
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, length / 2 - 0.04, 0]}>
        <cylinderGeometry args={[radius * 1.6, radius * 1.6, 0.06, 16]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -length / 2 + 0.04, 0]}>
        <cylinderGeometry args={[radius * 1.6, radius * 1.6, 0.06, 16]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Bolts({ ring = 1.0, count = 8, y = 0 }: { ring?: number; count?: number; y?: number }) {
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * ring, 0, Math.sin(angle) * ring]}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.06, 6]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.9} roughness={0.3} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Heat-driven emissive overlay applied to a machine's housing color. */
function heatOverlay(base: string, heat: number): { color: string; emissive: string; emissiveIntensity: number } {
  if (heat < 0.05) {
    return { color: base, emissive: '#000000', emissiveIntensity: 0 }
  }
  // Below 0.4 → faint orange; above 0.4 → strong orange/red glow
  const emissive = heat < 0.4 ? '#ff8a3c' : '#ff4a1a'
  const intensity = Math.min(1.6, heat * 1.8)
  return { color: base, emissive, emissiveIntensity: intensity }
}

/** Top warning beacon, pulses when active. */
function WarningBeacon({ y, on }: { y: number; on: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = on ? 1.0 + Math.sin(Date.now() * 0.012) * 0.7 : 0
  })
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <sphereGeometry args={[0.18, 18, 18]} />
      <meshStandardMaterial
        color={on ? '#ef4444' : '#7f1d1d'}
        emissive="#ef4444"
        emissiveIntensity={0}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Crude "smoke" — a few semi-transparent puffs that drift up + fade. */
function Smoke({ y, on, color = '#1f2937' }: { y: number; on: boolean; color?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!groupRef.current || !on) {
      if (groupRef.current) groupRef.current.visible = false
      return
    }
    groupRef.current.visible = true
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      mesh.position.y += dt * (0.4 + i * 0.05)
      mesh.position.x += dt * (Math.sin(Date.now() * 0.001 + i) * 0.1)
      const scale = mesh.scale.x + dt * 0.3
      if (mesh.position.y > y + 2) {
        mesh.position.y = y
        mesh.position.x = (i - 2) * 0.15
        mesh.scale.setScalar(0.2)
      } else {
        mesh.scale.setScalar(scale)
      }
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.opacity = Math.max(0, 0.6 - (mesh.position.y - y) * 0.3)
    })
  })
  return (
    <group ref={groupRef}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[(i - 2) * 0.15, y + i * 0.2, 0]} scale={0.2 + i * 0.05}>
          <sphereGeometry args={[0.4, 10, 10]} />
          <meshStandardMaterial color={color} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 13 Mesh-family components                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

interface FamilyProps {
  machine: MachineLike
  telemetry?: TelemetryLike
  visuals: DerivedVisuals
  accent?: string
}

/** 1. Conveyor family — conveyors, intake, packaging belts. */
function ConveyorMesh({ visuals, accent = ACCENT }: FamilyProps) {
  const beltRef = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (!beltRef.current) return
    const mat = beltRef.current.material as THREE.MeshStandardMaterial
    if (mat.map && visuals.active) {
      mat.map.offset.x -= dt * 0.5 * Math.max(0.4, visuals.spinSpeed * 0.2)
    }
  })
  return (
    <group>
      {[-1.4, 1.4].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.5, 0.5]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[x, 0.5, -0.5]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh ref={beltRef} position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3.2, 0.06, 1.2]} />
        <meshStandardMaterial color={RUBBER} metalness={0.1} roughness={0.95} />
      </mesh>
      {[0.62, -0.62].map((z, i) => (
        <mesh key={i} position={[0, 1.05, z]}>
          <boxGeometry args={[3.2, 0.12, 0.06]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 1.25, 16]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[1.7, 0.85, 0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.5]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      <ControlPanel position={[-1.75, 1.4, 0]} rotation={[0, Math.PI / 2, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 2. Crusher family — shredder, grinder, pulper, refiner, granulator, deinker, pelletizer. */
function CrusherMesh({ visuals, accent = '#ff6b35' }: FamilyProps) {
  const drumRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (drumRef.current && visuals.active) drumRef.current.rotation.y += dt * (1 + visuals.spinSpeed * 0.4)
  })
  const heat = heatOverlay(STEEL, visuals.heat)
  return (
    <group>
      <Frame size={[2.4, 2.6, 2]} />
      <group position={[0, 2.1, 0]}>
        <mesh>
          <cylinderGeometry args={[1.1, 0.7, 0.7, 8]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
        </mesh>
        <Bolts ring={1.05} count={8} y={-0.05} />
      </group>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.1, 1.5, 1.7]} />
        <meshStandardMaterial color={heat.color} emissive={heat.emissive} emissiveIntensity={heat.emissiveIntensity} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Spinning drum visible inside hopper */}
      <group ref={drumRef} position={[0, 1.7, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 12]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.95} roughness={0.2} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.05, 0.4, 0.12]} />
              <meshStandardMaterial color={STEEL_LIGHT} metalness={0.95} roughness={0.15} />
            </mesh>
          )
        })}
      </group>
      <mesh position={[0, 1.2, 0.86]}>
        <boxGeometry args={[1, 0.9, 0.04]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Outflow chute */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.7, 0.6, 6]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <ControlPanel position={[0, 1.2, 1.06]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 3. Tank family — chemical, reactor, dyeing, fermenter, lyophilizer, autoclave, pasteurizer, mixer. */
function TankMesh({ machine, visuals, accent = PAINT_BLUE }: FamilyProps) {
  const bladeRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (bladeRef.current && visuals.active) bladeRef.current.rotation.y += dt * (1.5 + visuals.spinSpeed * 0.5)
  })
  const tankVolume = machine.parameters.tank_volume ?? machine.parameters.batch_size ?? 2000
  const h = Math.max(2, Math.min(3.4, 2.2 + (tankVolume / 6000) * 1.2))
  const heat = heatOverlay(STEEL, visuals.heat)
  return (
    <group>
      <mesh position={[0, h / 2 + 0.2, 0]} castShadow>
        <cylinderGeometry args={[1, 1, h, 24]} />
        <meshStandardMaterial color={heat.color} emissive={heat.emissive} emissiveIntensity={heat.emissiveIntensity} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, h + 0.55, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Agitator motor on top */}
      <group ref={bladeRef} position={[0, h + 0.95, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.4, 16]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.3, 12]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      <Bolts ring={0.95} count={12} y={h + 0.18} />
      <Bolts ring={0.95} count={12} y={0.22} />
      <Pipe from={[1, 0.6, 0]} to={[1.6, 0.6, 0]} />
      <Pipe from={[-1, h - 0.4, 0]} to={[-1.6, h - 0.4, 0]} />
      {/* Sight glass */}
      <mesh position={[0, h / 2 + 0.2, 1.005]}>
        <planeGeometry args={[0.16, h * 0.7]} />
        <meshStandardMaterial color={GLASS} emissive={visuals.active ? accent : '#0f3a4a'} emissiveIntensity={visuals.active ? 0.9 : 0.25} transparent opacity={0.9} />
      </mesh>
      {/* Pressure dial */}
      <mesh position={[0.7, 1.2, 1.005]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 1.2, 1.04]}>
        <ringGeometry args={[0.13, 0.18, 32]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <ControlPanel position={[-0.6, 1.2, 1.05]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 4. Furnace family — furnace, oven, reflow_oven, kiln, pasteurizer, fryer, cooker, drying, boiler. */
function FurnaceMesh({ visuals, accent = '#e63946' }: FamilyProps) {
  const heat = heatOverlay(STEEL, Math.max(0.2, visuals.heat))
  return (
    <group>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.6, 2.4, 1.8]} />
        <meshStandardMaterial color={heat.color} emissive={heat.emissive} emissiveIntensity={heat.emissiveIntensity * 0.6} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0.91]}>
        <boxGeometry args={[2.2, 2, 0.06]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Glowing interior viewport — drives the "hot when running" signal */}
      <mesh position={[0, 1.6, 0.95]}>
        <planeGeometry args={[1.4, 0.5]} />
        <meshStandardMaterial color="#1a0c00" emissive={accent} emissiveIntensity={visuals.active ? 1.6 + visuals.heat * 1.5 : 0.3} toneMapped={false} />
      </mesh>
      <mesh position={[0.95, 1.3, 0.96]}>
        <boxGeometry args={[0.08, 0.4, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
      </mesh>
      {[0.6, 1.3, 2].map((y, i) => (
        <mesh key={i} position={[1.31, y, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[0.7, 3.1, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.9, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <ControlPanel position={[-1.1, 1.5, 0.95]} rotation={[0, Math.PI / 6, 0]} active={visuals.active} statusColor={visuals.statusColor} />
      {/* Smoke from chimney when hot */}
      <Smoke y={3.55} on={visuals.heat > 0.3 || visuals.smoke} />
    </group>
  )
}

/** 5. Press / forming family — press, forge, stamping, tablet_press, calender, injection_molder, blow_molder. */
function PressMesh({ visuals, accent = PAINT_BLUE }: FamilyProps) {
  const ramRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ramRef.current) return
    if (visuals.active) {
      const t = Date.now() * 0.001
      ramRef.current.position.y = 2.4 + Math.sin(t * (1.2 + visuals.spinSpeed * 0.2)) * 0.18
    } else {
      ramRef.current.position.y = 2.4
    }
  })
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2.4, 0.8, 2]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      {[
        [-1, 1.8, -0.8],
        [1, 1.8, -0.8],
        [-1, 1.8, 0.8],
        [1, 1.8, 0.8],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.13, 0.13, 2.6, 16]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[2.4, 0.4, 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <group ref={ramRef} position={[0, 2.4, 0]}>
        <mesh>
          <boxGeometry args={[1.6, 0.4, 1.4]} />
          <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
      <Pipe from={[-1.4, 1.5, 1]} to={[-1.4, 2.6, 1]} radius={0.05} color={accent} />
      <ControlPanel position={[1.35, 1.4, 0.85]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 6. Rotational family — lathe, cnc, milling, spinning, centrifuge, rolling_mill, motor, weaving. */
function RotationalMesh({ visuals, accent = '#0ea5e9' }: FamilyProps) {
  const spinRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spinRef.current && visuals.active) spinRef.current.rotation.x += dt * (3 + visuals.spinSpeed * 0.5)
  })
  return (
    <group>
      {/* Bed */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[3, 0.6, 1.2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Headstock */}
      <mesh position={[-1.1, 1.05, 0]}>
        <boxGeometry args={[0.7, 0.8, 1]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Chuck */}
      <mesh position={[-0.7, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.18, 16]} />
        <meshStandardMaterial color={STEEL_LIGHT} metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Spinning workpiece */}
      <group ref={spinRef} position={[0.2, 1.05, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 1.5, 16]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Speed lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[0, Math.cos(angle) * 0.2, Math.sin(angle) * 0.2]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.4, 0.02, 0.02]} />
              <meshStandardMaterial color={STEEL_DARK} />
            </mesh>
          )
        })}
      </group>
      {/* Tailstock */}
      <mesh position={[1.1, 1.05, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.9]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Tool head */}
      <mesh position={[0.2, 1.5, 0.4]}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
        <meshStandardMaterial color={PAINT_RED} metalness={0.5} roughness={0.5} />
      </mesh>
      <ControlPanel position={[1.45, 1.05, 0.65]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 7. Liquid handling family — bottling, capper, labeler, filter, pump, compressor, capsule_filler, coater. */
function LiquidMesh({ visuals, accent = '#0891b2' }: FamilyProps) {
  return (
    <group>
      {/* Holding tank */}
      <mesh position={[-0.9, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.6, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-0.9, 2.1, 0]}>
        <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Sight strip */}
      <mesh position={[-0.9, 1.3, 0.555]}>
        <planeGeometry args={[0.1, 1.0]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={visuals.active ? 0.8 : 0.2} transparent opacity={0.85} />
      </mesh>
      {/* Manifold above conveyor */}
      <mesh position={[0.4, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.3, 12]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Dispensing nozzles */}
      {[-0.2, 0.2, 0.6].map((x, i) => (
        <group key={i} position={[x, 1.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.04, 0.3, 12]} />
            <meshStandardMaterial color={accent} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Bottle below */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 12]} />
            <meshStandardMaterial color="#bfdbfe" metalness={0.1} roughness={0.4} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.06, 12]} />
            <meshStandardMaterial color={STEEL_DARK} />
          </mesh>
        </group>
      ))}
      {/* Conveyor base */}
      <mesh position={[0.4, 0.7, 0]}>
        <boxGeometry args={[2, 0.08, 0.5]} />
        <meshStandardMaterial color={RUBBER} metalness={0.1} roughness={0.95} />
      </mesh>
      {[1.4, -0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.55, 12]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      <Pipe from={[-0.9, 0.5, 0]} to={[-1.6, 0.5, 0]} />
      <ControlPanel position={[1.4, 1.2, 0.55]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 8. Cutting / tool family — cutting, laser, welder, soldering, pick_and_place. */
function CuttingMesh({ visuals, accent = '#22d3ee' }: FamilyProps) {
  const headRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!headRef.current) return
    if (visuals.active) {
      const t = Date.now() * 0.001
      headRef.current.position.x = Math.sin(t * 0.7) * 1.1
    }
  })
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3, 0.8, 1.4]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[2.9, 0.04, 1.3]} />
        <meshStandardMaterial color="#22272e" metalness={0.2} roughness={0.9} />
      </mesh>
      <group position={[0, 1.6, 0]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          <meshStandardMaterial color={accent} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          <meshStandardMaterial color={accent} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[2.9, 0.18, 0.18]} />
          <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
        </mesh>
        <group ref={headRef}>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.3]} />
            <meshStandardMaterial color={PAINT_RED} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.12, 0.05, 0.4, 16]} />
            <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Glow under tool head when active */}
          {visuals.active && (
            <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.18, 24]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} transparent opacity={0.8} toneMapped={false} />
            </mesh>
          )}
        </group>
      </group>
      <ControlPanel position={[1.6, 1.1, 0.75]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 9. Sorting / inspection family — sorting, inspection, magnetic, separator, quality. */
function SortingMesh({ visuals, accent = PAINT_BLUE }: FamilyProps) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.6, 0.12, 0.9]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.85, 12]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0]}>
          <boxGeometry args={[0.1, 1.4, 0.1]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[2.7, 0.15, 0.6]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={i} position={[x, 1.85, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 0.16, 0.22]} />
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
            <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={visuals.active ? 1.2 : 0.4} />
          </mesh>
        </group>
      ))}
      {/* Divert chutes underneath */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]} rotation={[0, 0, x > 0 ? -0.3 : 0.3]}>
          <boxGeometry args={[0.4, 0.04, 0.6]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      <ControlPanel position={[1.1, 1.1, 0.6]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 10. Textile family — sewing, fabric, washing, ironing, printing — distinctive low-profile machines with thread spools / fabric guides. */
function TextileMesh({ visuals, accent = '#f59e0b' }: FamilyProps) {
  const headRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (headRef.current && visuals.active) {
      headRef.current.position.y = 1.55 + Math.abs(Math.sin(Date.now() * 0.04)) * 0.06
    }
  })
  return (
    <group>
      {/* Table */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.4, 0.15, 1.4]} />
        <meshStandardMaterial color="#3f4a55" metalness={0.4} roughness={0.7} />
      </mesh>
      {[
        [-1.1, 0.27, -0.6],
        [1.1, 0.27, -0.6],
        [-1.1, 0.27, 0.6],
        [1.1, 0.27, 0.6],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.08, 0.55, 0.08]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Fabric roll feeding in */}
      <mesh position={[-1.0, 0.85, 0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.2, 16]} />
        <meshStandardMaterial color="#dbeafe" metalness={0.1} roughness={0.6} />
      </mesh>
      {/* Strip of fabric across table */}
      <mesh position={[0, 0.64, 0.3]}>
        <boxGeometry args={[2, 0.005, 0.8]} />
        <meshStandardMaterial color="#bfdbfe" metalness={0.05} roughness={0.7} />
      </mesh>
      {/* Machine head */}
      <group ref={headRef} position={[0, 1.55, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.45, 0.4]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.3, 0.45, 0.4]} />
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Needle */}
        <mesh position={[0.42, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Thread spool */}
        <mesh position={[-0.55, 0.32, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
          <meshStandardMaterial color={PAINT_RED} metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
      {/* Side spool stands */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 1.0, -0.5]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
            <meshStandardMaterial color={i === 0 ? '#ef4444' : '#3b82f6'} metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <ControlPanel position={[1.15, 0.95, 0.7]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 11. Power / utility family — turbine, generator, transformer, cooling_tower, motor, freezer. */
function PowerMesh({ machine, visuals, accent = '#facc15' }: FamilyProps) {
  const fanRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (fanRef.current && visuals.active) fanRef.current.rotation.z += dt * (4 + visuals.spinSpeed)
  })
  const isCoolingTower = /cool/.test(machine.type) || /tower/.test(machine.type)
  const isTransformer = /transformer/.test(machine.type)

  if (isCoolingTower) {
    return (
      <group>
        {/* Hyperboloid-like cooling tower — stacked cylinders */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 1.2, 16]} />
          <meshStandardMaterial color={STEEL_LIGHT} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.85, 1.2, 0.8, 16]} />
          <meshStandardMaterial color={STEEL_LIGHT} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <cylinderGeometry args={[1.0, 0.85, 0.6, 16]} />
          <meshStandardMaterial color={STEEL_LIGHT} metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Steam column */}
        <Smoke y={2.7} on={visuals.active} color="#e2e8f0" />
        <ControlPanel position={[-1.1, 1.0, 0.7]} rotation={[0, Math.PI / 6, 0]} active={visuals.active} statusColor={visuals.statusColor} />
      </group>
    )
  }
  if (isTransformer) {
    return (
      <group>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[2.2, 1.8, 1.6]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Cooling fins */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-1.05 + i * 0.05, 1.0, 0]}>
            <boxGeometry args={[0.04, 1.6, 1.7]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        {/* HV bushings */}
        {[-0.6, 0, 0.6].map((x, i) => (
          <group key={i} position={[x, 2.2, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.7, 12]} />
              <meshStandardMaterial color="#a16207" metalness={0.3} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
              <meshStandardMaterial color={COPPER} metalness={0.95} roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* Hazard placard */}
        <mesh position={[0, 1.0, 0.81]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={visuals.active ? 0.6 : 0.2} />
        </mesh>
        <ControlPanel position={[1.2, 1.0, 0.7]} rotation={[0, -Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
      </group>
    )
  }
  // Default: turbine / generator look
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[3, 0.5, 1.4]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Generator body */}
      <mesh position={[1, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 1.2, 24]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Turbine cage */}
      <mesh position={[-1, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 1.0, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Spinning blades inside */}
      <group ref={fanRef} position={[-1, 1.2, 0]}>
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[0, Math.cos(angle) * 0.5, Math.sin(angle) * 0.5]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.4]} />
              <meshStandardMaterial color={STEEL_LIGHT} metalness={0.95} roughness={0.15} />
            </mesh>
          )
        })}
      </group>
      {/* Bus duct from generator out */}
      <mesh position={[1.85, 1.2, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.4]} />
        <meshStandardMaterial color={COPPER} metalness={0.95} roughness={0.2} />
      </mesh>
      <ControlPanel position={[0, 1.7, 0.7]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 12. Storage / packaging family — storage, packaging, waste, silos, IBC totes. */
function StorageMesh({ machine, visuals, accent = '#94a3b8' }: FamilyProps) {
  const isPackaging = /pack/.test(machine.type)
  if (isPackaging) {
    return (
      <group>
        {/* Wrapping tunnel */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2.6, 1.5, 1.4]} />
          <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[2.0, 0.9, 1.0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[3.6, 0.06, 0.9]} />
          <meshStandardMaterial color={RUBBER} metalness={0.1} roughness={0.95} />
        </mesh>
        {[-1.8, 1.8].map((x, i) => (
          <mesh key={i} position={[x, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.95, 16]} />
            <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
          </mesh>
        ))}
        <mesh position={[0, 1.95, -0.55]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 1.3, 24]} />
          <meshStandardMaterial color={'#fef3c7'} metalness={0.1} roughness={0.6} />
        </mesh>
        {/* Stack of finished boxes */}
        {[0, 0.42, 0.84].map((y, i) => (
          <mesh key={i} position={[1.7, y + 0.7, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color={'#a16207'} metalness={0.05} roughness={0.85} />
          </mesh>
        ))}
        <ControlPanel position={[-1.4, 1.1, 0.75]} rotation={[0, Math.PI / 4, 0]} active={visuals.active} statusColor={visuals.statusColor} />
      </group>
    )
  }
  // Silo
  return (
    <group>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 3.2, 24]} />
        <meshStandardMaterial color={STEEL_LIGHT} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <coneGeometry args={[1.3, 0.7, 24]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <Bolts ring={1.25} count={20} y={0.22} />
      <Pipe from={[1.3, 0.5, 0]} to={[2, 0.5, 0]} />
      {/* Vertical sight strip */}
      <mesh position={[0, 1.8, 1.305]}>
        <planeGeometry args={[0.16, 2.6]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={visuals.active ? 0.6 : 0.15} transparent opacity={0.85} />
      </mesh>
      <ControlPanel position={[-1.05, 1.5, 0.7]} rotation={[0, Math.PI / 6, 0]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/** 13. Generic industrial cabinet — final fallback for any unmapped icon. */
function GenericIndustrialMesh({ visuals, accent = ACCENT }: FamilyProps) {
  return (
    <group>
      {/* Cabinet body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.0, 1.8, 1.2]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Pipes coming off the side */}
      {[0.6, 1.2].map((y, i) => (
        <Pipe key={i} from={[1, y, 0.3]} to={[1.6, y, 0.3]} />
      ))}
      {/* Indicator LEDs row */}
      {[-0.5, -0.2, 0.1, 0.4, 0.7].map((x, i) => {
        const colors = ['#22c55e', accent, '#f59e0b', '#ef4444', '#a855f7']
        return (
          <mesh key={i} position={[x, 1.6, 0.61]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={colors[i]}
              emissiveIntensity={visuals.active ? 1.0 : 0.3}
            />
          </mesh>
        )
      })}
      {/* Vents */}
      {[0.1, 0.5].map((y, i) => (
        <mesh key={i} position={[-0.7, y + 0.6, 0.61]}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      {/* Top trim */}
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[2.05, 0.1, 1.25]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2.05, 0.1, 1.25]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} />
      </mesh>
      <ControlPanel position={[0, 1.0, 0.61]} active={visuals.active} statusColor={visuals.statusColor} />
    </group>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public dispatcher                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Wraps the chosen family component with telemetry-driven side effects:
 *  - vibration shake on the parent group
 *  - warning beacon
 *  - smoke (in addition to any family-specific smoke)
 */
function ShakeWrapper({
  vibration,
  warning,
  height,
  smoke,
  children,
}: {
  vibration: number
  warning: boolean
  height: number
  smoke: boolean
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    if (vibration > 0.7) {
      const t = Date.now() * 0.06 * vibration
      ref.current.position.x = Math.sin(t) * 0.04
      ref.current.position.z = Math.cos(t) * 0.04
    } else {
      ref.current.position.x = 0
      ref.current.position.z = 0
    }
  })
  return (
    <group ref={ref}>
      {children}
      <WarningBeacon y={height + 0.9} on={warning} />
      <Smoke y={height} on={smoke} />
    </group>
  )
}

/**
 * Top-level entry point. Render this inside a <group> positioned at the
 * machine's spot on the factory floor.
 */
export function MachineMesh({
  family,
  machine,
  telemetry,
  isActiveFlow = false,
  accent,
}: {
  family: MeshFamily
  machine: MachineLike
  telemetry?: TelemetryLike
  isActiveFlow?: boolean
  accent?: string
}) {
  const visuals = useMemo(() => deriveVisuals(telemetry, isActiveFlow), [telemetry, isActiveFlow])
  const height = meshHeight(family)
  const familyProps: FamilyProps = { machine, telemetry, visuals, accent }
  let body: React.ReactNode
  switch (family) {
    case 'conveyor':   body = <ConveyorMesh {...familyProps} />; break
    case 'crusher':    body = <CrusherMesh {...familyProps} />; break
    case 'tank':       body = <TankMesh {...familyProps} />; break
    case 'furnace':    body = <FurnaceMesh {...familyProps} />; break
    case 'press':      body = <PressMesh {...familyProps} />; break
    case 'rotational': body = <RotationalMesh {...familyProps} />; break
    case 'liquid':     body = <LiquidMesh {...familyProps} />; break
    case 'cutting':    body = <CuttingMesh {...familyProps} />; break
    case 'sorting':    body = <SortingMesh {...familyProps} />; break
    case 'textile':    body = <TextileMesh {...familyProps} />; break
    case 'power':      body = <PowerMesh {...familyProps} />; break
    case 'storage':    body = <StorageMesh {...familyProps} />; break
    default:           body = <GenericIndustrialMesh {...familyProps} />; break
  }
  return (
    <ShakeWrapper vibration={visuals.vibration} warning={visuals.warning} height={height} smoke={visuals.smoke}>
      {body}
    </ShakeWrapper>
  )
}

/** Concrete plinth + hazard ring used under every machine. */
export function MachineBase({ size = 2.6, active }: { size?: number; active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[size, 0.12, size]} />
        <meshStandardMaterial color="#3a4250" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[size + 0.02, 0.02, size + 0.02]} />
        <meshStandardMaterial
          color={active ? '#22c55e' : '#94a3b8'}
          emissive={active ? '#22c55e' : '#000000'}
          emissiveIntensity={active ? 0.6 : 0}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}
