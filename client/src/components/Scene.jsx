import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
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

// Rotating head model for the "Self" page
function RotatingHead() {
    const headRef = useRef();
    const { scene } = useGLTF('/head.glb');
    
    // Clone the scene so we can manipulate it
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    
    useFrame((state, delta) => {
        if (headRef.current) {
            // Gentle continuous rotation
            headRef.current.rotation.y += delta * 0.3;
            // Subtle bob
            headRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
        }
    });
    
    return (
        <group ref={headRef} position={[0, 0.3, 0]} scale={8}>
            {/* Center the head (it's positioned at y ~1.7 in original) */}
            <group position={[0, -1.68, 0]}>
                <primitive object={clonedScene} />
            </group>
        </group>
    );
}

// Ghostly T-pose body in background
function GhostBody() {
    const bodyRef = useRef();
    const { scene } = useGLTF('/body.glb');
    
    // Clone and create wireframe version
    const wireframeScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                // Create wireframe material
                child.material = new THREE.MeshBasicMaterial({
                    color: '#7a9e9e',
                    wireframe: true,
                    transparent: true,
                    opacity: 0.15,
                });
            }
        });
        return clone;
    }, [scene]);
    
    // Random initial rotation
    const randomRotation = useMemo(() => ({
        x: (Math.random() - 0.5) * 0.4,
        y: Math.random() * Math.PI * 2,
        z: (Math.random() - 0.5) * 0.3,
    }), []);
    
    useFrame((state, delta) => {
        if (bodyRef.current) {
            // Very slow rotation
            bodyRef.current.rotation.y += delta * 0.05;
        }
    });
    
    return (
        <group 
            ref={bodyRef} 
            position={[2.5, -1.5, -4]} 
            scale={2}
            rotation={[randomRotation.x, randomRotation.y, randomRotation.z]}
        >
            {/* Center the body */}
            <group position={[0, -0.9, 0]}>
                <primitive object={wireframeScene} />
            </group>
        </group>
    );
}

// Combined Self page 3D elements
function SelfModels() {
    return (
        <group>
            {/* Ambient light for the models */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />
            
            {/* Main head in center */}
            <RotatingHead />
            
            {/* Ghost body in background */}
            <GhostBody />
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
                    {sceneState === 'self-cloud' && <SelfModels />}
                    <PostEffects />
                </Suspense>
            </Canvas>
        </div>
    );
}

// Preload models
useGLTF.preload('/head.glb');
useGLTF.preload('/body.glb');
