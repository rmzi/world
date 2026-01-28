import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import PointCloudSphere from '../../components/PointCloudSphere';
import VoronoiBackground from '../../components/VoronoiBackground';
import { useStore } from '../../store';

// Import room to ensure it's registered
import './index';

// Wrapper component that provides store context
function HarpSceneWrapper({ colorHue, colorSaturation, pointSize, deformStrength, rotationSpeed }) {
  // Apply story args to store
  const setParams = useStore(s => s.setParams);

  // Update params when args change
  if (pointSize !== undefined) {
    setParams({ pointSize });
  }
  if (deformStrength !== undefined) {
    setParams({ deformStrength });
  }
  if (rotationSpeed !== undefined) {
    setParams({ rotationSpeed });
  }

  return <PointCloudSphere visible={true} />;
}

// Post-processing effects
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

// Canvas wrapper for all stories
function CanvasWrapper({ children }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <VoronoiBackground />
          {children}
          <PostEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Rooms/Harp',
  component: HarpSceneWrapper,
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 1500 }, // Wait for 3D to render and stabilize
  },
  decorators: [
    (Story) => (
      <CanvasWrapper>
        <Story />
      </CanvasWrapper>
    ),
  ],
};

// Default state
export const Default = {
  args: {},
};

// With custom controls
export const WithControls = {
  args: {
    pointSize: 180,
    deformStrength: 1.85,
    rotationSpeed: 0.15,
  },
  argTypes: {
    pointSize: {
      control: { type: 'range', min: 50, max: 800, step: 10 },
      description: 'Size of the points in the cloud',
    },
    deformStrength: {
      control: { type: 'range', min: 0.1, max: 2, step: 0.05 },
      description: 'How much the sphere deforms on interaction',
    },
    rotationSpeed: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Speed of automatic rotation',
    },
  },
};

// Large points variant
export const LargePoints = {
  args: {
    pointSize: 400,
  },
};

// Small points variant
export const SmallPoints = {
  args: {
    pointSize: 80,
  },
};

// Fast rotation
export const FastRotation = {
  args: {
    rotationSpeed: 0.8,
  },
};

// High deformation
export const HighDeformation = {
  args: {
    deformStrength: 2.0,
  },
};
