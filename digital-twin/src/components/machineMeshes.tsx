'use client'

/**
 * Reusable 3D machine geometries for the digital twin.
 *
 * Each variant returns a self-contained <group> built from primitive meshes
 * with PBR materials. The models are intentionally stylized (no external
 * GLB/asset files) but use enough detail — vents, control panels, pipes,
 * bolts, frames, hazard stripes — to read as real factory equipment.
 *
 * The picker `pickMeshVariant` matches keywords in the machine type so that
 * AI-generated machine types still get a sensible mesh.
 */

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const STEEL = '#9aa3ad'
const STEEL_DARK = '#5a6470'
const PAINT = '#d8a52b' // industrial yellow
const PAINT_BLUE = '#3b82f6'
const PAINT_RED = '#dc2626'
const PANEL = '#1f2937'
const ACCENT = '#22d3ee'
const RUBBER = '#1f2937'
const GLASS = '#7dd3fc'

export type MeshVariant =
  | 'conveyor'
  | 'shredder'
  | 'separator'
  | 'tank'
  | 'press'
  | 'oven'
  | 'mixer'
  | 'sewing'
  | 'cutting'
  | 'boiler'
  | 'inspection'
  | 'packaging'
  | 'robot'
  | 'pump'
  | 'storage'
  | 'sorting'
  | 'generic'

export function pickMeshVariant(type: string): MeshVariant {
  const t = (type || '').toLowerCase()
  if (t.includes('conveyor') || t.includes('intake') || t.includes('belt')) return 'conveyor'
  if (t.includes('shredder') || t.includes('grind') || t.includes('crush') || t.includes('mill')) return 'shredder'
  if (t.includes('cutting') || t.includes('cut')) return 'cutting'
  if (t.includes('separator') || t.includes('magnet')) return 'separator'
  if (t.includes('tank') || t.includes('chemical') || t.includes('reactor') || t.includes('storage') || t.includes('silo')) {
    return t.includes('storage') || t.includes('silo') ? 'storage' : 'tank'
  }
  if (t.includes('press') || t.includes('filter')) return 'press'
  if (t.includes('oven') || t.includes('furnace') || t.includes('drying') || t.includes('dry') || t.includes('kiln')) return 'oven'
  if (t.includes('mixer') || t.includes('mix') || t.includes('blend')) return 'mixer'
  if (t.includes('sewing') || t.includes('stitch') || t.includes('assembly')) return 'sewing'
  if (t.includes('boiler') || t.includes('steam')) return 'boiler'
  if (t.includes('inspection') || t.includes('quality') || t.includes('sorting') || t.includes('sort')) return 'inspection'
  if (t.includes('packaging') || t.includes('pack') || t.includes('box')) return 'packaging'
  if (t.includes('robot') || t.includes('arm')) return 'robot'
  if (t.includes('pump') || t.includes('compressor')) return 'pump'
  if (t.includes('washing') || t.includes('dyeing') || t.includes('wash')) return 'tank'
  return 'generic'
}

/**
 * Approximate height of the largest visible feature, used to position labels
 * and status lights.
 */
