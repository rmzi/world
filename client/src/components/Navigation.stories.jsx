import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { Environment } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useStore, NavState } from '../store';
import VoronoiBackground from './VoronoiBackground';
import RoomGallery from './RoomGallery';
import PointCloudSphere from './PointCloudSphere';
import RoomLoader from '../rooms/RoomLoader';
import { getAllRooms } from '../rooms/index';

// Import room definitions to register them
import '../rooms/harp/index';
import '../rooms/visitor/index';

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

// Simplified splash text for stories (without heavy 3D text)
function SimpleSplashText({ onEnter }) {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 5]} intensity={0.6} />
      {/* Simple placeholder mesh for splash */}
      <mesh position={[0, 0, 4]} onClick={onEnter}>
        <boxGeometry args={[2, 0.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, -0.8, 4]} onClick={onEnter}>
        <boxGeometry args={[1, 0.3, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

// Component to set store state for stories
function StoreStateSetter({ navState, roomId, children }) {
  const store = useStore();

  useEffect(() => {
    // Directly set the store state for the story
    useStore.setState({ navState, roomId });
  }, [navState, roomId]);

  return children;
}

// Scene content that mirrors the actual SceneContent logic
function SceneContentForStory() {
  const navState = useStore(s => s.navState);
  const roomId = useStore(s => s.roomId);
  const enter = useStore(s => s.enter);
  const selectRoom = useStore(s => s.selectRoom);

  const rooms = getAllRooms();

  const handleSelectRoom = (selectedRoomId) => {
    selectRoom(selectedRoomId);
  };

  return (
    <>
      <VoronoiBackground />

      {/* Environment map for glass reflections in gallery */}
      {navState === NavState.GALLERY && (
        <Environment preset="city" />
      )}

      {navState === NavState.SPLASH && (
        <SimpleSplashText onEnter={enter} />
      )}

      {navState === NavState.GALLERY && (
        <RoomGallery rooms={rooms} onSelectRoom={handleSelectRoom} />
      )}

      {navState === NavState.ROOM && roomId && (
        <>
          {roomId === 'harp' ? (
            <PointCloudSphere visible={true} />
          ) : (
            <RoomLoader roomId={roomId} />
          )}
        </>
      )}

      <PostEffects />
    </>
  );
}

// Canvas wrapper for all stories
function CanvasWrapper({ children, navState, roomId }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#d4d4c4' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <StoreStateSetter navState={navState} roomId={roomId}>
            {children}
          </StoreStateSetter>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default {
  title: 'Components/Navigation',
  component: SceneContentForStory,
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 2000 }, // Wait for 3D scenes to render
  },
};

// Story: SPLASH state - showing splash text
export const SplashState = {
  render: () => (
    <CanvasWrapper navState={NavState.SPLASH} roomId={null}>
      <SceneContentForStory />
    </CanvasWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navigation in SPLASH state - shows the "rmzi" splash text with "enter" button.',
      },
    },
  },
};

// Story: GALLERY state - showing room gallery
export const GalleryState = {
  render: () => (
    <CanvasWrapper navState={NavState.GALLERY} roomId={null}>
      <SceneContentForStory />
    </CanvasWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navigation in GALLERY state - shows the RoomGallery with room selection cards.',
      },
    },
  },
};

// Story: ROOM state with roomId='harp' - showing PointCloudSphere
export const RoomStateHarp = {
  render: () => (
    <CanvasWrapper navState={NavState.ROOM} roomId="harp">
      <SceneContentForStory />
    </CanvasWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navigation in ROOM state with roomId="harp" - shows the PointCloudSphere audio-reactive visualization.',
      },
    },
  },
};

// Story: ROOM state with roomId='visitor' - showing visitor room
export const RoomStateVisitor = {
  render: () => (
    <CanvasWrapper navState={NavState.ROOM} roomId="visitor">
      <SceneContentForStory />
    </CanvasWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navigation in ROOM state with roomId="visitor" - shows the Visitor room with walking character.',
      },
    },
  },
};
