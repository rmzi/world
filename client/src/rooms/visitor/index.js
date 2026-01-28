import { lazy } from 'react'
import { registerRoom } from '../index'

const room = {
  // Metadata
  id: 'visitor',
  name: 'Visitor',
  description: 'A walking character in a liminal space',
  day: 2, // Day 2 of the 30-day challenge

  // Scene component (lazy loaded)
  Scene: lazy(() => import('./Scene')),

  // Action handlers - placeholder implementations
  actions: {
    shuffle: ({ colors }) => {
      // TODO: Randomize character appearance or environment
      colors.randomize()
    },
    scatter: () => {
      // TODO: Trigger character animation or environment effect
    },
    signal: () => {
      // TODO: Toggle some continuous effect
    },
  },

  // Lifecycle hooks
  onEnter: ({ store }) => {
    store.setSceneState('sphere')
  },
  onExit: () => {
    // Clean up
  },
}

// Self-register on import
registerRoom(room)

export default room
