import { Suspense, useEffect, useRef } from 'react'
import { RoomProvider, useRoomContext } from './RoomContext'
import { getRoom } from './index'

// Loading fallback for room scenes
function RoomLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  )
}

// Wrapper that handles room lifecycle
function RoomLifecycle({ room, children }) {
  const ctx = useRoomContext()
  const hasCalledEnter = useRef(false)
  const hasCalledExit = useRef(false)

  useEffect(() => {
    // Call onEnter when room mounts
    if (!hasCalledEnter.current && room.onEnter) {
      room.onEnter(ctx)
      hasCalledEnter.current = true
    }

    // Call onExit when room unmounts
    return () => {
      if (!hasCalledExit.current && room.onExit) {
        room.onExit(ctx)
        hasCalledExit.current = true
      }
    }
  }, [room, ctx])

  return children
}

// Main RoomLoader component
export default function RoomLoader({ roomId, fallback = <RoomLoadingFallback /> }) {
  const room = getRoom(roomId)

  if (!room) {
    console.warn(`Room "${roomId}" not found`)
    return null
  }

  const { Scene } = room

  if (!Scene) {
    console.warn(`Room "${roomId}" has no Scene component`)
    return null
  }

  return (
    <RoomProvider room={room}>
      <RoomLifecycle room={room}>
        <Suspense fallback={fallback}>
          <Scene />
        </Suspense>
      </RoomLifecycle>
    </RoomProvider>
  )
}

// Export a hook for rooms to access their own room data
export function useCurrentRoom() {
  const ctx = useRoomContext()
  return ctx.room
}
