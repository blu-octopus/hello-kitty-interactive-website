import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame as useFrame3D, extend, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  Vignette 
} from '@react-three/postprocessing'
import { 
  InstancedMesh, 
  Vector3, 
  Color, 
  Group
} from 'three'
import { useExperienceStore } from './state/useExperienceStore'
import * as THREE from 'three'

// Extend Three.js with custom types
extend({ InstancedMesh })

// Mathematical function to determine if a point is inside Hello Kitty shape
function isInsideHelloKitty(x: number, y: number, z: number): { inside: boolean; part: 'head' | 'body' | 'bow' | 'leftEar' | 'rightEar' | 'none' } {
  // Head (large sphere at center)
  const headRadius = 1.2
  const headCenter = new Vector3(0, 0.8, 0)
  const distToHead = Math.sqrt(
    Math.pow(x - headCenter.x, 2) + 
    Math.pow(y - headCenter.y, 2) + 
    Math.pow(z - headCenter.z, 2)
  )
  
  if (distToHead < headRadius) {
    // Check if it's in the ear region (exclude)
    const leftEarDist = Math.sqrt(Math.pow(x + 0.6, 2) + Math.pow(y - 1.3, 2) + Math.pow(z, 2))
    const rightEarDist = Math.sqrt(Math.pow(x - 0.6, 2) + Math.pow(y - 1.3, 2) + Math.pow(z, 2))
    
    if (leftEarDist < 0.25) return { inside: true, part: 'leftEar' }
    if (rightEarDist < 0.25) return { inside: true, part: 'rightEar' }
    
    // Exclude face area (where eyes and nose would be)
    const faceDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y - 0.5, 2) + Math.pow(z - 0.9, 2))
    if (faceDist < 0.4) return { inside: false, part: 'none' }
    
    return { inside: true, part: 'head' }
  }
  
  // Body (ellipsoid below head)
  const bodyCenter = new Vector3(0, -0.5, 0)
  const bodyDist = Math.sqrt(
    Math.pow(x - bodyCenter.x, 2) / 0.8 + 
    Math.pow(y - bodyCenter.y, 2) / 1.2 + 
    Math.pow(z - bodyCenter.z, 2) / 0.8
  )
  
  if (bodyDist < 1) {
    return { inside: true, part: 'body' }
  }
  
  // Bow (on left ear)
  const bowCenter = new Vector3(-0.7, 1.2, 0.1)
  const bowDist = Math.sqrt(
    Math.pow(x - bowCenter.x, 2) + 
    Math.pow(y - bowCenter.y, 2) + 
    Math.pow(z - bowCenter.z, 2)
  )
  
  if (bowDist < 0.3) {
    return { inside: true, part: 'bow' }
  }
  
  return { inside: false, part: 'none' }
}

// Generate particle positions for Hello Kitty shape
function generateHelloKittyParticles(count: number): Array<{ position: Vector3; part: string; isOrnament: boolean }> {
  const particles: Array<{ position: Vector3; part: string; isOrnament: boolean }> = []
  const attempts = count * 10 // Try many times to fill the shape
  
  for (let i = 0; i < attempts && particles.length < count; i++) {
    const x = (Math.random() - 0.5) * 3
    const y = (Math.random() - 0.5) * 3
    const z = (Math.random() - 0.5) * 2
    
    const result = isInsideHelloKitty(x, y, z)
    if (result.inside) {
      // 10% chance to be an ornament (larger, gold particles)
      const isOrnament = Math.random() < 0.1 && result.part !== 'leftEar' && result.part !== 'rightEar'
      particles.push({
        position: new Vector3(x, y, z),
        part: result.part,
        isOrnament
      })
    }
  }
  
  return particles
}

