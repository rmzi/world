import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useStore } from '../store';
import { useControls, folder, button } from 'leva';

const PointCloudMaterial = shaderMaterial(
    {
        uTime: 0,
        uMouse: new THREE.Vector3(999, 999, 999),
        uDeformRadius: 0.5,
        uDeformStrength: 0.5,
        uExplode: 0,
        uOpacity: 1.0,
        uColor: new THREE.Color('#ffffff'),
        uStrokeColor: new THREE.Color('#1a1a1a'),
        uStrokeWidth: 0.12,
        uPointSize: 300.0,
        uStressColor: new THREE.Color('#ff4081'), // Color when stressed/displaced
        uAudioLevel: 0.0, // Audio reactivity (0-1)
    },
    // Vertex Shader
    `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uDeformRadius;
  uniform float uDeformStrength;
  uniform float uExplode;
  uniform float uPointSize;
  uniform float uAudioLevel;
  
  attribute float displacement;
  
  varying vec3 vPosition;
  varying float vDisplacement;
  varying float vDepth;
  varying float vAudioLevel;
  
  void main() {
    vec3 pos = position;
    vec3 dir = normalize(pos);

    // Explode / Offscreen
    pos += dir * uExplode * 10.0;

    vec4 viewPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    
    // Size varies with displacement AND audio level - pulses with sound
    float sizeBoost = 1.0 + displacement * 0.3;
    float audioPulse = 1.0 + uAudioLevel * 0.15; // ±15% size variance with audio
    gl_PointSize = (uPointSize * sizeBoost * audioPulse) / -viewPosition.z;
    
    vPosition = pos;
    vDisplacement = displacement;
    vDepth = -viewPosition.z;
    vAudioLevel = uAudioLevel;
  }
  `,
    // Fragment Shader
    `
  uniform vec3 uColor;
  uniform vec3 uStrokeColor;
  uniform vec3 uStressColor;
  uniform float uStrokeWidth;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uAudioLevel;
  
  varying float vDisplacement;
  varying float vDepth;
  varying float vAudioLevel;
  
  // HSL to RGB conversion for hue shifting
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }
  
  // RGB to HSL conversion
  vec3 rgb2hsl(vec3 c) {
    float maxC = max(c.r, max(c.g, c.b));
    float minC = min(c.r, min(c.g, c.b));
    float l = (maxC + minC) / 2.0;
    
    if(maxC == minC) {
      return vec3(0.0, 0.0, l);
    }
    
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    float h;
    
    if(maxC == c.r) {
      h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if(maxC == c.g) {
      h = (c.b - c.r) / d + 2.0;
    } else {
      h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
    
    return vec3(h, s, l);
  }
  
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if(d > 0.5) discard;
    
    // Soft edge alpha falloff - smooth gradient from center
    float softEdge = 1.0 - smoothstep(0.2, 0.5, d);
    
    // Depth fog - points further away fade out more
    float depthFog = clamp(1.0 - (vDepth - 7.0) / 8.0, 0.3, 1.0);
    
    float strokeStart = 0.5 - uStrokeWidth;
    
    // Displacement factor - more sensitive, allows stronger effect
    float stress = clamp(vDisplacement * 3.5, 0.0, 1.0);
    // Ease-in curve for more punch at higher displacements
    float stressEased = stress * stress;
    
    // Color mixing based on displacement
    vec3 baseColor = uColor;
    vec3 stressedColor = uStressColor;
    
    // Direct blend toward stress color - much stronger
    vec3 fillBlend = mix(baseColor, stressedColor, stressEased * 0.9);
    
    // Hue shift - more dramatic rotation + audio brightness boost
    vec3 hsl = rgb2hsl(baseColor);
    hsl.x = mod(hsl.x + stressEased * 0.35, 1.0); // Stronger hue rotation
    hsl.y = min(1.0, hsl.y + stressEased * 0.6 + vAudioLevel * 0.15);  // Saturation + audio
    hsl.z = min(1.0, hsl.z + stressEased * 0.15 + vAudioLevel * 0.1); // Brightness + audio pulse
    vec3 hueShifted = hsl2rgb(hsl);
    
    // Combine both effects - favor the stress color more
    vec3 finalFill = mix(fillBlend, hueShifted, 0.35);
    
    // Stroke shifts more dramatically
    vec3 strokeHsl = rgb2hsl(uStrokeColor);
    strokeHsl.x = mod(strokeHsl.x + stressEased * 0.25, 1.0);
    strokeHsl.y = min(1.0, strokeHsl.y + stressEased * 0.4);
    vec3 finalStroke = mix(uStrokeColor, hsl2rgb(strokeHsl), stressEased * 0.8);
    
    // Subtle fluorescent flicker effect (~2% variance)
    float flicker = 0.98 + 0.02 * sin(uTime * 8.3 + gl_FragCoord.x * 0.05 + gl_FragCoord.y * 0.03);
    float flicker2 = 0.99 + 0.01 * sin(uTime * 12.7 + gl_FragCoord.y * 0.07);
    float flickerCombined = flicker * flicker2;
    
    // Final alpha combines base opacity, soft edges, depth fog, and flicker
    float finalAlpha = uOpacity * softEdge * depthFog * flickerCombined * 0.85;
    
    if(d > strokeStart) {
      // Stroke is slightly more opaque
      gl_FragColor = vec4(finalStroke * flickerCombined, finalAlpha * 1.2);
    } else {
      gl_FragColor = vec4(finalFill * flickerCombined, finalAlpha);
    }
  }
  `
);

