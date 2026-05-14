'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MachineConfig, TelemetryData } from '@/types'
import { MachineBase, MachineMesh, meshHeight, pickMeshVariant } from './machineMeshes'

interface TwinCanvasProps {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
}

const SPACING = 6.5

export default function TwinCanvas({ machines, telemetryData }: TwinCanvasProps) {
  // Center the row and clamp camera distance to the number of machines.
  const totalWidth = Math.max(machines.length, 1) * SPACING
  const camDistance = Math.min(60, Math.max(16, totalWidth * 0.55))

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

      <FactoryFloor width={Math.max(40, totalWidth + 16)} depth={Math.max(20, totalWidth * 0.45 + 12)} />

      {machines.map((machine, index) => {
        const x = index * SPACING - ((machines.length - 1) * SPACING) / 2
        return (
          <MachineStation
            key={machine.id}
            machine={machine}
            telemetry={telemetryData[machine.id]}
            position={[x, 0, 0]}
          />
        )
      })}

      {machines.length > 1 &&
        machines.slice(0, -1).map((m, idx) => {
          const x1 = idx * SPACING - ((machines.length - 1) * SPACING) / 2 + SPACING * 0.5 - SPACING / 2 + 1.5
          const x2 = (idx + 1) * SPACING - ((machines.length - 1) * SPACING) / 2 - 1.5
          const startTel = telemetryData[m.id]
          const isLive = !!startTel && startTel.machineState === 'running'
          return (
            <ConveyorLink
              key={`link_${m.id}`}
              from={[x1, 0, 0]}
              to={[x2, 0, 0]}
              active={isLive}
            />
          )
        })}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={Math.max(40, totalWidth + 20)}
        blur={2.5}
        far={20}
      />

      <Grid
        args={[60, 30]}
        position={[0, 0.005, 0]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#27324a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3c4a6b"
        fadeDistance={Math.max(40, totalWidth + 20)}
        fadeStrength={1.2}
        infiniteGrid
      />

      <fog attach="fog" args={['#0d1422', 35, 120]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={90}
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
}: {
  machine: MachineConfig
  telemetry?: TelemetryData
  position: [number, number, number]
}) {
  const variant = useMemo(() => pickMeshVariant(machine.type), [machine.type])
  const height = meshHeight(variant)
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
      <MachineMesh variant={variant} active={active} />

      {/* Status beacon on top */}
      <Beacon position={[0, height + 0.5, 0]} color={statusColor} pulsing={state === 'critical'} />

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
