import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Text3D, Center } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import PointCloudSphere from './PointCloudSphere';
import VoronoiBackground from './VoronoiBackground';
import { useStore } from '../store';

// Performance: detect mobile/low-power devices
const isMobile = typeof navigator !== 'undefined' && 
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const quality = {
    postProcessing: !isMobile,
    textCurveSegments: isMobile ? 6 : 12,
    textBevelSegments: isMobile ? 2 : 3,
    dpr: isMobile ? [1, 1] : [1, 1.5],
};

// Audio-reactive post-processing effects (skip on mobile)
function PostEffects() {
    const { audioLevel } = useStore();
    
    // Skip post-processing on mobile for performance
    if (!quality.postProcessing) return null;
    
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

// Interactive T-pose body on splash screen - drag to spin
function GhostBody({ visible }) {
    const bodyRef = useRef();
    const { scene } = useGLTF('/body.glb');
    const isDragging = useRef(false);
    const previousX = useRef(0);
    const velocityY = useRef(0);
    const targetRotationY = useRef(0);
    
    // Clone and create wireframe version
    const wireframeScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshBasicMaterial({
                    color: '#5a7a7a',
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3,
                    depthWrite: false,
                });
            }
        });
        return clone;
    }, [scene]);
    
    // Random initial rotation
    const randomRotation = useMemo(() => ({
        x: (Math.random() - 0.5) * 0.1,
        y: Math.random() * Math.PI * 2,
        z: (Math.random() - 0.5) * 0.08,
    }), []);
    
    // Initialize target rotation
    useMemo(() => {
        targetRotationY.current = randomRotation.y;
    }, [randomRotation.y]);
    
    useFrame((state, delta) => {
        if (bodyRef.current) {
            // Apply velocity with friction when not dragging
            if (!isDragging.current) {
                velocityY.current *= 0.95; // Friction
                targetRotationY.current += velocityY.current;
            }
            
            // Smooth interpolation to target rotation
            bodyRef.current.rotation.y = THREE.MathUtils.lerp(
                bodyRef.current.rotation.y,
                targetRotationY.current,
                0.1
            );
            
            // Gentle floating motion at center of sphere
            bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
        }
    });
    
    const handlePointerDown = (e) => {
        e.stopPropagation();
        isDragging.current = true;
        previousX.current = e.clientX || e.touches?.[0]?.clientX || 0;
        velocityY.current = 0;
    };
    
    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
        const deltaX = currentX - previousX.current;
        velocityY.current = deltaX * 0.01;
        targetRotationY.current += deltaX * 0.01;
        previousX.current = currentX;
    };
    
    const handlePointerUp = () => {
        isDragging.current = false;
    };
    
    if (!visible) return null;
    
    return (
        <group 
            ref={bodyRef} 
            position={[0, 0, 0]} 
            scale={2.2}
            rotation={[randomRotation.x, randomRotation.y, randomRotation.z]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Invisible hitbox for easier interaction */}
            <mesh visible={false}>
                <boxGeometry args={[1.2, 2, 0.5]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {/* Center the body's navel in the sphere */}
            <group position={[0, -0.45, 0]}>
                <primitive object={wireframeScene} />
            </group>
        </group>
    );
}

// Self page - just the rotating head
function SelfModels() {
    return (
        <group>
            {/* Ambient light for the head model */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />
            
            {/* Main head in center */}
            <RotatingHead />
        </group>
    );
}

// Animated individual letter for splash screen
function AnimatedLetter({ letter, index, xOffset }) {
    const letterRef = useRef();
    const materialRef = useRef();
    
    // Random animation speeds per letter (like the original HTML version)
    const speeds = useMemo(() => ({
        y: 2 + Math.random(),
        x: 1.5 + Math.random(),
        z: 2.5 + Math.random(),
    }), []);
    
    // Fade in delay per letter
    const [opacity, setOpacity] = useState(0);
    useMemo(() => {
        setTimeout(() => setOpacity(0.9), index * 80);
    }, [index]);
    
    useFrame((state) => {
        if (letterRef.current) {
            const t = state.clock.elapsedTime;
            // Animate y: [0, -0.03, 0.03, 0] and x: [0, 0.015, -0.015, 0]
            letterRef.current.position.y = Math.sin(t / speeds.y * Math.PI * 2) * 0.03;
            letterRef.current.position.x = xOffset + Math.sin(t / speeds.x * Math.PI * 2) * 0.015;
            letterRef.current.position.z = Math.sin(t / speeds.z * Math.PI * 2) * 0.01;
        }
        if (materialRef.current) {
            materialRef.current.opacity = opacity;
        }
    });
    
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        metalness: 0.1,
        roughness: 0.8,
        transparent: true,
        opacity: 0,
    }), []);
    
    return (
        <group ref={letterRef} position={[xOffset, 0, 0]}>
            <Text3D
                font="/helvetiker_regular.typeface.json"
                size={0.6}
                height={0.08}
                curveSegments={quality.textCurveSegments}
                bevelEnabled
                bevelThickness={0.01}
                bevelSize={0.01}
                bevelSegments={quality.textBevelSegments}
            >
                {letter}
                <primitive object={material} ref={materialRef} attach="material" />
            </Text3D>
        </group>
    );
}

