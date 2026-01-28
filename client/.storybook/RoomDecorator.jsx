import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { RoomProvider } from '../src/rooms/RoomContext';

// Mock context for Storybook - provides minimal implementations
const mockContext = {
  store: {
    params: {
      deformRadius: 1.0,
      deformStrength: 1.85,
      pointSize: 180,
      strokeWidth: 0.11,
      fillColor: '#b8b8a8',
      strokeColor: '#5a5a50',
      stressColor: '#c9a0a0',
      rotationSpeed: 0.15,
      springConstant: 0.002,
      damping: 0.90,
      repulsionStrength: 0.13,
    },
    scatterCount: 0,
    signalActive: false,
    audioLevel: 0,
    isAudioPlaying: false,
    hasEntered: true,
    sceneState: 'sphere',
    scatter: () => {},
    toggleSignal: () => {},
    randomizeParams: () => {},
    setParams: () => {},
    pluckTrigger: null,
  },
  audio: {
    pluck: () => {},
    setDroneParams: () => {},
    audioLevel: 0,
    isPlaying: false,
  },
  colors: {
    current: {
      fill: '#b8b8a8',
      stroke: '#5a5a50',
      stress: '#c9a0a0',
    },
    randomize: () => {},
  },
  actions: {
    shuffle: () => {},
    scatter: () => {},
    signal: () => {},
  },
  room: null,
};

// Post-processing effects for Storybook
function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.001, 0.001]}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.1}
      />
    </EffectComposer>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  );
}

// Room decorator that wraps stories with Canvas and shared systems
export const RoomDecorator = (Story, context) => {
  const { args = {} } = context;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />

          {/* Room content */}
          <Story />

          {/* Post-processing */}
          <PostEffects />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Provider decorator that wraps with RoomContext
export const RoomProviderDecorator = (Story, context) => {
  const room = context.parameters?.room || { id: 'storybook-room' };

  return (
    <RoomProvider room={room}>
      <Story />
    </RoomProvider>
  );
};

export default RoomDecorator;