// Fairy Dust Particle Component
function FairyDustParticles({ count = 5000 }: { count?: number }) {
  const whiteMeshRef = useRef<InstancedMesh>(null)
  const pinkMeshRef = useRef<InstancedMesh>(null)
  const { progress, gestureInfluence } = useExperienceStore()
  
  // Generate particles and separate by type
  const { whiteParticles, pinkParticles } = useMemo(() => {
    const allParticles = generateHelloKittyParticles(count)
    const white: typeof allParticles = []
    const pink: typeof allParticles = []
    
    allParticles.forEach(p => {
      if (p.part === 'bow') {
        pink.push(p)
      } else if (!p.isOrnament) {
        white.push(p)
      }
    })
    
    return { whiteParticles: white, pinkParticles: pink }
  }, [count])
  
  // Store matrices for each particle
  const whiteMatrices = useMemo(() => 
    whiteParticles.map(() => new THREE.Matrix4()), 
    [whiteParticles]
  )
  const pinkMatrices = useMemo(() => 
    pinkParticles.map(() => new THREE.Matrix4()), 
    [pinkParticles]
  )
  
  // Initial positions and target positions for white particles
  const whiteInitialPositions = useMemo(() => 
    whiteParticles.map(p => p.position.clone()), 
    [whiteParticles]
  )
  
  const whiteChaosPositions = useMemo(() => 
    whiteParticles.map(() => {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 4
      const height = (Math.random() - 0.5) * 6
      return new Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
    }), 
    [whiteParticles]
  )
  
  // Initial positions and target positions for pink particles
  const pinkInitialPositions = useMemo(() => 
    pinkParticles.map(p => p.position.clone()), 
    [pinkParticles]
  )
  
  const pinkChaosPositions = useMemo(() => 
    pinkParticles.map(() => {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 4
      const height = (Math.random() - 0.5) * 6
      return new Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
    }), 
    [pinkParticles]
  )
  
  useFrame3D(() => {
    const lerpSpeed = 0.05
    const currentProgress = progress
    
    // Update white particles
    if (whiteMeshRef.current) {
      whiteParticles.forEach((_, i) => {
        const initial = whiteInitialPositions[i]
        const chaos = whiteChaosPositions[i]
        
        const targetPos = initial.clone().lerp(chaos, 1 - currentProgress)
        targetPos.x += gestureInfluence.x * 0.5
        targetPos.y += gestureInfluence.y * 0.5
        
        const currentPos = new Vector3()
        const tempMatrix = new THREE.Matrix4()
        whiteMeshRef.current!.getMatrixAt(i, tempMatrix)
        currentPos.setFromMatrixPosition(tempMatrix)
        
        const newPos = currentPos.clone().lerp(targetPos, lerpSpeed)
        
        const scale = 0.03
        whiteMatrices[i].compose(
          newPos,
          new THREE.Quaternion(),
          new THREE.Vector3(scale, scale, scale)
        )
        
        whiteMeshRef.current!.setMatrixAt(i, whiteMatrices[i])
      })
      whiteMeshRef.current.instanceMatrix.needsUpdate = true
    }
    
    // Update pink particles
    if (pinkMeshRef.current) {
      pinkParticles.forEach((_, i) => {
        const initial = pinkInitialPositions[i]
        const chaos = pinkChaosPositions[i]
        
        const targetPos = initial.clone().lerp(chaos, 1 - currentProgress)
        targetPos.x += gestureInfluence.x * 0.5
        targetPos.y += gestureInfluence.y * 0.5
        
        const currentPos = new Vector3()
        const tempMatrix = new THREE.Matrix4()
        pinkMeshRef.current!.getMatrixAt(i, tempMatrix)
        currentPos.setFromMatrixPosition(tempMatrix)
        
        const newPos = currentPos.clone().lerp(targetPos, lerpSpeed)
        
        const scale = 0.03
        pinkMatrices[i].compose(
          newPos,
          new THREE.Quaternion(),
          new THREE.Vector3(scale, scale, scale)
        )
        
        pinkMeshRef.current!.setMatrixAt(i, pinkMatrices[i])
      })
      pinkMeshRef.current.instanceMatrix.needsUpdate = true
    }
  })
  
  return (
    <>
      {/* White particles */}
      <instancedMesh ref={whiteMeshRef} args={[undefined, undefined, whiteParticles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={new Color(0xffffff)}
          emissive={new Color(0xffffff).multiplyScalar(0.1)}
          roughness={0.2}
          metalness={0.3}
        />
      </instancedMesh>
      
      {/* Pink particles (bow) */}
      <instancedMesh ref={pinkMeshRef} args={[undefined, undefined, pinkParticles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={new Color(0xff5c8d)}
          emissive={new Color(0xff5c8d).multiplyScalar(0.2)}
          roughness={0.2}
          metalness={0.3}
        />
      </instancedMesh>
    </>
  )
}

// Luxury Ornaments (larger, gold particles)
function LuxuryOrnaments({ count = 200 }: { count?: number }) {
  const meshRef = useRef<InstancedMesh>(null)
  const { progress, gestureInfluence } = useExperienceStore()
  
  const ornaments = useMemo(() => {
    const particles = generateHelloKittyParticles(count * 10)
    return particles.filter(p => p.isOrnament).slice(0, count)
  }, [count])
  
  const initialPositions = useMemo(() => 
    ornaments.map(o => o.position.clone()), 
    [ornaments]
  )
  
  const chaosPositions = useMemo(() => 
    ornaments.map(() => {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 5
      const height = (Math.random() - 0.5) * 8
      return new Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
    }), 
    [ornaments]
  )
  
  const ornamentMatrices = useMemo(() => 
    ornaments.map(() => new THREE.Matrix4()), 
    [ornaments]
  )
  
  useFrame3D((state) => {
    if (!meshRef.current) return
    
    const lerpSpeed = 0.05
    const currentProgress = progress
    
    ornaments.forEach((_, i) => {
      const initial = initialPositions[i]
      const chaos = chaosPositions[i]
      
      const targetPos = initial.clone().lerp(chaos, 1 - currentProgress)
      targetPos.x += gestureInfluence.x * 0.8
      targetPos.y += gestureInfluence.y * 0.8
      
      const currentPos = new Vector3()
      const tempMatrix = new THREE.Matrix4()
      meshRef.current!.getMatrixAt(i, tempMatrix)
      currentPos.setFromMatrixPosition(tempMatrix)
      
      const newPos = currentPos.clone().lerp(targetPos, lerpSpeed)
      
      // Add rotation for ornaments
      const rotation = state.clock.elapsedTime * 0.5 + i
      const quaternion = new THREE.Quaternion()
      quaternion.setFromEuler(new THREE.Euler(rotation, rotation * 0.7, rotation * 0.3))
      const scale = 0.12
      ornamentMatrices[i].compose(
        newPos,
        quaternion,
        new THREE.Vector3(scale, scale, scale)
      )
      
      meshRef.current!.setMatrixAt(i, ornamentMatrices[i])
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ornaments.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={new Color(0xf6d88c)}
        emissive={new Color(0xf6d88c).multiplyScalar(0.8)}
        roughness={0.1}
        metalness={0.9}
      />
    </instancedMesh>
  )
}

// Photo Gallery Frames
function PhotoGallery({ photoCount = 8 }: { photoCount?: number }) {
  const framesRef = useRef<Group>(null)
  
  const photos = useMemo(() => {
    return Array.from({ length: photoCount }, (_, i) => ({
      angle: (i / photoCount) * Math.PI * 2,
      radius: 4.5,
      height: (Math.random() - 0.5) * 2,
    }))
  }, [photoCount])
  
  useFrame3D((state) => {
    if (!framesRef.current) return
    
    const time = state.clock.elapsedTime
    framesRef.current.rotation.y = time * 0.1
    
    // Float animation
    photos.forEach((photo, i) => {
      const frame = framesRef.current!.children[i]
      if (frame) {
        frame.position.y = photo.height + Math.sin(time + i) * 0.3
      }
    })
  })
  
  return (
    <group ref={framesRef}>
      {photos.map((photo, i) => (
        <group
          key={i}
          position={[
            Math.cos(photo.angle) * photo.radius,
            photo.height,
            Math.sin(photo.angle) * photo.radius
          ]}
          rotation={[0, photo.angle + Math.PI / 2, 0]}
        >
          {/* Polaroid Frame */}
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.05]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
          {/* Photo Placeholder */}
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[1, 1.2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Photo Label */}
          <mesh position={[0, -0.65, 0.03]}>
            <planeGeometry args={[0.9, 0.2]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Camera Controller with Parallax
function CameraController() {
  const { camera } = useThree()
  const { gestureInfluence } = useExperienceStore()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  useFrame3D(() => {
    // Parallax camera movement
    const targetX = mousePos.x * 0.5 + gestureInfluence.x * 0.3
    const targetY = mousePos.y * 0.3 + gestureInfluence.y * 0.3
    
    camera.position.x += (targetX - camera.position.x) * 0.05
    camera.position.y += (targetY + 3 - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  })
  
  return null
}

// Lighting Setup
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#f6d88c" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#ff5c8d" />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#ffffff" />
    </>
  )
}

// Main 3D Scene Component
function HelloKittyScene() {
  return (
    <>
      <SceneLights />
      <CameraController />
      <FairyDustParticles count={5000} />
      <LuxuryOrnaments count={200} />
      <PhotoGallery photoCount={8} />
    </>
  )
}

// Hold to Unleash Button Component
function UnleashButton() {
  const [isHolding, setIsHolding] = useState(false)
  const { setTargetState } = useExperienceStore()
  
  const handleMouseDown = () => {
    setIsHolding(true)
    setTargetState('CHAOS')
  }
  
  const handleMouseUp = () => {
    setIsHolding(false)
    setTargetState('FORMED')
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsHolding(true)
    setTargetState('CHAOS')
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsHolding(false)
    setTargetState('FORMED')
  }
  
  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2
        px-12 py-6 rounded-full
        bg-gradient-to-r from-luxeGold via-yellow-400 to-luxeGold
        text-emeraldDeep font-display font-bold text-2xl
        shadow-2xl transition-all duration-300
        ${isHolding ? 'scale-95 shadow-glow' : 'scale-100 hover:scale-105'}
        active:scale-95
        z-50
      `}
      style={{
        boxShadow: isHolding 
          ? '0 0 40px rgba(246, 216, 140, 0.8), 0 0 80px rgba(246, 216, 140, 0.4)'
          : '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}
    >
      {isHolding ? 'UNLEASHING CHAOS...' : 'HOLD TO UNLEASH'}
    </button>
  )
}

// Progress Animation Hook
function ProgressAnimator() {
  const { targetProgress, setProgress, progress } = useExperienceStore()
  
  useFrame3D(() => {
    const diff = targetProgress - progress
    if (Math.abs(diff) > 0.001) {
      setProgress(progress + diff * 0.05)
    }
  })
  
  return null
}

// Main Component
export default function HelloKittyLuxuryCard() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-emeraldDeep">
      {/* Luxury UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="container mx-auto px-8 pt-12">
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-luxeGold via-yellow-300 to-luxeGold bg-clip-text text-transparent">
              Hello Kitty
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-luxeGold/80 font-body">
            Luxury Interactive Experience
          </p>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        <HelloKittyScene />
        <ProgressAnimator />
        
        {/* Post-Processing Effects */}
        <EffectComposer>
          <Bloom
            intensity={2.5}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            height={300}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      </Canvas>
      
      {/* Interactive Button */}
      <UnleashButton />
      
      {/* State Indicator */}
      <StateIndicator />
    </div>
  )
}

// State Indicator Component
function StateIndicator() {
  const { machineState, progress } = useExperienceStore()
  
  return (
    <div className="absolute top-8 right-8 z-40 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-sm rounded-lg px-6 py-4 border border-luxeGold/30">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${
            machineState === 'FORMED' ? 'bg-green-400' : 'bg-red-400'
          } animate-pulse`} />
          <div>
            <p className="text-luxeGold font-body text-sm font-semibold">
              {machineState}
            </p>
            <p className="text-white/60 text-xs">
              {Math.round(progress * 100)}% Formed
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
