'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { Billboard, ContactShadows, Environment, Grid, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  MachineBase,
  MachineMesh,
  meshHeight,
  pickMeshVariant,
  familyFor,
  ICON_TO_FAMILY,
  type MeshFamily,
} from './machineMeshes'

interface MachineConfig {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  parameters: Record<string, number>
  connections: string[]
  /** Optional icon hint (preferred). When present we map via ICON_TO_FAMILY. */
  icon?: string
}

interface TelemetryData {
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

interface Props {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
  activeFlowIndex: number
  onMachineHover: (machineId: string | null) => void
  selectedMachineId?: string | null
  onMachineSelect?: (id: string | null) => void
}

const SPACING = 6.5
const ROW_GAP = 7.5
const MAX_PER_ROW = 6

/** Snake-style flow layout: wraps every MAX_PER_ROW machines and reverses
 *  direction each row so the flow reads naturally. */
function computeLayout(count: number): Array<{ x: number; z: number; flipFlow: boolean }> {
  const rows = Math.ceil(count / MAX_PER_ROW)
  const positions: Array<{ x: number; z: number; flipFlow: boolean }> = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / MAX_PER_ROW)
    const col = i % MAX_PER_ROW
    const machinesInThisRow = Math.min(MAX_PER_ROW, count - row * MAX_PER_ROW)
    const reverse = row % 2 === 1
    const localCol = reverse ? machinesInThisRow - 1 - col : col
    const x = localCol * SPACING - ((machinesInThisRow - 1) * SPACING) / 2
    const z = (row - (rows - 1) / 2) * ROW_GAP
    positions.push({ x, z, flipFlow: reverse })
  }
  return positions
}

export default function TwinCanvas3D({
  machines,
  telemetryData,
  activeFlowIndex,
  onMachineHover,
  selectedMachineId,
  onMachineSelect,
}: Props) {
  const layout = useMemo(() => computeLayout(machines.length), [machines.length])

  // Bounding extents drive camera framing + floor size.
  const extents = useMemo(() => {
    if (layout.length === 0) return { width: 24, depth: 16 }
    const xs = layout.map((p) => p.x)
    const zs = layout.map((p) => p.z)
    const width = (Math.max(...xs) - Math.min(...xs)) + 12
    const depth = (Math.max(...zs) - Math.min(...zs)) + 12
    return { width, depth }
  }, [layout])

  const camDistance = Math.min(80, Math.max(18, Math.max(extents.width, extents.depth) * 0.8))

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [camDistance * 0.7, camDistance * 0.55, camDistance * 0.7], fov: 45 }}
      style={{ background: 'linear-gradient(180deg, #1a2435 0%, #0d1422 100%)' }}
      onPointerMissed={() => {
        onMachineHover(null)
        onMachineSelect?.(null)
      }}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#cbd5e1', '#1f2937', 0.65]} />
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
      <directionalLight position={[-12, 10, -8]} intensity={0.4} color="#a5b4fc" />
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
            isActive={index === activeFlowIndex}
            isSelected={selectedMachineId === machine.id}
            onHover={onMachineHover}
            onSelect={onMachineSelect}
          />
        )
      })}

      {machines.length > 1 &&
        machines.slice(0, -1).map((m, idx) => {
          const a = layout[idx]
          const b = layout[idx + 1]
          const sameRow = Math.abs(a.z - b.z) < 0.01
          const isLive =
            idx === activeFlowIndex - 1 ||
            (activeFlowIndex === 0 && idx === machines.length - 2)
          if (sameRow) {
            const x1 = a.x + (b.x > a.x ? 1.5 : -1.5)
            const x2 = b.x + (b.x > a.x ? -1.5 : 1.5)
            return <ConveyorLink key={`link_${m.id}`} from={[x1, 0, a.z]} to={[x2, 0, b.z]} active={isLive} />
          }
          // Vertical inter-row link
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

      <fog attach="fog" args={['#0d1422', 45, 140]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={6}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1c2434" roughness={0.95} metalness={0.05} />
      </mesh>
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
  isActive,
  isSelected,
  onHover,
  onSelect,
}: {
  machine: MachineConfig
  telemetry?: TelemetryData
  position: [number, number, number]
  isActive: boolean
  isSelected: boolean
  onHover: (id: string | null) => void
  onSelect?: (id: string | null) => void
}) {
  const family: MeshFamily = useMemo(() => {
    if (machine.icon && ICON_TO_FAMILY[machine.icon]) return ICON_TO_FAMILY[machine.icon]
    return familyFor(machine.icon) === 'generic' ? pickMeshVariant(machine.type) : familyFor(machine.icon)
  }, [machine.icon, machine.type])
  const height = meshHeight(family)
  const [hovered, setHovered] = useState(false)

  const state = telemetry?.machineState ?? 'idle'
  const active = isActive || state === 'running' || state === 'warning'

  const statusColor =
    state === 'critical' ? '#ef4444' :
    state === 'warning' ? '#f59e0b' :
    state === 'running' ? '#22c55e' :
    '#94a3b8'

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    onHover(machine.id)
    document.body.style.cursor = 'pointer'
  }, [machine.id, onHover])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    onHover(null)
    document.body.style.cursor = 'default'
  }, [onHover])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect?.(isSelected ? null : machine.id)
  }, [machine.id, isSelected, onSelect])

  const labelY = height + 1.0

  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <MachineBase active={active || hovered || isSelected} />
      <MachineMesh family={family} machine={machine} telemetry={telemetry} isActiveFlow={isActive} />

      <pointLight
        position={[0, height * 0.55, 0]}
        color={isActive ? '#22c55e' : statusColor}
        intensity={isActive || isSelected ? 2.4 : active ? 1.4 : 0.6}
        distance={6}
      />

      {(isActive || isSelected) && <ActiveRing color={isSelected ? '#22d3ee' : '#4ade80'} />}

      {/* Always-visible billboarded label panel */}
      <Billboard position={[0, labelY, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <LabelPanel
          name={machine.name}
          state={state}
          statusColor={statusColor}
          efficiency={telemetry?.efficiencyScore}
          throughput={telemetry?.throughput}
          isSelected={isSelected}
          isHovered={hovered}
        />
      </Billboard>
    </group>
  )
}

