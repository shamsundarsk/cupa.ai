'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { MachineConfig, TelemetryData } from '@/types'

interface TwinCanvasProps {
  machines: MachineConfig[]
  telemetryData: Record<string, TelemetryData>
}

export default function TwinCanvas({ machines, telemetryData }: TwinCanvasProps) {
  return (
    <Canvas
      camera={{ position: [15, 12, 15], fov: 50 }}
      style={{ background: '#0a0f1a' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#22c55e" />

      {/* Factory Floor */}
      <FactoryFloor />

      {/* Machines */}
      {machines.map((machine, index) => (
        <MachineModel
          key={machine.id}
          machine={machine}
          telemetry={telemetryData[machine.id]}
          position={[index * 4 - (machines.length * 2), 0, 0]}
          index={index}
        />
      ))}

      {/* Conveyors between machines */}
      {machines.length > 1 && machines.slice(0, -1).map((_, index) => (
        <ConveyorBelt
          key={`conv_${index}`}
          start={[index * 4 - (machines.length * 2) + 1.5, 0.3, 0]}
          end={[(index + 1) * 4 - (machines.length * 2) - 1.5, 0.3, 0]}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />
      <Grid
        args={[50, 50]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={50}
      />
      <fog attach="fog" args={['#0a0f1a', 20, 60]} />
    </Canvas>
  )
}

function FactoryFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[60, 30]} />
      <meshStandardMaterial color="#0f172a" roughness={0.9} />
    </mesh>
  )
}

function MachineModel({ machine, telemetry, position, index }: {
  machine: MachineConfig
  telemetry?: TelemetryData
  position: [number, number, number]
  index: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const rotorRef = useRef<THREE.Mesh>(null)

  const state = telemetry?.machineState || 'idle'
  const efficiency = telemetry?.efficiencyScore || 0
  const temperature = telemetry?.temperature || 25

  // Color based on state
  const color = useMemo(() => {
    if (state === 'critical') return '#ef4444'
    if (state === 'warning') return '#f59e0b'
    if (state === 'running') return '#22c55e'
    return '#64748b'
  }, [state])

  // Animate
  useFrame((_, delta) => {
    if (rotorRef.current && telemetry) {
      rotorRef.current.rotation.y += delta * (telemetry.rpm / 1000)
    }
    if (glowRef.current) {
      glowRef.current.intensity = state === 'critical' 
        ? 2 + Math.sin(Date.now() * 0.01) * 1.5
        : state === 'running' ? 0.8 : 0.2
    }
  })

  // Machine body dimensions based on type
  const getSize = (): [number, number, number] => {
    if (machine.type.includes('conveyor')) return [2.5, 0.8, 1.2]
    if (machine.type.includes('tank')) return [1.5, 2.5, 1.5]
    if (machine.type.includes('boiler')) return [1.8, 2.8, 1.8]
    if (machine.type.includes('press')) return [2, 2, 1.5]
    return [2, 1.8, 1.5]
  }

  const size = getSize()

  return (
    <group position={position}>
      {/* Machine Body */}
      <mesh ref={meshRef} position={[0, size[1] / 2, 0]} castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={state === 'idle' ? 0 : 0.15}
        />
      </mesh>

      {/* Status Light */}
      <mesh position={[0, size[1] + 0.3, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={state === 'idle' ? 0.2 : 1.5}
        />
      </mesh>

      {/* Rotor/Motor */}
      {telemetry && telemetry.rpm > 0 && (
        <mesh ref={rotorRef} position={[0, size[1] / 2, size[2] / 2 + 0.2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
        </mesh>
      )}

      {/* Heat indicator */}
      {temperature > 80 && (
        <pointLight
          position={[0, size[1] / 2, 0]}
          color="#ff6b35"
          intensity={Math.min(2, (temperature - 80) / 30)}
          distance={3}
        />
      )}

      {/* Glow light */}
      <pointLight
        ref={glowRef}
        position={[0, size[1] + 0.5, 0]}
        color={color}
        intensity={0.5}
        distance={4}
      />

      {/* Label */}
      <Text
        position={[0, -0.5, 1.2]}
        fontSize={0.25}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {machine.name}
      </Text>

      {/* Efficiency bar */}
      {telemetry && (
        <mesh position={[0, -0.3, size[2] / 2 + 0.3]}>
          <boxGeometry args={[efficiency / 50, 0.1, 0.05]} />
          <meshStandardMaterial
            color={efficiency > 70 ? '#22c55e' : efficiency > 50 ? '#f59e0b' : '#ef4444'}
            emissive={efficiency > 70 ? '#22c55e' : efficiency > 50 ? '#f59e0b' : '#ef4444'}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Base platform */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[size[0] + 0.4, 0.1, size[2] + 0.4]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function ConveyorBelt({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) +
    Math.pow(end[1] - start[1], 2) +
    Math.pow(end[2] - start[2], 2)
  )
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ]

  useFrame((_, delta) => {
    if (ref.current) {
      // Animate conveyor texture offset
      const material = ref.current.material as THREE.MeshStandardMaterial
      if (material.map) {
        material.map.offset.x += delta * 0.5
      }
    }
  })

  return (
    <group>
      {/* Belt */}
      <mesh ref={ref} position={midpoint}>
        <boxGeometry args={[length, 0.1, 0.4]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      {/* Rails */}
      <mesh position={[midpoint[0], midpoint[1] + 0.05, midpoint[2] + 0.25]}>
        <boxGeometry args={[length, 0.05, 0.05]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[midpoint[0], midpoint[1] + 0.05, midpoint[2] - 0.25]}>
        <boxGeometry args={[length, 0.05, 0.05]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
