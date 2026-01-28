import { create } from 'zustand';
import {
  NavState,
  NavAction,
  navTransition,
  getInitialStateFromURL,
  syncStateToURL,
} from './navigationMachine';

// Liminal/fluorescent color palette
const liminalFillColors = [
    '#d4c896', // muted yellow (fluorescent)
    '#98b88c', // sickly green
    '#7a9e9e', // desaturated teal
    '#b8b8a8', // fog gray
    '#c4b99e', // dusty cream
    '#a8b8a0', // pale sage
    '#9eb8b8', // muted cyan
    '#b8a8b0', // dusty mauve
];

const randomColor = () =>
    liminalFillColors[Math.floor(Math.random() * liminalFillColors.length)];

// Liminal stroke colors (muted, slightly darker versions)
const liminalStrokeColors = [
    '#6b6650', // dark muted yellow
    '#5a7052', // dark sage green
    '#4a6666', // dark teal
    '#707068', // charcoal gray
    '#5a5a50', // dark olive
    '#606858', // moss
    '#586868', // slate
];

const randomStrokeColor = () =>
    liminalStrokeColors[Math.floor(Math.random() * liminalStrokeColors.length)];

// Default visual parameters (liminal theme)
export const DEFAULT_PARAMS = {
    deformRadius: 1.0,
    deformStrength: 1.85,
    pointSize: 180,
    strokeWidth: 0.11,
    fillColor: '#b8b8a8', // fog gray
    strokeColor: '#5a5a50', // dark olive
    stressColor: '#c9a0a0', // fluorescent pink
    rotationSpeed: 0.15,
    springConstant: 0.002,
    damping: 0.90,
    repulsionStrength: 0.13,
};

// Liminal stress colors (muted but distinct)
const liminalStressColors = [
    '#c9a0a0', // fluorescent pink
    '#d9d4a0', // pale yellow
    '#a0c9b8', // mint
    '#b8a0c9', // lavender
    '#c9c0a0', // cream
    '#a0b8c9', // pale blue
];

const randomStressColor = () =>
    liminalStressColors[Math.floor(Math.random() * liminalStressColors.length)];

// Generate randomized parameters
export const generateRandomParams = () => ({
    deformRadius: 0.4 + Math.random() * 1.2,
    deformStrength: 0.2 + Math.random() * 1.5,
    pointSize: 80 + Math.random() * 200,
    strokeWidth: 0.05 + Math.random() * 0.25,
    fillColor: randomColor(),
    strokeColor: randomStrokeColor(),
    stressColor: randomStressColor(),
    rotationSpeed: 0.05 + Math.random() * 0.4,
    springConstant: 0.005 + Math.random() * 0.015,
    damping: 0.92 + Math.random() * 0.06,
    repulsionStrength: 0.02 + Math.random() * 0.06,
});

// Get initial navigation state from URL
const initialNavState = getInitialStateFromURL();

export const useStore = create((set, get) => ({
    // ==========================================================================
    // NAVIGATION STATE MACHINE
    // ==========================================================================
    navState: initialNavState.navState,
    roomId: initialNavState.roomId,

    // Dispatch a navigation action through the state machine
    navDispatch: (actionType, payload) => {
        const currentState = { navState: get().navState, roomId: get().roomId };
        const action = { type: actionType, payload };
        const newState = navTransition(currentState, action);

        // Only update if state actually changed
        if (newState.navState !== currentState.navState || newState.roomId !== currentState.roomId) {
            set({ navState: newState.navState, roomId: newState.roomId });
            syncStateToURL(newState);

            // Start audio when entering from splash
            if (currentState.navState === NavState.SPLASH && newState.navState !== NavState.SPLASH) {
                set({ isAudioPlaying: true });
            }
        }
    },

    // Convenience actions
    enter: () => get().navDispatch(NavAction.ENTER),
    selectRoom: (roomId) => get().navDispatch(NavAction.SELECT_ROOM, { roomId }),
    openGallery: () => get().navDispatch(NavAction.OPEN_GALLERY),
    navigateToRoom: (roomId) => get().navDispatch(NavAction.NAVIGATE_ROOM, { roomId }),

    // Derived state helpers
    isInSplash: () => get().navState === NavState.SPLASH,
    isInGallery: () => get().navState === NavState.GALLERY,
    isInRoom: () => get().navState === NavState.ROOM,

    // ==========================================================================
    // LEGACY STATE (for content pages - work, self, connect)
    // ==========================================================================
    isPaused: false,
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPaused: (val) => set({ isPaused: val }),

    activePage: null, // null (home), 'work', 'self', 'connect'
    setActivePage: (page) => set({ activePage: page }),

    // For off-screen transitions (legacy content pages)
    sceneState: 'sphere', // 'sphere', 'offscreen', 'self-cloud'
    setSceneState: (state) => set({ sceneState: state }),

    // ==========================================================================
    // AUDIO STATE
    // ==========================================================================
    isAudioPlaying: false,
    toggleAudio: () => set((state) => ({ isAudioPlaying: !state.isAudioPlaying })),
    volume: 0.4,
    setVolume: (val) => set({ volume: val }),

    // Scatter Trigger
    scatterCount: 0,
    scatter: () => set((state) => ({ scatterCount: state.scatterCount + 1 })),

    // Signal - continuous deformation toggle
    signalActive: false,
    toggleSignal: () => set((state) => ({ signalActive: !state.signalActive })),

    // Pluck audio trigger (set by AudioPlayer, called by PointCloudSphere)
    pluckTrigger: null,
    setPluckTrigger: (fn) => set({ pluckTrigger: fn }),

    // Audio level for visualization (0-1)
    audioLevel: 0,
    setAudioLevel: (val) => set({ audioLevel: val }),

    // Track if external media (YouTube embed) is playing - mutes drone
    isEmbedOpen: false,
    setEmbedOpen: (val) => set({ isEmbedOpen: val }),

    // ==========================================================================
    // VISUAL PARAMETERS
    // ==========================================================================
    params: { ...DEFAULT_PARAMS },
    setParams: (newParams) => set((state) => ({ params: { ...state.params, ...newParams } })),

    randomizeParams: () => {
        const newParams = generateRandomParams();
        set({ params: newParams });
    }
}));

// Re-export NavState and NavAction for convenience
export { NavState, NavAction };
