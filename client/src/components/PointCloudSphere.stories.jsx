import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import PointCloudSphere from './PointCloudSphere';
import VoronoiBackground from './VoronoiBackground';
import { useStore } from '../store';

// Component to apply story args to the store
function StoreUpdater({ fillColor, strokeColor, stressColor, pointSize, rotationSpeed, deformStrength }) {
  const setParams = useStore(s => s.setParams);

  useEffect(() => {
    const params = {};
    if (fillColor) params.fillColor = fillColor;
    if (strokeColor) params.strokeColor = strokeColor;
    if (stressColor) params.stressColor = stressColor;
    if (pointSize) params.pointSize = pointSize;
    if (rotationSpeed !== undefined) params.rotationSpeed = rotationSpeed;
    if (deformStrength !== undefined) params.deformStrength = deformStrength;
    if (Object.keys(params).length > 0) {
      setParams(params);
    }
  }, [fillColor, strokeColor, stressColor, pointSize, rotationSpeed, deformStrength, setParams]);

  return null;
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

// Canvas wrapper
function CanvasWrapper({ children, ...props }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <StoreUpdater {...props} />
          <VoronoiBackground />
          {children}
          <PostEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Components/PointCloudSphere',
  component: PointCloudSphere,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    fillColor: { control: 'color' },
    strokeColor: { control: 'color' },
    stressColor: { control: 'color' },
    pointSize: { control: { type: 'range', min: 50, max: 500, step: 10 } },
    rotationSpeed: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    deformStrength: { control: { type: 'range', min: 0.1, max: 2, step: 0.05 } },
  },
};

export const Default = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {},
};

export const Customizable = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    fillColor: '#b8b8a8',
    strokeColor: '#5a5a50',
    stressColor: '#c9a0a0',
    pointSize: 180,
    rotationSpeed: 0.15,
    deformStrength: 1.85,
  },
};

export const WarmPalette = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    fillColor: '#d4c896',
    strokeColor: '#6b6650',
    stressColor: '#c9a0a0',
    pointSize: 200,
  },
};

export const CoolPalette = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    fillColor: '#7a9e9e',
    strokeColor: '#4a6666',
    stressColor: '#a0b8c9',
    pointSize: 150,
  },
};

export const LargePoints = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    pointSize: 400,
  },
};

export const SmallPoints = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    pointSize: 80,
  },
};

export const FastRotation = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    rotationSpeed: 0.8,
  },
};

export const Stationary = {
  render: (args) => (
    <CanvasWrapper {...args}>
      <PointCloudSphere visible={true} />
    </CanvasWrapper>
  ),
  args: {
    rotationSpeed: 0,
  },
};
