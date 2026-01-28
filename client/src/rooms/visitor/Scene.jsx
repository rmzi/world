import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Blocky walking figure made of cubes
function BlockyFigure() {
  const groupRef = useRef()
  const bodyRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // Walk forward slowly (looping path)
      groupRef.current.position.z = Math.sin(t * 0.2) * 4
      groupRef.current.position.x = Math.sin(t * 0.15) * 2
    }

    if (bodyRef.current) {
      // Subtle body bob while walking
      bodyRef.current.position.y = 0.9 + Math.abs(Math.sin(t * 4)) * 0.03
      // Slight body sway
      bodyRef.current.rotation.z = Math.sin(t * 2) * 0.02
    }

    // Walking animation - legs swing opposite to each other
    const legSwing = Math.sin(t * 4) * 0.5
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = legSwing
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -legSwing
    }

    // Arms swing opposite to legs
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -legSwing * 0.6
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = legSwing * 0.6
    }
  })

  const blockMaterial = useMemo(() => (
    <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
  ), [])

  return (
    <group ref={groupRef}>
      <group ref={bodyRef} position={[0, 0.9, 0]}>
        {/* Head - cube */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          {blockMaterial}
        </mesh>

        {/* Torso - rectangular block */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          {blockMaterial}
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.22, 0.3, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.1, 0.35, 0.1]} />
            {blockMaterial}
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[0.22, 0.3, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.1, 0.35, 0.1]} />
            {blockMaterial}
          </mesh>
        </group>
      </group>

      {/* Legs - pivot from hip */}
      <group position={[0, 0.5, 0]}>
        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.08, 0, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
            {blockMaterial}
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.08, 0, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
            {blockMaterial}
          </mesh>
        </group>
      </group>
    </group>
  )
}

// Fluorescent ceiling light with flicker
function FluorescentLight({ position }) {
  const lightRef = useRef()
  const flickerOffset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.elapsedTime + flickerOffset
      // Occasional flicker
      const flicker = Math.sin(t * 30) > 0.95 ? 0.3 : 1
      const hum = 0.9 + Math.sin(t * 120) * 0.1
      lightRef.current.material.emissiveIntensity = flicker * hum * 0.8
    }
  })

  return (
    <group position={position}>
      {/* Light fixture housing */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.8, 0.08, 0.3]} />
        <meshStandardMaterial color="#888888" roughness={0.6} />
      </mesh>
      {/* Light panel */}
      <mesh ref={lightRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.02, 0.2]} />
        <meshStandardMaterial
          color="#ffffee"
          emissive="#ffffcc"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Actual light source */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={0.5}
        distance={6}
        color="#ffffee"
      />
    </group>
  )
}

// Ceiling tile grid
function CeilingTiles() {
  const tiles = useMemo(() => {
    const result = []
    for (let x = -4; x <= 4; x++) {
      for (let z = -6; z <= 6; z++) {
        // Skip some tiles for variety (water damage look)
        if (Math.random() > 0.92) continue
        result.push({ x: x * 1.2, z: z * 1.2, variant: Math.random() })
      }
    }
    return result
  }, [])

  return (
    <group position={[0, 3, 0]}>
      {tiles.map((tile, i) => (
        <mesh key={i} position={[tile.x, 0, tile.z]}>
          <boxGeometry args={[1.15, 0.05, 1.15]} />
          <meshStandardMaterial
            color={tile.variant > 0.7 ? '#d8d4c8' : '#e8e4d8'}
            roughness={0.9}
          />
        </mesh>
      ))}
      {/* Ceiling grid lines */}
      <mesh position={[0, -0.01, 0]}>
        <planeGeometry args={[12, 16]} />
        <meshBasicMaterial color="#1a1a1a" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Columns/pillars
function Column({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.4, 3, 0.4]} />
        <meshStandardMaterial color="#c4c4b4" roughness={0.7} />
      </mesh>
    </group>
  )
}

// Floor with tile pattern
function Floor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#b8b4a8" roughness={0.8} />
      </mesh>
      {/* Tile grid overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[20, 24, 20, 24]} />
        <meshBasicMaterial color="#a0a090" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// Walls with baseboards
function Walls() {
  const wallMaterial = useMemo(() => (
    <meshStandardMaterial color="#d4d0c4" roughness={0.85} />
  ), [])

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.5, -8]}>
        <boxGeometry args={[12, 3, 0.2]} />
        {wallMaterial}
      </mesh>
      {/* Left wall */}
      <mesh position={[-6, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 16]} />
        {wallMaterial}
      </mesh>
      {/* Right wall */}
      <mesh position={[6, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 16]} />
        {wallMaterial}
      </mesh>
    </group>
  )
}

// Main visitor room scene
export default function VisitorScene() {
  return (
    <group>
      {/* Ambient light - dim, liminal */}
      <ambientLight intensity={0.2} color="#ffffee" />

      {/* Fog for depth */}
      <fog attach="fog" args={['#d4d4c4', 4, 18]} />

      {/* Environment */}
      <Floor />
      <Walls />
      <CeilingTiles />

      {/* Columns */}
      <Column position={[-3, 0, -3]} />
      <Column position={[3, 0, -3]} />
      <Column position={[-3, 0, 3]} />
      <Column position={[3, 0, 3]} />

      {/* Fluorescent lights */}
      <FluorescentLight position={[0, 2.95, -4]} />
      <FluorescentLight position={[0, 2.95, 0]} />
      <FluorescentLight position={[0, 2.95, 4]} />
      <FluorescentLight position={[-3, 2.95, -2]} />
      <FluorescentLight position={[3, 2.95, 2]} />

      {/* Walking figure */}
      <BlockyFigure />

      {/* Room label (temporary) */}
      <Text
        position={[0, 2.5, -7.8]}
        fontSize={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        day 2 - visitor
      </Text>
    </group>
  )
}
