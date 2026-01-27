import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// Performance: detect mobile
const isMobile = typeof navigator !== 'undefined' && 
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const VoronoiMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor1: new THREE.Color('#f0f0f0'),
        uColor2: new THREE.Color('#d8d8d8'),
        uLineColor: new THREE.Color('#a0a0a0'),
        uOpacity: 0.8,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader - organic cell-like pattern
    `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uLineColor;
    uniform float uOpacity;
    varying vec2 vUv;

    // Hash functions for randomness
    vec2 hash22(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    // Voronoi with distance to edges
    float voronoi(vec2 x, out float edge, out vec2 cellId) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        
        float m = 8.0;
        float m2 = 8.0;
        vec2 closestCell = vec2(0.0);
        
        for(int j = -1; j <= 1; j++)
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            // Gentle flowing movement - multiple wave speeds
            float t1 = uTime * 0.15;
            float t2 = uTime * 0.08;
            o = 0.5 + 0.35 * sin(t1 + 6.2831 * o) * cos(t2 + 3.14 * o.yx);
            vec2 r = g + o - f;
            float d = dot(r, r);
            
            if(d < m) {
                m2 = m;
                m = d;
                closestCell = n + g;
            } else if(d < m2) {
                m2 = d;
            }
        }
        
        // Edge detection (difference between closest and second closest)
        edge = m2 - m;
        cellId = closestCell;
        return sqrt(m);
    }

    void main() {
        // Denser cells - higher scale = more cells
        vec2 uv = vUv * 14.0;
        
        float edge;
        vec2 cellId;
        float v = voronoi(uv, edge, cellId);
        
        // Each cell gets unique subtle color variation based on its ID
        float cellVariation = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);
        float pulsePhase = cellVariation * 6.28;
        float pulse = 0.5 + 0.5 * sin(uTime * 0.2 + pulsePhase);
        
        // Soft gradient within cells with subtle pulsing
        vec3 cellColor = mix(uColor1, uColor2, v * 0.6 + cellVariation * 0.2 + pulse * 0.1);
        
        // More visible cell edges with soft glow
        float edgeLine = 1.0 - smoothstep(0.0, 0.08, edge);
        float edgeGlow = 1.0 - smoothstep(0.0, 0.25, edge);
        vec3 color = mix(cellColor, uLineColor, edgeLine * 0.5 + edgeGlow * 0.15);
        
        // Subtle inner cell highlight
        float innerHighlight = smoothstep(0.4, 0.0, v);
        color = mix(color, uColor1, innerHighlight * 0.15);
        
        // Softer vignette
        float vignette = 1.0 - length((vUv - 0.5) * 1.0);
        vignette = smoothstep(0.0, 0.6, vignette);
        
        gl_FragColor = vec4(color, uOpacity * vignette);
    }
    `
);

extend({ VoronoiMaterial });

export default function VoronoiBackground() {
    const materialRef = useRef();
    // Reduce opacity on mobile for performance (simpler GPU load)
    const opacity = isMobile ? 0.3 : 0.6;

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime += delta;
        }
    });

    return (
        <mesh position={[0, 0, -8]}>
            <planeGeometry args={[30, 30]} />
            <voronoiMaterial 
                ref={materialRef} 
                transparent 
                depthWrite={false}
                uOpacity={opacity}
            />
        </mesh>
    );
}
