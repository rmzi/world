import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

// Placeholder walking figure
function WalkingFigure() {
  const groupRef = useRef()
  const bodyRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // Gentle forward motion (looping)
      groupRef.current.position.z = Math.sin(t * 0.3) * 2
    }

    if (bodyRef.current) {
      // Subtle body bob
      bodyRef.current.position.y = 0.8 + Math.sin(t * 4) * 0.02
    }

    // Walking leg animation
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 4) * 0.4
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = Math.sin(t * 4 + Math.PI) * 0.4
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <group ref={bodyRef} position={[0, 0.8, 0]}>
        {/* Torso */}
        <mesh position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#5a5a5a" />
        </mesh>
      </group>

      {/* Legs */}
      <group position={[0, 0.4, 0]}>
        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.08, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.05, 0.3, 8, 16]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.08, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.05, 0.3, 8, 16]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// Liminal floor grid
function LiminalFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshStandardMaterial
        color="#c4c4b4"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

// Placeholder scene for visitor room
// Room context available via useRoomContext() for future enhancements
export default function VisitorScene() {
  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <directionalLight position={[-3, 5, -5]} intensity={0.2} />

      {/* Fog effect */}
      <fog attach="fog" args={['#d4d4c4', 5, 25]} />

      {/* Floor */}
      <LiminalFloor />

      {/* Walking figure */}
      <WalkingFigure />

      {/* Placeholder text */}
      <Text
        position={[0, 2.5, -3]}
        fontSize={0.3}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        visitor room
      </Text>

      <Text
        position={[0, 2.1, -3]}
        fontSize={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        day 2 - coming soon
      </Text>
    </group>
  )
}
