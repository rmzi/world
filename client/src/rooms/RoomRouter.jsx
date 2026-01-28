import { useState, useEffect, useCallback } from 'react'
import { getRoom, getAllRooms } from './index'
import RoomLoader from './RoomLoader'

// Parse hash route (e.g., "#/harp" -> "harp")
const parseHash = () => {
  const hash = window.location.hash
  if (!hash || hash === '#' || hash === '#/') {
    return ''
  }
  // Remove leading "#/" or "#"
  return hash.replace(/^#\/?/, '')
}

// Hook for hash-based routing
export function useRoomRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((roomId) => {
    if (roomId) {
      window.location.hash = `/${roomId}`
    } else {
      window.location.hash = '/'
    }
  }, [])

  const goToGallery = useCallback(() => {
    window.location.hash = '/'
  }, [])

  return { route, navigate, goToGallery }
}

// Check if a route matches a valid room
export function isValidRoom(roomId) {
  return !!getRoom(roomId)
}

// Get room for current route, or null if at gallery/invalid
export function useCurrentRoomFromRoute() {
  const { route } = useRoomRoute()

  if (!route) return null

  const room = getRoom(route)
  return room || null
}

// Main router component - renders either gallery or room
export default function RoomRouter({
  galleryComponent: Gallery,
  onRoomChange,
}) {
  const { route, navigate, goToGallery } = useRoomRoute()

  // Derive current room directly from route (no state needed)
  const currentRoom = route ? getRoom(route) : null

  // Handle invalid routes and callbacks
  useEffect(() => {
    if (route && !currentRoom) {
      // Invalid room, redirect to gallery
      console.warn(`Invalid room route: ${route}`)
      goToGallery()
    }
  }, [route, currentRoom, goToGallery])

  // Notify parent of room changes (in a separate effect)
  useEffect(() => {
    onRoomChange?.(currentRoom)
  }, [currentRoom, onRoomChange])

  // At gallery
  if (!route || !currentRoom) {
    return Gallery ? <Gallery onSelectRoom={navigate} rooms={getAllRooms()} /> : null
  }

  // In a room
  return <RoomLoader roomId={currentRoom.id} />
}

// Navigation helpers for use anywhere in the app
export const navigateToRoom = (roomId) => {
  window.location.hash = `/${roomId}`
}

export const navigateToGallery = () => {
  window.location.hash = '/'
}
