// Room Registry - Central catalog of all available rooms
// Each room is lazy-loaded to keep initial bundle small

const rooms = new Map()

// Register a room in the registry
export const registerRoom = (room) => {
  if (!room.id) {
    throw new Error('Room must have an id')
  }
  rooms.set(room.id, room)
}

// Get a room by ID
export const getRoom = (id) => rooms.get(id)

// Get all rooms as an array
export const getAllRooms = () => Array.from(rooms.values())

// Get rooms sorted by day (for 30-day challenge ordering)
export const getRoomsByDay = () =>
  getAllRooms()
    .filter(room => room.day !== undefined)
    .sort((a, b) => a.day - b.day)

// Default export is the rooms Map for direct access
export default rooms

// =============================================================================
// ROOM REGISTRATION - Import all rooms here to ensure they're registered
// This runs synchronously when the module is first imported
// =============================================================================
import './harp/index'
import './visitor/index'
