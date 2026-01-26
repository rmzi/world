import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import PointCloudSphere from './PointCloudSphere';
import { useStore } from '../store';

// Self cloud component placeholder
function SelfCloud() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="hotpink" wireframe />
        </mesh>
    )
}

export default function Scene() {
    const { sceneState } = useStore();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
                <Suspense fallback={null}>
                    {sceneState === 'self-cloud' ?
                        <SelfCloud /> :
                        <PointCloudSphere />
                    }
                </Suspense>
            </Canvas>
        </div>
    );
}
