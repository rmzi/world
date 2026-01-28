import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import VisitorScene from './Scene';

// Import room to ensure it's registered
import './index';

// Canvas wrapper with liminal background
function CanvasWrapper({ children, cameraPosition = [2, 1.6, 6], cameraFov = 60 }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
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
};

// Default view - slightly offset for depth
export const Default = {
  render: () => (
    <CanvasWrapper cameraPosition={[2, 1.6, 6]}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};

// First person perspective
export const FirstPerson = {
  render: () => (
    <CanvasWrapper cameraPosition={[0, 1.6, 8]} cameraFov={75}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};

// Looking down the corridor
export const DownCorridor = {
  render: () => (
    <CanvasWrapper cameraPosition={[0, 1.6, 10]} cameraFov={50}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};

// Corner view
export const CornerView = {
  render: () => (
    <CanvasWrapper cameraPosition={[-4, 1.6, 5]} cameraFov={65}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};

// Top down surveillance style
export const Surveillance = {
  render: () => (
    <CanvasWrapper cameraPosition={[3, 6, 3]} cameraFov={50}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};

// Close up on the figure
export const FigureCloseUp = {
  render: () => (
    <CanvasWrapper cameraPosition={[1, 1.2, 2]} cameraFov={45}>
      <VisitorScene />
    </CanvasWrapper>
  ),
};
