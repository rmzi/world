/**
 * Navigation State Machine for rmzi.world
 *
 * States:
 *   SPLASH   - Initial landing, showing "rmzi" + "enter" button
 *   GALLERY  - Room selection screen with 3D cards
 *   ROOM     - Inside a specific room (roomId in context)
 *
 * Transitions:
 *   SPLASH  → GALLERY  (user clicks "enter")
 *   GALLERY → ROOM     (user selects a room)
 *   ROOM    → GALLERY  (user clicks gallery button)
 *   ROOM    → ROOM     (direct navigation via URL)
 *
 * URL Sync:
 *   /         → GALLERY (or SPLASH if first visit)
 *   /#/       → GALLERY
 *   /#/harp   → ROOM (roomId: 'harp')
 *   /#/visitor → ROOM (roomId: 'visitor')
 */

export const NavState = {
  SPLASH: 'SPLASH',
  GALLERY: 'GALLERY',
  ROOM: 'ROOM',
}

export const NavAction = {
  ENTER: 'ENTER',           // SPLASH → GALLERY
  SELECT_ROOM: 'SELECT_ROOM', // GALLERY → ROOM
  OPEN_GALLERY: 'OPEN_GALLERY', // ROOM → GALLERY
  NAVIGATE_ROOM: 'NAVIGATE_ROOM', // Direct URL navigation to room
}

/**
 * Pure state machine transition function
 * @param {Object} state - Current state { navState, roomId }
 * @param {Object} action - Action { type, payload }
 * @returns {Object} - New state
 */
export function navTransition(state, action) {
  const { navState, roomId } = state
  const { type, payload } = action

  switch (navState) {
    case NavState.SPLASH:
      if (type === NavAction.ENTER) {
        return { navState: NavState.GALLERY, roomId: null }
      }
      // Allow direct room navigation from splash (e.g., shared link)
      if (type === NavAction.NAVIGATE_ROOM && payload?.roomId) {
        return { navState: NavState.ROOM, roomId: payload.roomId }
      }
      break

    case NavState.GALLERY:
      if (type === NavAction.SELECT_ROOM && payload?.roomId) {
        return { navState: NavState.ROOM, roomId: payload.roomId }
      }
      break

    case NavState.ROOM:
      if (type === NavAction.OPEN_GALLERY) {
        return { navState: NavState.GALLERY, roomId: null }
      }
      if (type === NavAction.NAVIGATE_ROOM && payload?.roomId) {
        return { navState: NavState.ROOM, roomId: payload.roomId }
      }
      break
  }

  // No valid transition, return current state
  return state
}

/**
 * Parse URL hash to determine initial state
 * @returns {Object} - Initial state based on URL
 */
export function getInitialStateFromURL() {
  const hash = window.location.hash

  // No hash or root - start at splash
  if (!hash || hash === '#' || hash === '#/') {
    return { navState: NavState.SPLASH, roomId: null }
  }

  // Parse room from hash (e.g., "#/harp" → "harp")
  const roomId = hash.replace(/^#\/?/, '')

  if (roomId) {
    // Direct link to room - go straight there (skip splash)
    return { navState: NavState.ROOM, roomId }
  }

  return { navState: NavState.SPLASH, roomId: null }
}

/**
 * Sync state to URL
 * @param {Object} state - Current nav state
 */
export function syncStateToURL(state) {
  const { navState, roomId } = state

  switch (navState) {
    case NavState.SPLASH:
      // Don't change URL on splash
      break
    case NavState.GALLERY:
      if (window.location.hash !== '#/') {
        window.history.replaceState(null, '', '#/')
      }
      break
    case NavState.ROOM:
      if (roomId) {
        const targetHash = `#/${roomId}`
        if (window.location.hash !== targetHash) {
          window.history.pushState(null, '', targetHash)
        }
      }
      break
  }
}

/**
 * Check if a room ID is valid
 * @param {string} roomId
 * @param {Array} rooms - Available rooms
 * @returns {boolean}
 */
export function isValidRoomId(roomId, rooms) {
  return rooms.some(r => r.id === roomId)
}
