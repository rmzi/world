import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

// Pentatonic scale frequencies based on A (110Hz) - sounds harmonious
const PENTATONIC_FREQUENCIES = [
    110, 130.81, 146.83, 164.81, 196,      // Octave 2
    220, 261.63, 293.66, 329.63, 392,      // Octave 3
    440, 523.25, 587.33, 659.25, 783.99,   // Octave 4
    880, 1046.5, 1174.66, 1318.51, 1567.98 // Octave 5
];

// Convert hex color to HSL for audio mapping
const hexToHSL = (hex) => {
    if (!hex || hex.length < 7) return { h: 0, s: 0, l: 0.5 };
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }
    return { h, s, l }; // h: 0-1, s: 0-1, l: 0-1
};

export default function AudioPlayer() {
    const { isAudioPlaying, volume, setPluckTrigger, setAudioLevel, params, scatterCount, isEmbedOpen, hasEntered } = useStore();
    const audioCtxRef = useRef(null);
    const isInitializedRef = useRef(false);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const nodesRef = useRef({
        oscs: [],
        gain: null,
        filter: null,
        panner: null,
        delay: null,
        delayGain: null,
        lfo: null,
        lfoGain: null,
        limiter: null,
        analyser: null,
    });
    
    const activePlucksRef = useRef(0);
    const MAX_CONCURRENT_PLUCKS = 12;
    const lastPluckTimeRef = useRef(0);
    const MIN_PLUCK_INTERVAL = 30;
    const lastScatterRef = useRef(scatterCount);

    // Initialize audio context - called on user interaction
    const initAudio = useCallback(() => {
        if (isInitializedRef.current) return audioCtxRef.current;
        
        try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                return null;
            }
            
                const ctx = new AudioContext();
                audioCtxRef.current = ctx;

            // === DRONE OSCILLATORS (softer, breathier) ===
            const baseFreq = 55; // A1
            const oscs = [0, 0.3, 0.7].map((detune, i) => {
                    const osc = ctx.createOscillator();
                osc.type = 'sine'; // All sine for softer tone
                osc.frequency.setValueAtTime(baseFreq + detune, ctx.currentTime);
                    osc.start();
                    return osc;
                });

            // Sub oscillator (one octave down) - very subtle
            const subOsc = ctx.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(baseFreq / 2, ctx.currentTime);
            subOsc.start();
            
            const subGain = ctx.createGain();
            subGain.gain.setValueAtTime(0.15, ctx.currentTime); // Quieter sub
            subOsc.connect(subGain);

            // === BREATHING LFO (slow volume modulation) ===
            const breathLfo = ctx.createOscillator();
            breathLfo.frequency.setValueAtTime(0.08, ctx.currentTime); // Very slow ~8 sec cycle
            const breathLfoGain = ctx.createGain();
            breathLfoGain.gain.setValueAtTime(0.15, ctx.currentTime); // Subtle volume swell
            breathLfo.connect(breathLfoGain);
            breathLfo.start();
            
            // Breath modulation target
            const breathGain = ctx.createGain();
            breathGain.gain.setValueAtTime(0.85, ctx.currentTime); // Base level
            breathLfoGain.connect(breathGain.gain); // LFO adds +/- 0.15

            // === PANNING LFO (gentle stereo movement) ===
            const panLfo = ctx.createOscillator();
            panLfo.frequency.setValueAtTime(0.03, ctx.currentTime); // Very slow pan
            const panLfoGain = ctx.createGain();
            panLfoGain.gain.setValueAtTime(0.2, ctx.currentTime); // Subtle movement
            panLfo.connect(panLfoGain);
            panLfo.start();

            // === FILTER (warmer, more muted) ===
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, ctx.currentTime); // Lower cutoff
            filter.Q.setValueAtTime(0.5, ctx.currentTime); // Less resonance

            // === PANNER ===
                const panner = ctx.createStereoPanner();
            panLfoGain.connect(panner.pan); // Slow pan movement

            // === REVERB LFO (modulates delay/reverb character) ===
            const reverbLfo = ctx.createOscillator();
            reverbLfo.frequency.setValueAtTime(0.05, ctx.currentTime); // ~20 sec cycle
            const reverbLfoGain = ctx.createGain();
            reverbLfoGain.gain.setValueAtTime(0.1, ctx.currentTime);
            reverbLfo.connect(reverbLfoGain);
            reverbLfo.start();

            // === ALGORITHMIC REVERB (multiple delay lines for spacious tail) ===
            // Primary delay line
            const delay = ctx.createDelay(2.0);
            delay.delayTime.setValueAtTime(0.4, ctx.currentTime);
            reverbLfoGain.connect(delay.delayTime); // LFO modulates delay time
            
            const delayGain = ctx.createGain();
            delayGain.gain.setValueAtTime(0.35, ctx.currentTime); // More wet signal
            
            const delayFilter = ctx.createBiquadFilter();
            delayFilter.type = 'lowpass';
            delayFilter.frequency.setValueAtTime(600, ctx.currentTime); // Darker reverb
            
            // Secondary delay (longer, for extended tail)
            const delay2 = ctx.createDelay(4.0);
            delay2.delayTime.setValueAtTime(0.73, ctx.currentTime); // Prime number ratio
            
            const delay2Gain = ctx.createGain();
            delay2Gain.gain.setValueAtTime(0.25, ctx.currentTime);
            
            const delay2Filter = ctx.createBiquadFilter();
            delay2Filter.type = 'lowpass';
            delay2Filter.frequency.setValueAtTime(400, ctx.currentTime); // Even darker
            
            // Third delay (very long, ghostly)
            const delay3 = ctx.createDelay(5.0);
            delay3.delayTime.setValueAtTime(1.17, ctx.currentTime); // Another prime ratio
            
            const delay3Gain = ctx.createGain();
            delay3Gain.gain.setValueAtTime(0.15, ctx.currentTime);
            
            const delay3Filter = ctx.createBiquadFilter();
            delay3Filter.type = 'lowpass';
            delay3Filter.frequency.setValueAtTime(300, ctx.currentTime); // Very dark
            
            // All-pass filters for diffusion (makes reverb more natural)
            const allpass1 = ctx.createBiquadFilter();
            allpass1.type = 'allpass';
            allpass1.frequency.setValueAtTime(200, ctx.currentTime);
            
            const allpass2 = ctx.createBiquadFilter();
            allpass2.type = 'allpass';
            allpass2.frequency.setValueAtTime(600, ctx.currentTime);

            // === NOISE LAYER (liminal texture) ===
            // Create noise buffer
            const noiseLength = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseLength; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            
            // Noise filter (bandpass for that distant, radio-static quality)
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(400, ctx.currentTime);
            noiseFilter.Q.setValueAtTime(0.5, ctx.currentTime);
            
            // LFO to modulate noise filter frequency (evolving texture)
            const noiseLfo = ctx.createOscillator();
            noiseLfo.frequency.setValueAtTime(0.07, ctx.currentTime); // ~14 sec cycle
            const noiseLfoGain = ctx.createGain();
            noiseLfoGain.gain.setValueAtTime(200, ctx.currentTime); // Sweep 200-600Hz
            noiseLfo.connect(noiseLfoGain);
            noiseLfoGain.connect(noiseFilter.frequency);
            noiseLfo.start();
            
            // Second LFO for noise volume (fade in and out)
            const noiseVolLfo = ctx.createOscillator();
            noiseVolLfo.frequency.setValueAtTime(0.04, ctx.currentTime); // ~25 sec cycle
            const noiseVolLfoGain = ctx.createGain();
            noiseVolLfoGain.gain.setValueAtTime(0.012, ctx.currentTime); // Very subtle
            noiseVolLfo.connect(noiseVolLfoGain);
            noiseVolLfo.start();
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.015, ctx.currentTime); // Base level very quiet
            noiseVolLfoGain.connect(noiseGain.gain); // LFO adds variation
            
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseSource.start();
            
            // === LIMITER (Compressor) ===
            const limiter = ctx.createDynamicsCompressor();
            limiter.threshold.setValueAtTime(-6, ctx.currentTime);  // Start compressing at -6dB
            limiter.knee.setValueAtTime(3, ctx.currentTime);        // Soft knee
            limiter.ratio.setValueAtTime(12, ctx.currentTime);      // Strong limiting
            limiter.attack.setValueAtTime(0.003, ctx.currentTime);  // Fast attack
            limiter.release.setValueAtTime(0.1, ctx.currentTime);   // Medium release

            // === ANALYSER for level metering ===
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            // === MASTER GAIN ===
                const masterGain = ctx.createGain();
                masterGain.gain.setValueAtTime(0, ctx.currentTime);

            // === REVERB NETWORK (interconnected delays for lush tail) ===
            // Primary delay loop with allpass diffusion
            delay.connect(allpass1);
            allpass1.connect(delayFilter);
            delayFilter.connect(delayGain);
            delayGain.connect(delay); // Primary feedback
            delayGain.connect(delay2Gain); // Cross-feed to delay 2
            delayGain.connect(limiter);
            
            // Secondary delay loop
            delay2.connect(allpass2);
            allpass2.connect(delay2Filter);
            delay2Filter.connect(delay2Gain);
            delay2Gain.connect(delay2); // Secondary feedback
            delay2Gain.connect(delay3Gain); // Cross-feed to delay 3
            delay2Gain.connect(limiter);
            
            // Third delay (longest tail)
            delay3.connect(delay3Filter);
            delay3Filter.connect(delay3Gain);
            delay3Gain.connect(delay3); // Tertiary feedback
            delay3Gain.connect(limiter);

            // === CONNECT GRAPH ===
            // Oscillators -> Filter -> Panner -> Breath modulation -> Master
            oscs.forEach(osc => osc.connect(filter));
            subGain.connect(filter);
            filter.connect(panner);
            panner.connect(breathGain); // Breathing volume modulation
            breathGain.connect(masterGain);
            
            // Noise layer feeds into master (subtle texture)
            noiseGain.connect(masterGain);
            
            masterGain.connect(limiter);
            masterGain.connect(delayGain); // Send drone to delay too
            
            // Limiter -> Analyser -> Destination
            limiter.connect(analyser);
            analyser.connect(ctx.destination);

            nodesRef.current = { 
                oscs: [...oscs, subOsc], subGain,
                gain: masterGain, filter, panner, 
                delay, delayGain, delayFilter,
                delay2, delay2Gain, delay2Filter,
                delay3, delay3Gain, delay3Filter,
                allpass1, allpass2,
                breathLfo, breathLfoGain, breathGain,
                panLfo, panLfoGain,
                reverbLfo, reverbLfoGain,
                noiseSource, noiseFilter, noiseGain, noiseLfo, noiseVolLfo,
                limiter, analyser
            };
            
            isInitializedRef.current = true;
            console.log('Audio initialized successfully');
            return ctx;
        } catch (err) {
            console.error('Failed to initialize audio:', err);
            return null;
        }
    }, []);

    // Resume audio context with Safari-friendly retry logic
    const resumeAudio = useCallback(async () => {
        const ctx = audioCtxRef.current;
        if (!ctx) return false;
        
        if (ctx.state === 'running') return true;
        
        try {
            await ctx.resume();
            return ctx.state === 'running';
        } catch (err) {
            console.warn('Failed to resume audio context:', err);
            return false;
        }
    }, []);

    // Create a pluck sound with color-influenced timbre
    // displacement param controls sustain (how far the point traveled)
    const triggerPluck = useCallback((intensity, yPosition, displacement = 0.5) => {
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') return;
        if (activePlucksRef.current >= MAX_CONCURRENT_PLUCKS) return;
        
        const now = Date.now();
        if (now - lastPluckTimeRef.current < MIN_PLUCK_INTERVAL) return;
        lastPluckTimeRef.current = now;

        // Get color influence on pluck sound
        const fillHSL = params?.fillColor ? hexToHSL(params.fillColor) : { h: 0, s: 0, l: 1 };
        const strokeHSL = params?.strokeColor ? hexToHSL(params.strokeColor) : { h: 0, s: 0, l: 0 };
        const strokeWidth = params?.strokeWidth || 0.11;
        const pointSize = params?.pointSize || 400;
        
        // Map Y position to frequency - use more of the scale based on pointSize
        const normalizedY = (yPosition + 1) / 2;
        const scaleRange = Math.floor(5 + (pointSize / 800) * 15); // 5-20 notes available
        const freqIndex = Math.floor(normalizedY * scaleRange);
        const frequency = PENTATONIC_FREQUENCIES[Math.max(0, Math.min(freqIndex, 
            PENTATONIC_FREQUENCIES.length - 1))];

        // Color dramatically affects pluck characteristics:
        // - Hue rotates through octaves and oscillator types
        // - Saturation = complexity (harmonics, resonance)
        // - Lightness = attack/brightness
        
        // Random variation for more organic feel
        const isGhostPluck = Math.random() < 0.15; // 15% chance of ghost pluck
        const volumeVariation = 0.7 + Math.random() * 0.6; // 70-130% volume
        const baseVolume = Math.min(0.4, 0.08 + intensity * 0.32) * volume * 3 * volumeVariation;
        const ghostMultiplier = isGhostPluck ? 0.3 : 1; // Ghost plucks are much quieter
        const finalVolume = baseVolume * ghostMultiplier;
        
        // Hue affects octave shift - full rotation = 2 octaves
        const octaveShift = Math.pow(2, Math.floor(fillHSL.h * 3) - 1); // 0.5x, 1x, 2x, or 4x
        const finalFreq = frequency * octaveShift;
        
        // Lightness affects attack (dark = soft pad-like, light = sharp pluck)
        // Ghost plucks always have soft attack
        const attackVariation = 0.8 + Math.random() * 0.4; // Random attack variation
        const attackTime = isGhostPluck 
            ? 0.08 + Math.random() * 0.12 // Ghost: very soft 80-200ms
            : (0.001 + (1 - fillHSL.l) * 0.06) * attackVariation;
        
        // Displacement affects release - bigger displacement = much longer release
        // Extended release times for liminal atmosphere (1-4 seconds)
        const releaseMultiplier = 1.5 + Math.min(displacement, 2) * 4; // 1.5x to 9.5x release
        
        // Base decay time, dramatically extended by displacement
        // Longer base decay for atmospheric tails
        const decayTime = (0.4 + strokeWidth * 3) * releaseMultiplier;
        
        activePlucksRef.current++;

        // Main oscillator - hue determines type blend
        const osc = ctx.createOscillator();
        const oscTypes = ['sine', 'triangle', 'square', 'sawtooth'];
        osc.type = oscTypes[Math.floor(fillHSL.h * 4) % 4];
        osc.frequency.setValueAtTime(finalFreq, ctx.currentTime);

        // Envelope with color-influenced shape - long gentle release for distant travels
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, ctx.currentTime);
        envelope.gain.linearRampToValueAtTime(finalVolume, ctx.currentTime + attackTime);
        
        // Saturation affects sustain curve (high sat = more sustain)
        const sustainLevel = finalVolume * (0.5 + fillHSL.s * 0.35);
        // Much longer, gentler release curve for liminal atmosphere
        const releaseTime = decayTime * 0.6;
        envelope.gain.setTargetAtTime(sustainLevel, ctx.currentTime + attackTime, releaseTime * 0.3);
        // Very slow final fade for lingering tail
        envelope.gain.setTargetAtTime(0.001, ctx.currentTime + attackTime + releaseTime, decayTime * 0.5);

        // No pitch bend - keep frequency stable for cleaner sound

        // Harmonics based on hue and saturation
        const harmonic = ctx.createOscillator();
        const harmonicRatios = [2, 3, 4, 5, 6, 7]; // More harmonic options
        const harmonicRatio = harmonicRatios[Math.floor(fillHSL.h * 6) % 6];
        harmonic.type = fillHSL.s > 0.5 ? 'triangle' : 'sine';
        harmonic.frequency.setValueAtTime(finalFreq * harmonicRatio, ctx.currentTime);
        
        const harmonicGain = ctx.createGain();
        // Saturation dramatically increases harmonic content
        const harmonicLevel = baseVolume * (0.05 + fillHSL.s * 0.4);
        harmonicGain.gain.setValueAtTime(harmonicLevel, ctx.currentTime);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decayTime * 0.6);

        // Filter - color affects cutoff dramatically
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Lightness = brightness (200Hz to 4000Hz range)
        const filterFreq = 200 + fillHSL.l * 3800;
        filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
        // Filter envelope - starts bright, darkens
        filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.3, ctx.currentTime + decayTime);
        // Saturation = resonance (creates more "twang")
        filter.Q.setValueAtTime(0.5 + fillHSL.s * 8, ctx.currentTime);

        // Stereo position based on Y position
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(yPosition * 0.7, ctx.currentTime);

        // Connect
        osc.connect(envelope);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(filter);
        envelope.connect(filter);
        filter.connect(panner);
        panner.connect(ctx.destination);

        // Send to all reverb delay lines for lush tail
        if (nodesRef.current.delay) {
            panner.connect(nodesRef.current.delay);
        }
        if (nodesRef.current.delay2) {
            panner.connect(nodesRef.current.delay2);
        }
        if (nodesRef.current.delay3) {
            panner.connect(nodesRef.current.delay3);
        }

        osc.start(ctx.currentTime);
        harmonic.start(ctx.currentTime);
        
        osc.stop(ctx.currentTime + decayTime + 0.1);
        harmonic.stop(ctx.currentTime + decayTime);
        
        osc.onended = () => {
            activePlucksRef.current--;
            osc.disconnect();
            envelope.disconnect();
            harmonic.disconnect();
            harmonicGain.disconnect();
            filter.disconnect();
            panner.disconnect();
        };
    }, [volume, params]);

    useEffect(() => {
        setPluckTrigger(triggerPluck);
        return () => setPluckTrigger(null);
    }, [triggerPluck, setPluckTrigger]);

    // Initialize audio when user enters the site (user gesture)
    useEffect(() => {
        if (hasEntered && !isInitializedRef.current) {
            // Initialize immediately on user gesture
            const ctx = initAudio();
            // If audio should be playing, start it
            if (ctx && isAudioPlaying && nodesRef.current.gain) {
                ctx.resume().then(() => {
                    nodesRef.current.gain.gain.setTargetAtTime(
                        volume * 0.23, ctx.currentTime, 0.5
                    );
                }).catch(() => {});
            }
        }
    }, [hasEntered, initAudio, isAudioPlaying, volume]);

    // Also try to init/resume on any user interaction as fallback for Safari
    useEffect(() => {
        const handleInteraction = async () => {
            if (!isInitializedRef.current && hasEntered) {
                initAudio();
            }
            if (isAudioPlaying && audioCtxRef.current?.state === 'suspended') {
                await resumeAudio();
            }
        };

        // Safari sometimes needs these specific events
        const events = ['click', 'touchstart', 'touchend', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: false, passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, [hasEntered, isAudioPlaying, initAudio, resumeAudio]);

    // Scatter creates a randomized burst of sounds
    useEffect(() => {
        if (scatterCount === 0 || scatterCount === lastScatterRef.current) return;
        lastScatterRef.current = scatterCount;
        
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running' || !isAudioPlaying) return;

        // Randomize scatter sound pattern
        const patterns = ['arpeggio', 'chord', 'cascade', 'explosion', 'shimmer'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        const noteCount = 4 + Math.floor(Math.random() * 6); // 4-9 notes
        const baseDelay = 20 + Math.random() * 60; // 20-80ms between notes
        
        for (let i = 0; i < noteCount; i++) {
            let yPos, timing, intensity;
            
            switch (pattern) {
                case 'arpeggio':
                    // Ascending or descending
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    yPos = direction * (-0.8 + (i / noteCount) * 1.6);
                    timing = i * baseDelay;
                    intensity = 0.4 + Math.random() * 0.3;
                    break;
                    
                case 'chord':
                    // All at once with slight spread
                    yPos = -0.6 + Math.random() * 1.2;
                    timing = i * 10; // Very close together
                    intensity = 0.3 + Math.random() * 0.2;
                    break;
                    
                case 'cascade':
                    // Fast start, slowing down
                    yPos = 0.8 - (i / noteCount) * 1.6;
                    timing = i * i * 15; // Accelerating gaps
                    intensity = 0.5 - (i / noteCount) * 0.3;
                    break;
                    
                case 'explosion':
                    // All random
                    yPos = -1 + Math.random() * 2;
                    timing = Math.random() * 200;
                    intensity = 0.2 + Math.random() * 0.5;
                    break;
                    
                case 'shimmer':
                    // High notes only, spread out
                    yPos = 0.3 + Math.random() * 0.7; // Upper register
                    timing = i * (baseDelay + Math.random() * 40);
                    intensity = 0.15 + Math.random() * 0.2; // Quieter
                    break;
                    
                default:
                    yPos = -0.8 + (i * 0.4);
                    timing = i * 60;
                    intensity = 0.5;
            }
            
            setTimeout(() => triggerPluck(intensity, yPos), timing);
        }
    }, [scatterCount, isAudioPlaying, triggerPluck]);

    // Update audio parameters based on visual params - MORE DRAMATIC
    useEffect(() => {
        const nodes = nodesRef.current;
        const ctx = audioCtxRef.current;
        if (!ctx || !nodes.filter || !params) return;

        const fillHSL = hexToHSL(params.fillColor || '#ffffff');
        const strokeHSL = hexToHSL(params.strokeColor || '#000000');
        
        // fillColor DRAMATICALLY affects filter (100Hz to 800Hz range)
        const filterFreq = 100 + fillHSL.l * 700;
        nodes.filter.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.3);
        
        // Saturation affects resonance dramatically (0.5 to 6)
        nodes.filter.Q.setTargetAtTime(0.5 + fillHSL.s * 5.5, ctx.currentTime, 0.2);
        
        // strokeWidth affects delay feedback (thicker = much more reverb)
        if (nodes.delayGain) {
            const feedback = 0.05 + (params.strokeWidth || 0.11) * 1.2;
            nodes.delayGain.gain.setTargetAtTime(Math.min(feedback, 0.55), ctx.currentTime, 0.3);
        }
        
        // strokeColor lightness affects delay time (0.1s to 0.6s)
        if (nodes.delay) {
            const delayTime = 0.1 + strokeHSL.l * 0.5;
            nodes.delay.delayTime.setTargetAtTime(delayTime, ctx.currentTime, 0.5);
        }
        
        // rotationSpeed affects LFO rate dramatically (0.01 to 0.3 Hz)
        if (nodes.lfo) {
            const lfoRate = 0.01 + (params.rotationSpeed || 0.1) * 0.29;
            nodes.lfo.frequency.setTargetAtTime(lfoRate, ctx.currentTime, 0.3);
        }
        
        // pointSize affects oscillator detune amount (more = wider, more chorus-like)
        if (nodes.oscs && nodes.oscs[1]) {
            const detuneAmount = 0.1 + ((params.pointSize || 400) / 800) * 3;
            nodes.oscs[1].frequency.setTargetAtTime(55 + detuneAmount, ctx.currentTime, 0.5);
        }
        if (nodes.oscs && nodes.oscs[2]) {
            const detuneAmount2 = 0.05 + ((params.pointSize || 400) / 800) * 1.5;
            nodes.oscs[2].frequency.setTargetAtTime(55 - detuneAmount2, ctx.currentTime, 0.5);
        }
        
        // Hue affects sub oscillator level (warmer hues = more bass)
        if (nodes.subGain) {
            // Red/orange (hue 0-0.15) = more sub, blue/purple = less
            const subLevel = fillHSL.h < 0.15 || fillHSL.h > 0.85 
                ? 0.4 + fillHSL.s * 0.3 
                : 0.1 + fillHSL.s * 0.1;
            nodes.subGain.gain.setTargetAtTime(subLevel, ctx.currentTime, 0.5);
        }

    }, [params]);

    // Handle play/pause and embed muting
useEffect(() => {
        const playAudio = async () => {
            // If context not ready yet, retry shortly
            if (!audioCtxRef.current || !nodesRef.current.gain) {
                if (isAudioPlaying && hasEntered) {
                    // Retry after a short delay
                    setTimeout(playAudio, 200);
                }
                return;
            }
            
            // Mute if audio is off OR if an embed is open
            const shouldPlay = isAudioPlaying && !isEmbedOpen;
            
            if (shouldPlay) {
                // Try to resume (especially important for Safari)
                const resumed = await resumeAudio();
                if (resumed) {
                    // Use shorter ramp time when restoring from embed pause
                    const rampTime = 0.3;
                    nodesRef.current.gain.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
                    nodesRef.current.gain.gain.setTargetAtTime(
                        volume * 0.23, audioCtxRef.current.currentTime, rampTime
                    );
                }
        } else {
                // Mute quickly when embed opens
                nodesRef.current.gain.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
                nodesRef.current.gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.15);
                // Only suspend if audio is actually off (not just muted for embed)
                if (!isAudioPlaying && audioCtxRef.current.state === 'running') {
                    setTimeout(() => {
                        if (!isAudioPlaying && audioCtxRef.current?.state === 'running') {
                            audioCtxRef.current.suspend().catch(() => {});
                }
            }, 1000);
        }
    }
        };

        playAudio();
    }, [isAudioPlaying, volume, isEmbedOpen, resumeAudio, hasEntered]);

    // Volume changes (only apply if not muted by embed)
useEffect(() => {
        if (nodesRef.current.gain && audioCtxRef.current && !isEmbedOpen && isAudioPlaying) {
            nodesRef.current.gain.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
            nodesRef.current.gain.gain.setTargetAtTime(
                volume * 0.23, audioCtxRef.current.currentTime, 0.3
            );
    }
    }, [volume, isEmbedOpen, isAudioPlaying]);

    // Audio level monitoring for visualization
useEffect(() => {
        let rafId = null;
        let dataArray = null;
        
        const updateLevel = () => {
            const analyser = analyserRef.current;
            const ctx = audioCtxRef.current;
            
            // Check if audio system is ready
            if (!isAudioPlaying || !analyser || !ctx || ctx.state !== 'running') {
                setAudioLevel(0);
                rafId = requestAnimationFrame(updateLevel);
                return;
            }
            
            // Initialize data array if needed
            if (!dataArray) {
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            }
            
            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS level from frequency data
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length) / 255;
            
            // Scale and clamp (boost it a bit for visibility)
            const level = Math.min(1, rms * 3);
            setAudioLevel(level);
            
            rafId = requestAnimationFrame(updateLevel);
        };
        
        // Start the monitoring loop
        rafId = requestAnimationFrame(updateLevel);
        
        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            setAudioLevel(0);
        };
    }, [isAudioPlaying, setAudioLevel]);

return null;
}
