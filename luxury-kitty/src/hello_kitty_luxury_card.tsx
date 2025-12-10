import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- OLD SDF Helper Functions (COMMENTED OUT) ---
/*
const sdSphere = (p: [number, number, number], r: number): number => {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) - r;
};

const sdBox = (p: [number, number, number], b: [number, number, number]): number => {
  const q = [
    Math.abs(p[0]) - b[0],
    Math.abs(p[1]) - b[1],
    Math.abs(p[2]) - b[2],
  ];
  return Math.sqrt(
    Math.max(q[0], 0) ** 2 + Math.max(q[1], 0) ** 2 + Math.max(q[2], 0) ** 2
  ) + Math.min(Math.max(q[0], Math.max(q[1], q[2])), 0);
};

const sdCylinder = (p: [number, number, number], h: [number, number]): number => {
  const d = Math.abs(Math.sqrt(p[0] * p[0] + p[2] * p[2])) - h[0];
  return Math.sqrt(Math.max(d, 0) ** 2 + Math.max(Math.abs(p[1]) - h[1], 0) ** 2) + Math.min(Math.max(d, Math.abs(p[1]) - h[1]), 0);
};

const opUnion = (d1: number, d2: number): number => Math.min(d1, d2);

const opSmoothUnion = (d1: number, d2: number, k: number): number => {
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.min(d1, d2) - h * h * h * k * (1.0 / 6.0);
};

const rotateZ = (p: [number, number, number], angle: number): [number, number, number] => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
*/

// --- OLD SDF CODE (COMMENTED OUT) ---
/*
const mapHelloKitty = (p: [number, number, number], part?: string): number => {
  // ... old SDF implementation commented out
};
*/

