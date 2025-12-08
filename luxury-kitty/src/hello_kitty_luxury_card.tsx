import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- SDF Helper Functions ---
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

// --- Main SDF Map Function for Hello Kitty ---
const mapHelloKitty = (p: [number, number, number], part?: string): number => {
  let d = 1e6;
  const scale = 3.0;
  const p_scaled: [number, number, number] = [p[0] / scale, p[1] / scale, p[2] / scale];

  // 1. Head (white)
  const p_head: [number, number, number] = [p_scaled[0], p_scaled[1] - 0.2, p_scaled[2]];
  const head_radius = 1.0;
  let d_head = sdSphere(p_head, head_radius);

  // 2. Ears (white)
  const p_ear_r: [number, number, number] = [p_scaled[0] - 0.75, p_scaled[1] - 0.7, p_scaled[2]];
  const d_ear_r = sdSphere(p_ear_r, 0.25);
  const p_ear_l: [number, number, number] = [p_scaled[0] + 0.75, p_scaled[1] - 0.7, p_scaled[2]];
  const d_ear_l = sdSphere(p_ear_l, 0.25);

  d = opSmoothUnion(d_head, d_ear_r, 0.2);
  d = opSmoothUnion(d, d_ear_l, 0.2);

  // 3. Body (white)
  const p_body: [number, number, number] = [p_scaled[0], p_scaled[1] + 1.0, p_scaled[2]];
  const d_body = sdCylinder(p_body, [0.8, 0.5]);
  d = opSmoothUnion(d, d_body, 0.3);

  // 4. Arms (cylinders) - on sides of body, moved down
  // Left arm (viewer's right) - moved down more
  const p_arm_l: [number, number, number] = [p_scaled[0] - 0.9, p_scaled[1] + 0.6, p_scaled[2]];
  const d_arm_l = sdCylinder(p_arm_l, [0.15, 0.6]);
  // Left hand (sphere right under cylinder)
  const p_hand_l: [number, number, number] = [p_scaled[0] - 0.9, p_scaled[1] + 1.2, p_scaled[2]];
  const d_hand_l = sdSphere(p_hand_l, 0.2);
  // Left thumb (smaller sphere)
  const p_thumb_l: [number, number, number] = [p_scaled[0] - 1.0, p_scaled[1] + 1.1, p_scaled[2] + 0.15];
  const d_thumb_l = sdSphere(p_thumb_l, 0.08);
  
  // Right arm (viewer's left) - moved down more
  const p_arm_r: [number, number, number] = [p_scaled[0] + 0.9, p_scaled[1] + 0.6, p_scaled[2]];
  const d_arm_r = sdCylinder(p_arm_r, [0.15, 0.6]);
  // Right hand (sphere right under cylinder)
  const p_hand_r: [number, number, number] = [p_scaled[0] + 0.9, p_scaled[1] + 1.2, p_scaled[2]];
  const d_hand_r = sdSphere(p_hand_r, 0.2);
  // Right thumb (smaller sphere)
  const p_thumb_r: [number, number, number] = [p_scaled[0] + 1.0, p_scaled[1] + 1.1, p_scaled[2] + 0.15];
  const d_thumb_r = sdSphere(p_thumb_r, 0.08);

  // 5. Legs (cylinders) - moved down to touch bottom of body
  const p_leg_l: [number, number, number] = [p_scaled[0] - 0.4, p_scaled[1] + 1.8, p_scaled[2]];
  const d_leg_l = sdCylinder(p_leg_l, [0.2, 0.4]);
  const p_leg_r: [number, number, number] = [p_scaled[0] + 0.4, p_scaled[1] + 1.8, p_scaled[2]];
  const d_leg_r = sdCylinder(p_leg_r, [0.2, 0.4]);

  // 6. Clothes (pink)
  let d_clothes = 1e6;
  if (part === 'clothes') {
    const p_clothes: [number, number, number] = [p_scaled[0], p_scaled[1] + 1.0, p_scaled[2]];
    d_clothes = sdCylinder(p_clothes, [0.85, 0.52]);
    d_clothes = Math.max(d_clothes, -d_body);
  }

  // 7. Bow (pink)
  const bow_pivot: [number, number, number] = [0.7, 0.7, 0.2];
  const p_bow: [number, number, number] = [
    p_scaled[0] - bow_pivot[0],
    p_scaled[1] - bow_pivot[1],
    p_scaled[2] - bow_pivot[2],
  ];
  const p_loop_r = rotateZ(p_bow, -0.7);
  const d_loop_r = sdBox([p_loop_r[0] - 0.2, p_loop_r[1], p_loop_r[2]], [0.3, 0.15, 0.1]);
  const p_loop_l = rotateZ(p_bow, 0.7);
  const d_loop_l = sdBox([p_loop_l[0] + 0.2, p_loop_l[1], p_loop_l[2]], [0.3, 0.15, 0.1]);
  const d_knot = sdSphere(p_bow, 0.1);
  let d_bow = opUnion(d_loop_r, d_loop_l);
  d_bow = opUnion(d_bow, d_knot);

  // 8. Eyes (dark grey) - closer to front (positive z)
  const p_eye_l: [number, number, number] = [p_scaled[0] + 0.3, p_scaled[1] - 0.1, p_scaled[2] + 0.3];
  const d_eye_l = sdSphere(p_eye_l, 0.12);
  const p_eye_r: [number, number, number] = [p_scaled[0] - 0.3, p_scaled[1] - 0.1, p_scaled[2] + 0.3];
  const d_eye_r = sdSphere(p_eye_r, 0.12);

  // 9. Nose (yellow) - single larger elliptical sphere proportional to eyes
  const p_nose: [number, number, number] = [p_scaled[0], p_scaled[1] + 0.2, p_scaled[2] + 0.2];
  // Elliptical: scale x and y differently
  const nose_scale = [0.15, 0.12, 0.1]; // Wider than tall
  const d_nose = Math.sqrt(
    Math.pow(p_nose[0] / nose_scale[0], 2) + 
    Math.pow(p_nose[1] / nose_scale[1], 2) + 
    Math.pow(p_nose[2] / nose_scale[2], 2)
  ) - 1.0;

  if (part === 'head') return Math.min(d, 1e6);
  if (part === 'body') return d_body;
  if (part === 'clothes') return d_clothes;
  if (part === 'bow') return d_bow;
  if (part === 'leftEye') return d_eye_l;
  if (part === 'rightEye') return d_eye_r;
  if (part === 'nose') return d_nose;
  if (part === 'armLeft') return Math.min(d_arm_l, d_hand_l, d_thumb_l);
  if (part === 'armRight') return Math.min(d_arm_r, d_hand_r, d_thumb_r);
  if (part === 'legLeft') return d_leg_l;
  if (part === 'legRight') return d_leg_r;

  return Math.min(d, d_bow);
};

