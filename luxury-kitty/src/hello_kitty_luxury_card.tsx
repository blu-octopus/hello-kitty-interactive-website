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

  // Left Ear (Ellipsoid) - Tilted away from each other, extruded more, Centered at (3.2, 4.5, 0)
  const earL = (Math.pow((x - 3.2) / 0.9, 2) + Math.pow((y - 4.5) / 1.4, 2) + Math.pow(z / 0.6, 2)) <= 1;

  // Right Ear (Ellipsoid) - Tilted away from each other, extruded more, Centered at (-3.2, 4.5, 0)
  const earR = (Math.pow((x + 3.2) / 0.9, 2) + Math.pow((y - 4.5) / 1.4, 2) + Math.pow(z / 0.6, 2)) <= 1;

  // Left Arm (Ellipsoid) - Centered at (2.8, -0.5, 0.5)
  const armL = (Math.pow((x - 2.8) / 0.8, 2) + Math.pow((y + 0.5) / 1.5, 2) + Math.pow((z - 0.5) / 0.8, 2)) <= 1;

  // Right Arm (Ellipsoid) - Centered at (-2.8, -0.5, 0.5)
  const armR = (Math.pow((x + 2.8) / 0.8, 2) + Math.pow((y + 0.5) / 1.5, 2) + Math.pow((z - 0.5) / 0.8, 2)) <= 1;

  // Left Leg (Ellipsoid) - Centered at (1.2, -3.5, 0.2)
  const legL = (Math.pow((x - 1.2) / 0.9, 2) + Math.pow((y + 3.5) / 1.2, 2) + Math.pow((z - 0.2) / 0.9, 2)) <= 1;

  // Right Leg (Ellipsoid) - Centered at (-1.2, -3.5, 0.2)
  const legR = (Math.pow((x + 1.2) / 0.9, 2) + Math.pow((y + 3.5) / 1.2, 2) + Math.pow((z - 0.2) / 0.9, 2)) <= 1;

  // --- B. Facial Features ---
  
  // Dark Grey Eyes (Much Bigger Spheres) - same z axis as nose
  const eyeR = (Math.pow((x - 1.2) / 0.7, 2) + Math.pow((y - 2.5) / 0.7, 2) + Math.pow((z - 2.0) / 0.7, 2)) <= 1;
  const eyeL = (Math.pow((x + 1.2) / 0.7, 2) + Math.pow((y - 2.5) / 0.7, 2) + Math.pow((z - 2.0) / 0.7, 2)) <= 1;

  // Yellow Nose (Small Ellipsoid/Sphere) - z axis at 2.0
  const nose = (Math.pow(x / 0.5, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 2.0) / 0.5, 2)) <= 1;

  // Dark Grey Whiskers (Much thicker and wider ellipsoids) - bigger max
  // Right Whiskers (3 segments) - thicker and wider
  const whiskerR1 = (Math.pow((x - 2.0) / 0.4, 2) + Math.pow((y - 1.8) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;
  const whiskerR2 = (Math.pow((x - 2.2) / 0.4, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;
  const whiskerR3 = (Math.pow((x - 2.0) / 0.4, 2) + Math.pow((y - 0.6) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;

  // Left Whiskers (3 segments, symmetric) - thicker and wider
  const whiskerL1 = (Math.pow((x + 2.0) / 0.4, 2) + Math.pow((y - 1.8) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;
  const whiskerL2 = (Math.pow((x + 2.2) / 0.4, 2) + Math.pow((y - 1.2) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;
  const whiskerL3 = (Math.pow((x + 2.0) / 0.4, 2) + Math.pow((y - 0.6) / 0.4, 2) + Math.pow((z - 2.0) / 2.0, 2)) <= 1;

  // --- C. Clothing (Pink) ---
  
  // Pink Shirt/Dress (Covers the upper body, slightly larger than the body primitive)
  const shirt = (Math.pow(x / 2.5, 2) + Math.pow((y + 1.5) / 3.0, 2) + Math.pow(z / 2.0, 2)) <= 1;

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

// Generate nose positions - based on new ellipsoid
const generateNosePositions = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Generate positions inside the nose ellipsoid
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI;
    const radius = Math.random() * 0.5; // Nose radius
    
    positions[i * 3] = radius * Math.sin(angle2) * Math.cos(angle1);
    positions[i * 3 + 1] = 1.2 + radius * Math.cos(angle2) * 0.4;
    positions[i * 3 + 2] = 2.0 + radius * Math.sin(angle2) * Math.sin(angle1) * 0.5;
  }
  return positions;
};

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
    // Orbital position around Hello Kitty
    const baseAngle = (i / count) * Math.PI * 2; // Evenly distributed around
    const orbitalRadius = 15 + Math.random() * 5; // 15-20 units away
    const orbitalSpeed = 0.2 + Math.random() * 0.3; // Varying orbital speeds
    const verticalOffset = (Math.random() - 0.5) * 8; // Vertical variation
    
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
          emissiveIntensity={color === COLORS.darkGrey ? 1.2 : 0.4}
          metalness={0.7}
          roughness={0.2}
        />
      </instancedMesh>
      {/* Cubes */}
      <instancedMesh args={[geometries.cube, undefined, shapeCounts.cube]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={color === COLORS.darkGrey ? 1.2 : 0.4}
          metalness={0.7}
          roughness={0.2}
        />
      </instancedMesh>
      {/* Tetrahedrons */}
      <instancedMesh args={[geometries.tetra, undefined, shapeCounts.tetra]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={color === COLORS.darkGrey ? 1.2 : 0.4}
          metalness={0.7}
          roughness={0.2}
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

// Whiskers Component - NOT forked, just tilted apart, thicker, bigger, same color as eyes
const Whiskers: React.FC<{ mouseRotation: { x: number; y: number }; deviceRotation?: { x: number; y: number; z: number } }> = ({ mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const whiskers = useMemo(() => [
    // Left side - NOT forked, just tilted apart, wider apart, bigger max
    // Scaled to match SDF positions: whiskerL1 at y=1.8, whiskerL2 at y=1.2, whiskerL3 at y=0.6
    { start: [-2.0 * 3.0, (1.8 * 3.0), 2.0 * 3.0], end: [-4.0 * 3.0, (1.8 * 3.0), 2.0 * 3.0] }, // Top - wider
    { start: [-2.2 * 3.0, (1.2 * 3.0), 2.0 * 3.0], end: [-4.2 * 3.0, (1.2 * 3.0), 2.0 * 3.0] }, // Middle - wider
    { start: [-2.0 * 3.0, (0.6 * 3.0), 2.0 * 3.0], end: [-4.0 * 3.0, (0.6 * 3.0), 2.0 * 3.0] }, // Bottom - wider
    // Right side - NOT forked, just tilted apart, wider apart, bigger max
    { start: [2.0 * 3.0, (1.8 * 3.0), 2.0 * 3.0], end: [4.0 * 3.0, (1.8 * 3.0), 2.0 * 3.0] }, // Top - wider
    { start: [2.2 * 3.0, (1.2 * 3.0), 2.0 * 3.0], end: [4.2 * 3.0, (1.2 * 3.0), 2.0 * 3.0] }, // Middle - wider
    { start: [2.0 * 3.0, (0.6 * 3.0), 2.0 * 3.0], end: [4.0 * 3.0, (0.6 * 3.0), 2.0 * 3.0] }, // Bottom - wider
  ], []);

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
        // Simple line, NOT forked, just tilted
        const points = [new THREE.Vector3(...whisker.start), new THREE.Vector3(...whisker.end)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <primitive 
            key={idx} 
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({ 
                color: COLORS.darkGrey, // Same color as eyes
                linewidth: 40 // Much thicker and wider - bigger max
              })
            )} 
          />
        );
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
  const objects = useMemo(() => generateFloatingObjects(60), []); // Many more floating objects
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
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ position, rotation, imageUrl, isZoomed, customText, mouseRotation, deviceRotation }) => {
  const frameRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const loader = useRef(new THREE.TextureLoader());
  const currentPos = useRef<[number, number, number]>(position);
  const currentScale = useRef(0.3);
  const { viewport, size } = useThree();

  useEffect(() => {
    if (imageUrl) {
      // Try loading with the URL as-is first
      loader.current.load(
        imageUrl,
        (loadedTexture) => {
          loadedTexture.flipY = true; // Right side up
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load image ${imageUrl}:`, error);
          // Try alternative path if direct load fails
          const altUrl = imageUrl.replace('/src/', '/');
          loader.current.load(
            altUrl,
            (loadedTexture) => {
              loadedTexture.flipY = true;
              setTexture(loadedTexture);
            },
            undefined,
            (error2) => {
              console.warn(`Failed to load image with alternative path ${altUrl}:`, error2);
              setTexture(null);
            }
          );
        }
      );
    } else {
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
      {/* Photo Area - front side */}
      <mesh position={[0, 0.15, 0.03]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshStandardMaterial
          map={texture || null}
          color={COLORS.white}
          emissive={COLORS.white}
          emissiveIntensity={0}
        />
      </mesh>
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
      {/* Custom text label when zoomed */}
      {isZoomed && customText && (
        <Html position={[0, -0.9, 0.06]} center>
          <div style={{
            width: `${photoWidth * 100}px`,
            textAlign: 'center',
            fontSize: '12px',
            color: 'black',
            fontWeight: 'bold',
            padding: '4px 8px',
            backgroundColor: 'white',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {customText}
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

// Load photo descriptions from JSON
const loadPhotoDescriptions = async (): Promise<Record<string, string>> => {
  try {
    // Try to load JSON file
    const response = await fetch('/src/assets/images/photoDescriptions.json');
    if (response.ok) {
      const data = await response.json();
      return data.descriptions || {};
    }
  } catch (e) {
    // If fetch fails, try import (for Vite dev server)
    try {
      // @ts-ignore
      const descriptionsModule = await import('/src/assets/images/photoDescriptions.json');
      return descriptionsModule.default?.descriptions || descriptionsModule.descriptions || {};
    } catch (importError) {
      console.warn('Could not load photo descriptions:', e, importError);
    }
  }
  return {};
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
}> = ({ isChaos, mouseRotation, deviceRotation, onProgressChange }) => {
  const photoCount = 40;
  const availableImages = useMemo(() => loadGalleryImages(), []);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const photoStartTime = useRef<number | null>(null);
  const lastPhotoIndexRef = useRef(0); // Remember last photo index when released

  const startPositions = useMemo(() => generatePolaroidStartPositions(photoCount), []);
  
  // Load descriptions on mount
  useEffect(() => {
    loadPhotoDescriptions().then(setDescriptions);
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
              return next;
            });
            photoStartTime.current = Date.now();
            setProgress(0);
            onProgressChange?.(0);
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
      
      return {
        position: startPositions[i] || [0, 0, 0],
        rotation: [0, angle + Math.PI / 2, 0] as [number, number, number],
        imageUrl: imageInfo.url,
        isZoomed: isChaos && i === currentPhotoIndex,
        customText,
      };
    });
  }, [startPositions, imageData, isChaos, currentPhotoIndex, descriptions, availableImages.length, photoCount]);

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
}> = ({ isChaos, mouseRotation, deviceRotation, onProgressChange }) => {
  // Increased particle counts for denser appearance, especially head
  const headCount = 3000; // More orbs filling head space
  const bodyCount = 1800;
  const earCount = 400; // Ears
  const clothesCount = 1200;
  const bowCount = 300;
  const noseCount = 80;

  const headTargets = useMemo(() => generateHelloKittyPositions(headCount, 'head'), []);
  const bodyTargets = useMemo(() => generateHelloKittyPositions(bodyCount, 'body'), []);
  const earLeftTargets = useMemo(() => generateHelloKittyPositions(earCount, 'earLeft'), []);
  const earRightTargets = useMemo(() => generateHelloKittyPositions(earCount, 'earRight'), []);
  const clothesTargets = useMemo(() => generateHelloKittyPositions(clothesCount, 'clothes'), []);
  const bowTargets = useMemo(() => generateHelloKittyPositions(bowCount, 'bow'), []);
  const eyeTargets = useMemo(() => generateEyePositions(), []);
  const noseTargets = useMemo(() => generateNosePositions(noseCount), [noseCount]);

  const headPositions = useMemo(() => headTargets.slice(), [headTargets]);
  const bodyPositions = useMemo(() => bodyTargets.slice(), [bodyTargets]);
  const earLeftPositions = useMemo(() => earLeftTargets.slice(), [earLeftTargets]);
  const earRightPositions = useMemo(() => earRightTargets.slice(), [earRightTargets]);
  const clothesPositions = useMemo(() => clothesTargets.slice(), [clothesTargets]);
  const bowPositions = useMemo(() => bowTargets.slice(), [bowTargets]);
  const eyePositions = useMemo(() => eyeTargets.slice(), [eyeTargets]);
  const nosePositions = useMemo(() => noseTargets.slice(), [noseTargets]);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController isChaos={isChaos} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} color={COLORS.gold} />
      <pointLight position={[-10, 5, -5]} intensity={0.6} color={COLORS.pink} />
      <pointLight position={[0, 0, 10]} intensity={0.5} color={COLORS.pearlWhite} />

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
        color={COLORS.pearlWhite}
        emissiveColor={COLORS.pearlWhite2}
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

      <HelloKittyParticle
        positions={clothesPositions}
        targetPositions={clothesTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.pink}
        emissiveColor={COLORS.pink2}
        baseSize={0.09}
      />

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

      <HelloKittyParticle
        positions={eyePositions}
        targetPositions={eyeTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.darkGrey}
        emissiveColor={COLORS.darkGreyGlow}
        baseSize={1.0}
      />

      <HelloKittyParticle
        positions={nosePositions}
        targetPositions={noseTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.yellow}
        emissiveColor={COLORS.yellow2}
        baseSize={0.12}
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

  const handleMouseDown = useCallback(() => {
    setIsHolding(true);
    setIsChaos(true);
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
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">
          GRAND LUXURY
        </h1>
        <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-2 py-1 rounded-lg inline-block">
          <h2 className="text-sm font-semibold text-[#000000]">INTERACTIVE TREE</h2>
        </div>
      </div>

      {isChaos && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-64">
          <div className="bg-black/50 rounded-full h-2 mb-1">
            <div 
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-center text-white">Next picture coming up...</p>
        </div>
      )}

      <Canvas
        className="w-full h-full"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 20], fov: 50 }}
      >
        <Scene 
          isChaos={isChaos} 
          mouseRotation={mouseRotation}
          deviceRotation={deviceRotation}
          onProgressChange={setProgress} 
        />
      </Canvas>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <button
          className={`
            px-6 py-3 rounded-full text-sm font-bold
            transition-all duration-300 transform
            ${isHolding
              ? 'bg-gradient-to-r from-[#BE185D] to-[#EC4899] scale-110 shadow-2xl'
              : 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:scale-105 shadow-lg'
            }
            text-[#000000] border-2 border-[#FFD700]
            active:scale-95
            select-none
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isHolding ? 'UNLEASHING CHAOS...' : 'HOLD TO UNLEASH'}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-3 py-1.5 rounded-lg">
          <p className="text-xs font-semibold text-[#000000]">??ค@?งฮ?</p>
        </div>
      </div>
    </div>
  );
};

export default HelloKittyLuxuryCard;
