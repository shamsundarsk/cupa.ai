'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import * as THREE from 'three'

interface MachineConfig {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  parameters: Record<string, number>
  connections: string[]
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

interface TwinCanvas3DProps {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
  activeFlowIndex: number
  onMachineHover: (machineId: string | null) => void
}

export default function TwinCanvas3D({ machines, telemetryData, activeFlowIndex, onMachineHover }: TwinCanvas3DProps) {
  return (
    <Canvas
      camera={{ position: [18, 14, 18], fov: 45 }}
      style={{ background: '#0a0f1a' }}
      onPointerMissed={() => onMachineHover(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.2} color="#4ade80" />

      <FactoryFloor />

      {machines.map((machine, index) => (
        <MachineModel
          key={machine.id}
          machine={machine}
          telemetry={telemetryData[machine.id]}
          position={[index * 5 - (machines.length * 2.5) + 2.5, 0, 0]}
          index={index}
          isActive={index === activeFlowIndex}
          onHover={onMachineHover}
        />
      ))}

      {/* Conveyor belts */}
      {machines.length > 1 && machines.slice(0, -1).map((_, index) => (
        <ConveyorBelt
          key={`conv_${index}`}
          startX={index * 5 - (machines.length * 2.5) + 2.5 + 2}
          endX={(index + 1) * 5 - (machines.length * 2.5) + 2.5 - 2}
          isActive={index === activeFlowIndex - 1 || (activeFlowIndex === 0 && index === machines.length - 2)}
        />
      ))}

      {/* Scrap flow arrows */}
      <ScrapFlowArrows
        machines={machines}
        activeFlowIndex={activeFlowIndex}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2.2}
      />
      <Grid
        args={[60, 60]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#1a2332"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#2a3a4a"
        fadeDistance={50}
      />
      <fog attach="fog" args={['#0a0f1a', 25, 60]} />
    </Canvas>
  )
}

function FactoryFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[70, 35]} />
      <meshStandardMaterial color="#0c1220" roughness={0.95} />
    </mesh>
  )
}

