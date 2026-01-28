import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import VisitorScene from './Scene';

// Import room to ensure it's registered
import './index';

// Canvas wrapper
function CanvasWrapper({ children }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: [0, 1, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Rooms/Visitor',
  component: VisitorScene,
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

export const TopDown = {
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
        <Canvas
          camera={{ position: [0, 8, 0], fov: 50 }}
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

export const SideView = {
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
        <Canvas
          camera={{ position: [5, 1, 0], fov: 50 }}
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
