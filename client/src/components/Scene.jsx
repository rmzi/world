import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
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

// Rotating head model for the "Self" page - drag to spin
function RotatingHead() {
    const headRef = useRef();
    const { scene } = useGLTF('/head.glb');
    const isDragging = useRef(false);
    const previousX = useRef(0);
    const velocityY = useRef(0);
    const autoRotateSpeed = useRef(0.3);
    
    // Clone the scene so we can manipulate it
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    
    // Window-level event listeners for smooth dragging
    useEffect(() => {
        const handleMove = (e) => {
            if (!isDragging.current) return;
            const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
            const deltaX = currentX - previousX.current;
            velocityY.current = deltaX * 0.01;
            if (headRef.current) {
                headRef.current.rotation.y += deltaX * 0.01;
            }
            previousX.current = currentX;
        };
        
        const handleUp = () => {
            isDragging.current = false;
        };
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);
    
    useFrame((state, delta) => {
        if (headRef.current) {
            if (isDragging.current) {
                // When dragging, don't auto-rotate
                autoRotateSpeed.current = 0;
            } else {
                // Apply velocity with friction
                velocityY.current *= 0.95;
                headRef.current.rotation.y += velocityY.current;
                
                // Gradually restore auto-rotation
                autoRotateSpeed.current += (0.3 - autoRotateSpeed.current) * 0.01;
                headRef.current.rotation.y += delta * autoRotateSpeed.current;
            }
            // Subtle bob
            headRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
        }
    });
    
    const handlePointerDown = (e) => {
        e.stopPropagation();
        isDragging.current = true;
        previousX.current = e.clientX || e.touches?.[0]?.clientX || 0;
        velocityY.current = 0;
        document.body.style.cursor = 'grabbing';
    };
    
    return (
        <group 
            ref={headRef} 
            position={[0, 0.3, 0]} 
            scale={8}
            onPointerDown={handlePointerDown}
            onPointerOver={() => { document.body.style.cursor = 'grab'; }}
            onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = 'auto'; }}
        >
            {/* Large invisible hitbox for easier interaction */}
            <mesh position={[0, -1.68, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {/* Center the head (it's positioned at y ~1.7 in original) */}
            <group position={[0, -1.68, 0]}>
                <primitive object={clonedScene} />
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
function AnimatedLetter({ letter, index, xOffset, size = 0.6 }) {
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
                size={size}
                height={size * 0.13}
                curveSegments={quality.textCurveSegments}
                bevelEnabled
                bevelThickness={size * 0.017}
                bevelSize={size * 0.017}
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
    const showEnter = true; // Always show enter immediately
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
    
    // Centered on page, in front of sphere (z=4 puts it closer to camera)
    const textSize = isMobile ? 0.5 : 0.7;
    const rmziPosition = [0, 0.3, 4];
    const enterPosition = [0, -0.9, 4];
    const enterSize = isMobile ? 0.18 : 0.22;
    
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
            
            {/* Animated letters "rmzi" - centered */}
            <Center position={rmziPosition}>
                <group>
                    {letters.map((letter, i) => (
                        <AnimatedLetter 
                            key={i} 
                            letter={letter} 
                            index={i} 
                            xOffset={letterPositions[i] * (textSize / 0.7)} 
                            size={textSize}
                        />
                    ))}
                </group>
            </Center>
            
            {/* "enter" button - responsive position */}
            {showEnter && (
                <group position={enterPosition}>
                    {/* Large invisible hitbox for easy clicking/tapping */}
                    <mesh 
                        position={[0, 0, 0.2]} 
                        onClick={(e) => { e.stopPropagation(); onEnter(); }}
                        onPointerDown={(e) => { e.stopPropagation(); onEnter(); }}
                        onPointerUp={(e) => { e.stopPropagation(); onEnter(); }}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = 'pointer';
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = 'auto';
                        }}
                    >
                        <planeGeometry args={[2.5, 1.2]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    {/* Visible text - also clickable */}
                    <Center>
                        <Text3D
                            ref={enterRef}
                            font="/helvetiker_regular.typeface.json"
                            size={enterSize}
                            height={enterSize * 0.16}
                            curveSegments={8}
                            bevelEnabled
                            bevelThickness={enterSize * 0.024}
                            bevelSize={enterSize * 0.024}
                            bevelSegments={2}
                            material={enterMaterial}
                            onClick={(e) => { e.stopPropagation(); onEnter(); }}
                            onPointerDown={(e) => { e.stopPropagation(); onEnter(); }}
                        >
                            enter
                        </Text3D>
                    </Center>
                </group>
            )}
        </group>
    );
}

export default function Scene() {
    const { sceneState, hasEntered, enter } = useStore();
    
    const handleEnter = () => {
        enter(); // Sets hasEntered=true and isAudioPlaying=true
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