export function meshHeight(variant: MeshVariant): number {
  switch (variant) {
    case 'conveyor': return 1.5
    case 'tank': return 4
    case 'storage': return 4.5
    case 'shredder': return 3.4
    case 'cutting': return 2.5
    case 'separator': return 3
    case 'press': return 3.6
    case 'oven': return 3.2
    case 'mixer': return 3.6
    case 'sewing': return 2.5
    case 'boiler': return 4
    case 'inspection': return 2.8
    case 'packaging': return 2.6
    case 'robot': return 3
    case 'pump': return 1.6
    default: return 2.4
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared sub-components                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function HazardStripes({ y = 0.15, size = 3.4 }: { y?: number; size?: number }) {
  const stripeCount = 12
  const stripeWidth = (size * Math.PI) / stripeCount
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: stripeCount }).map((_, i) => {
        const angle = (i / stripeCount) * Math.PI * 2
        const x = Math.cos(angle) * (size / 2)
        const z = Math.sin(angle) * (size / 2)
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[stripeWidth * 0.9, 0.08, 0.08]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? PAINT : '#111111'}
              metalness={0.4}
              roughness={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Frame({ size, color = STEEL_DARK }: { size: [number, number, number]; color?: string }) {
  const [w, h, d] = size
  const t = 0.06
  const y = h / 2
  // Four vertical posts and a top frame
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
      {/* Screen */}
      <mesh position={[0, 0.08, 0.045]}>
        <planeGeometry args={[0.55, 0.22]} />
        <meshStandardMaterial
          color="#020617"
          emissive={active ? ACCENT : '#0f172a'}
          emissiveIntensity={active ? 0.9 : 0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Buttons */}
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
      {/* Flange ends */}
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Variants                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function ConveyorMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Frame legs */}
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
      {/* Belt */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3.2, 0.06, 1.2]} />
        <meshStandardMaterial color={RUBBER} metalness={0.1} roughness={0.95} />
      </mesh>
      {/* Side rails */}
      <mesh position={[0, 1.05, 0.62]}>
        <boxGeometry args={[3.2, 0.12, 0.06]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.05, -0.62]}>
        <boxGeometry args={[3.2, 0.12, 0.06]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Rollers (visible at ends) */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 1.25, 16]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {/* Motor at one end */}
      <mesh position={[1.7, 0.85, 0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.5]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[1.7, 0.85, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.9} roughness={0.2} />
      </mesh>
      <ControlPanel position={[-1.75, 1.4, 0]} rotation={[0, Math.PI / 2, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function ShredderMesh({ active }: { active: boolean }) {
  return (
    <group>
      <Frame size={[2.4, 2.6, 2]} />
      {/* Hopper */}
      <group position={[0, 2.1, 0]}>
        <mesh>
          <cylinderGeometry args={[1.1, 0.7, 0.7, 8]} />
          <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
        </mesh>
        <Bolts ring={1.05} count={8} y={-0.05} />
      </group>
      {/* Body */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.1, 1.5, 1.7]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Service door */}
      <mesh position={[0, 1.2, 0.86]}>
        <boxGeometry args={[1, 0.9, 0.04]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Vent grills */}
      {[0.9, 1.5].map((y, i) => (
        <group key={i}>
          {[-0.7, 0, 0.7].map((x, j) => (
            <mesh key={j} position={[x, y, -0.86]}>
              <boxGeometry args={[0.1, 0.2, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Outflow chute */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.7, 0.6, 6]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <ControlPanel position={[0, 1.2, 1.06]} active={active} statusColor={PAINT_RED} />
    </group>
  )
}

function CuttingMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Bed */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3, 0.8, 1.4]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Cutting surface */}
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[2.9, 0.04, 1.3]} />
        <meshStandardMaterial color="#22272e" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* Gantry */}
      <group position={[0, 1.6, 0]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          <meshStandardMaterial color={PAINT} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          <meshStandardMaterial color={PAINT} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[2.9, 0.18, 0.18]} />
          <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Cutter head */}
        <CutterHead active={active} />
      </group>
      <ControlPanel position={[1.6, 1.1, 0.75]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function CutterHead({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    if (active) {
      const t = Date.now() * 0.001
      ref.current.position.x = Math.sin(t * 0.7) * 1.1
    }
  })
  return (
    <group ref={ref}>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.3]} />
        <meshStandardMaterial color={PAINT_RED} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.05, 0.4, 16]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  )
}

function SeparatorMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Drum */}
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 2.2, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Coil bands (the magnetic field rings) */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.13, 0.08, 12, 24]} />
          <meshStandardMaterial
            color={PAINT_BLUE}
            emissive={PAINT_BLUE}
            emissiveIntensity={active ? 1.4 : 0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* Support pylons */}
      {[-1.0, 1.0].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.18, 1.4, 0.6]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Conveyor underneath */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.6, 0.06, 0.6]} />
        <meshStandardMaterial color={RUBBER} metalness={0.1} roughness={0.95} />
      </mesh>
      <ControlPanel position={[1.4, 1.6, 0.7]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={PAINT_BLUE} />
    </group>
  )
}

