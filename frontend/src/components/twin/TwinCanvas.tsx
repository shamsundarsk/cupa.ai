'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MachineConfig, TelemetryData } from '@/types'
import { ALL_MACHINES } from '@/data/machines'
import { useStore } from '@/store/useStore'
import {
  MachineBase,
  MachineMesh,
  meshHeight,
  pickMeshVariant,
  familyFor,
  ICON_TO_FAMILY,
  type MeshFamily,
} from './machineMeshes'

interface TwinCanvasProps {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
}

const SPACING = 6.5
const ROW_GAP = 7.5
const MAX_PER_ROW = 6

function computeLayout(count: number): Array<{ x: number; z: number }> {
  const positions: Array<{ x: number; z: number }> = []
  const rows = Math.ceil(count / MAX_PER_ROW)
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / MAX_PER_ROW)
    const col = i % MAX_PER_ROW
    const machinesInThisRow = Math.min(MAX_PER_ROW, count - row * MAX_PER_ROW)
    const reverse = row % 2 === 1
    const localCol = reverse ? machinesInThisRow - 1 - col : col
    const x = localCol * SPACING - ((machinesInThisRow - 1) * SPACING) / 2
    const z = (row - (rows - 1) / 2) * ROW_GAP
    positions.push({ x, z })
  }
  return positions
}

export default function TwinCanvas({ machines, telemetryData }: TwinCanvasProps) {
  const customIndustries = useStore((s) => s.customIndustries)
  const iconByType = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of ALL_MACHINES) map[m.type] = m.icon
    for (const c of customIndustries) for (const m of c.machines) map[m.type] = m.icon
    return map
  }, [customIndustries])

  const layout = useMemo(() => computeLayout(machines.length), [machines.length])
  const extents = useMemo(() => {
    if (layout.length === 0) return { width: 24, depth: 16 }
    const xs = layout.map((p) => p.x)
    const zs = layout.map((p) => p.z)
    return {
      width: (Math.max(...xs) - Math.min(...xs)) + 12,
      depth: (Math.max(...zs) - Math.min(...zs)) + 12,
    }
  }, [layout])

  const camDistance = Math.min(80, Math.max(18, Math.max(extents.width, extents.depth) * 0.8))

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [camDistance * 0.7, camDistance * 0.55, camDistance * 0.7], fov: 45 }}
      style={{ background: 'linear-gradient(180deg, #1a2435 0%, #0d1422 100%)' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#cbd5e1', '#1f2937', 0.55]} />

      {/* Key light */}
      <directionalLight
        castShadow
        position={[14, 22, 10]}
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Fill */}
      <directionalLight position={[-12, 10, -8]} intensity={0.4} color="#a5b4fc" />
      {/* Rim */}
      <directionalLight position={[0, 6, -16]} intensity={0.5} color="#22d3ee" />

      <Environment preset="warehouse" />

      <FactoryFloor width={Math.max(40, extents.width + 8)} depth={Math.max(20, extents.depth + 8)} />

      {machines.map((machine, index) => {
        const pos = layout[index]
        return (
          <MachineStation
            key={machine.id}
            machine={machine}
            telemetry={telemetryData[machine.id]}
            position={[pos.x, 0, pos.z]}
            iconHint={iconByType[machine.type]}
          />
        )
      })}

      {machines.length > 1 &&
        machines.slice(0, -1).map((m, idx) => {
          const a = layout[idx]
          const b = layout[idx + 1]
          const sameRow = Math.abs(a.z - b.z) < 0.01
          const startTel = telemetryData[m.id]
          const isLive = !!startTel && startTel.machineState === 'running'
          if (sameRow) {
            const x1 = a.x + (b.x > a.x ? 1.5 : -1.5)
            const x2 = b.x + (b.x > a.x ? -1.5 : 1.5)
            return <ConveyorLink key={`link_${m.id}`} from={[x1, 0, a.z]} to={[x2, 0, b.z]} active={isLive} />
          }
          return (
            <ConveyorLink
              key={`link_${m.id}`}
              from={[a.x, 0, a.z + (b.z > a.z ? 1.5 : -1.5)]}
              to={[b.x, 0, b.z + (b.z > a.z ? -1.5 : 1.5)]}
              active={isLive}
            />
          )
        })}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={Math.max(40, Math.max(extents.width, extents.depth) + 12)}
        blur={2.5}
        far={20}
      />

      <Grid
        args={[80, 60]}
        position={[0, 0.005, 0]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#27324a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3c4a6b"
        fadeDistance={Math.max(40, Math.max(extents.width, extents.depth) + 16)}
        fadeStrength={1.2}
        infiniteGrid
      />

      <fog attach="fog" args={['#0d1422', 35, 130]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.2, 0]}
      />
    </Canvas>
  )
}

