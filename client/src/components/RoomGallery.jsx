import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Text, Float, MeshTransmissionMaterial, Center } from '@react-three/drei'
import * as THREE from 'three'

// Individual room card with glass effect
function RoomCard({ room, index, total, onSelect, isSelected }) {
  const groupRef = useRef()
  const materialRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Arrange cards in a horizontal row with spacing
  const spacing = 3
  const offsetX = (index - (total - 1) / 2) * spacing

  // Hover animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Scale animation on hover
      const targetScale = hovered ? 1.1 : 1
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 8)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale, delta * 8)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale, delta * 8)
    }

    if (materialRef.current) {
      // Glow effect on hover
      const targetEmissive = hovered ? 0.3 : 0
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity || 0,
        targetEmissive,
        delta * 8
      )
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onSelect(room.id)
  }

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <Float
      speed={2}
      rotationIntensity={0.1}
      floatIntensity={0.3}
      position={[offsetX, 0, 0]}
    >
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Glass card */}
        <RoundedBox args={[2, 2.8, 0.15]} radius={0.15} smoothness={4}>
          <MeshTransmissionMaterial
            ref={materialRef}
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={0.05}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            transmission={0.95}
            roughness={0.1}
            metalness={0}
            color={hovered ? '#ffffff' : '#f0f0f0'}
            emissive="#ffffff"
            emissiveIntensity={0}
          />
        </RoundedBox>

        {/* Day badge */}
        {room.day !== undefined && (
          <group position={[-0.65, 1.1, 0.1]}>
            <mesh>
              <circleGeometry args={[0.25, 32]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              font="/helvetiker_regular.typeface.json"
            >
              {room.day}
            </Text>
          </group>
        )}

        {/* Room name */}
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.28}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
          textAlign="center"
        >
          {room.name || room.id}
        </Text>

        {/* Description */}
        <Text
          position={[0, -0.5, 0.1]}
          fontSize={0.12}
          color="#666666"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
          textAlign="center"
        >
          {room.description || ''}
        </Text>
      </group>
    </Float>
  )
}

// Main gallery component - renders all room cards
export default function RoomGallery({ rooms = [], onSelectRoom }) {
  // Filter to only rooms with valid scenes
  const availableRooms = useMemo(() =>
    rooms.filter(room => room.Scene),
    [rooms]
  )

  if (availableRooms.length === 0) {
    return (
      <Center>
        <Text fontSize={0.3} color="#666">
          No rooms available
        </Text>
      </Center>
    )
  }

  return (
    <group>
      {/* Ambient lighting for the gallery */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />

      {/* Room cards */}
      {availableRooms.map((room, index) => (
        <RoomCard
          key={room.id}
          room={room}
          index={index}
          total={availableRooms.length}
          onSelect={onSelectRoom}
        />
      ))}
    </group>
  )
}
