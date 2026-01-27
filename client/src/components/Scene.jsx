import { Canvas } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import PointCloudSphere from './PointCloudSphere';
import VoronoiBackground from './VoronoiBackground';
import { useStore } from '../store';

// Audio-reactive post-processing effects
function PostEffects() {
    const { audioLevel } = useStore();
    
    // Calculate offset based on audio level (simple, no ref needed)
    const offset = 0.001 + audioLevel * 0.003;
    
    // Grain intensity slightly boosted by audio
    const grainIntensity = 0.1 + audioLevel * 0.05;
    
    return (
        <EffectComposer multisampling={0}>
            <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={[offset, offset]}
            />
            <Noise
                premultiply
                blendFunction={BlendFunction.SOFT_LIGHT}
                opacity={grainIntensity}
            />
        </EffectComposer>
    );
}

// Tesseract style component for the "Self" page
function SelfCube() {
    const outerRef = useRef();
    const innerRef = useRef();
    const { viewport } = useThree();

    useFrame((state) => {
        const { x, y } = state.mouse;

        // Mouse interaction tilt - subtle and only on mouse move
        if (outerRef.current) {
            outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, -y * 0.3, 0.1);
            outerRef.current.rotation.y = THREE.MathUtils.lerp(outerRef.current.rotation.y, x * 0.3, 0.1);
        }

        if (innerRef.current) {
            innerRef.current.rotation.y -= 0.005;
            innerRef.current.rotation.z += 0.002;
            // Pulse inner cube
            const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
            innerRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group>
            {/* Outer Cube */}
            <mesh ref={outerRef}>
                <boxGeometry args={[2.5, 2.5, 2.5]} />
                <meshBasicMaterial color="#ff4081" wireframe transparent opacity={0.4} />
            </mesh>

            {/* Inner Cube */}
            <mesh ref={innerRef}>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.8} />
            </mesh>

            {/* Connecting lines - simplified with a smaller cube */}
            <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <boxGeometry args={[1.8, 1.8, 1.8]} />
                <meshBasicMaterial color="#ff4081" wireframe transparent opacity={0.2} />
            </mesh>
        </group>
    );
}

export default function Scene() {
    const { sceneState } = useStore();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                camera={{ position: [0, 0, 9], fov: 50 }}
                dpr={[1, 1.5]}
                performance={{ min: 0.5 }}
                gl={{ antialias: false, powerPreference: 'high-performance' }}
            >
                <Suspense fallback={null}>
                    <VoronoiBackground />
                    <PointCloudSphere visible={true} />
                    {sceneState === 'self-cloud' && <SelfCube />}
                    <PostEffects />
                </Suspense>
            </Canvas>
        </div>
    );
}
