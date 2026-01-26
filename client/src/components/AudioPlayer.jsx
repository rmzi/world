import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export default function AudioPlayer() {
    const { isAudioPlaying } = useStore();
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const pannerRef = useRef(null);
    const gainRef = useRef(null);

    useEffect(() => {
        const initAudio = () => {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContext();

                oscillatorRef.current = audioCtxRef.current.createOscillator();
                oscillatorRef.current.type = 'sine';
                oscillatorRef.current.frequency.setValueAtTime(440, audioCtxRef.current.currentTime); // A4

                pannerRef.current = audioCtxRef.current.createStereoPanner();

                gainRef.current = audioCtxRef.current.createGain();
                gainRef.current.gain.value = 0.1; // Low volume

                oscillatorRef.current
                    .connect(gainRef.current)
                    .connect(pannerRef.current)
                    .connect(audioCtxRef.current.destination);

                oscillatorRef.current.start();
                audioCtxRef.current.suspend(); // Start suspended
            }
        };

        initAudio();

        return () => {
            // cleanup if needed
        }
    }, []);

    useEffect(() => {
        if (audioCtxRef.current) {
            if (isAudioPlaying) {
                audioCtxRef.current.resume();
            } else {
                audioCtxRef.current.suspend();
            }
        }
    }, [isAudioPlaying]);

    // Simple panning animation
    useEffect(() => {
        let animationFrame;
        const animate = () => {
            if (pannerRef.current && isAudioPlaying) {
                const time = Date.now() / 1000;
                pannerRef.current.pan.value = Math.sin(time); // Pan left-right
            }
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isAudioPlaying]);

    return null; // Invisible component
}
