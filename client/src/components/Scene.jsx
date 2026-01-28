import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Text3D, Center } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import PointCloudSphere from './PointCloudSphere';
import VoronoiBackground from './VoronoiBackground';
import RoomGallery from './RoomGallery';
import { useStore, NavState } from '../store';
import RoomLoader from '../rooms/RoomLoader';
// getAllRooms triggers room registration via rooms/index.js imports
import { getAllRooms } from '../rooms/index';
import { isValidRoomId } from '../navigationMachine';

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
    const audioLevel = useStore(s => s.audioLevel);

    if (!quality.postProcessing) return null;

    const offset = 0.001 + audioLevel * 0.003;
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
    const isDragging = useRef(false);
    const previousX = useRef(0);
    const velocityY = useRef(0);
    const autoRotateSpeed = useRef(0.3);

    const clonedScene = useMemo(() => scene.clone(), [scene]);

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
                autoRotateSpeed.current = 0;
            } else {
                velocityY.current *= 0.95;
                headRef.current.rotation.y += velocityY.current;
                autoRotateSpeed.current += (0.3 - autoRotateSpeed.current) * 0.01;
                headRef.current.rotation.y += delta * autoRotateSpeed.current;
            }
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
        <group ref={headRef} position={[0, 0.3, 0]} scale={8}>
            <mesh
                position={[0, -1.68, 0]}
                onPointerDown={handlePointerDown}
                onPointerOver={() => { document.body.style.cursor = 'grab'; }}
                onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = 'auto'; }}
            >
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
            </mesh>
            <group position={[0, -1.68, 0]}>
                <primitive object={clonedScene} />
            </group>
        </group>
    );
}

function SelfModels() {
    return (
        <group>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />
            <RotatingHead />
        </group>
    );
}

// Animated letter for splash screen
function AnimatedLetter({ letter, index, xOffset, size = 0.6 }) {
    const letterRef = useRef();
    const materialRef = useRef();

    const speeds = useMemo(() => ({
        y: 2 + Math.random(),
        x: 1.5 + Math.random(),
        z: 2.5 + Math.random(),
    }), []);

    const [opacity, setOpacity] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setOpacity(0.9), index * 80);
        return () => clearTimeout(timer);
    }, [index]);

    useFrame((state) => {
        if (letterRef.current) {
            const t = state.clock.elapsedTime;
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

// 3D splash screen
function SplashText3D({ onEnter }) {
    const groupRef = useRef();
    const enterRef = useRef();
    const [hovered, setHovered] = useState(false);
    const enterOpacity = useRef(0);

    const letters = ['r', 'm', 'z', 'i'];
    const letterWidths = [0.35, 0.55, 0.4, 0.2];
    const letterPositions = useMemo(() => {
        const positions = [];
        let currentX = -0.65;
        letters.forEach((_, i) => {
            positions.push(currentX);
            currentX += letterWidths[i] + 0.05;
        });
        return positions;
    }, []);

    const textSize = isMobile ? 0.5 : 0.7;
    const rmziPosition = [0, 0.3, 4];
    const enterPosition = [0, -0.9, 4];
    const enterSize = isMobile ? 0.18 : 0.22;

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.015;
        }

        const targetOpacity = hovered ? 0.9 : 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
        enterOpacity.current += (targetOpacity - enterOpacity.current) * 0.1;
        if (enterRef.current) {
            enterRef.current.material.opacity = enterOpacity.current;
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
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 3, 5]} intensity={0.6} />
            <directionalLight position={[-3, 1, 3]} intensity={0.3} />

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

            <group position={enterPosition}>
                <mesh
                    position={[0, 0, 0.2]}
                    onClick={(e) => { e.stopPropagation(); onEnter(); }}
                    onPointerDown={(e) => { e.stopPropagation(); onEnter(); }}
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
                    >
                        enter
                    </Text3D>
                </Center>
            </group>
        </group>
    );
}

// Main scene content - controlled by navigation state machine
function SceneContent() {
    const navState = useStore(s => s.navState);
    const roomId = useStore(s => s.roomId);
    const sceneState = useStore(s => s.sceneState);
    const enter = useStore(s => s.enter);
    const selectRoom = useStore(s => s.selectRoom);

    const rooms = getAllRooms();

    // Handle room selection from gallery
    const handleSelectRoom = (selectedRoomId) => {
        if (isValidRoomId(selectedRoomId, rooms)) {
            selectRoom(selectedRoomId);
        }
    };

    return (
        <>
            {/* Background - always visible */}
            <VoronoiBackground />

            {/* SPLASH state - show splash screen */}
            {navState === NavState.SPLASH && (
                <SplashText3D onEnter={enter} />
            )}

            {/* GALLERY state - show room selector */}
            {navState === NavState.GALLERY && (
                <RoomGallery rooms={rooms} onSelectRoom={handleSelectRoom} />
            )}

            {/* ROOM state - show the selected room */}
            {navState === NavState.ROOM && roomId && (
                <>
                    {roomId === 'harp' ? (
                        <PointCloudSphere visible={true} />
                    ) : (
                        <RoomLoader roomId={roomId} />
                    )}
                </>
            )}

            {/* Legacy: Self page content */}
            {sceneState === 'self-cloud' && <SelfModels />}

            {/* Post-processing effects */}
            <PostEffects />
        </>
    );
}

// Listen for browser back/forward navigation
function useHashNavigation() {
    const navigateToRoom = useStore(s => s.navigateToRoom);
    const openGallery = useStore(s => s.openGallery);
    const navState = useStore(s => s.navState);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;

            // Don't respond to hash changes while in splash
            if (navState === NavState.SPLASH) return;

            if (!hash || hash === '#' || hash === '#/') {
                openGallery();
            } else {
                const roomId = hash.replace(/^#\/?/, '');
                if (roomId) {
                    navigateToRoom(roomId);
                }
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [navState, navigateToRoom, openGallery]);
}

export default function Scene() {
    useHashNavigation();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                camera={{ position: [0, 0, 9], fov: 50 }}
                dpr={quality.dpr}
                performance={{ min: 0.5 }}
                gl={{ antialias: false, powerPreference: 'high-performance' }}
            >
                <Suspense fallback={null}>
                    <SceneContent />
                </Suspense>
            </Canvas>
        </div>
    );
}

useGLTF.preload('/head.glb');
