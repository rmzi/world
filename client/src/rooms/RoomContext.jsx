import { createContext, useContext, useMemo } from 'react'
import { useStore } from '../store'

// Context for shared room utilities
const RoomContext = createContext(null)

// Hook to access room context
export const useRoomContext = () => {
  const ctx = useContext(RoomContext)
  if (!ctx) {
    throw new Error('useRoomContext must be used within a RoomProvider')
  }
  return ctx
}

// Hook for audio utilities
export const useAudio = () => {
  const { pluckTrigger, audioLevel, isAudioPlaying } = useStore()
  return {
    pluck: pluckTrigger,
    audioLevel,
    isPlaying: isAudioPlaying,
  }
}

// Hook for color utilities
export const useColors = () => {
  const params = useStore(s => s.params)
  const randomize = useStore(s => s.randomizeParams)
  return {
    h: params.colorHue,
    s: params.colorSaturation,
    l: params.colorLightness,
    fillColor: params.fillColor,
    strokeColor: params.strokeColor,
    stressColor: params.stressColor,
    randomize,
  }
}

// Provider component that wraps rooms with shared utilities
export function RoomProvider({ room, children }) {
  const store = useStore()
  const {
    pluckTrigger,
    audioLevel,
    isAudioPlaying,
    params,
    randomizeParams,
    scatter,
    toggleSignal,
    signalActive,
  } = store

  // Build context object matching the plan's ctx interface
  const ctx = useMemo(() => ({
    store,
    audio: {
      pluck: (options) => {
        if (pluckTrigger) {
          const { intensity = 0.5, yPosition = 0, displacement = 0.5 } = options || {}
          pluckTrigger(intensity, yPosition, displacement)
        }
      },
      setDroneParams: () => {}, // TODO: implement if needed
      audioLevel,
      isPlaying: isAudioPlaying,
    },
    colors: {
      current: {
        fill: params.fillColor,
        stroke: params.strokeColor,
        stress: params.stressColor,
      },
      randomize: randomizeParams,
    },
    actions: {
      shuffle: () => randomizeParams(),
      scatter: () => scatter(),
      signal: (active) => {
        if (active !== signalActive) {
          toggleSignal()
        }
      },
    },
    room,
  }), [
    store, pluckTrigger, audioLevel, isAudioPlaying,
    params, randomizeParams, scatter, toggleSignal, signalActive, room
  ])

  return (
    <RoomContext.Provider value={ctx}>
      {children}
    </RoomContext.Provider>
  )
}

export default RoomContext