function TankMesh({ active, tall = true }: { active: boolean; tall?: boolean }) {
  const h = tall ? 3 : 2.2
  return (
    <group>
      {/* Body */}
      <mesh position={[0, h / 2 + 0.2, 0]} castShadow>
        <cylinderGeometry args={[1, 1, h, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Top dome */}
      <mesh position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Inspection hatch */}
      <mesh position={[0, h + 0.55, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
        <meshStandardMaterial color={PAINT_BLUE} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Bolts at top */}
      <Bolts ring={0.95} count={12} y={h + 0.18} />
      <Bolts ring={0.95} count={12} y={0.22} />
      {/* Pipes */}
      <Pipe from={[1, 0.6, 0]} to={[1.6, 0.6, 0]} />
      <Pipe from={[-1, h - 0.4, 0]} to={[-1.6, h - 0.4, 0]} />
      {/* Sight glass */}
      <mesh position={[0, h / 2 + 0.2, 1.005]}>
        <planeGeometry args={[0.16, h * 0.7]} />
        <meshStandardMaterial
          color={GLASS}
          emissive={active ? '#22d3ee' : '#0f3a4a'}
          emissiveIntensity={active ? 0.9 : 0.25}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Ladder */}
      <group position={[0.95, 0, 0.4]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, 0.5 + i * 0.45, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.4]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, h / 2 + 0.4, -0.18]}>
          <boxGeometry args={[0.04, h, 0.04]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, h / 2 + 0.4, 0.18]}>
          <boxGeometry args={[0.04, h, 0.04]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <ControlPanel position={[-0.6, 1.2, 1.05]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function StorageMesh({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 3.2, 24]} />
        <meshStandardMaterial color={'#cfd6dd'} metalness={0.85} roughness={0.3} />
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
      <ControlPanel position={[-1.05, 1.5, 0.7]} rotation={[0, Math.PI / 6, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function PressMesh({ active }: { active: boolean }) {
  const ramRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ramRef.current) return
    if (active) {
      const t = Date.now() * 0.001
      ramRef.current.position.y = 2.4 + Math.sin(t * 1.2) * 0.18
    } else {
      ramRef.current.position.y = 2.4
    }
  })
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2.4, 0.8, 2]} />
        <meshStandardMaterial color={PAINT_BLUE} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Pillars */}
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
      {/* Top crossbeam */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[2.4, 0.4, 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Ram */}
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
      {/* Hydraulic line */}
      <Pipe from={[-1.4, 1.5, 1]} to={[-1.4, 2.6, 1]} radius={0.05} color={PAINT_BLUE} />
      <ControlPanel position={[1.35, 1.4, 0.85]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={PAINT_RED} />
    </group>
  )
}

function OvenMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.6, 2.4, 1.8]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Door with viewport */}
      <mesh position={[0, 1.3, 0.91]}>
        <boxGeometry args={[2.2, 2, 0.06]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.6, 0.95]}>
        <planeGeometry args={[1.4, 0.5]} />
        <meshStandardMaterial
          color="#1a0c00"
          emissive={active ? '#ff6a00' : '#3b1500'}
          emissiveIntensity={active ? 1.6 : 0.3}
          toneMapped={false}
        />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.95, 1.3, 0.96]}>
        <boxGeometry args={[0.08, 0.4, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Vents on side */}
      {[0.6, 1.3, 2].map((y, i) => (
        <mesh key={i} position={[1.31, y, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Stack/exhaust */}
      <mesh position={[0.7, 3.1, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.9, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <ControlPanel position={[-1.1, 1.5, 0.95]} rotation={[0, Math.PI / 6, 0]} active={active} statusColor={'#fb923c'} />
    </group>
  )
}

function MixerMesh({ active }: { active: boolean }) {
  const bladeRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (bladeRef.current && active) bladeRef.current.rotation.y += dt * 4
  })
  return (
    <group>
      {/* Vat */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[1, 0.85, 2.2, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Top mount */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
        <meshStandardMaterial color={PAINT_BLUE} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Motor */}
      <mesh position={[0, 2.95, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 16]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Shaft + blades inside (visible above rim) */}
      <group ref={bladeRef}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
        {[0, Math.PI / 2].map((r, i) => (
          <mesh key={i} position={[0, 0.7, 0]} rotation={[0, r, 0]}>
            <boxGeometry args={[1.4, 0.05, 0.18]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <Bolts ring={0.95} count={12} y={2.4} />
      <Pipe from={[0.95, 0.6, 0]} to={[1.6, 0.6, 0]} />
      <ControlPanel position={[-0.95, 1.4, 0.6]} rotation={[0, Math.PI / 6, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function SewingMesh({ active }: { active: boolean }) {
  const headRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (headRef.current && active) {
      headRef.current.position.y = 1.55 + Math.abs(Math.sin(Date.now() * 0.04)) * 0.04
    }
  })
  return (
    <group>
      {/* Table */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.2, 0.15, 1.3]} />
        <meshStandardMaterial color="#3f4a55" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[
        [-1, 0.27, -0.55],
        [1, 0.27, -0.55],
        [-1, 0.27, 0.55],
        [1, 0.27, 0.55],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.08, 0.55, 0.08]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Machine head */}
      <group ref={headRef} position={[0, 1.55, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.45, 0.4]} />
          <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Arm */}
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.3, 0.45, 0.4]} />
          <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Needle */}
        <mesh position={[0.42, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Spool */}
        <mesh position={[-0.55, 0.32, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
          <meshStandardMaterial color={PAINT_RED} metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
      <ControlPanel position={[1.05, 0.95, 0.65]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function BoilerMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Cylindrical body */}
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 2.6, 24]} />
        <meshStandardMaterial color={PAINT_RED} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* End caps */}
      <mesh position={[1.3, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 24]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Pressure dial */}
      <mesh position={[0, 1.4, 1.06]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.4, 1.09]}>
        <ringGeometry args={[0.13, 0.18, 32]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Stack */}
      <mesh position={[-1, 2.6, 0]}>
        <cylinderGeometry args={[0.22, 0.27, 1.4, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Frame supports */}
      <mesh position={[-0.6, 0.4, 0]}>
        <boxGeometry args={[0.18, 0.8, 1.4]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.6, 0.4, 0]}>
        <boxGeometry args={[0.18, 0.8, 1.4]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <Pipe from={[1, 0.6, 0]} to={[1.7, 0.6, 0]} />
      <ControlPanel position={[1.05, 1.4, 0]} rotation={[0, -Math.PI / 2, 0]} active={active} statusColor={'#fb923c'} />
    </group>
  )
}

function InspectionMesh({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.6, 0.12, 0.9]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Roller bed */}
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.85, 12]} />
          <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {/* Camera bridge */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0]}>
          <boxGeometry args={[0.1, 1.4, 0.1]} />
          <meshStandardMaterial color={PAINT_BLUE} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[2.7, 0.15, 0.6]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Inspection cameras */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={i} position={[x, 1.85, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 0.16, 0.22]} />
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={active ? 1.2 : 0.4}
            />
          </mesh>
        </group>
      ))}
      <ControlPanel position={[1.1, 1.1, 0.6]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function PackagingMesh({ active }: { active: boolean }) {
  return (
    <group>
      {/* Wrapping tunnel */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.6, 1.5, 1.4]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.0, 0.9, 1.0]} />
        <meshStandardMaterial color={'#0f172a'} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Conveyor through */}
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
      {/* Roll of film */}
      <mesh position={[0, 1.95, -0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.3, 24]} />
        <meshStandardMaterial color={'#fef3c7'} metalness={0.1} roughness={0.6} />
      </mesh>
      <ControlPanel position={[1.4, 1.1, 0.75]} rotation={[0, -Math.PI / 4, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function RobotMesh({ active }: { active: boolean }) {
  const a1 = useRef<THREE.Group>(null)
  const a2 = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!active) return
    const t = Date.now() * 0.001
    if (a1.current) a1.current.rotation.y = Math.sin(t * 0.6) * 0.6
    if (a2.current) a2.current.rotation.x = Math.sin(t * 0.8) * 0.5 - 0.4
  })
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.5, 16]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
      </mesh>
      <group ref={a1} position={[0, 0.5, 0]}>
        {/* Shoulder */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.35, 0.5, 0.35]} />
          <meshStandardMaterial color={'#f8fafc'} metalness={0.4} roughness={0.5} />
        </mesh>
        <group ref={a2} position={[0, 0.5, 0]}>
          {/* Upper arm */}
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.22, 1.4, 0.22]} />
            <meshStandardMaterial color={'#f8fafc'} metalness={0.4} roughness={0.5} />
          </mesh>
          {/* Elbow joint */}
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.4, 1.4, 0]} rotation={[0, 0, -0.6]}>
            <boxGeometry args={[0.9, 0.18, 0.18]} />
            <meshStandardMaterial color={'#f8fafc'} metalness={0.4} roughness={0.5} />
          </mesh>
          {/* Gripper */}
          <mesh position={[0.85, 1.18, 0]}>
            <boxGeometry args={[0.14, 0.3, 0.18]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function PumpMesh({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 1]} />
        <meshStandardMaterial color={PAINT_BLUE} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.5, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.6, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
      </mesh>
      <Pipe from={[0.7, 0.5, 0]} to={[1.4, 0.5, 0]} />
      <Pipe from={[-0.85, 0.5, 0]} to={[-1.6, 0.5, 0]} />
      <ControlPanel position={[0, 1.1, 0]} active={active} statusColor={ACCENT} />
    </group>
  )
}