function LabelPanel({
  name,
  state,
  statusColor,
  efficiency,
  throughput,
  isSelected,
  isHovered,
}: {
  name: string
  state: string
  statusColor: string
  efficiency?: number
  throughput?: number
  isSelected: boolean
  isHovered: boolean
}) {
  // Background plate — wider when selected/hovered
  const width = isSelected || isHovered ? 3.2 : 2.6
  const height = isSelected ? 0.92 : 0.62
  const baseColor = isSelected ? '#0d1322' : '#0a1020'
  const borderColor = isSelected ? '#22d3ee' : 'rgba(148,163,184,0.35)'

  return (
    <group>
      {/* Plate background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.92} />
      </mesh>
      {/* Border accent */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[width + 0.04, height + 0.04]} />
        <meshBasicMaterial color={borderColor} transparent opacity={0.45} />
      </mesh>
      {/* Status dot */}
      <mesh position={[-width / 2 + 0.2, height / 2 - 0.18, 0]}>
        <circleGeometry args={[0.07, 24]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      {/* Name */}
      <Text
        position={[-width / 2 + 0.34, height / 2 - 0.18, 0]}
        anchorX="left"
        anchorY="middle"
        fontSize={0.22}
        color="#ffffff"
        outlineWidth={0.012}
        outlineColor="#000"
        maxWidth={width - 0.55}
        clipRect={[0, -0.2, width - 0.55, 0.2]}
      >
        {name}
      </Text>
      {/* Sub-row: state + KPIs */}
      <Text
        position={[-width / 2 + 0.34, height / 2 - 0.45, 0]}
        anchorX="left"
        anchorY="middle"
        fontSize={0.15}
        color={statusColor}
        outlineWidth={0.006}
        outlineColor="#000"
      >
        {state.toUpperCase()}
      </Text>
      {efficiency !== undefined && (
        <Text
          position={[width / 2 - 0.2, height / 2 - 0.45, 0]}
          anchorX="right"
          anchorY="middle"
          fontSize={0.15}
          color="#86efac"
          outlineWidth={0.006}
          outlineColor="#000"
        >
          {`${Math.round(efficiency)}% eff`}
        </Text>
      )}
      {/* Selected: extra metrics */}
      {isSelected && throughput !== undefined && (
        <Text
          position={[0, -height / 2 + 0.18, 0]}
          anchorX="center"
          anchorY="middle"
          fontSize={0.14}
          color="#cbd5e1"
          outlineWidth={0.006}
          outlineColor="#000"
        >
          {`${throughput.toFixed(0)} kg/h · click again to deselect`}
        </Text>
      )}
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

function ActiveRing({ color = '#4ade80' }: { color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2
  })
  return (
    <mesh ref={ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.7, 2.0, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.5}
      />
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
      {[-0.45, 0.45].map((z, i) => (
        <mesh key={i} position={[midX, 0.55, z]}>
          <boxGeometry args={[length, 0.06, 0.06]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[midX, 0.55, 0]}>
        <boxGeometry args={[length, 0.04, 0.85]} />
        <meshStandardMaterial
          color={active ? '#1f2937' : '#0f172a'}
          emissive={active ? '#22c55e' : '#000000'}
          emissiveIntensity={active ? 0.05 : 0}
          metalness={0.1}
          roughness={0.95}
        />
      </mesh>
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