function FactoryFloor({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      {/* Painted concrete pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1c2434" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Lane stripes (yellow) along the production line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 2.6]}>
        <planeGeometry args={[width, 0.16]} />
        <meshStandardMaterial color="#f5b500" emissive="#f5b500" emissiveIntensity={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -2.6]}>
        <planeGeometry args={[width, 0.16]} />
        <meshStandardMaterial color="#f5b500" emissive="#f5b500" emissiveIntensity={0.05} />
      </mesh>
    </group>
  )
}

function MachineStation({
  machine,
  telemetry,
  position,
  iconHint,
}: {
  machine: MachineConfig
  telemetry?: TelemetryData
  position: [number, number, number]
  iconHint?: string
}) {
  const family: MeshFamily = useMemo(() => {
    if (iconHint && ICON_TO_FAMILY[iconHint]) return ICON_TO_FAMILY[iconHint]
    return pickMeshVariant(machine.type)
  }, [iconHint, machine.type])
  const height = meshHeight(family)
  const state = telemetry?.machineState ?? 'idle'
  const active = state === 'running' || state === 'warning'

  const statusColor =
    state === 'critical' ? '#ef4444' :
    state === 'warning' ? '#f59e0b' :
    state === 'running' ? '#22c55e' :
    '#94a3b8'

  return (
    <group position={position}>
      <MachineBase active={active} />
      <MachineMesh family={family} machine={machine} telemetry={telemetry} />

      {/* Soft glow */}
      <pointLight position={[0, height * 0.55, 0]} color={statusColor} intensity={active ? 1.4 : 0.6} distance={5} />

      {/* Label */}
      <Html position={[0, height + 1.1, 0]} center distanceFactor={10} occlude="blending">
        <div className="px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-mono whitespace-nowrap border border-white/10 backdrop-blur-sm">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ background: statusColor }}
          />
          {machine.name}
          {telemetry && (
            <span className="text-emerald-300/90 ml-2">
              {Math.round(telemetry.efficiencyScore)}%
            </span>
          )}
        </div>
      </Html>
    </group>
  )
}

function Beacon({
  position,
  color,
  pulsing,
}: {
  position: [number, number, number]
  color: string
  pulsing: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    const base = pulsing ? 1 + Math.sin(Date.now() * 0.008) * 0.6 : 0.6
    mat.emissiveIntensity = base + 0.4
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.16, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
    </mesh>
  )
}

function ConveyorLink({
  from,
  to,
  active,
}: {
  from: [number, number, number]
  to: [number, number, number]
  active: boolean
}) {
  const length = Math.abs(to[0] - from[0])
  const midX = (from[0] + to[0]) / 2

  return (
    <group>
      {/* Frame */}
      {[-0.45, 0.45].map((z, i) => (
        <mesh key={i} position={[midX, 0.55, z]}>
          <boxGeometry args={[length, 0.06, 0.06]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Belt */}
      <BeltMesh midX={midX} length={length} active={active} />
      {/* Legs */}
      {[from[0] + 0.5, midX, to[0] - 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]}>
          <boxGeometry args={[0.06, 0.6, 1]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {active && <FlowParticles startX={from[0]} endX={to[0]} />}
    </group>
  )
}

function BeltMesh({ midX, length, active }: { midX: number; length: number; active: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (!matRef.current || !active) return
    if (matRef.current.map) {
      matRef.current.map.offset.x -= dt * 0.5
      matRef.current.map.needsUpdate = true
    }
  })
  return (
    <mesh position={[midX, 0.55, 0]}>
      <boxGeometry args={[length, 0.04, 0.85]} />
      <meshStandardMaterial
        ref={matRef}
        color={active ? '#1f2937' : '#0f172a'}
        emissive={active ? '#22c55e' : '#000000'}
        emissiveIntensity={active ? 0.05 : 0}
        metalness={0.1}
        roughness={0.95}
      />
    </mesh>
  )
}

function FlowParticles({ startX, endX }: { startX: number; endX: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const count = 6
  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() * 0.001
    groupRef.current.children.forEach((child, i) => {
      const offset = i / count
      const progress = ((t * 0.4 + offset) % 1)
      child.position.x = startX + (endX - startX) * progress
    })
  })
  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0.7, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  )
}