function GenericMesh({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2, 1.8, 1.4]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Trim */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.05, 0.1, 1.45]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[2.05, 0.1, 1.45]} />
        <meshStandardMaterial color={PAINT} metalness={0.5} roughness={0.5} />
      </mesh>
      <ControlPanel position={[0, 1.05, 0.74]} active={active} statusColor={ACCENT} />
    </group>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public dispatcher                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export function MachineMesh({
  variant,
  active,
}: {
  variant: MeshVariant
  active: boolean
}) {
  switch (variant) {
    case 'conveyor': return <ConveyorMesh active={active} />
    case 'shredder': return <ShredderMesh active={active} />
    case 'cutting': return <CuttingMesh active={active} />
    case 'separator': return <SeparatorMesh active={active} />
    case 'tank': return <TankMesh active={active} />
    case 'storage': return <StorageMesh active={active} />
    case 'press': return <PressMesh active={active} />
    case 'oven': return <OvenMesh active={active} />
    case 'mixer': return <MixerMesh active={active} />
    case 'sewing': return <SewingMesh active={active} />
    case 'boiler': return <BoilerMesh active={active} />
    case 'inspection': return <InspectionMesh active={active} />
    case 'sorting': return <InspectionMesh active={active} />
    case 'packaging': return <PackagingMesh active={active} />
    case 'robot': return <RobotMesh active={active} />
    case 'pump': return <PumpMesh active={active} />
    default: return <GenericMesh active={active} />
  }
}

/** Concrete plinth + hazard ring used under every machine. */
export function MachineBase({ size = 2.6, active }: { size?: number; active: boolean }) {
  return (
    <group>
      {/* Concrete pad */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[size, 0.12, size]} />
        <meshStandardMaterial color="#3a4250" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Top trim */}
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