// Line material for connecting threads (center lines and web)
const LineMaterial = shaderMaterial(
    {
        uOpacity: 0.08,
        uColor: new THREE.Color('#7a9e9e'),
        uTime: 0,
    },
    // Vertex Shader
    `
    attribute float lineOpacity;
    varying float vOpacity;
    
    void main() {
        vOpacity = lineOpacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform float uOpacity;
    uniform vec3 uColor;
    uniform float uTime;
    varying float vOpacity;
    
    void main() {
        // Subtle flicker effect
        float flicker = 0.95 + 0.05 * sin(uTime * 2.0 + gl_FragCoord.x * 0.1);
        gl_FragColor = vec4(uColor, uOpacity * vOpacity * flicker);
    }
    `
);

extend({ PointCloudMaterial, LineMaterial });

export default function PointCloudSphere({ visible = true }) {
    const meshRef = useRef();
    const materialRef = useRef();
    const centerLinesRef = useRef();
    const webLinesRef = useRef();
    const centerLineMaterialRef = useRef();
    const webLineMaterialRef = useRef();
    const { 
        volume, setVolume, isAudioPlaying, toggleAudio, 
        sceneState, isPaused, params, setParams, randomizeParams,
        scatterCount, pluckTrigger, hasEntered,
        signalActive, toggleSignal, scatter, isEmbedOpen, audioLevel
    } = useStore();

    // Leva control panel
    useControls('Control Panel', {
        Sound: folder({
            'Sound On': {
                value: isAudioPlaying,
                onChange: (v) => { if (v !== isAudioPlaying) toggleAudio(); }
            },
            Volume: { value: volume, min: 0, max: 0.7, step: 0.01, onChange: (v) => setVolume(v) }
        }),
        Animation: folder({
            deformRadius: { 
                value: params.deformRadius, min: 0.1, max: 2, step: 0.05,
                onChange: (v) => setParams({ deformRadius: v })
            },
            deformStrength: { 
                value: params.deformStrength, min: 0.1, max: 2, step: 0.05,
                onChange: (v) => setParams({ deformStrength: v })
            },
            pointSize: { 
                value: params.pointSize, min: 50, max: 800, step: 10,
                onChange: (v) => setParams({ pointSize: v })
            },
            strokeWidth: { 
                value: params.strokeWidth, min: 0, max: 0.4, step: 0.01,
                onChange: (v) => setParams({ strokeWidth: v })
            },
            fillColor: { 
                value: params.fillColor,
                onChange: (v) => setParams({ fillColor: v })
            },
            strokeColor: { 
                value: params.strokeColor,
                onChange: (v) => setParams({ strokeColor: v })
            },
            stressColor: { 
                value: params.stressColor || '#ff4081',
                onChange: (v) => setParams({ stressColor: v })
            },
            rotationSpeed: { 
                value: params.rotationSpeed, min: 0, max: 1, step: 0.01,
                onChange: (v) => setParams({ rotationSpeed: v })
            }
        }),
        Physics: folder({
            springConstant: { 
                value: params.springConstant, min: 0.002, max: 0.05, step: 0.001,
                onChange: (v) => setParams({ springConstant: v })
            },
            damping: { 
                value: params.damping, min: 0.9, max: 0.99, step: 0.01,
                onChange: (v) => setParams({ damping: v })
            },
            repulsionStrength: { 
                value: params.repulsionStrength, min: 0.01, max: 0.2, step: 0.01,
                onChange: (v) => setParams({ repulsionStrength: v })
            }
        }, { collapsed: true }),
        '🎲 Shuffle': button(() => randomizeParams()),
        '💥 Scatter': button(() => scatter()),
        '📡 Signal': button(() => toggleSignal()),
    });

    const activeParams = params;
    const NUM_POINTS = 500;

    // Create sphere target positions
    const { geometry, targetPositions } = useMemo(() => {
        const radius = 2;
        const positions = new Float32Array(NUM_POINTS * 3);
        const targets = new Float32Array(NUM_POINTS * 3);
        const displacements = new Float32Array(NUM_POINTS); // Per-point displacement

        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        for (let i = 0; i < NUM_POINTS; i++) {
            const y = 1 - (i / (NUM_POINTS - 1)) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            // Target positions (sphere)
            targets[i * 3] = x * radius;
            targets[i * 3 + 1] = y * radius;
            targets[i * 3 + 2] = z * radius;

            // Initial positions: random cloud that will spring into sphere
            const randomRadius = 3 + Math.random() * 4;
            const randomTheta = Math.random() * Math.PI * 2;
            const randomPhi = Math.random() * Math.PI;
            positions[i * 3] = randomRadius * Math.sin(randomPhi) * Math.cos(randomTheta);
            positions[i * 3 + 1] = randomRadius * Math.cos(randomPhi);
            positions[i * 3 + 2] = randomRadius * Math.sin(randomPhi) * Math.sin(randomTheta);
            
            displacements[i] = 1.0; // Start with high displacement (intro animation)
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('displacement', new THREE.BufferAttribute(displacements, 1));
        return { geometry: geo, targetPositions: targets };
    }, []);

    // Line geometry for center connections (point -> sphere center)
    const centerLineGeometry = useMemo(() => {
        // Each line has 2 vertices (point position + center)
        const positions = new Float32Array(NUM_POINTS * 2 * 3);
        const opacities = new Float32Array(NUM_POINTS * 2);
        
        for (let i = 0; i < NUM_POINTS; i++) {
            // Start point (will be updated)
            positions[i * 6] = 0;
            positions[i * 6 + 1] = 0;
            positions[i * 6 + 2] = 0;
            // End point (center)
            positions[i * 6 + 3] = 0;
            positions[i * 6 + 4] = 0;
            positions[i * 6 + 5] = 0;
            // Opacity for both vertices
            opacities[i * 2] = 1.0;
            opacities[i * 2 + 1] = 0.0; // Fade toward center
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('lineOpacity', new THREE.BufferAttribute(opacities, 1));
        return geo;
    }, []);

    // Web line geometry - connect nearby neighbors
    const MAX_CONNECTIONS_PER_POINT = 3;
    const webLineGeometry = useMemo(() => {
        // Build neighbor connections based on sphere positions
        const connections = [];
        const connectionThreshold = 0.8; // Distance threshold for connection
        
        for (let i = 0; i < NUM_POINTS; i++) {
            const distances = [];
            for (let j = i + 1; j < NUM_POINTS; j++) {
                const dx = targetPositions[i * 3] - targetPositions[j * 3];
                const dy = targetPositions[i * 3 + 1] - targetPositions[j * 3 + 1];
                const dz = targetPositions[i * 3 + 2] - targetPositions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < connectionThreshold) {
                    distances.push({ j, dist });
                }
            }
            // Sort by distance and take closest neighbors
            distances.sort((a, b) => a.dist - b.dist);
            const maxConn = Math.min(MAX_CONNECTIONS_PER_POINT, distances.length);
            for (let k = 0; k < maxConn; k++) {
                connections.push({ i, j: distances[k].j, dist: distances[k].dist });
            }
        }
        
        const numConnections = connections.length;
        const positions = new Float32Array(numConnections * 2 * 3);
        const opacities = new Float32Array(numConnections * 2);
        
        connections.forEach((conn, idx) => {
            // Start point
            positions[idx * 6] = 0;
            positions[idx * 6 + 1] = 0;
            positions[idx * 6 + 2] = 0;
            // End point
            positions[idx * 6 + 3] = 0;
            positions[idx * 6 + 4] = 0;
            positions[idx * 6 + 5] = 0;
            // Opacity based on distance (closer = more visible)
            const opacity = 1.0 - (conn.dist / connectionThreshold);
            opacities[idx * 2] = opacity;
            opacities[idx * 2 + 1] = opacity;
        });
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('lineOpacity', new THREE.BufferAttribute(opacities, 1));
        geo.userData = { connections };
        return geo;
    }, [targetPositions]);

    const dummySphereRef = useRef();
    const [hoverPoint, setHoverPoint] = useState(null);

    // Physics State
    const physics = useMemo(() => ({
        velocities: new Float32Array(NUM_POINTS * 3),
            currentPositions: new Float32Array(geometry.attributes.position.array),
        targetPositions: new Float32Array(targetPositions),
        // Wave deformation state for scatter
        waveOrigins: [], // { origin: vec3, time: number, strength: number, pattern: string }
    }), [geometry, targetPositions]);

    const lastScatterRef = useRef(scatterCount);
    const pluckCooldownRef = useRef(new Float32Array(NUM_POINTS));
    const introCompleteRef = useRef(false);
    const timeRef = useRef(0);
    const lastSceneStateRef = useRef(sceneState);
    const signalIntervalRef = useRef(null);

    // Continuous signal - adds waves at regular intervals when active
    // Each toggle picks a unique deformation style
    useEffect(() => {
        if (signalActive) {
            // Pick a unique deformation style for this signal session
            const patterns = ['radial', 'spiral', 'ripple', 'twist', 'breathe'];
            const sessionPattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            // Randomize the signal's character for this session
            const sessionStrength = 0.25 + Math.random() * 0.5;
            const sessionFrequency = 0.8 + Math.random() * 2.5;
            const sessionInterval = 600 + Math.random() * 800;
            const sessionDuration = 10 + Math.random() * 15;
            
            // Some sessions use fixed origin, others roam
            const useFixedOrigin = Math.random() > 0.5;
            const fixedTheta = Math.random() * Math.PI * 2;
            const fixedPhi = Math.random() * Math.PI;
            
            const addSignalWave = () => {
                let theta, phi;
                if (useFixedOrigin) {
                    // Slight variation around fixed point
                    theta = fixedTheta + (Math.random() - 0.5) * 0.5;
                    phi = fixedPhi + (Math.random() - 0.5) * 0.3;
                } else {
                    // Roaming origin
                    theta = Math.random() * Math.PI * 2;
                    phi = Math.random() * Math.PI;
                }
                
                const origin = new THREE.Vector3(
                    2 * Math.sin(phi) * Math.cos(theta),
                    2 * Math.cos(phi),
                    2 * Math.sin(phi) * Math.sin(theta)
                );
                
                physics.waveOrigins.push({
                    origin,
                    time: 0,
                    strength: sessionStrength * (0.8 + Math.random() * 0.4),
                    pattern: sessionPattern,
                    duration: sessionDuration * (0.8 + Math.random() * 0.4),
                    frequency: sessionFrequency * (0.8 + Math.random() * 0.4),
                });
            };
            
            // Add initial wave immediately
            addSignalWave();
            
            // Add new waves at session-specific interval
            signalIntervalRef.current = setInterval(addSignalWave, sessionInterval);
        } else {
            if (signalIntervalRef.current) {
                clearInterval(signalIntervalRef.current);
                signalIntervalRef.current = null;
            }
        }
        
        return () => {
            if (signalIntervalRef.current) {
                clearInterval(signalIntervalRef.current);
            }
        };
    }, [signalActive, physics]);

    // Add wave deformations when sphere expands for page transitions
    useEffect(() => {
        const expandedStates = ['offscreen', 'self-cloud', 'connect-page'];
        const isExpanding = expandedStates.includes(sceneState) && 
                          !expandedStates.includes(lastSceneStateRef.current);
        
        if (isExpanding) {
            // Add multiple wave origins to create entropy - like pressing scatter multiple times
            const patterns = ['radial', 'spiral', 'ripple', 'twist', 'breathe'];
            const numWaves = 4 + Math.floor(Math.random() * 4); // 4-7 waves
            
            for (let w = 0; w < numWaves; w++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const origin = new THREE.Vector3(
                    2 * Math.sin(phi) * Math.cos(theta),
                    2 * Math.cos(phi),
                    2 * Math.sin(phi) * Math.sin(theta)
                );
                
                physics.waveOrigins.push({
                    origin,
                    time: w * 0.3, // Stagger start times
                    strength: 0.5 + Math.random() * 0.5,
                    pattern: patterns[Math.floor(Math.random() * patterns.length)],
                    duration: 15 + Math.random() * 15, // 15-30 seconds
                    frequency: 1 + Math.random() * 2,
                });
            }
        }
        
        lastSceneStateRef.current = sceneState;
    }, [sceneState, physics]);

    useFrame((state, delta) => {
        if (!activeParams) return;
        timeRef.current += delta;
        
        // Use gentler spring during intro
        const introProgress = Math.min(timeRef.current / 3, 1); // 3 second intro
        const introSpring = 0.008 + introProgress * (activeParams.springConstant - 0.008);
        const springConstant = introCompleteRef.current ? activeParams.springConstant : introSpring;
        const { damping = 0.88, repulsionStrength = 0.1 } = activeParams;

        if (introProgress >= 1 && !introCompleteRef.current) {
            introCompleteRef.current = true;
        }

        // Check for scatter trigger - create wave deformations
        if (scatterCount !== lastScatterRef.current) {
            lastScatterRef.current = scatterCount;
            
            // Create multiple wave origins with different patterns
            const patterns = ['radial', 'spiral', 'ripple', 'twist', 'breathe'];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            const numWaves = 1 + Math.floor(Math.random() * 3); // 1-3 waves
            for (let w = 0; w < numWaves; w++) {
                // Random origin on sphere surface
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const origin = new THREE.Vector3(
                    2 * Math.sin(phi) * Math.cos(theta),
                    2 * Math.cos(phi),
                    2 * Math.sin(phi) * Math.sin(theta)
                );
                
                physics.waveOrigins.push({
                    origin,
                    time: 0,
                    strength: 0.4 + Math.random() * 0.6,
                    pattern,
                    duration: 15 + Math.random() * 20, // 15-35 seconds
                    frequency: 0.8 + Math.random() * 2, // Slower wave frequency
                });
            }
        }

        // Update wave deformations
        physics.waveOrigins = physics.waveOrigins.filter(wave => {
            wave.time += delta;
            return wave.time < wave.duration;
        });

        if (materialRef.current && meshRef.current) {
            const posAttr = geometry.attributes.position;
            const mouseLocal = new THREE.Vector3();
            if (hoverPoint) {
                mouseLocal.copy(hoverPoint);
                meshRef.current.worldToLocal(mouseLocal);
            }

            const step = Math.min(delta * 60, 2);
            const dampFactor = Math.pow(damping, step);
            const deformRadius2 = activeParams.deformRadius * 2;

            // Track total displacement for audio
            let totalDisplacement = 0;

            for (let i = 0; i < NUM_POINTS; i++) {
                const i3 = i * 3;
                const currentPos = new THREE.Vector3(
                    physics.currentPositions[i3],
                    physics.currentPositions[i3 + 1],
                    physics.currentPositions[i3 + 2]
                );
                const targetPos = new THREE.Vector3(
                    physics.targetPositions[i3],
                    physics.targetPositions[i3 + 1],
                    physics.targetPositions[i3 + 2]
                );

                // Calculate wave displacement
                let waveDisplacement = new THREE.Vector3(0, 0, 0);
                
                for (const wave of physics.waveOrigins) {
                    const distToOrigin = currentPos.distanceTo(wave.origin);
                    const waveProgress = wave.time / wave.duration;
                    // Slower decay curve - stays strong longer then fades
                    const decay = Math.pow(1 - waveProgress, 0.5); 
                    
                    // Wave travels outward more slowly
                    const waveRadius = wave.time * 1.5; // Slower wave speed
                    const distFromWave = Math.abs(distToOrigin - waveRadius);
                    // Wider wave influence area
                    const waveInfluence = Math.exp(-distFromWave * 1.2) * decay;
                    
                    const dir = currentPos.clone().normalize();
                    let displacement = 0;
                    
                    switch (wave.pattern) {
                        case 'radial':
                            displacement = Math.sin(distToOrigin * wave.frequency - wave.time * 2) * waveInfluence;
                            break;
                        case 'spiral':
                            const angle = Math.atan2(currentPos.z, currentPos.x);
                            displacement = Math.sin(distToOrigin * wave.frequency + angle * 2 - wave.time * 1.5) * waveInfluence;
                            break;
                        case 'ripple':
                            displacement = Math.sin(distToOrigin * wave.frequency * 1.5 - wave.time * 3) * waveInfluence * 0.8;
                            break;
                        case 'twist':
                            const twist = Math.sin(currentPos.y * 2 + wave.time * 1.2);
                            displacement = twist * waveInfluence * 0.6;
                            // Add tangential movement
                            const tangent = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
                            waveDisplacement.add(tangent.multiplyScalar(twist * waveInfluence * wave.strength * 0.4));
                            break;
                        case 'breathe':
                            displacement = Math.sin(wave.time * 0.8) * decay * 0.6;
                            break;
                    }
                    
                    waveDisplacement.add(dir.multiplyScalar(displacement * wave.strength));
                }

                // 1. Spring force (pull back to target + wave offset)
                const effectiveTarget = targetPos.clone().add(waveDisplacement);
                const dx = effectiveTarget.x - physics.currentPositions[i3];
                const dy = effectiveTarget.y - physics.currentPositions[i3 + 1];
                const dz = effectiveTarget.z - physics.currentPositions[i3 + 2];

                physics.velocities[i3] += dx * springConstant * step;
                physics.velocities[i3 + 1] += dy * springConstant * step;
                physics.velocities[i3 + 2] += dz * springConstant * step;

                // 2. Mouse Repulsion
                if (hoverPoint) {
                    const distX = physics.currentPositions[i3] - mouseLocal.x;
                    const distY = physics.currentPositions[i3 + 1] - mouseLocal.y;
                    const distZ = physics.currentPositions[i3 + 2] - mouseLocal.z;
                    const distSq = distX * distX + distY * distY + distZ * distZ;

                    if (distSq < deformRadius2 * deformRadius2) {
                        const dist = Math.sqrt(distSq);
                        const push = (1.0 - dist / deformRadius2) * repulsionStrength * step;
                        const invDist = 1 / dist;
                        
                        const pushX = distX * invDist * push;
                        const pushY = distY * invDist * push;
                        const pushZ = distZ * invDist * push;
                        
                        physics.velocities[i3] += pushX;
                        physics.velocities[i3 + 1] += pushY;
                        physics.velocities[i3 + 2] += pushZ;

                        // Calculate displacement magnitude for sustain
                        const displacement = Math.sqrt(
                            Math.pow(physics.currentPositions[i3] - physics.targetPositions[i3], 2) +
                            Math.pow(physics.currentPositions[i3 + 1] - physics.targetPositions[i3 + 1], 2) +
                            Math.pow(physics.currentPositions[i3 + 2] - physics.targetPositions[i3 + 2], 2)
                        );

                        // Trigger pluck with displacement-based sustain (mute when embed playing)
                        if (pluckTrigger && isAudioPlaying && !isEmbedOpen) {
                            const pushMagnitude = Math.sqrt(pushX*pushX + pushY*pushY + pushZ*pushZ);
                            pluckCooldownRef.current[i] -= delta;
                            
                            if (pushMagnitude > 0.015 && pluckCooldownRef.current[i] <= 0) {
                                if (Math.random() < 0.15) {
                                    const yPos = physics.currentPositions[i3 + 1] / 2;
                                    // Pass displacement as third param for sustain
                                    pluckTrigger(pushMagnitude, yPos, displacement);
                                    pluckCooldownRef.current[i] = 0.2;
                                }
                            }
                        }
                    }
                }

                // Track displacement for wave sounds
                const pointDisplacement = Math.sqrt(dx*dx + dy*dy + dz*dz);
                totalDisplacement += pointDisplacement;

                // 3. Damping & Integration
                physics.velocities[i3] *= dampFactor;
                physics.velocities[i3 + 1] *= dampFactor;
                physics.velocities[i3 + 2] *= dampFactor;

                physics.currentPositions[i3] += physics.velocities[i3] * step;
                physics.currentPositions[i3 + 1] += physics.velocities[i3 + 1] * step;
                physics.currentPositions[i3 + 2] += physics.velocities[i3 + 2] * step;

                posAttr.array[i3] = physics.currentPositions[i3];
                posAttr.array[i3 + 1] = physics.currentPositions[i3 + 1];
                posAttr.array[i3 + 2] = physics.currentPositions[i3 + 2];
                
                // Update displacement attribute for color
                const dispAttr = geometry.attributes.displacement;
                if (dispAttr) {
                    dispAttr.array[i] = pointDisplacement;
                }
            }
            posAttr.needsUpdate = true;

            // Mark displacement attribute for update
            if (geometry.attributes.displacement) {
                geometry.attributes.displacement.needsUpdate = true;
            }

            // Update line geometries
            if (centerLinesRef.current) {
                const linePos = centerLineGeometry.attributes.position;
                for (let i = 0; i < NUM_POINTS; i++) {
                    const i3 = i * 3;
                    // Point position
                    linePos.array[i * 6] = physics.currentPositions[i3];
                    linePos.array[i * 6 + 1] = physics.currentPositions[i3 + 1];
                    linePos.array[i * 6 + 2] = physics.currentPositions[i3 + 2];
                    // Center stays at 0,0,0
                }
                linePos.needsUpdate = true;
            }

            if (webLinesRef.current && webLineGeometry.userData.connections) {
                const linePos = webLineGeometry.attributes.position;
                const connections = webLineGeometry.userData.connections;
                connections.forEach((conn, idx) => {
                    const i3 = conn.i * 3;
                    const j3 = conn.j * 3;
                    // Start point
                    linePos.array[idx * 6] = physics.currentPositions[i3];
                    linePos.array[idx * 6 + 1] = physics.currentPositions[i3 + 1];
                    linePos.array[idx * 6 + 2] = physics.currentPositions[i3 + 2];
                    // End point
                    linePos.array[idx * 6 + 3] = physics.currentPositions[j3];
                    linePos.array[idx * 6 + 4] = physics.currentPositions[j3 + 1];
                    linePos.array[idx * 6 + 5] = physics.currentPositions[j3 + 2];
                });
                linePos.needsUpdate = true;
            }

            // Update line material time
            if (centerLineMaterialRef.current) {
                centerLineMaterialRef.current.uTime += delta;
            }
            if (webLineMaterialRef.current) {
                webLineMaterialRef.current.uTime += delta;
            }

            // Trigger plucks from wave deformations (mute when embed playing)
            if (physics.waveOrigins.length > 0 && pluckTrigger && isAudioPlaying && !isEmbedOpen) {
                const avgDisplacement = totalDisplacement / NUM_POINTS;
                if (avgDisplacement > 0.05 && Math.random() < 0.08) {
                    const randomY = -1 + Math.random() * 2;
                    pluckTrigger(avgDisplacement * 0.5, randomY, avgDisplacement);
                }
            }

            // Material updates
            if (!isPaused) {
                materialRef.current.uTime += delta;
            }

            const isExploded = sceneState === 'offscreen' || sceneState === 'self-cloud';
            const targetExplode = isExploded ? 1.0 : 0.0;
            materialRef.current.uExplode = THREE.MathUtils.lerp(
                materialRef.current.uExplode,
                targetExplode,
                delta * 1.5
            );
            
            const targetOpacity = isExploded ? 0.15 : 1.0;
            materialRef.current.uOpacity = THREE.MathUtils.lerp(
                materialRef.current.uOpacity,
                targetOpacity,
                delta * 2
            );

            if (hoverPoint) {
                const localPoint = hoverPoint.clone();
                meshRef.current.worldToLocal(localPoint);
                materialRef.current.uMouse.lerp(localPoint, 0.1);
            } else {
                materialRef.current.uMouse.lerp(new THREE.Vector3(999, 999, 999), 0.05);
            }

            materialRef.current.uDeformRadius = THREE.MathUtils.lerp(materialRef.current.uDeformRadius, activeParams.deformRadius, 0.1);
            materialRef.current.uDeformStrength = THREE.MathUtils.lerp(materialRef.current.uDeformStrength, activeParams.deformStrength, 0.1);
            materialRef.current.uPointSize = THREE.MathUtils.lerp(materialRef.current.uPointSize, activeParams.pointSize, 0.1);
            materialRef.current.uStrokeWidth = THREE.MathUtils.lerp(materialRef.current.uStrokeWidth, activeParams.strokeWidth, 0.1);

            materialRef.current.uColor.lerp(new THREE.Color(activeParams.fillColor), 0.05);
            materialRef.current.uStrokeColor.lerp(new THREE.Color(activeParams.strokeColor), 0.05);
            
            // Update stress color
            if (materialRef.current.uStressColor && activeParams.stressColor) {
                materialRef.current.uStressColor.lerp(new THREE.Color(activeParams.stressColor), 0.05);
            }
            
            // Update audio level for reactivity
            materialRef.current.uAudioLevel = THREE.MathUtils.lerp(
                materialRef.current.uAudioLevel || 0,
                audioLevel,
                0.15
            );
        }

        // Rotate - sync all geometries
        if (meshRef.current && !isPaused) {
            const isExploded = sceneState === 'offscreen' || sceneState === 'self-cloud';
            const rotationMultiplier = isExploded ? 0.05 : 1.0;
            const rotDelta = delta * activeParams.rotationSpeed * rotationMultiplier;
            meshRef.current.rotation.y += rotDelta;
            
            // Sync line rotations
            if (centerLinesRef.current) {
                centerLinesRef.current.rotation.y = meshRef.current.rotation.y;
            }
            if (webLinesRef.current) {
                webLinesRef.current.rotation.y = meshRef.current.rotation.y;
        }
        }
    });

    const linesVisible = visible && !(sceneState === 'offscreen' || sceneState === 'self-cloud');

    return (
        <>
            {/* Center lines - very faint threads to void */}
            <lineSegments 
                ref={centerLinesRef} 
                geometry={centerLineGeometry} 
                rotation={meshRef.current?.rotation}
                visible={linesVisible}
            >
                <lineMaterial 
                    ref={centerLineMaterialRef}
                    transparent 
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uOpacity={0.06}
                    uColor={new THREE.Color(params.strokeColor)}
                />
            </lineSegments>

            {/* Web lines - neighbor connections */}
            <lineSegments 
                ref={webLinesRef} 
                geometry={webLineGeometry}
                rotation={meshRef.current?.rotation}
                visible={linesVisible}
            >
                <lineMaterial 
                    ref={webLineMaterialRef}
                    transparent 
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uOpacity={0.12}
                    uColor={new THREE.Color(params.fillColor)}
                />
            </lineSegments>

            <points ref={meshRef} geometry={geometry} visible={visible || materialRef.current?.uExplode < 0.95}>
                <pointCloudMaterial ref={materialRef} transparent depthWrite={true} depthTest={true} />
            </points>

            {/* Only enable sphere interaction after entering (audio context loaded) */}
            <mesh
                ref={dummySphereRef}
                onPointerDown={hasEntered ? (e) => {
                    e.stopPropagation();
                    setHoverPoint(e.point);
                } : undefined}
                onPointerMove={hasEntered ? (e) => {
                    if (e.buttons > 0) {
                        setHoverPoint(e.point);
                    }
                } : undefined}
                onPointerUp={hasEntered ? () => setHoverPoint(null) : undefined}
                onPointerOut={hasEntered ? () => setHoverPoint(null) : undefined}
            >
                <sphereGeometry args={[2.2, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </>
    );
}
