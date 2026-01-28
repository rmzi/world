// Leva control schema for the Harp room
// These controls are exposed in the Storybook and Leva panel

export const controlSchema = {
  // Sound controls
  sound: {
    label: 'Sound',
    collapsed: false,
    schema: {
      soundOn: { value: true, label: 'Sound On' },
      volume: { value: 0.4, min: 0, max: 0.7, step: 0.01 },
    },
  },

  // Animation parameters
  animation: {
    label: 'Animation',
    collapsed: false,
    schema: {
      deformRadius: { value: 1.0, min: 0.1, max: 2, step: 0.05 },
      deformStrength: { value: 1.85, min: 0.1, max: 2, step: 0.05 },
      pointSize: { value: 180, min: 50, max: 800, step: 10 },
      strokeWidth: { value: 0.11, min: 0, max: 0.4, step: 0.01 },
      fillColor: { value: '#b8b8a8' },
      strokeColor: { value: '#5a5a50' },
      stressColor: { value: '#c9a0a0' },
      rotationSpeed: { value: 0.15, min: 0, max: 1, step: 0.01 },
    },
  },

  // Physics parameters
  physics: {
    label: 'Physics',
    collapsed: true,
    schema: {
      springConstant: { value: 0.002, min: 0.002, max: 0.05, step: 0.001 },
      damping: { value: 0.90, min: 0.9, max: 0.99, step: 0.01 },
      repulsionStrength: { value: 0.13, min: 0.01, max: 0.2, step: 0.01 },
    },
  },
}

// Default values for the room
export const defaults = {
  deformRadius: 1.0,
  deformStrength: 1.85,
  pointSize: 180,
  strokeWidth: 0.11,
  fillColor: '#b8b8a8',
  strokeColor: '#5a5a50',
  stressColor: '#c9a0a0',
  rotationSpeed: 0.15,
  springConstant: 0.002,
  damping: 0.90,
  repulsionStrength: 0.13,
}

export default controlSchema
