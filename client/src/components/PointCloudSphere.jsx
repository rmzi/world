import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useStore } from '../store';

const PointCloudMaterial = shaderMaterial(
    {
        uTime: 0,
        uMouse: new THREE.Vector3(999, 999, 999),
        uDeformRadius: 0.5,
        uDeformStrength: 0.5,
        uExplode: 0, // 0 = sphere, 1 = offscreen
        uColor: new THREE.Color('#ffffff'), // White points
    },
    // Vertex Shader
    `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uDeformRadius;
  uniform float uDeformStrength;
  uniform float uExplode;
  
  varying vec3 vPosition;
  
  void main() {
    vec3 pos = position;
    
    // Interaction Deformation
    float dist = distance(pos, uMouse);
    float influence = smoothstep(uDeformRadius, 0.0, dist);
    vec3 dir = normalize(pos); // Radial direction for sphere
    
    // Push away from mouse
    pos += dir * influence * uDeformStrength;
    
    // Pulse animation (sine wave)
    // pos += dir * sin(uTime + pos.y * 5.0) * 0.02;

    // Explode / Offscreen
    // Move points far away based on uExplode
    pos += dir * uExplode * 50.0;

    vec4 viewPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = 300.0 / -viewPosition.z; // Size attenuation
    vPosition = pos;
  }
  `,
    // Fragment Shader
    `
  uniform vec3 uColor;
  
  void main() {
    // Circle shape
    float d = distance(gl_PointCoord, vec2(0.5));
    if(d > 0.5) discard;
    
    gl_FragColor = vec4(uColor, 1.0);
  }
  `
);

extend({ PointCloudMaterial });

export default function PointCloudSphere() {
    const meshRef = useRef();
    const materialRef = useRef();
    const { sceneState, isPaused } = useStore();
    const { viewport } = useThree();

    // Create sphere points
    const points = useMemo(() => {
        const geometry = new THREE.SphereGeometry(2, 64, 64);
        return geometry.attributes.position; // Float32BufferAttribute
    }, []);

    const dummySphereRef = useRef(); // Invisible sphere for raycasting
    const [hoverPoint, setHoverPoint] = useState(null);

    useFrame((state, delta) => {
        if (materialRef.current) {
            // Pausing effect on time?
            if (!isPaused) {
                materialRef.current.uTime += delta;
            }

            // Lerp Explode value
            const targetExplode = sceneState === 'offscreen' ? 1.0 : 0.0;
            materialRef.current.uExplode = THREE.MathUtils.lerp(
                materialRef.current.uExplode,
                targetExplode,
                delta * 2.0
            );

            // Update mouse uniform
            if (hoverPoint) {
                materialRef.current.uMouse.lerp(hoverPoint, 0.2);
            } else {
                materialRef.current.uMouse.set(999, 999, 999);
            }
        }

        // Rotate the cloud slightly
        if (meshRef.current && !isPaused) {
            meshRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <>
            {/* The Point Cloud */}
            <points ref={meshRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <pointCloudMaterial ref={materialRef} transparent depthWrite={false} />
            </points>

            {/* Invisible Raycasting Hit Target */}
            <mesh
                ref={dummySphereRef}
                visible={false}
                onPointerMove={(e) => setHoverPoint(e.point)}
                onPointerOut={() => setHoverPoint(null)}
            >
                <sphereGeometry args={[2.2, 32, 32]} />
                <meshBasicMaterial />
            </mesh>
        </>
    );
}
