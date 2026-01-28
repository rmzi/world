import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Environment } from '@react-three/drei';
import RoomGallery from './RoomGallery';

// Mock room data for stories
const mockRooms = [
  {
    id: 'harp',
    name: 'Harp',
    description: 'An audio-reactive point cloud sphere',
    day: 1,
    Scene: () => null,
  },
  {
    id: 'visitor',
    name: 'Visitor',
    description: 'A walking character in a liminal space',
    day: 2,
    Scene: () => null,
  },
  {
    id: 'corridor',
    name: 'Corridor',
    description: 'An endless hallway that loops',
    day: 3,
    Scene: () => null,
  },
];

// Canvas wrapper for 3D stories
function CanvasWrapper({ children, cameraPosition = [0, 0, 8] }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          {/* Environment map for glass reflections */}
          <Environment preset="city" />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Components/RoomGallery',
  component: RoomGallery,
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
  argTypes: {
    onSelectRoom: { action: 'room selected' },
  },
};

export const Default = {
  args: {
    rooms: mockRooms,
  },
};

export const SingleRoom = {
  args: {
    rooms: [mockRooms[0]],
  },
};

export const TwoRooms = {
  args: {
    rooms: mockRooms.slice(0, 2),
  },
};

export const ManyRooms = {
  args: {
    rooms: [
      ...mockRooms,
      { id: 'pool', name: 'Pool', description: 'Empty pool with flickering lights', day: 4, Scene: () => null },
      { id: 'office', name: 'Office', description: 'Abandoned cubicles at 3am', day: 5, Scene: () => null },
    ],
  },
};

export const EmptyGallery = {
  args: {
    rooms: [],
  },
};