// 3D text for the splash screen
function SplashText3D({ onEnter }) {
    const groupRef = useRef();
    const enterRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [showEnter, setShowEnter] = useState(false);
    const enterOpacity = useRef(0);
    
    // Letter positions (approximate widths for helvetiker)
    const letters = ['r', 'm', 'z', 'i'];
    const letterWidths = [0.35, 0.55, 0.4, 0.2]; // approximate widths
    const letterPositions = useMemo(() => {
        const positions = [];
        let currentX = -0.65; // start offset to center
        letters.forEach((_, i) => {
            positions.push(currentX);
            currentX += letterWidths[i] + 0.05; // width + spacing
        });
        return positions;
    }, []);
    
    // Show enter after a short delay
    useMemo(() => {
        setTimeout(() => setShowEnter(true), 1500);
    }, []);
    
    useFrame((state) => {
        if (groupRef.current) {
            // Very subtle overall rotation
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.015;
        }
        
        // Animate enter opacity
        if (showEnter) {
            const targetOpacity = hovered ? 0.9 : 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
            enterOpacity.current += (targetOpacity - enterOpacity.current) * 0.1;
            if (enterRef.current) {
                enterRef.current.material.opacity = enterOpacity.current;
            }
        }
    });
    
    const enterMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        metalness: 0.1,
        roughness: 0.8,
        transparent: true,
        opacity: 0.3,
    }), []);
    
    return (
        <group ref={groupRef}>
            {/* Lighting for text */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 3, 5]} intensity={0.6} />
            <directionalLight position={[-3, 1, 3]} intensity={0.3} />
            
            {/* Animated letters "rmzi" - bottom left corner */}
            <group position={[-3.2, -2.8, 3]}>
                {letters.map((letter, i) => (
                    <AnimatedLetter 
                        key={i} 
                        letter={letter} 
                        index={i} 
                        xOffset={letterPositions[i]} 
                    />
                ))}
            </group>
            
            {/* "enter" button - below the sphere */}
            {showEnter && (
                <Center position={[0, -2.8, 3]}>
                    <Text3D
                        ref={enterRef}
                        font="/helvetiker_regular.typeface.json"
                        size={0.25}
                        height={0.04}
                        curveSegments={8}
                        bevelEnabled
                        bevelThickness={0.006}
                        bevelSize={0.006}
                        bevelSegments={2}
                        material={enterMaterial}
                        onClick={onEnter}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = 'pointer';
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = 'auto';
                        }}
                    >
                        enter
                    </Text3D>
                    {/* Invisible hitbox for easier clicking */}
                    <mesh 
                        position={[0.4, 0.1, 0.02]} 
                        onClick={onEnter}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = 'pointer';
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = 'auto';
                        }}
                    >
                        <boxGeometry args={[1.2, 0.5, 0.3]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </Center>
            )}
        </group>
    );
}

export default function Scene() {
    const { sceneState, hasEntered, setHasEntered, setIsAudioPlaying } = useStore();
    
    const handleEnter = () => {
        setHasEntered(true);
        setIsAudioPlaying(true);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                camera={{ position: [0, 0, 9], fov: 50 }}
                dpr={quality.dpr}
                performance={{ min: 0.5 }}
                gl={{ antialias: false, powerPreference: 'high-performance' }}
            >
                <Suspense fallback={null}>
                    <VoronoiBackground />
                    <PointCloudSphere visible={true} />
                    {/* Ghost body on splash screen */}
                    <GhostBody visible={!hasEntered} />
                    {/* 3D splash text */}
                    {!hasEntered && <SplashText3D onEnter={handleEnter} />}
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