const isInsideHelloKitty = (x: number, y: number, z: number, part?: string): boolean => {
  const d = mapHelloKitty([x, y, z], part);
  return d <= 0.1;
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
  positions[0] = -0.9;
  positions[1] = 0.3;
  positions[2] = 0.9; // Closer to front
  positions[3] = 0.9;
  positions[4] = 0.3;
  positions[5] = 0.9; // Closer to front
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
    
    positions[i * 3] = sign * (0.9 + radius * Math.cos(angle));
    positions[i * 3 + 1] = 0.6 + t * 0.6; // From 0.6 to 1.2 (arm length)
    positions[i * 3 + 2] = radius * Math.sin(angle);
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

// Generate sparse floating objects (more spheres)
const generateFloatingObjects = (count: number): Array<{
  position: [number, number, number];
  color: string;
  size: number;
  shape: 'sphere' | 'cube' | 'tetrahedron';
}> => {
  const objects: Array<{
    position: [number, number, number];
    color: string;
    size: number;
    shape: 'sphere' | 'cube' | 'tetrahedron';
  }> = [];
  const colors = ['#FFD700', '#FF0000', '#0D9488']; // Gold, Red, Emerald
  const shapes: Array<'sphere' | 'cube' | 'tetrahedron'> = ['sphere', 'sphere', 'sphere', 'sphere', 'sphere', 'cube', 'tetrahedron']; // Mostly spheres

  for (let i = 0; i < count; i++) {
    // Place far from Hello Kitty (outside 10 unit radius), sparse
    const angle = Math.random() * Math.PI * 2;
    const distance = 12 + Math.random() * 10; // 12-22 units away
    const height = (Math.random() - 0.5) * 12;
    
    objects.push({
      position: [
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance,
      ],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 0.15 + Math.random() * 0.1, // 0.15-0.25
      shape: shapes[Math.floor(Math.random() * shapes.length)],
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
          emissiveIntensity={0.15}
          metalness={0.7}
          roughness={0.2}
        />
      </instancedMesh>
      {/* Cubes */}
      <instancedMesh args={[geometries.cube, undefined, shapeCounts.cube]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={0.15}
          metalness={0.7}
          roughness={0.2}
        />
      </instancedMesh>
      {/* Tetrahedrons */}
      <instancedMesh args={[geometries.tetra, undefined, shapeCounts.tetra]}>
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor || color}
          emissiveIntensity={0.15}
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
      {/* Left Hand sphere - right under cylinder */}
      <mesh position={[-2.7, 1.8, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color={COLORS.pearlWhite} emissive={COLORS.pearlWhite2} emissiveIntensity={0.15} />
      </mesh>
      {/* Left Thumb */}
      <mesh position={[-2.8, 1.7, 0.45]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color={COLORS.pearlWhite} emissive={COLORS.pearlWhite2} emissiveIntensity={0.15} />
      </mesh>

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
      {/* Right Hand sphere - right under cylinder */}
      <mesh position={[2.7, 1.8, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color={COLORS.pearlWhite} emissive={COLORS.pearlWhite2} emissiveIntensity={0.15} />
      </mesh>
      {/* Right Thumb */}
      <mesh position={[2.8, 1.7, 0.45]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color={COLORS.pearlWhite} emissive={COLORS.pearlWhite2} emissiveIntensity={0.15} />
      </mesh>
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

// Whiskers Component - forked, wider, farther apart
const Whiskers: React.FC<{ mouseRotation: { x: number; y: number }; deviceRotation?: { x: number; y: number; z: number } }> = ({ mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const whiskers = useMemo(() => [
    // Left side - forked (split at end), wider, farther apart
    { start: [-1.5, 0.4, 0.1], mid: [-2.2, 0.4, 0.1], end1: [-2.8, 0.35, 0.1], end2: [-2.8, 0.45, 0.1] },
    { start: [-1.5, 0.6, 0.1], mid: [-2.2, 0.6, 0.1], end1: [-2.8, 0.55, 0.1], end2: [-2.8, 0.65, 0.1] },
    { start: [-1.5, 0.8, 0.1], mid: [-2.2, 0.8, 0.1], end1: [-2.8, 0.75, 0.1], end2: [-2.8, 0.85, 0.1] },
    // Right side - forked (split at end), wider, farther apart
    { start: [1.5, 0.4, 0.1], mid: [2.2, 0.4, 0.1], end1: [2.8, 0.35, 0.1], end2: [2.8, 0.45, 0.1] },
    { start: [1.5, 0.6, 0.1], mid: [2.2, 0.6, 0.1], end1: [2.8, 0.55, 0.1], end2: [2.8, 0.65, 0.1] },
    { start: [1.5, 0.8, 0.1], mid: [2.2, 0.8, 0.1], end1: [2.8, 0.75, 0.1], end2: [2.8, 0.85, 0.1] },
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
        // Main line from start to mid
        const mainPoints = [new THREE.Vector3(...whisker.start), new THREE.Vector3(...whisker.mid)];
        const mainGeometry = new THREE.BufferGeometry().setFromPoints(mainPoints);
        
        // Fork 1 from mid to end1
        const fork1Points = [new THREE.Vector3(...whisker.mid), new THREE.Vector3(...whisker.end1)];
        const fork1Geometry = new THREE.BufferGeometry().setFromPoints(fork1Points);
        
        // Fork 2 from mid to end2
        const fork2Points = [new THREE.Vector3(...whisker.mid), new THREE.Vector3(...whisker.end2)];
        const fork2Geometry = new THREE.BufferGeometry().setFromPoints(fork2Points);
        
        return (
          <group key={idx}>
            <primitive object={new THREE.Line(mainGeometry, new THREE.LineBasicMaterial({ color: COLORS.pearlWhite, linewidth: 4 }))} />
            <primitive object={new THREE.Line(fork1Geometry, new THREE.LineBasicMaterial({ color: COLORS.pearlWhite, linewidth: 4 }))} />
            <primitive object={new THREE.Line(fork2Geometry, new THREE.LineBasicMaterial({ color: COLORS.pearlWhite, linewidth: 4 }))} />
          </group>
        );
      })}
    </group>
  );
};

// Floating Objects Component
const FloatingObjects: React.FC<{
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
}> = ({ mouseRotation, deviceRotation }) => {
  const groupRef = useRef<THREE.Group>(null);
  const objects = useMemo(() => generateFloatingObjects(25), []); // More floating objects

  useFrame(() => {
    if (groupRef.current) {
      if (deviceRotation) {
        groupRef.current.rotation.x = deviceRotation.x * 0.3;
        groupRef.current.rotation.y = deviceRotation.y * 0.3;
        groupRef.current.rotation.z = deviceRotation.z * 0.2;
      }
      groupRef.current.rotation.y += mouseRotation.x * 0.02;
      groupRef.current.rotation.x += mouseRotation.y * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {objects.map((obj, idx) => {
        let geometry: THREE.BufferGeometry;
        if (obj.shape === 'sphere') {
          geometry = new THREE.SphereGeometry(obj.size, 8, 8);
        } else if (obj.shape === 'cube') {
          geometry = new THREE.BoxGeometry(obj.size, obj.size, obj.size);
        } else {
          geometry = new THREE.TetrahedronGeometry(obj.size);
        }

        const color = new THREE.Color(obj.color);
        color.multiplyScalar(0.6); // Desaturate

        return (
          <mesh key={idx} position={obj.position} geometry={geometry}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.1}
              metalness={0.3}
              roughness={0.7}
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
      loader.current.load(
        imageUrl,
        (loadedTexture) => {
          loadedTexture.flipY = true; // Right side up
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load image ${imageUrl}:`, error);
          setTexture(null);
        }
      );
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
    return Array.from({ length: photoCount }, (_, i) => {
      const angle = (i / photoCount) * Math.PI * 2;
      const imageInfo = imageData[i];
      const filename = imageInfo.path ? getFilename(imageInfo.path) : '';
      const customText = descriptions[filename] || `Photo ${i + 1}`;
      
      return {
        position: startPositions[i] || [0, 0, 0],
        rotation: [0, angle + Math.PI / 2, 0] as [number, number, number],
        imageUrl: imageInfo.url,
        isZoomed: isChaos && i === currentPhotoIndex,
        customText,
      };
    });
  }, [startPositions, imageData, isChaos, currentPhotoIndex, descriptions]);

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
  const targetZ = useRef(20); // Zoomed out more

  useFrame(() => {
    if (isChaos) {
      targetZ.current = 10;
    } else {
      targetZ.current = 20; // More zoomed out
    }
    camera.position.z += (targetZ.current - camera.position.z) * 0.05;
  });

  return null;
};

const Scene: React.FC<{
  isChaos: boolean;
  mouseRotation: { x: number; y: number };
  deviceRotation?: { x: number; y: number; z: number };
  onProgressChange?: (progress: number) => void;
}> = ({ isChaos, mouseRotation, deviceRotation, onProgressChange }) => {
  // Increased particle counts for denser appearance
  const headCount = 2000;
  const bodyCount = 1800;
  const clothesCount = 1200;
  const bowCount = 300;
  const noseCount = 80;

  const headTargets = useMemo(() => generateHelloKittyPositions(headCount, 'head'), []);
  const bodyTargets = useMemo(() => generateHelloKittyPositions(bodyCount, 'body'), []);
  const clothesTargets = useMemo(() => generateHelloKittyPositions(clothesCount, 'clothes'), []);
  const bowTargets = useMemo(() => generateHelloKittyPositions(bowCount, 'bow'), []);
  const eyeTargets = useMemo(() => generateEyePositions(), []);
  const noseTargets = useMemo(() => generateHelloKittyPositions(noseCount, 'nose'), []);

  const headPositions = useMemo(() => headTargets.slice(), [headTargets]);
  const bodyPositions = useMemo(() => bodyTargets.slice(), [bodyTargets]);
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
        color={COLORS.pearlWhite2}
        emissiveColor={COLORS.pearlWhite3}
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
        color={COLORS.deepPink}
        emissiveColor={COLORS.pink3}
        baseSize={0.12}
      />

      <HelloKittyParticle
        positions={eyePositions}
        targetPositions={eyeTargets}
        isChaos={isChaos}
        mouseRotation={mouseRotation}
        deviceRotation={deviceRotation}
        color={COLORS.black}
        baseSize={0.25}
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
    setMouseRotation({ x, y });
  }, []);

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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
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
