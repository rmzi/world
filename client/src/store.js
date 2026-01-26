import { create } from 'zustand';

export const useStore = create((set) => ({
    isPaused: false,
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPaused: (val) => set({ isPaused: val }),

    activePage: null, // null (home), 'work', 'self', 'connect'
    setActivePage: (page) => set({ activePage: page }),

    // Audio state
    isAudioPlaying: false,
    toggleAudio: () => set((state) => ({ isAudioPlaying: !state.isAudioPlaying })),

    // For off-screen transitions
    sceneState: 'sphere', // 'sphere', 'offscreen', 'self-cloud'
    setSceneState: (state) => set({ sceneState: state }),
}));
