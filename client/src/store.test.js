import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore, generateRandomParams, DEFAULT_PARAMS } from './store';

describe('store', () => {
    beforeEach(() => {
        // Reset the store state before each test
        useStore.setState({
            isPaused: false,
            activePage: null,
            hasEntered: false,
            isAudioPlaying: false,
            volume: 0.1,
            sceneState: 'sphere',
            scatterCount: 0,
            signalActive: false,
            isEmbedOpen: false,
            audioLevel: 0,
            params: { ...DEFAULT_PARAMS },
        });
    });

    describe('DEFAULT_PARAMS', () => {
        it('should have all required animation parameters', () => {
            expect(DEFAULT_PARAMS).toHaveProperty('deformRadius');
            expect(DEFAULT_PARAMS).toHaveProperty('deformStrength');
            expect(DEFAULT_PARAMS).toHaveProperty('pointSize');
            expect(DEFAULT_PARAMS).toHaveProperty('strokeWidth');
            expect(DEFAULT_PARAMS).toHaveProperty('fillColor');
            expect(DEFAULT_PARAMS).toHaveProperty('strokeColor');
            expect(DEFAULT_PARAMS).toHaveProperty('rotationSpeed');
        });

        it('should have all required physics parameters', () => {
            expect(DEFAULT_PARAMS).toHaveProperty('springConstant');
            expect(DEFAULT_PARAMS).toHaveProperty('damping');
            expect(DEFAULT_PARAMS).toHaveProperty('repulsionStrength');
        });

        it('should have valid default values', () => {
            expect(DEFAULT_PARAMS.deformRadius).toBe(1.0);
            expect(DEFAULT_PARAMS.deformStrength).toBe(1.85);
            expect(DEFAULT_PARAMS.pointSize).toBe(180);
            expect(DEFAULT_PARAMS.fillColor).toBe('#b8b8a8'); // fog gray
            expect(DEFAULT_PARAMS.strokeColor).toBe('#5a5a50'); // dark olive
        });
    });

    describe('generateRandomParams', () => {
        it('should return an object with all required keys', () => {
            const params = generateRandomParams();
            
            expect(params).toHaveProperty('deformRadius');
            expect(params).toHaveProperty('deformStrength');
            expect(params).toHaveProperty('pointSize');
            expect(params).toHaveProperty('strokeWidth');
            expect(params).toHaveProperty('fillColor');
            expect(params).toHaveProperty('strokeColor');
            expect(params).toHaveProperty('rotationSpeed');
            expect(params).toHaveProperty('springConstant');
            expect(params).toHaveProperty('damping');
            expect(params).toHaveProperty('repulsionStrength');
        });

        it('should generate values within expected ranges', () => {
            // Run multiple times to test randomness
            for (let i = 0; i < 10; i++) {
                const params = generateRandomParams();
                
                // Animation params
                expect(params.deformRadius).toBeGreaterThanOrEqual(0.4);
                expect(params.deformRadius).toBeLessThanOrEqual(1.6);
                
                expect(params.deformStrength).toBeGreaterThanOrEqual(0.2);
                expect(params.deformStrength).toBeLessThanOrEqual(1.7);
                
                expect(params.pointSize).toBeGreaterThanOrEqual(80);
                expect(params.pointSize).toBeLessThanOrEqual(280);
                
                expect(params.strokeWidth).toBeGreaterThanOrEqual(0.05);
                expect(params.strokeWidth).toBeLessThanOrEqual(0.3);
                
                expect(params.rotationSpeed).toBeGreaterThanOrEqual(0.05);
                expect(params.rotationSpeed).toBeLessThanOrEqual(0.45);
                
                // Physics params
                expect(params.springConstant).toBeGreaterThanOrEqual(0.005);
                expect(params.springConstant).toBeLessThanOrEqual(0.02);
                
                expect(params.damping).toBeGreaterThanOrEqual(0.92);
                expect(params.damping).toBeLessThanOrEqual(0.98);
                
                expect(params.repulsionStrength).toBeGreaterThanOrEqual(0.02);
                expect(params.repulsionStrength).toBeLessThanOrEqual(0.12);
            }
        });

        it('should generate valid hex colors from liminal palette', () => {
            const liminalFillColors = [
                '#d4c896', '#98b88c', '#7a9e9e', '#b8b8a8',
                '#c4b99e', '#a8b8a0', '#9eb8b8', '#b8a8b0',
            ];
            const liminalStrokeColors = [
                '#6b6650', '#5a7052', '#4a6666', '#707068',
                '#5a5a50', '#606858', '#586868',
            ];
            
            for (let i = 0; i < 10; i++) {
                const params = generateRandomParams();
                
                // fillColor should be from liminal palette
                expect(liminalFillColors).toContain(params.fillColor);
                
                // strokeColor should be from liminal stroke palette
                expect(liminalStrokeColors).toContain(params.strokeColor);
            }
        });

        it('should generate different values on each call', () => {
            const params1 = generateRandomParams();
            const params2 = generateRandomParams();
            
            // At least some values should be different (very unlikely to be all same)
            const isDifferent = 
                params1.deformRadius !== params2.deformRadius ||
                params1.pointSize !== params2.pointSize ||
                params1.fillColor !== params2.fillColor;
            
            expect(isDifferent).toBe(true);
        });
    });

    describe('randomizeParams', () => {
        it('should update params in store with randomized values', () => {
            const { randomizeParams } = useStore.getState();
            const initialParams = useStore.getState().params;
            
            randomizeParams();
            
            const newParams = useStore.getState().params;
            
            // Params should have changed (at least some values should be different)
            const hasChanged = 
                initialParams.deformRadius !== newParams.deformRadius ||
                initialParams.fillColor !== newParams.fillColor ||
                initialParams.pointSize !== newParams.pointSize;
            
            expect(hasChanged).toBe(true);
        });

        it('should set all required param fields', () => {
            const { randomizeParams } = useStore.getState();
            randomizeParams();
            
            const params = useStore.getState().params;
            
            expect(params).toHaveProperty('deformRadius');
            expect(params).toHaveProperty('deformStrength');
            expect(params).toHaveProperty('pointSize');
            expect(params).toHaveProperty('strokeWidth');
            expect(params).toHaveProperty('fillColor');
            expect(params).toHaveProperty('strokeColor');
            expect(params).toHaveProperty('rotationSpeed');
            expect(params).toHaveProperty('springConstant');
            expect(params).toHaveProperty('damping');
            expect(params).toHaveProperty('repulsionStrength');
        });
    });

    describe('scatter', () => {
        it('should increment scatterCount', () => {
            const { scatter } = useStore.getState();
            
            expect(useStore.getState().scatterCount).toBe(0);
            scatter();
            expect(useStore.getState().scatterCount).toBe(1);
            scatter();
            expect(useStore.getState().scatterCount).toBe(2);
        });
    });

    describe('setParams', () => {
        it('should update specific params while preserving others', () => {
            const { setParams } = useStore.getState();
            
            setParams({ pointSize: 999 });
            
            const params = useStore.getState().params;
            expect(params.pointSize).toBe(999);
            expect(params.deformRadius).toBe(DEFAULT_PARAMS.deformRadius); // Should be preserved
        });
    });

    describe('audio controls', () => {
        it('should toggle audio playing state', () => {
            const { toggleAudio } = useStore.getState();
            
            expect(useStore.getState().isAudioPlaying).toBe(false);
            toggleAudio();
            expect(useStore.getState().isAudioPlaying).toBe(true);
            toggleAudio();
            expect(useStore.getState().isAudioPlaying).toBe(false);
        });

        it('should set volume', () => {
            const { setVolume } = useStore.getState();
            
            expect(useStore.getState().volume).toBe(0.1);
            setVolume(0.5);
            expect(useStore.getState().volume).toBe(0.5);
        });
    });

    describe('navigation', () => {
        it('should set active page', () => {
            const { setActivePage } = useStore.getState();
            
            expect(useStore.getState().activePage).toBe(null);
            setActivePage('work');
            expect(useStore.getState().activePage).toBe('work');
        });

        it('should toggle pause state', () => {
            const { togglePause } = useStore.getState();
            
            expect(useStore.getState().isPaused).toBe(false);
            togglePause();
            expect(useStore.getState().isPaused).toBe(true);
        });
    });

    describe('signal', () => {
        it('should toggle signal active state', () => {
            const { toggleSignal } = useStore.getState();
            
            expect(useStore.getState().signalActive).toBe(false);
            toggleSignal();
            expect(useStore.getState().signalActive).toBe(true);
            toggleSignal();
            expect(useStore.getState().signalActive).toBe(false);
        });
    });

    describe('embed state', () => {
        it('should set embed open state', () => {
            const { setEmbedOpen } = useStore.getState();
            
            expect(useStore.getState().isEmbedOpen).toBe(false);
            setEmbedOpen(true);
            expect(useStore.getState().isEmbedOpen).toBe(true);
            setEmbedOpen(false);
            expect(useStore.getState().isEmbedOpen).toBe(false);
        });
    });

    describe('audio level', () => {
        it('should set audio level for VU meter', () => {
            const { setAudioLevel } = useStore.getState();
            
            expect(useStore.getState().audioLevel).toBe(0);
            setAudioLevel(0.5);
            expect(useStore.getState().audioLevel).toBe(0.5);
            setAudioLevel(1.0);
            expect(useStore.getState().audioLevel).toBe(1.0);
        });
    });

    describe('enter experience', () => {
        it('should set hasEntered and start audio', () => {
            const { enter } = useStore.getState();
            
            expect(useStore.getState().hasEntered).toBe(false);
            expect(useStore.getState().isAudioPlaying).toBe(false);
            
            enter();
            
            expect(useStore.getState().hasEntered).toBe(true);
            expect(useStore.getState().isAudioPlaying).toBe(true);
        });
    });

    describe('scene state', () => {
        it('should set scene state for transitions', () => {
            const { setSceneState } = useStore.getState();
            
            expect(useStore.getState().sceneState).toBe('sphere');
            setSceneState('offscreen');
            expect(useStore.getState().sceneState).toBe('offscreen');
            setSceneState('self-cloud');
            expect(useStore.getState().sceneState).toBe('self-cloud');
        });
    });
});
