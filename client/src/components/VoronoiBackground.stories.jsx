import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import VoronoiBackground from './VoronoiBackground';

// Canvas wrapper for 3D stories
function CanvasWrapper({ children }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Components/VoronoiBackground',
  component: VoronoiBackground,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <CanvasWrapper>
        <Story />
      </CanvasWrapper>
    ),
  ],
};

export const Default = {};

export const CloseUp = {
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <Canvas
          camera={{ position: [0, 0, 2], fov: 50 }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <Story />
          </Suspense>
        </Canvas>
      </div>
    ),
  ],
};

export const FarAway = {
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <Story />
          </Suspense>
        </Canvas>
      </div>
    ),
  ],
};