// --- NEW ELLIPSOID-BASED Hello Kitty Shape ---
// Returns true if point (x,y,z) is inside the shape volume
const isInsideHelloKitty = (x: number, y: number, z: number, part?: string): boolean => {
  // --- A. Main Body Shapes (Pearl Off-White Ivory) ---
  
  // Head (Ellipsoid) - Centered at (0, 2, 0)
  const head = (Math.pow(x / 3.2, 2) + Math.pow((y - 2) / 2.4, 2) + Math.pow(z / 2.2, 2)) <= 1;

  // Body (Ellipsoid) - Centered at (0, -1.5, 0)
  const body = (Math.pow(x / 2.2, 2) + Math.pow((y + 1.5) / 2.8, 2) + Math.pow(z / 1.8, 2)) <= 1;

  // Left Ear (Ellipsoid) - Tilted INWARD (toward each other), double the angle, Centered at (2.0, 4.5, 0.5)
  const earL = (Math.pow((x - 2.0) / 0.9, 2) + Math.pow((y - 4.5) / 1.4, 2) + Math.pow((z - 0.5) / 0.6, 2)) <= 1;

  // Right Ear (Ellipsoid) - Tilted INWARD (toward each other), double the angle, Centered at (-2.0, 4.5, 0.5)
  const earR = (Math.pow((x + 2.0) / 0.9, 2) + Math.pow((y - 4.5) / 1.4, 2) + Math.pow((z - 0.5) / 0.6, 2)) <= 1;

  // Left Arm (Ellipsoid) - Centered at (2.8, -0.5, 0.5)
  const armL = (Math.pow((x - 2.8) / 0.8, 2) + Math.pow((y + 0.5) / 1.5, 2) + Math.pow((z - 0.5) / 0.8, 2)) <= 1;

  // Right Arm (Ellipsoid) - Centered at (-2.8, -0.5, 0.5)
  const armR = (Math.pow((x + 2.8) / 0.8, 2) + Math.pow((y + 0.5) / 1.5, 2) + Math.pow((z - 0.5) / 0.8, 2)) <= 1;

  // Left Leg (Ellipsoid) - Centered at (1.2, -3.5, 0.2)
  const legL = (Math.pow((x - 1.2) / 0.9, 2) + Math.pow((y + 3.5) / 1.2, 2) + Math.pow((z - 0.2) / 0.9, 2)) <= 1;

  // Right Leg (Ellipsoid) - Centered at (-1.2, -3.5, 0.2)
  const legR = (Math.pow((x + 1.2) / 0.9, 2) + Math.pow((y + 3.5) / 1.2, 2) + Math.pow((z - 0.2) / 0.9, 2)) <= 1;

  // --- B. Facial Features ---
  
  // Dark Grey Eyes (OVAL/ELLIPSOID - wider horizontally) - same z axis as nose, more visible
  const eyeR = (Math.pow((x - 1.2) / 0.9, 2) + Math.pow((y - 2.5) / 0.6, 2) + Math.pow((z - 2.0) / 0.5, 2)) <= 1;
  const eyeL = (Math.pow((x + 1.2) / 0.9, 2) + Math.pow((y - 2.5) / 0.6, 2) + Math.pow((z - 2.0) / 0.5, 2)) <= 1;

  // Yellow Nose (Small Ellipsoid/Sphere) - closer to head center (z=1.2)
  const nose = (Math.pow(x / 0.5, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 2.0) / 0.5, 2)) <= 1;

  // Dark Grey Whiskers (Much thicker and wider ellipsoids) - closer to head center (z=1.2)
  // Right Whiskers (3 segments)
  const whiskerR1 = (Math.pow((x - 1.5) / 0.4, 2) + Math.pow((y - 1.8) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;
  const whiskerR2 = (Math.pow((x - 1.6) / 0.4, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;
  const whiskerR3 = (Math.pow((x - 1.5) / 0.4, 2) + Math.pow((y - 0.6) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;

  // Left Whiskers (3 segments, symmetric)
  const whiskerL1 = (Math.pow((x + 1.5) / 0.4, 2) + Math.pow((y - 1.8) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;
  const whiskerL2 = (Math.pow((x + 1.6) / 0.4, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;
  const whiskerL3 = (Math.pow((x + 1.5) / 0.4, 2) + Math.pow((y - 0.6) / 0.4, 2) + Math.pow((z - 1.2) / 1.8, 2)) <= 1;

  // --- C. Clothing (Pink) ---
  
  // Pink Shirt/Dress (Covers the upper body, slightly larger than the body primitive)
  // For surface-only generation, we check if point is near the surface (within a small threshold)
  const shirtDist = Math.sqrt(Math.pow(x / 2.5, 2) + Math.pow((y + 1.5) / 3.0, 2) + Math.pow(z / 2.0, 2));
  const shirt = shirtDist >= 0.95 && shirtDist <= 1.05; // Surface only (within 5% threshold)

  // Pink Bow (Simple sphere approximation)
  const bowCenter = (Math.pow((x - 3.0) / 0.5, 2) + Math.pow((y - 3.5) / 0.5, 2) + Math.pow(z / 0.5, 2)) <= 1;

  // --- D. Part Detection ---
  if (part === 'head') return head;
  if (part === 'body') return body;
  if (part === 'earLeft') return earL;
  if (part === 'earRight') return earR;
  if (part === 'armLeft') return armL;
  if (part === 'armRight') return armR;
  if (part === 'legLeft') return legL;
  if (part === 'legRight') return legR;
  if (part === 'leftEye') return eyeL;
  if (part === 'rightEye') return eyeR;
  if (part === 'nose') return nose;
  if (part === 'whisker') return whiskerR1 || whiskerR2 || whiskerR3 || whiskerL1 || whiskerL2 || whiskerL3;
  if (part === 'clothes') return shirt;
  if (part === 'bow') return bowCenter;

  // --- E. Final Combination (Boolean OR = Union) ---
  return (
    // Main Body (Pearl Off-White Ivory)
    head || body || earL || earR || armL || armR || legL || legR || 
    // Facial Features (Dark Grey/Yellow)
    eyeR || eyeL || nose || whiskerR1 || whiskerR2 || whiskerR3 || whiskerL1 || whiskerL2 || whiskerL3 ||
    // Clothing (Pink)
    shirt || bowCenter
  );
};

const generateHelloKittyPositions = (count: number, part?: string): Float32Array => {
  const positions = new Float32Array(count * 3);
  let validCount = 0;
  const maxAttempts = count * 80; // More attempts for denser packing
  let attempts = 0;

  while (validCount < count && attempts < maxAttempts) {
    attempts++;
    const x = (Math.random() - 0.5) * 8;
    const y = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 4;

    if (isInsideHelloKitty(x, y, z, part)) {
      positions[validCount * 3] = x;
      positions[validCount * 3 + 1] = y;
      positions[validCount * 3 + 2] = z;
      validCount++;
    }
  }

  while (validCount < count) {
    positions[validCount * 3] = (Math.random() - 0.5) * 8;
    positions[validCount * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[validCount * 3 + 2] = (Math.random() - 0.5) * 4;
    validCount++;
  }

  return positions;
};

const generateEyePositions = (): Float32Array => {
  const positions = new Float32Array(6);
  // Eyes based on new ellipsoid positions
  positions[0] = -1.2; // Left eye (viewer's right)
  positions[1] = 2.5;
  positions[2] = 2.0;
  positions[3] = 1.2; // Right eye (viewer's left)
  positions[4] = 2.5;
  positions[5] = 2.0;
  return positions;
};

// Clothes generation disabled
// const generateClothesSurfacePositions = (count: number): Float32Array => {
//   const positions = new Float32Array(count * 3);
//   let validCount = 0;
//   const maxAttempts = count * 200;
//   let attempts = 0;
//   while (validCount < count && attempts < maxAttempts) {
//     attempts++;
//     const u = Math.random();
//     const v = Math.random();
//     const theta = u * Math.PI * 2;
//     const phi = Math.acos(2 * v - 1);
//     const a = 2.5;
//     const b = 3.0;
//     const c = 2.0;
//     const x = a * Math.sin(phi) * Math.cos(theta);
//     const y = b * Math.sin(phi) * Math.sin(theta) - 1.5;
//     const z = c * Math.cos(phi);
//     if (isInsideHelloKitty(x, y, z, 'clothes')) {
//       positions[validCount * 3] = x;
//       positions[validCount * 3 + 1] = y;
//       positions[validCount * 3 + 2] = z;
//       validCount++;
//     }
//   }
//   while (validCount < count) {
//     const u = Math.random();
//     const v = Math.random();
//     const theta = u * Math.PI * 2;
//     const phi = Math.acos(2 * v - 1);
//     const a = 2.5;
//     const b = 3.0;
//     const c = 2.0;
//     positions[validCount * 3] = a * Math.sin(phi) * Math.cos(theta);
//     positions[validCount * 3 + 1] = b * Math.sin(phi) * Math.sin(theta) - 1.5;
//     positions[validCount * 3 + 2] = c * Math.cos(phi);
//     validCount++;
//   }
//   return positions;
// };

// Generate positions for arms (filled with particles)
const generateArmPositions = (count: number, side: 'left' | 'right'): Float32Array => {
  const positions = new Float32Array(count * 3);
  const sign = side === 'left' ? -1 : 1;
  
  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1 along arm
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.45; // Arm radius
    
    positions[i * 3] = sign * (1.1 + radius * Math.cos(angle)); // Outside body
    positions[i * 3 + 1] = 0.6 + t * 0.6; // From 0.6 to 1.2 (arm length)
    positions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  return positions;
};

// Generate positions for hands (filled with body-colored particles)
const generateHandPositions = (count: number, side: 'left' | 'right'): Float32Array => {
  const positions = new Float32Array(count * 3);
  const sign = side === 'left' ? -1 : 1;
  
  for (let i = 0; i < count; i++) {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI;
    const radius = Math.random() * 0.25; // Hand radius
    
    positions[i * 3] = sign * 1.1 + radius * Math.sin(angle2) * Math.cos(angle1);
    positions[i * 3 + 1] = 1.2 + radius * Math.cos(angle2);
    positions[i * 3 + 2] = radius * Math.sin(angle2) * Math.sin(angle1);
  }
  
  return positions;
};

// Generate positions for legs (filled with particles)
const generateLegPositions = (count: number, side: 'left' | 'right'): Float32Array => {
  const positions = new Float32Array(count * 3);
  const sign = side === 'left' ? -1 : 1;
  
  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1 along leg
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.6; // Leg radius
    
    positions[i * 3] = sign * (0.4 + radius * Math.cos(angle));
    positions[i * 3 + 1] = 1.8 + t * 0.4; // From 1.8 to 2.2 (leg length, touching body bottom)
    positions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  return positions;
};

const generatePolaroidStartPositions = (count: number): Array<[number, number, number]> => {
  const positions: Array<[number, number, number]> = [];
  let attempts = 0;
  const maxAttempts = count * 50;

  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 4;
    const z = (Math.random() - 0.5) * 2;

    if (isInsideHelloKitty(x, y, z, 'body')) {
      positions.push([x, y, z]);
    }
  }

  while (positions.length < count) {
    positions.push([
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 2,
    ]);
  }

  return positions;
};

// Generate sparse floating objects (more spheres) - crystal-like, glowy, varied sizes, orbiting
const generateFloatingObjects = (count: number): Array<{
  position: [number, number, number];
  color: string;
  size: number;
  shape: 'sphere' | 'cube' | 'tetrahedron';
  glowIntensity: number;
  orbitalAngle: number;
  orbitalSpeed: number;
  orbitalRadius: number;
  verticalOffset: number;
}> => {
  const objects: Array<{
    position: [number, number, number];
    color: string;
    size: number;
    shape: 'sphere' | 'cube' | 'tetrahedron';
    glowIntensity: number;
    orbitalAngle: number;
    orbitalSpeed: number;
    orbitalRadius: number;
    verticalOffset: number;
  }> = [];
  const colors = ['#0D9488', '#8B0000', '#FFD700']; // Emerald, Dark Red, Gold only
  const shapes: Array<'sphere' | 'cube' | 'tetrahedron'> = ['sphere', 'cube', 'tetrahedron'];

  for (let i = 0; i < count; i++) {
    // Orbital position around Hello Kitty - fill whole space
    const baseAngle = (i / count) * Math.PI * 2; // Evenly distributed around
    const orbitalRadius = 12 + Math.random() * 25; // 12-37 units away - much wider range
    const orbitalSpeed = 0.2 + Math.random() * 0.3; // Varying orbital speeds
    const verticalOffset = (Math.random() - 0.5) * 20; // Much more vertical variation
    
    // Base size with 50% variation (if base is 0.4, range is 0.2-0.6)
    const baseSize = 0.3;
    const sizeVariation = baseSize * 0.5; // 50% of base
    const size = baseSize - sizeVariation + Math.random() * (sizeVariation * 2);
    
    // Varying glow intensity for depth
    const glowIntensity = 0.3 + Math.random() * 0.5; // 0.3-0.8
    
    objects.push({
      position: [
        Math.cos(baseAngle) * orbitalRadius,
        verticalOffset,
        Math.sin(baseAngle) * orbitalRadius,
      ],
      color: colors[Math.floor(Math.random() * colors.length)],
      size,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      glowIntensity,
      orbitalAngle: baseAngle,
      orbitalSpeed,
      orbitalRadius,
      verticalOffset,
    });
  }

  return objects;
};

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};


const COLORS = {
  pearlWhite: '#FFFEF5', // Ivory off-white
  pearlWhite2: '#FDF8E8', // Warmer ivory
  pearlWhite3: '#FAF5E6', // Slightly darker ivory
  pink: '#FFB6C1',
  pink2: '#FFC0CB',
  pink3: '#FF69B4',
  deepPink: '#FF1493',
  darkGrey: '#2A2A2A', // Dark grey for eyes
  darkGreyGlow: '#3A3A3A', // Slightly lighter for glow
  black: '#000000',
  yellow: '#FFD700',
  yellow2: '#FFA500',
  gold: '#FFD700',
  white: '#FFFFFF',
};

// Particle Component with shape variety
const HelloKittyParticle: React.FC<{
  positions: Float32Array;
  targetPositions: Float32Array;
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
  color: string;
  emissiveColor?: string;
  baseSize?: number;
}> = ({ positions, targetPositions, isChaos, mouseRotation, deviceRotation, color, emissiveColor, baseSize = 0.08 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const currentPositions = useRef<Float32Array>(positions.slice());
  const chaosTime = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  // Create geometries for different shapes
  const geometries = useMemo(() => {
    const sphere = new THREE.SphereGeometry(baseSize, 8, 8);
    const cube = new THREE.BoxGeometry(baseSize * 1.2, baseSize * 1.2, baseSize * 1.2);
    const tetra = new THREE.TetrahedronGeometry(baseSize);
    return { sphere, cube, tetra };
  }, [baseSize]);


  // Size variations
  const sizeVariations = useMemo(() => {
    const count = positions.length / 3;
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = baseSize + (Math.random() - 0.5) * 0.01; // กำ10px max variation
    }
    return sizes;
  }, [baseSize, positions.length]);

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const count = positions.length / 3;
    
    if (deviceRotation) {
      groupRef.current.rotation.x = deviceRotation.x * 0.5;
      groupRef.current.rotation.y = deviceRotation.y * 0.5;
      groupRef.current.rotation.z = deviceRotation.z * 0.3;
    }

    groupRef.current.rotation.y += mouseRotation.x * 0.05;
    groupRef.current.rotation.x += mouseRotation.y * 0.05;
    
    if (isChaos) {
      chaosTime.current += delta * 0.3;
    } else {
      chaosTime.current = Math.max(0, chaosTime.current - delta * 0.5);
    }

    const easedTime = easeInOutCubic(Math.min(chaosTime.current, 1));
    const lerpSpeed = isChaos ? 0.008 * easedTime : 0.05;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      let targetX = targetPositions[idx];
      let targetY = targetPositions[idx + 1];
      let targetZ = targetPositions[idx + 2];

      if (isChaos) {
        const chaosRadius = 15 * easedTime;
        const angle = (i / count) * Math.PI * 2 + chaosTime.current;
        const wave = Math.sin(chaosTime.current * 2 + i * 0.1) * 0.5 + 0.5;
        
        targetX += Math.cos(angle) * chaosRadius * wave;
        targetY += Math.sin(angle * 2) * chaosRadius * wave;
        targetZ += Math.sin(angle * 3) * chaosRadius * wave;
      }

      currentPositions.current[idx] += (targetX - currentPositions.current[idx]) * lerpSpeed;
      currentPositions.current[idx + 1] += (targetY - currentPositions.current[idx + 1]) * lerpSpeed;
      currentPositions.current[idx + 2] += (targetZ - currentPositions.current[idx + 2]) * lerpSpeed;

      const matrix = new THREE.Matrix4();
      const scale = sizeVariations[i];
      matrix.makeScale(scale / baseSize, scale / baseSize, scale / baseSize);
      matrix.setPosition(
        currentPositions.current[idx],
        currentPositions.current[idx + 1],
        currentPositions.current[idx + 2]
      );
      meshRef.current.setMatrixAt(i, matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Distribute shapes: 40% sphere, 30% cube, 30% tetrahedron
  const shapeCounts = {
    sphere: Math.floor((positions.length / 3) * 0.4),
    cube: Math.floor((positions.length / 3) * 0.3),
    tetra: Math.floor((positions.length / 3) * 0.3),
  };

  return (
    <group ref={groupRef}>
      {/* Spheres */}
      <instancedMesh ref={meshRef} args={[geometries.sphere, undefined, shapeCounts.sphere]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={color === COLORS.darkGrey ? 2.5 : 0.8}
          metalness={0.8}
          roughness={0.15}
          envMapIntensity={1.5}
        />
      </instancedMesh>
      {/* Cubes */}
      <instancedMesh args={[geometries.cube, undefined, shapeCounts.cube]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={color === COLORS.darkGrey ? 2.5 : 0.8}
          metalness={0.8}
          roughness={0.15}
          envMapIntensity={1.5}
        />
      </instancedMesh>
      {/* Tetrahedrons */}
      <instancedMesh args={[geometries.tetra, undefined, shapeCounts.tetra]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={color === COLORS.darkGrey ? 2.5 : 0.8}
          metalness={0.8}
          roughness={0.15}
          envMapIntensity={1.5}
        />
      </instancedMesh>
    </group>
  );
};

// Arms Component - filled with particles
const Arms: React.FC<{
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ isChaos, mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armParticleCount = 300;

  const leftArmTargets = useMemo(() => generateArmPositions(armParticleCount, 'left'), []);
  const rightArmTargets = useMemo(() => generateArmPositions(armParticleCount, 'right'), []);
  const leftArmPositions = useMemo(() => leftArmTargets.slice(), [leftArmTargets]);
  const rightArmPositions = useMemo(() => rightArmTargets.slice(), [rightArmTargets]);

  const leftHandTargets = useMemo(() => generateHandPositions(200, 'left'), []);
  const rightHandTargets = useMemo(() => generateHandPositions(200, 'right'), []);
  const leftHandPositions = useMemo(() => leftHandTargets.slice(), [leftHandTargets]);
  const rightHandPositions = useMemo(() => rightHandTargets.slice(), [rightHandTargets]);

  useFrame(() => {
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.5;
        groupRef.current.rotation.y = deviceRotation.y * 0.5;
        groupRef.current.rotation.z = deviceRotation.z * 0.3;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.05;
      groupRef.current.rotation.x += mouseRotation.y * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Left Arm Particles */}
      <HelloKittyParticle
        positions={leftArmPositions}
        targetPositions={leftArmTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />
      {/* Left Hand Particles - body colored orbs, below cylinder */}
      <HelloKittyParticle
        positions={leftHandPositions}
        targetPositions={leftHandTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />

      {/* Right Arm Particles */}
      <HelloKittyParticle
        positions={rightArmPositions}
        targetPositions={rightArmTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />
      {/* Right Hand Particles - body colored orbs, below cylinder */}
      <HelloKittyParticle
        positions={rightHandPositions}
        targetPositions={rightHandTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />
    </group>
  );
};

// Legs Component - filled with particles
const Legs: React.FC<{
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ isChaos, mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const legParticleCount = 400;

  const leftLegTargets = useMemo(() => generateLegPositions(legParticleCount, 'left'), []);
  const rightLegTargets = useMemo(() => generateLegPositions(legParticleCount, 'right'), []);
  const leftLegPositions = useMemo(() => leftLegTargets.slice(), [leftLegTargets]);
  const rightLegPositions = useMemo(() => rightLegTargets.slice(), [rightLegTargets]);

  return (
    <group ref={groupRef}>
      {/* Left Leg Particles */}
      <HelloKittyParticle
        positions={leftLegPositions}
        targetPositions={leftLegTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />
      {/* Right Leg Particles */}
      <HelloKittyParticle
        positions={rightLegPositions}
        targetPositions={rightLegTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.08}
      />
    </group>
  );
};

// Eyes Component - Oval/ellipsoid shape, grey, glowing
const Eyes: React.FC<{
  eyePositions: Float32Array;
  eyeTargets: Float32Array;
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ eyePositions, eyeTargets, isChaos, mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEyePos = useRef<THREE.Vector3>(new THREE.Vector3(eyePositions[0], eyePositions[1], eyePositions[2]));
  const rightEyePos = useRef<THREE.Vector3>(new THREE.Vector3(eyePositions[3], eyePositions[4], eyePositions[5]));
  const leftEyeTarget = useRef<THREE.Vector3>(new THREE.Vector3(eyeTargets[0], eyeTargets[1], eyeTargets[2]));
  const rightEyeTarget = useRef<THREE.Vector3>(new THREE.Vector3(eyeTargets[3], eyeTargets[4], eyeTargets[5]));
  const chaosTime = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.5;
        groupRef.current.rotation.y = deviceRotation.y * 0.5;
        groupRef.current.rotation.z = deviceRotation.z * 0.3;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.05;
      groupRef.current.rotation.x += mouseRotation.y * 0.05;
    }

    if (isChaos) {
      chaosTime.current += delta * 0.3;
    } else {
      chaosTime.current = Math.max(0, chaosTime.current - delta * 0.5);
    }

    const easedTime = easeInOutCubic(Math.min(chaosTime.current, 1));
    const lerpSpeed = isChaos ? 0.008 * easedTime : 0.05;

    // Update left eye position
    leftEyeTarget.current.set(eyeTargets[0], eyeTargets[1], eyeTargets[2]);
    if (isChaos) {
      const chaosRadius = 15 * easedTime;
      const angle = chaosTime.current;
      leftEyeTarget.current.x += Math.cos(angle) * chaosRadius;
      leftEyeTarget.current.y += Math.sin(angle * 2) * chaosRadius;
      leftEyeTarget.current.z += Math.sin(angle * 3) * chaosRadius;
    }
    leftEyePos.current.lerp(leftEyeTarget.current, lerpSpeed);

    // Update right eye position
    rightEyeTarget.current.set(eyeTargets[3], eyeTargets[4], eyeTargets[5]);
    if (isChaos) {
      const chaosRadius = 15 * easedTime;
      const angle = chaosTime.current + Math.PI;
      rightEyeTarget.current.x += Math.cos(angle) * chaosRadius;
      rightEyeTarget.current.y += Math.sin(angle * 2) * chaosRadius;
      rightEyeTarget.current.z += Math.sin(angle * 3) * chaosRadius;
    }
    rightEyePos.current.lerp(rightEyeTarget.current, lerpSpeed);

    if (leftEyeRef.current) {
      leftEyeRef.current.position.copy(leftEyePos.current);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.copy(rightEyePos.current);
    }
  });

  // Create ellipsoid geometry for oval eyes (wider horizontally)
  const eyeGeometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 16, 16);
  }, []);

  return (
    <group ref={groupRef}>
      {/* Left Eye - Oval shape, 30% smaller, rotated 90 degrees on z axis */}
      <mesh ref={leftEyeRef} geometry={eyeGeometry} scale={[0.35, 0.245, 0.21]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color={COLORS.darkGrey}
          emissive={COLORS.darkGreyGlow}
          emissiveIntensity={2.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>
      {/* Right Eye - Oval shape, 30% smaller, rotated 90 degrees on z axis */}
      <mesh ref={rightEyeRef} geometry={eyeGeometry} scale={[0.35, 0.245, 0.21]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color={COLORS.darkGrey}
          emissive={COLORS.darkGreyGlow}
          emissiveIntensity={2.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
};

// Nose Component - Single oval orb
const Nose: React.FC<{
  nosePosition: [number, number, number];
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ nosePosition, isChaos, mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const noseRef = useRef<THREE.Mesh>(null);
  const nosePos = useRef<THREE.Vector3>(new THREE.Vector3(...nosePosition));
  const noseTarget = useRef<THREE.Vector3>(new THREE.Vector3(...nosePosition));
  const chaosTime = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.5;
        groupRef.current.rotation.y = deviceRotation.y * 0.5;
        groupRef.current.rotation.z = deviceRotation.z * 0.3;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.05;
      groupRef.current.rotation.x += mouseRotation.y * 0.05;
    }

    if (isChaos) {
      chaosTime.current += delta * 0.3;
    } else {
      chaosTime.current = Math.max(0, chaosTime.current - delta * 0.5);
    }

    const easedTime = easeInOutCubic(Math.min(chaosTime.current, 1));
    const lerpSpeed = isChaos ? 0.008 * easedTime : 0.05;

    // Update nose position
    noseTarget.current.set(...nosePosition);
    if (isChaos) {
      const chaosRadius = 15 * easedTime;
      const angle = chaosTime.current * 1.5;
      noseTarget.current.x += Math.cos(angle) * chaosRadius;
      noseTarget.current.y += Math.sin(angle * 2) * chaosRadius;
      noseTarget.current.z += Math.sin(angle * 3) * chaosRadius;
    }
    nosePos.current.lerp(noseTarget.current, lerpSpeed);

    if (noseRef.current) {
      noseRef.current.position.copy(nosePos.current);
    }
  });

  const noseGeometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 16, 16);
  }, []);

  return (
    <group ref={groupRef}>
      <mesh ref={noseRef} geometry={noseGeometry} scale={[0.35, 0.28, 0.35]}>
        <meshStandardMaterial
          color={COLORS.yellow}
          emissive={COLORS.yellow2}
          emissiveIntensity={1.2}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
    </group>
  );
};

// Whiskers Component - Volume cylinders, shorter, closer together, starting on surface of head
const Whiskers: React.FC<{ mouseRotation: { x: number; y: number }; deviceRotation?: { x: number; y: number; z: number } }> = ({ mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const whiskers = useMemo(() => {
    // Shorter length and closer together
    const whiskerLength = 1.4; // Shorter whiskers
    const baseY = 1.4; // Middle whisker y position
    const ySpacing = 0.4; // Closer together (reduced from 0.6)
    const startX = 2.0; // Start point closer to face (inside)
    const zPos = 1.6;
    // Rotation angle: 10 degrees = 0.1745 radians
    const angle = 10 * (Math.PI / 180);
    
    // Calculate rotated end points
    // Top whisker: rotate up (increase y)
    const topStartX = startX;
    const topStartY = baseY + ySpacing;
    const topEndX = startX + whiskerLength * Math.cos(angle);
    const topEndY = topStartY + whiskerLength * Math.sin(angle);
    
    // Middle whisker: straight (no rotation)
    const midStartX = startX;
    const midStartY = baseY;
    const midEndX = startX + whiskerLength;
    const midEndY = midStartY;
    
    // Bottom whisker: rotate down (decrease y)
    const botStartX = startX;
    const botStartY = baseY - ySpacing;
    const botEndX = startX + whiskerLength * Math.cos(angle);
    const botEndY = botStartY - whiskerLength * Math.sin(angle);
    
    return [
      // Left side - start inside, spread outward with rotation
      { start: [-topStartX, topStartY, zPos], end: [-topEndX, topEndY, zPos] }, // Top - rotated up
      { start: [-midStartX, midStartY, zPos], end: [-midEndX, midEndY, zPos] }, // Middle - straight
      { start: [-botStartX, botStartY, zPos], end: [-botEndX, botEndY, zPos] }, // Bottom - rotated down
      // Right side - symmetric
      { start: [topStartX, topStartY, zPos], end: [topEndX, topEndY, zPos] }, // Top - rotated up
      { start: [midStartX, midStartY, zPos], end: [midEndX, midEndY, zPos] }, // Middle - straight
      { start: [botStartX, botStartY, zPos], end: [botEndX, botEndY, zPos] }, // Bottom - rotated down
    ];
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.5;
        groupRef.current.rotation.y = deviceRotation.y * 0.5;
        groupRef.current.rotation.z = deviceRotation.z * 0.3;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.05;
      groupRef.current.rotation.x += mouseRotation.y * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {whiskers.map((whisker, idx) => {
        // Create cylinder geometry for volume (thick radius)
        const start = new THREE.Vector3(...whisker.start);
        const end = new THREE.Vector3(...whisker.end);
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const radius = 0.08; // Thinner whiskers
        
        // Create cylinder geometry
        const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
          color: COLORS.darkGrey,
          emissive: COLORS.darkGreyGlow,
          emissiveIntensity: 1.5,
          metalness: 0.7,
          roughness: 0.2,
        }));
        
        // Position and orient the cylinder
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(center);
        
        // Orient cylinder along the direction vector
        mesh.lookAt(end);
        mesh.rotateX(Math.PI / 2);
        
        return <primitive key={idx} object={mesh} />;
      })}
    </group>
  );
};

// Floating Objects Component - Crystal glass, self-rotating
const FloatingObjects: React.FC<{
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const objects = useMemo(() => generateFloatingObjects(150), []); // Fill whole space with floating objects
  const rotationSpeeds = useMemo(() => 
    objects.map(() => ({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.01,
    })),
    [objects]
  );
  const meshRefs = useRef<Array<THREE.Mesh | null>>(objects.map(() => null));
  const orbitalTimeRef = useRef(0);

  useFrame((_, delta) => {
    orbitalTimeRef.current += delta;
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.3;
        groupRef.current.rotation.y = deviceRotation.y * 0.3;
        groupRef.current.rotation.z = deviceRotation.z * 0.2;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.02;
      groupRef.current.rotation.x += mouseRotation.y * 0.02;
    }
    
    // Self-rotate each object slowly
    meshRefs.current.forEach((mesh, idx) => {
      if (mesh && rotationSpeeds[idx]) {
        mesh.rotation.x += rotationSpeeds[idx].x;
        mesh.rotation.y += rotationSpeeds[idx].y;
        mesh.rotation.z += rotationSpeeds[idx].z;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {objects.map((obj, idx) => {
        let geometry: THREE.BufferGeometry;
        if (obj.shape === 'sphere') {
          geometry = new THREE.SphereGeometry(obj.size, 16, 16);
        } else if (obj.shape === 'cube') {
          geometry = new THREE.BoxGeometry(obj.size, obj.size, obj.size);
        } else {
          geometry = new THREE.TetrahedronGeometry(obj.size);
        }

        const color = new THREE.Color(obj.color);
        // Keep colors vibrant for crystal effect
        const crystalColor = color.clone();
        
        // Calculate orbital position
        const currentAngle = obj.orbitalAngle + orbitalTimeRef.current * obj.orbitalSpeed;
        const orbitalX = Math.cos(currentAngle) * obj.orbitalRadius;
        const orbitalZ = Math.sin(currentAngle) * obj.orbitalRadius;
        
        // Create crystal glass material: more transparent, highly reflective
        return (
          <mesh 
            key={idx} 
            ref={(el) => { meshRefs.current[idx] = el; }}
            position={[orbitalX, obj.verticalOffset, orbitalZ]} 
            geometry={geometry}
          >
            <meshStandardMaterial
              color={crystalColor}
              emissive={crystalColor}
              emissiveIntensity={obj.glowIntensity * 0.8} // Slightly less glow for clarity
              metalness={0.95} // Very high metalness for mirror-like reflection
              roughness={0.05} // Very low roughness for crystal clarity
              transparent={true}
              opacity={0.3} // More transparent for crystal glass effect
              envMapIntensity={2.5} // Very strong environment reflection
              side={THREE.DoubleSide} // Render both sides for transparency
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Photo Frame with proper zoom and rotation
const PhotoFrame: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl?: string;
  isZoomed: boolean;
  customText?: string;
  personalizedMessage?: string;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ position, rotation, imageUrl, isZoomed, customText, personalizedMessage, mouseRotation, deviceRotation }) => {
  const frameRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const loader = useRef(new THREE.TextureLoader());
  const currentPos = useRef<[number, number, number]>(position);
  const currentScale = useRef(0.3);
  const { viewport, size } = useThree();

  useEffect(() => {
    if (imageUrl) {
      console.log('Loading polaroid image:', imageUrl);
      // Use the URL directly from import.meta.glob - it should be a valid path
      loader.current.load(
        imageUrl,
        (loadedTexture) => {
          console.log('Successfully loaded image:', imageUrl);
          loadedTexture.flipY = false; // Keep original orientation
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load image ${imageUrl}:`, error);
          // Try alternative: use the URL as-is but ensure it's a valid path
          const altUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
          if (altUrl !== imageUrl) {
            loader.current.load(
              altUrl,
              (loadedTexture) => {
                console.log('Successfully loaded image with alt path:', altUrl);
                loadedTexture.flipY = false;
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                setTexture(loadedTexture);
              },
              undefined,
              (error2) => {
                console.error('Failed to load image with alternative path:', error2);
                setTexture(null);
              }
            );
          } else {
            setTexture(null);
          }
        }
      );
    } else {
      console.warn('No imageUrl provided for polaroid');
      setTexture(null);
    }
  }, [imageUrl]);

  useFrame(() => {
    if (frameRef.current) {
      // Apply rotation with Hello Kitty
      if (deviceRotation) {
        frameRef.current.rotation.x = deviceRotation.x * 0.5 + rotation[0];
        frameRef.current.rotation.y = deviceRotation.y * 0.5 + rotation[1] + mouseRotation.x * 0.05;
        frameRef.current.rotation.z = deviceRotation.z * 0.3 + rotation[2];
      } else {
        frameRef.current.rotation.y = rotation[1] + mouseRotation.x * 0.05;
        frameRef.current.rotation.x = rotation[0] + mouseRotation.y * 0.05;
        frameRef.current.rotation.z = rotation[2];
      }

      if (isZoomed) {
        const isMobile = size.width < 768;
        let maxScale = 1.0;
        
        if (isMobile) {
          const maxWidth = size.width * 0.9;
          const frameWidth = 1.2;
          maxScale = (maxWidth / viewport.width) / frameWidth;
        } else {
          const maxHeight = viewport.height * 0.6;
          const frameHeight = 1.5;
          maxScale = maxHeight / frameHeight;
        }
        
        maxScale = Math.min(maxScale, 2.5);

        // Zoom to center, face camera (flat side showing)
        currentPos.current[0] += (0 - currentPos.current[0]) * 0.1;
        currentPos.current[1] += (0 - currentPos.current[1]) * 0.1;
        currentPos.current[2] += (3 - currentPos.current[2]) * 0.1; // Closer for better view
        currentScale.current += (maxScale - currentScale.current) * 0.1;
        
        // Face camera directly
        frameRef.current.lookAt(0, 0, 10);
      } else {
        currentPos.current[0] += (position[0] - currentPos.current[0]) * 0.1;
        currentPos.current[1] += (position[1] - currentPos.current[1]) * 0.1;
        currentPos.current[2] += (position[2] - currentPos.current[2]) * 0.1;
        currentScale.current += (0.3 - currentScale.current) * 0.1;
      }
      frameRef.current.position.set(...currentPos.current);
      frameRef.current.scale.set(currentScale.current, currentScale.current, currentScale.current);
    }
  });

  const frameWidth = 1.2;
  const frameHeight = 1.6;
  const photoWidth = 0.9;
  const photoHeight = 1.2;

  return (
    <group ref={frameRef} position={position} rotation={rotation}>
      {/* Front Frame - Pure white, no glow */}
      <mesh>
        <boxGeometry args={[frameWidth, frameHeight, 0.05]} />
        <meshStandardMaterial color={COLORS.white} emissive={COLORS.white} emissiveIntensity={0} />
      </mesh>
      {/* Photo Area - front side - ensure white background and image visible */}
      <mesh position={[0, 0.15, 0.03]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshStandardMaterial
          map={texture || null}
          color={texture ? COLORS.white : '#F5F5F5'}
          emissive={COLORS.white}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          transparent={false}
        />
      </mesh>
      {/* Debug: Show if texture is loaded */}
      {!texture && imageUrl && (
        <Html position={[0, 0.15, 0.04]} center>
          <div style={{ 
            width: `${photoWidth * 100}px`, 
            height: `${photoHeight * 100}px`,
            backgroundColor: '#F5F5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#999',
            border: '1px solid #ddd'
          }}>
            {imageUrl ? 'Loading image...' : 'No image'}
          </div>
        </Html>
      )}
      {/* Back Side - Solid Color */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshStandardMaterial color={COLORS.white} emissive={COLORS.white} emissiveIntensity={0} />
      </mesh>
      {/* Label Area */}
      <mesh position={[0, -0.7, 0.03]}>
        <planeGeometry args={[photoWidth, 0.2]} />
        <meshStandardMaterial color={COLORS.white} emissive={COLORS.white} emissiveIntensity={0} />
      </mesh>
      {/* Custom text label when zoomed - wider to fit all text */}
      {isZoomed && customText && (
        <Html position={[0, -0.9, 0.06]} center>
          <div style={{
            width: `${photoWidth * 120}px`,
            maxWidth: `${photoWidth * 120}px`,
            minWidth: `${photoWidth * 100}px`,
            textAlign: 'center',
            fontSize: '12px',
            color: 'black',
            fontWeight: 'bold',
            padding: '6px 10px',
            backgroundColor: 'white',
            borderRadius: '4px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
          }}>
            {customText}
          </div>
        </Html>
      )}
      {/* Personalized message on polaroid */}
      {isZoomed && personalizedMessage && (
        <Html position={[0, -1.15, 0.06]} center>
          <div style={{
            width: `${photoWidth * 120}px`,
            maxWidth: `${photoWidth * 120}px`,
            minWidth: `${photoWidth * 100}px`,
            textAlign: 'center',
            fontSize: '11px',
            color: '#666',
            fontStyle: 'italic',
            padding: '4px 8px',
            backgroundColor: '#FFF9E6',
            borderRadius: '4px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            marginTop: '4px',
          }}>
            {personalizedMessage}
          </div>
        </Html>
      )}
    </group>
  );
};

const loadGalleryImages = () => {
  try {
    // @ts-ignore
    const images = import.meta.glob('/src/assets/images/*.{jpg,jpeg,png,webp}', { 
      eager: true,
      import: 'default' 
    }) as Record<string, string>;
    
    return Object.entries(images)
      .sort(([a], [b]) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      })
      .map(([path, url]) => ({ path, url: url as string }));
  } catch (e) {
    console.warn('Could not load gallery images:', e);
    return [];
  }
};

// Load photo descriptions and personalized messages from JSON
const loadPhotoDescriptions = async (): Promise<{ descriptions: Record<string, string>; personalizedMessages: Record<string, string> }> => {
  try {
    // Try to load JSON file
    const response = await fetch('/src/assets/images/photoDescriptions.json');
    if (response.ok) {
      const data = await response.json();
      return {
        descriptions: data.descriptions || {},
        personalizedMessages: data.personalizedMessages || {},
      };
    }
  } catch (e) {
    // If fetch fails, try import (for Vite dev server)
    try {
      // @ts-ignore
      const descriptionsModule = await import('/src/assets/images/photoDescriptions.json');
      const data = descriptionsModule.default || descriptionsModule;
      return {
        descriptions: data.descriptions || {},
        personalizedMessages: data.personalizedMessages || {},
      };
    } catch (importError) {
      console.warn('Could not load photo descriptions:', e, importError);
    }
  }
  return { descriptions: {}, personalizedMessages: {} };
};

// Get filename from path
const getFilename = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const PhotoGallery: React.FC<{
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
  onProgressChange?: (progress: number) => void;
  onPhotoChange?: (photoIndex: number) => void;
}> = ({ isChaos, mouseRotation, deviceRotation, onProgressChange, onPhotoChange }) => {
  const photoCount = 40;
  const availableImages = useMemo(() => loadGalleryImages(), []);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [personalizedMessages, setPersonalizedMessages] = useState<Record<string, string>>({});
  const [, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const photoStartTime = useRef<number | null>(null);
  const lastPhotoIndexRef = useRef(0); // Remember last photo index when released

  const startPositions = useMemo(() => generatePolaroidStartPositions(photoCount), []);
  
  // Load descriptions and personalized messages on mount
  useEffect(() => {
    loadPhotoDescriptions().then((data) => {
      setDescriptions(data.descriptions);
      setPersonalizedMessages(data.personalizedMessages);
    });
  }, []);
  
  const imageData = useMemo(() => {
    const data: Array<{ url: string; path: string }> = [];
    for (let i = 0; i < photoCount; i++) {
      if (availableImages.length > 0) {
        data.push(availableImages[i % availableImages.length]);
      } else {
        data.push({ url: '', path: '' });
      }
    }
    return data;
  }, [availableImages, photoCount]);

  useEffect(() => {
    if (isChaos && availableImages.length > 0) {
      // Continue from last photo index when re-pressed
      if (lastPhotoIndexRef.current > 0) {
        setCurrentPhotoIndex(lastPhotoIndexRef.current);
      }
      setProgress(0);
      photoStartTime.current = Date.now();

      const updateProgress = () => {
        if (photoStartTime.current) {
          const elapsed = (Date.now() - photoStartTime.current) / 1000;
          const newProgress = Math.min(elapsed / 3, 1);
          setProgress(newProgress);
          onProgressChange?.(newProgress);

          if (newProgress >= 1) {
            setCurrentPhotoIndex((prev) => {
              const next = (prev + 1) % availableImages.length;
              lastPhotoIndexRef.current = next;
              // Play transition woosh sound with pitch progression
              onPhotoChange?.(next);
              return next;
            });
            photoStartTime.current = Date.now();
            setProgress(0);
            onProgressChange?.(0);
          }
          
          // Play transitional buildup when progress is high
          if (newProgress > 0.7 && newProgress < 0.95) {
            // Trigger buildup sound (only once per transition)
            if (Math.floor(newProgress * 10) === 7) {
              onPhotoChange?.(currentPhotoIndex);
            }
          }
        }
      };

      progressInterval.current = setInterval(updateProgress, 50);
      return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
      };
    } else {
      // When released, remember current index
      if (isChaos === false && currentPhotoIndex > 0) {
        lastPhotoIndexRef.current = currentPhotoIndex;
      }
      setProgress(0);
      photoStartTime.current = null;
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  }, [isChaos, availableImages.length, onProgressChange, currentPhotoIndex]);

  const frames = useMemo(() => {
    const totalImages = availableImages.length > 0 ? availableImages.length : photoCount;
    return Array.from({ length: photoCount }, (_, i) => {
      const angle = (i / photoCount) * Math.PI * 2;
      const imageInfo = imageData[i];
      const filename = imageInfo.path ? getFilename(imageInfo.path) : '';
      // Calculate photo number based on current index
      const photoNumber = isChaos && i === currentPhotoIndex 
        ? ((currentPhotoIndex % totalImages) + 1)
        : ((i % totalImages) + 1);
      const customText = descriptions[filename] || `Photo ${photoNumber} of ${totalImages}`;
      const personalizedMessage = personalizedMessages[filename] || '';
      
      return {
        position: startPositions[i] || [0, 0, 0],
        rotation: [0, angle + Math.PI / 2, 0] as [number, number, number],
        imageUrl: imageInfo.url,
        isZoomed: isChaos && i === currentPhotoIndex,
        customText,
        personalizedMessage,
      };
    });
  }, [startPositions, imageData, isChaos, currentPhotoIndex, descriptions, personalizedMessages, availableImages.length, photoCount]);

  return (
    <>
      {frames.map((frame, idx) => (
        <PhotoFrame
          key={idx}
          position={frame.position}
          rotation={frame.rotation}
          imageUrl={frame.imageUrl}
          isZoomed={frame.isZoomed}
          customText={frame.customText}
          personalizedMessage={frame.personalizedMessage}
          mouseRotation={mouseRotation}
          deviceRotation={deviceRotation}
        />
      ))}
    </>
  );
};

const CameraController: React.FC<{ isChaos: boolean }> = ({ isChaos }) => {
  const { camera } = useThree();
  const targetZ = useRef(18); // Closer to show face better
  const targetY = useRef(1); // Slightly above center to show face

  useFrame(() => {
    if (isChaos) {
      targetZ.current = 10;
      targetY.current = 0;
    } else {
      targetZ.current = 18; // Closer to show face
      targetY.current = 1; // Slightly above to show face
    }
    camera.position.z += (targetZ.current - camera.position.z) * 0.05;
    camera.position.y += (targetY.current - camera.position.y) * 0.05;
  });

  return null;
};

const Scene: React.FC<{
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
  onProgressChange?: (progress: number) => void;
  onPhotoChange?: (photoIndex: number) => void;
}> = ({ isChaos, mouseRotation, deviceRotation, onProgressChange, onPhotoChange }) => {
  // Increased particle counts for denser appearance, especially head
  const headCount = 3000; // More orbs filling head space
  const bodyCount = 1800;
  const earCount = 400; // Ears
  // const clothesCount = 1200; // clothes disabled
  const bowCount = 300;

  const headTargets = useMemo(() => generateHelloKittyPositions(headCount, 'head'), []);
  const bodyTargets = useMemo(() => generateHelloKittyPositions(bodyCount, 'body'), []);
  const earLeftTargets = useMemo(() => generateHelloKittyPositions(earCount, 'earLeft'), []);
  const earRightTargets = useMemo(() => generateHelloKittyPositions(earCount, 'earRight'), []);
  // const clothesTargets = useMemo(() => generateClothesSurfacePositions(clothesCount), []);
  const bowTargets = useMemo(() => generateHelloKittyPositions(bowCount, 'bow'), []);
  const eyeTargets = useMemo(() => generateEyePositions(), []);

  const headPositions = useMemo(() => headTargets.slice(), [headTargets]);
  const bodyPositions = useMemo(() => bodyTargets.slice(), [bodyTargets]);
  const earLeftPositions = useMemo(() => earLeftTargets.slice(), [earLeftTargets]);
  const earRightPositions = useMemo(() => earRightTargets.slice(), [earRightTargets]);
  // const clothesPositions = useMemo(() => clothesTargets.slice(), [clothesTargets]);
  const bowPositions = useMemo(() => bowTargets.slice(), [bowTargets]);
  const eyePositions = useMemo(() => eyeTargets.slice(), [eyeTargets]);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController isChaos={isChaos} />
      {/* Deep space lighting with bounce/reflective light */}
      <ambientLight intensity={0.2} />
      {/* Main light from Hello Kitty (emissive glow source) */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={2.5} 
        color={COLORS.pink2}
        distance={50}
        decay={2}
      />
      {/* Bounce lights from surrounding objects */}
      <pointLight 
        position={[15, 10, 10]} 
        intensity={0.8} 
        color={COLORS.gold}
        distance={30}
        decay={2}
      />
      <pointLight 
        position={[-15, 10, -10]} 
        intensity={0.8} 
        color={COLORS.pink}
        distance={30}
        decay={2}
      />
      <pointLight 
        position={[0, -10, 15]} 
        intensity={0.6} 
        color={COLORS.pearlWhite2}
        distance={25}
        decay={2}
      />
      {/* Directional light for depth */}
      <directionalLight position={[10, 10, 5]} intensity={0.8} color={COLORS.gold} />
      {/* Hemisphere light for ambient bounce */}
      <hemisphereLight 
        args={[COLORS.pink2, COLORS.darkGrey, 0.4]} 
      />

      <HelloKittyParticle
        positions={headPositions}
        targetPositions={headTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.1}
      />

      <HelloKittyParticle
        positions={bodyPositions}
        targetPositions={bodyTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pink}
        emissiveColor={COLORS.pink2}
        baseSize={0.1}
      />

      {/* Ears - Pearl Off-White Ivory */}
      <HelloKittyParticle
        positions={earLeftPositions}
        targetPositions={earLeftTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.1}
      />

      <HelloKittyParticle
        positions={earRightPositions}
        targetPositions={earRightTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
        baseSize={0.1}
      />

      {/* Clothes rendering disabled */}
      {/* <HelloKittyParticle
        positions={clothesPositions}
        targetPositions={clothesTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pink}
        emissiveColor={COLORS.pink2}
        baseSize={0.09}
      /> */}

      <HelloKittyParticle
        positions={bowPositions}
        targetPositions={bowTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pink}
        emissiveColor={COLORS.pink2}
        baseSize={0.12}
      />

      {/* Eyes - Custom oval/ellipsoid shape for better visibility */}
      <Eyes 
        eyePositions={eyePositions}
        eyeTargets={eyeTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
      />

      {/* Nose - Single oval orb, same z axis as eyes, closer to head center */}
      <Nose 
        nosePosition={[0, 1.8, 2.2]}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
      />

      <Arms isChaos={isChaos} mouseRotation={mouseRotation} deviceRotation={deviceRotation} />
      <Legs isChaos={isChaos} mouseRotation={mouseRotation} deviceRotation={deviceRotation} />
      <Whiskers mouseRotation={mouseRotation} deviceRotation={deviceRotation} />
      <FloatingObjects mouseRotation={mouseRotation} deviceRotation={deviceRotation} />
      <PhotoGallery 
        isChaos={isChaos} 
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        onProgressChange={onProgressChange}
        onPhotoChange={onPhotoChange}
      />

      <EffectComposer>
        <Bloom
          intensity={2.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          height={300}
        />
      </EffectComposer>
    </>
  );
};

export const HelloKittyLuxuryCard: React.FC = () => {
  const [isChaos, setIsChaos] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mouseRotation, setMouseRotation] = useState({ x: 0, y: 0 });
  const [targetMouseRotation, setTargetMouseRotation] = useState({ x: 0, y: 0 });
  const [deviceRotation, setDeviceRotation] = useState<{ x: number; y: number; z: number } | undefined>(undefined);
  const [cameraZoom, setCameraZoom] = useState(20);
  const [musicEnabled, setMusicEnabled] = useState(false); // Music off by default
  const [soundEffectsMuted, setSoundEffectsMuted] = useState(false); // Sound effects mute
  const wooshSoundRef = useRef<{ play: () => void; playTransition: (pitchOffset?: number) => void; playCrescendo: (progress: number) => void } | null>(null);
  const lastWooshPlayRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null); // Separate gain for music
  const soundEffectsGainRef = useRef<GainNode | null>(null); // Separate gain for sound effects
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crescendoOscillatorRef = useRef<OscillatorNode | null>(null);
  const photoPitchRef = useRef(0); // Track pitch progression for photo transitions

  // Initialize audio
  useEffect(() => {
    // Create 8-bit background music (synthesized)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Create separate gain nodes for music and sound effects
    const musicGain = audioContext.createGain();
    const soundEffectsGain = audioContext.createGain();
    
    musicGain.connect(audioContext.destination);
    soundEffectsGain.connect(audioContext.destination);
    
    musicGain.gain.value = musicEnabled ? 1 : 0;
    soundEffectsGain.gain.value = soundEffectsMuted ? 0 : 1;
    
    musicGainRef.current = musicGain;
    soundEffectsGainRef.current = soundEffectsGain;
    
    // Simple 8-bit style melody generator (not used - replaced by multi-track music)
    // const create8BitTone = (frequency: number, duration: number, type: OscillatorType = 'square') => {
    //   const oscillator = audioContext.createOscillator();
    //   const gainNode = audioContext.createGain();
    //   
    //   oscillator.connect(gainNode);
    //   gainNode.connect(audioContext.destination);
    //   
    //   oscillator.frequency.value = frequency;
    //   oscillator.type = type;
    //   
    //   gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    //   gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    //   
    //   oscillator.start(audioContext.currentTime);
    //   oscillator.stop(audioContext.currentTime + duration);
    // };

    // Create 8-bit cute Sanrio style woosh sound
    const createWooshSound = () => {
      // Multiple oscillators for cute layered sound
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(soundEffectsGain); // Sound effects go to soundEffectsGain
      
      // Cute 8-bit filter sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.4);
      filter.Q.setValueAtTime(5, audioContext.currentTime);
      
      // Cute Sanrio-style oscillators (square waves for 8-bit feel) - PITCHED UP
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(880, audioContext.currentTime); // A5 (pitched up from A4)
      osc1.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.4);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1320, audioContext.currentTime); // E6 (pitched up from E5)
      osc2.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.4);
      
      // Cute volume envelope
      gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.4);
      osc2.stop(audioContext.currentTime + 0.4);
    };

    // Create 8-bit cute transition woosh (for photo changes) with pitch progression
    const createTransitionWoosh = (pitchOffset: number = 0) => {
      // Calculate pitch based on photo index (each photo = one semitone higher)
      // Base pitch: C5 (523.25 Hz), each semitone multiplies by 2^(1/12) ? 1.05946
      const semitoneMultiplier = Math.pow(2, pitchOffset / 12);
      const baseFreq1 = 1046.50; // C6 (pitched up from C5)
      const baseFreq2 = 1318.51; // E6 (pitched up from E5)
      
      const freq1 = baseFreq1 * semitoneMultiplier;
      const freq2 = baseFreq2 * semitoneMultiplier;
      
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(soundEffectsGain); // Sound effects go to soundEffectsGain
      
      // Cute 8-bit filter - pitched up
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, audioContext.currentTime); // Higher filter for pitched up sound
      filter.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.5);
      filter.Q.setValueAtTime(6, audioContext.currentTime);
      
      // Cute Sanrio-style 8-bit oscillators - pitched up with progression
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(freq1, audioContext.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(freq1 * 0.5, audioContext.currentTime + 0.5);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq2, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(freq2 * 0.5, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.5);
      osc2.stop(audioContext.currentTime + 0.5);
    };
    
    // Create transitional buildup sound between polaroids
    const createTransitionalBuildup = (pitchOffset: number = 0) => {
      const semitoneMultiplier = Math.pow(2, pitchOffset / 12);
      const baseFreq = 880 * semitoneMultiplier; // A5 base, scaled by pitch
      
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(soundEffectsGain); // Sound effects go to soundEffectsGain
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3000, audioContext.currentTime + 0.3);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.3);
      
      // Build up volume
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.3);
      
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.3);
    };

    // Create crescendo buildup sound
    const createCrescendo = (progress: number) => {
      // Stop previous crescendo if exists
      if (crescendoOscillatorRef.current) {
        try {
          crescendoOscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(soundEffectsGain); // Sound effects go to soundEffectsGain
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200 + progress * 600, audioContext.currentTime);
      filter.Q.setValueAtTime(15, audioContext.currentTime);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100 + progress * 200, audioContext.currentTime);
      
      // Volume increases with progress
      gainNode.gain.setValueAtTime(0.05 + progress * 0.15, audioContext.currentTime);
      
      oscillator.start(audioContext.currentTime);
      crescendoOscillatorRef.current = oscillator;
      
      // Keep it running, will be stopped when released
    };

    // Store sound creation functions
    wooshSoundRef.current = { 
      play: createWooshSound,
      playTransition: createTransitionWoosh,
      playCrescendo: createCrescendo,
      playBuildup: createTransitionalBuildup,
    } as any;

    // Play background music with 3 tracks: bass, melody, beat (2-5-1 progression)
    const playBackgroundMusic = () => {
      if (!musicEnabled) return;
      
      // 2-5-1 progression in C major: Dm (ii) - G (V) - C (I)
      // Dm: D, F, A
      // G: G, B, D
      // C: C, E, G
      
      const bassNotes = [
        146.83, // D3 (Dm root)
        146.83, // D3
        196.00, // G3 (G root)
        196.00, // G3
        130.81, // C3 (C root)
        130.81, // C3
      ];
      
      const melodyNotes = [
        293.66, // D4 (Dm)
        329.63, // E4
        349.23, // F4 (Dm)
        392.00, // G4 (G)
        440.00, // A4
        493.88, // B4 (G)
        523.25, // C5 (C)
        523.25, // C5
      ];
      
      const beatFreq = 220; // A3 for kick-like beat
      
      let bassIndex = 0;
      let melodyIndex = 0;
      let beatCounter = 0;
      
      // Bass track (slower, lower)
      const playBass = () => {
        if (!musicEnabled) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = bassNotes[bassIndex];
        osc.connect(gain);
        gain.connect(musicGain);
        
        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.6);
        
        bassIndex = (bassIndex + 1) % bassNotes.length;
        musicIntervalRef.current = setTimeout(playBass, 600);
      };
      
      // Melody track (main tune)
      const playMelody = () => {
        if (!musicEnabled) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'square';
        osc.frequency.value = melodyNotes[melodyIndex];
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain); // Music tracks go to musicGain
        
        // Cute lofi filter
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;
        
        gain.gain.setValueAtTime(0.06, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.4);
        
        melodyIndex = (melodyIndex + 1) % melodyNotes.length;
        setTimeout(playMelody, 450);
      };
      
      // Beat track (rhythm)
      const playBeat = () => {
        if (!musicEnabled) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = beatFreq;
        osc.connect(gain);
        gain.connect(musicGain);
        
        // Short punchy beat
        gain.gain.setValueAtTime(0.05, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
        
        beatCounter++;
        if (beatCounter % 2 === 0) {
          setTimeout(playBeat, 300);
        } else {
          setTimeout(playBeat, 200);
        }
      };
      
      // Start all tracks
      playBass();
      setTimeout(() => playMelody(), 100);
      setTimeout(() => playBeat(), 50);
    };

    // Start background music if enabled
    if (musicEnabled) {
      playBackgroundMusic();
    }

    return () => {
      if (musicIntervalRef.current) clearTimeout(musicIntervalRef.current);
      if (crescendoOscillatorRef.current) {
        try {
          crescendoOscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, [musicEnabled, soundEffectsMuted]);
  
  // Update music gain when music enabled changes
  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = musicEnabled ? 1 : 0;
    }
  }, [musicEnabled]);
  
  // Update sound effects gain when mute changes
  useEffect(() => {
    if (soundEffectsGainRef.current) {
      soundEffectsGainRef.current.gain.value = soundEffectsMuted ? 0 : 1;
    }
  }, [soundEffectsMuted]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.beta !== null && e.gamma !== null && e.alpha !== null) {
          setDeviceRotation({
            x: (e.beta - 90) * (Math.PI / 180),
            y: e.gamma * (Math.PI / 180),
            z: e.alpha * (Math.PI / 180),
          });
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  // Camera gesture controls using MediaPipe or webcam (disabled - mediapipe file removed)
  useEffect(() => {
    // MediaPipe removed; fallback to touch gestures only

    // Fallback: Basic touch gestures
    let lastPinchDistance = 0;
    let lastRotation = 0;
    let handUpTimer: NodeJS.Timeout | null = null;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastPinchDistance > 0) {
          const delta = distance - lastPinchDistance;
          setCameraZoom((prev) => Math.max(10, Math.min(30, prev - delta * 0.1)));
        }
        lastPinchDistance = distance;

        // Rotation gesture
        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );
        if (lastRotation !== 0) {
          const rotationDelta = angle - lastRotation;
          setTargetMouseRotation((prev) => ({
            x: prev.x + rotationDelta * 2,
            y: prev.y,
          }));
        }
        lastRotation = angle;
      } else {
        lastPinchDistance = 0;
        lastRotation = 0;
      }
    };

    const handleTouchEnd = () => {
      lastPinchDistance = 0;
      lastRotation = 0;
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (handUpTimer) clearTimeout(handUpTimer);
    };
  }, [isChaos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setTargetMouseRotation({ x, y });
  }, []);

  // Ease mouse rotation in and out
  useEffect(() => {
    const interval = setInterval(() => {
      setMouseRotation((prev) => ({
        x: prev.x + (targetMouseRotation.x - prev.x) * 0.1, // Ease in/out
        y: prev.y + (targetMouseRotation.y - prev.y) * 0.1,
      }));
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [targetMouseRotation]);

  // Crescendo buildup sound when holding
  useEffect(() => {
    if (isHolding && wooshSoundRef.current && wooshSoundRef.current.playCrescendo) {
      // Update crescendo based on progress
      const updateCrescendo = () => {
        if (isHolding && wooshSoundRef.current && wooshSoundRef.current.playCrescendo) {
          wooshSoundRef.current.playCrescendo(progress);
        }
      };
      const crescendoInterval = setInterval(updateCrescendo, 100);
      return () => {
        clearInterval(crescendoInterval);
        // Stop crescendo when released
        if (crescendoOscillatorRef.current) {
          try {
            crescendoOscillatorRef.current.stop();
            crescendoOscillatorRef.current = null;
          } catch (e) {
            // Already stopped
          }
        }
      };
    }
  }, [isHolding, progress]);

  const handleMouseDown = useCallback(() => {
    setIsHolding(true);
    setIsChaos(true);
    // Play woosh sound (throttled)
    const now = Date.now();
    if (now - lastWooshPlayRef.current > 200) {
      if (wooshSoundRef.current && wooshSoundRef.current.play) {
        wooshSoundRef.current.play();
      }
      lastWooshPlayRef.current = now;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsHolding(false);
    setIsChaos(false);
    setProgress(0);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsHolding(true);
    setIsChaos(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsHolding(false);
    setIsChaos(false);
    setProgress(0);
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a1a 0%, #000000 70%)',
        backgroundSize: '100% 100%',
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Blurred background extension */}
      <div className="absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 105, 180, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-3xl mb-2" style={{ 
          fontFamily: "'Comic Sans MS', 'Marker Felt', cursive",
          fontWeight: 'bold',
          color: '#FF69B4',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          letterSpacing: '1px'
        }}>
          Hello Kitty
        </h1>
        <div className="px-3 py-1.5 rounded-full inline-block" style={{
          background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <h2 className="text-sm font-semibold" style={{ 
            fontFamily: "'Comic Sans MS', 'Marker Felt', cursive",
            color: '#FFFFFF',
            fontWeight: '600'
          }}>Interactive Experience</h2>
        </div>
      </div>

      {/* Music and Volume Toggle Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Music Toggle Button */}
        <button
          onClick={() => setMusicEnabled(!musicEnabled)}
          className="px-3 py-2 rounded-full transition-all duration-300 transform active:scale-95 select-none"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            color: '#2D3748',
            background: musicEnabled ? '#FFF0F8' : '#E5E5E5',
            border: `2px solid ${musicEnabled ? '#FFB6C1' : '#CCCCCC'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
          }}
          title={musicEnabled ? 'Disable Music' : 'Enable Music'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {musicEnabled ? (
              // Music note icon (on)
              <>
                <path d="M9 18V5L21 3V16" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="6" cy="18" r="3" stroke="#FF69B4" strokeWidth="2" fill="none"/>
                <circle cx="18" cy="16" r="3" stroke="#FF69B4" strokeWidth="2" fill="none"/>
              </>
            ) : (
              // Music note icon (off - crossed out)
              <>
                <path d="M9 18V5L21 3V16" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="6" cy="18" r="3" stroke="#999" strokeWidth="2" fill="none"/>
                <circle cx="18" cy="16" r="3" stroke="#999" strokeWidth="2" fill="none"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>
        
        {/* Sound Effects Mute Button */}
        <button
          onClick={() => setSoundEffectsMuted(!soundEffectsMuted)}
          className="px-3 py-2 rounded-full transition-all duration-300 transform active:scale-95 select-none"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            color: '#2D3748',
            background: !soundEffectsMuted ? '#FFF0F8' : '#E5E5E5',
            border: `2px solid ${!soundEffectsMuted ? '#FFB6C1' : '#CCCCCC'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
          }}
          title={soundEffectsMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {!soundEffectsMuted ? (
              // Sound effects on icon (speaker)
              <>
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34835 21.9979 12C21.9979 14.6517 20.9447 17.1947 19.07 19.07" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
              </>
            ) : (
              // Sound effects off icon (crossed out speaker)
              <>
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <line x1="23" y1="9" x2="17" y2="15" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>
      </div>

      {isChaos && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-64">
          <div className="bg-white/30 rounded-full h-2 mb-1" style={{ backdropFilter: 'blur(10px)' }}>
            <div 
              className="h-2 rounded-full transition-all duration-100"
              style={{ 
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #FFB6C1 0%, #FF69B4 100%)'
              }}
            />
          </div>
          <p className="text-xs text-center" style={{ 
            fontFamily: "'Comic Sans MS', 'Marker Felt', cursive",
            color: '#FFFFFF',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            fontWeight: '600'
          }}>Next picture coming up...</p>
        </div>
      )}

      {/* Gesture Hints - Outside Canvas */}
      <div className="absolute bottom-20 left-4 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 max-w-xs" style={{
          border: '1px solid rgba(255, 182, 193, 0.3)',
        }}>
          <h3 className="text-sm font-semibold mb-2" style={{
            fontFamily: "'Inter', sans-serif",
            color: '#FFB6C1',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Try These Gestures:
          </h3>
          <ul className="space-y-2 text-xs" style={{
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF',
            listStyle: 'none',
            padding: 0,
          }}>
            <li className="flex items-start gap-2">
              <span style={{ color: '#FF69B4' }}>?</span>
              <span>Try pinching your fingers together to zoom!</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#FF69B4' }}>?</span>
              <span>Wave your hand left/right to rotate the scene!</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#FF69B4' }}>?</span>
              <span>Hold your hand up to advance photos!</span>
            </li>
          </ul>
        </div>
      </div>

      <Canvas
        className="w-full"
        style={{ height: '90vh' }}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, cameraZoom], fov: 50 }}
      >
        <Scene 
          isChaos={isChaos} 
          mouseRotation={mouseRotation}
          deviceRotation={deviceRotation}
          onProgressChange={setProgress}
          onPhotoChange={(photoIndex) => {
            if (wooshSoundRef.current) {
              // Update pitch progression (each photo = one semitone higher)
              photoPitchRef.current = photoIndex;
              
              // Play buildup sound first
              if ((wooshSoundRef.current as any).playBuildup) {
                (wooshSoundRef.current as any).playBuildup(photoPitchRef.current);
              }
              
              // Then play transition woosh with pitch progression
              setTimeout(() => {
                if (wooshSoundRef.current && wooshSoundRef.current.playTransition) {
                  wooshSoundRef.current.playTransition(photoPitchRef.current);
                }
              }, 300);
            }
          }}
        />
      </Canvas>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <button
          className="px-8 py-4 rounded-2xl transition-all duration-300 transform active:scale-95 select-none"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '15px',
            fontWeight: '600',
            color: '#2D3748',
            background: isHolding 
              ? '#FFE5F1' 
              : '#FFF0F8',
            border: '2px solid #FFB6C1',
            boxShadow: isHolding 
              ? '0 8px 24px rgba(255, 182, 193, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)' 
              : '0 4px 16px rgba(255, 182, 193, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            transform: isHolding ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.3px',
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isHolding ? '? Exploring...' : '? Hold to Explore'}
        </button>
      </div>

    </div>
  );
};

export default HelloKittyLuxuryCard;