function MachineModel({ machine, telemetry, position, index, isActive, onHover }: {
  machine: MachineConfig
  telemetry?: TelemetryData
  position: [number, number, number]
  index: number
  isActive: boolean
  onHover: (id: string | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)

  const state = telemetry?.machineState || 'idle'

  const statusColor = useMemo(() => {
    if (state === 'critical') return '#ef4444'
    if (state === 'warning') return '#f59e0b'
    if (state === 'running') return '#4ade80'
    return '#64748b'
  }, [state])

  useFrame((_, delta) => {
    if (glowRef.current) {
      const targetIntensity = isActive ? 3.0 : (hovered ? 1.5 : 0.6)
      glowRef.current.intensity += (targetIntensity - glowRef.current.intensity) * delta * 4
    }
  })

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

  const baseEmissive = isActive ? 0.35 : 0.08
  const machineColor = '#2a3a4a'

  return (
    <group position={position} ref={groupRef}>
      <MachineShape
        type={machine.type}
        machineColor={machineColor}
        emissiveColor={isActive ? '#4ade80' : statusColor}
        emissiveIntensity={hovered ? 0.3 : baseEmissive}
        isActive={isActive}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Status light */}
      <mesh position={[0, getHeight(machine.type) + 0.4, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isActive ? 3 : 1}
        />
      </mesh>

      {/* Glow */}
      <pointLight
        ref={glowRef}
        position={[0, getHeight(machine.type) / 2, 0]}
        color={isActive ? '#4ade80' : statusColor}
        intensity={0.6}
        distance={6}
      />

      {isActive && <ActiveRing />}

      {/* Label */}
      <Text
        position={[0, -0.6, 1.8]}
        fontSize={0.28}
        color={isActive ? '#4ade80' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {machine.name}
      </Text>

      {/* Base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.8, 0.1, 6]} />
        <meshStandardMaterial
          color={isActive ? '#1a3a2a' : '#1e293b'}
          metalness={0.5}
          roughness={0.5}
          emissive={isActive ? '#4ade80' : '#000000'}
          emissiveIntensity={isActive ? 0.15 : 0}
        />
      </mesh>
    </group>
  )
}

function ActiveRing() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2
    }
  })
  return (
    <mesh ref={ref} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.7, 2.0, 32]} />
      <meshStandardMaterial
        color="#4ade80"
        emissive="#4ade80"
        emissiveIntensity={1.5}
        transparent
        opacity={0.5}
      />
    </mesh>
  )
}

function getHeight(type: string): number {
  if (type.includes('tank') || type.includes('storage')) return 2.8
  if (type.includes('boiler') || type.includes('drying')) return 2.5
  if (type.includes('conveyor')) return 1.0
  if (type.includes('shredder') || type.includes('press')) return 2.0
  return 1.8
}

function MachineShape({ type, machineColor, emissiveColor, emissiveIntensity, isActive, onPointerOver, onPointerOut }: {
  type: string
  machineColor: string
  emissiveColor: string
  emissiveIntensity: number
  isActive: boolean
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut: () => void
}) {
  if (type.includes('conveyor')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[3, 0.6, 1.4]} />
          <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {[-1, 0, 1].map(x => (
          <mesh key={x} position={[x, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 1.3, 8]} />
            <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        <mesh position={[0, 0.6, 0.75]}>
          <boxGeometry args={[3, 0.5, 0.05]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, -0.75]}>
          <boxGeometry args={[3, 0.5, 0.05]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  if (type.includes('sorting') || type.includes('inspection')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2.2, 2, 1.6]} />
          <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        <mesh position={[-0.6, 0.3, 0.9]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.6, 0.3, 0.9]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[1.8, 0.15, 1.2]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} emissive={emissiveColor} emissiveIntensity={isActive ? 0.5 : 0.1} />
        </mesh>
      </group>
    )
  }

  if (type.includes('shredder') || type.includes('cutting')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[1.1, 1.3, 2.2, 8]} />
          <meshStandardMaterial color={machineColor} metalness={0.8} roughness={0.2} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1.2, 0.8, 0.6, 8]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <torusGeometry args={[1.15, 0.08, 8, 16]} />
          <meshStandardMaterial color="#7a8a9a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <torusGeometry args={[1.2, 0.06, 8, 16]} />
          <meshStandardMaterial color="#6a7a8a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    )
  }

  if (type.includes('separator') || type.includes('magnetic') || type.includes('sewing')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[1.4, 1.4, 1.8, 16]} />
          <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.1, 8, 24]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={isActive ? 1.0 : 0.3} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.3, 0.08, 8, 24]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={isActive ? 0.7 : 0.2} metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    )
  }

  if (type.includes('tank') || type.includes('chemical') || type.includes('storage') || type.includes('boiler')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[1, 1, 3, 16]} />
          <meshStandardMaterial color={machineColor} metalness={0.6} roughness={0.4} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        <mesh position={[0, 3.1, 0]}>
          <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.1, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8, 8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-1.1, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8, 8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.5, 1.05]}>
          <boxGeometry args={[0.15, 2, 0.05]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={isActive ? 1.2 : 0.4} transparent opacity={0.7} />
        </mesh>
      </group>
    )
  }

  if (type.includes('drying') || type.includes('dry') || type.includes('washing') || type.includes('dyeing')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[2.4, 2.4, 1.8]} />
          <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {[0.4, 0.8, 1.2, 1.6, 2.0].map(y => (
          <mesh key={y} position={[0, y, 0.95]}>
            <boxGeometry args={[1.8, 0.06, 0.05]} />
            <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0.8, 2.8, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    )
  }

  if (type.includes('filter') || type.includes('press') || type.includes('packaging') || type.includes('heat')) {
    return (
      <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2, 2.2, 1.6]} />
          <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* Hydraulic arms */}
        <mesh position={[-0.8, 2.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.8, 2.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Top plate */}
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[2.2, 0.15, 1.8]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  // Default generic machine
  return (
    <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2, 2, 1.5]} />
        <meshStandardMaterial color={machineColor} metalness={0.7} roughness={0.3} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
      </mesh>
    </group>
  )
}

// Scrap flow arrows between active machine and next
function ScrapFlowArrows({ machines, activeFlowIndex }: { machines: MachineConfig[]; activeFlowIndex: number }) {
  if (activeFlowIndex >= machines.length - 1) return null

  const startX = activeFlowIndex * 5 - (machines.length * 2.5) + 2.5 + 2
  const endX = (activeFlowIndex + 1) * 5 - (machines.length * 2.5) + 2.5 - 2

  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <FlowArrow key={`${activeFlowIndex}-${i}`} startX={startX} endX={endX} delay={i * 0.2} />
      ))}
    </group>
  )
}

function FlowArrow({ startX, endX, delay }: { startX: number; endX: number; delay: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    const time = Date.now() * 0.001 * 1.5
    const progress = ((time + delay) % 1)
    const x = startX + (endX - startX) * progress
    ref.current.position.set(x, 0.6, 0)
    ref.current.scale.setScalar(0.8 + Math.sin(progress * Math.PI) * 0.4)
  })

  return (
    <group ref={ref} rotation={[0, -Math.PI / 2, 0]}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.4, 4]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0, 0.25]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.08, 0.3, 4]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}

function ConveyorBelt({ startX, endX, isActive }: { startX: number; endX: number; isActive: boolean }) {
  const length = endX - startX
  const midX = (startX + endX) / 2

  return (
    <group>
      <mesh position={[midX, 0.4, 0]}>
        <boxGeometry args={[length, 0.06, 0.5]} />
        <meshStandardMaterial
          color={isActive ? '#2a4a3a' : '#2d3748'}
          metalness={0.4}
          roughness={0.6}
          emissive={isActive ? '#4ade80' : '#1a2a3a'}
          emissiveIntensity={isActive ? 0.2 : 0.05}
        />
      </mesh>
      <mesh position={[midX, 0.43, 0.28]}>
        <boxGeometry args={[length, 0.03, 0.03]} />
        <meshStandardMaterial
          color="#5a6a7a"
          emissive={isActive ? '#4ade80' : '#2a3a4a'}
          emissiveIntensity={isActive ? 0.4 : 0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[midX, 0.43, -0.28]}>
        <boxGeometry args={[length, 0.03, 0.03]} />
        <meshStandardMaterial
          color="#5a6a7a"
          emissive={isActive ? '#4ade80' : '#2a3a4a'}
          emissiveIntensity={isActive ? 0.4 : 0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {[startX + 0.3, midX, endX - 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.5]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
