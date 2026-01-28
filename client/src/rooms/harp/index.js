import { lazy } from 'react'
import { registerRoom } from '../index'

const room = {
  // Metadata
  id: 'harp',
  name: 'Harp',
  description: 'An audio-reactive point cloud sphere',
  day: 1, // Day 1 of the 30-day challenge

  // Scene component (lazy loaded)
  Scene: lazy(() => import('./Scene')),

  // Optional: Leva controls schema
  controls: lazy(() => import('./controls')),

  // Action handlers (what Shuffle/Scatter/Signal do)
  actions: {
    shuffle: (ctx) => {
      ctx.colors.randomize()
    },
    scatter: (ctx) => {
      ctx.store.scatter()
    },
    signal: (active, ctx) => {
      const { signalActive, toggleSignal } = ctx.store
      if (active !== signalActive) {
        toggleSignal()
      }
    },
  },

  // Optional lifecycle hooks
  onEnter: ({ store }) => {
    // Reset scene state when entering the room
    store.setSceneState('sphere')
  },
  onExit: () => {
    // Clean up when leaving
  },
}

// Self-register on import
registerRoom(room)

export default room
