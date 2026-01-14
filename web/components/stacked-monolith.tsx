'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function Slab({
  position,
  floatSpeed,
  hovered,
  delay = 0,
  slabType = 'default'
}: {
  position: [number, number, number];
  floatSpeed: number;
  hovered: boolean;
  delay?: number;
  slabType?: 'zk' | 'tee' | 'private' | 'default';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Different color schemes for each slab type
  const slabConfig = {
    zk: {
      emissive: '#00FF85',
      edgeColor: '#00FF85',
      particleColor: '#00FF85',
    },
    tee: {
      emissive: '#FFD700',
      edgeColor: '#FFD700',
      particleColor: '#FFD700',
    },
    private: {
      emissive: '#00D4FF',
      edgeColor: '#00D4FF',
      particleColor: '#00D4FF',
    },
    default: {
      emissive: '#00FF85',
      edgeColor: '#00FF85',
      particleColor: '#00FF85',
    }
  };

  const config = slabConfig[slabType];

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation animation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.05;

      // Slight scale pulse on hover
      const scale = hovered ? 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.02 : 1;
      groupRef.current.scale.setScalar(scale);
    }

    // Edge glow pulsing (reduced brightness on hover)
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (hovered) {
        material.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.2;
      } else {
        material.emissiveIntensity = THREE.MathUtils.lerp(
          material.emissiveIntensity,
          0.25,
          0.1
        );
      }
    }
  });

  return (
    <Float
      speed={floatSpeed}
      rotationIntensity={0.08}
      floatIntensity={0.4}
      floatingRange={[-0.2, 0.2]}
    >
      <group ref={groupRef} position={position}>
        <RoundedBox
          ref={meshRef}
          args={[3.2, 0.5, 2]}
          radius={0.08}
          smoothness={4}
        >
          <meshPhysicalMaterial
            color="#0A0A0A"
            roughness={0.2}
            metalness={0.3}
            transmission={0.92}
            thickness={0.8}
            emissive={config.emissive}
            emissiveIntensity={0.25}
            clearcoat={1}
            clearcoatRoughness={0.03}
            transparent
            opacity={0.85}
            envMapIntensity={0.8}
          />
        </RoundedBox>

        {/* Edge highlights with unique colors */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(3.2, 0.5, 2)]} />
          <lineBasicMaterial color={config.edgeColor} opacity={0.5} transparent />
        </lineSegments>
      </group>
    </Float>
  );
}

function InternalLight({ hovered }: { hovered: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      if (hovered) {
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 1 + 3;
        lightRef.current.intensity = pulse;
      } else {
        lightRef.current.intensity = THREE.MathUtils.lerp(
          lightRef.current.intensity,
          1.5,
          0.05
        );
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      color="#00FF85"
      intensity={1.5}
      distance={6}
      decay={1.5}
    />
  );
}

function MonolithScene({ hovered }: { hovered: boolean }) {
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#00FF85" />

      {/* Rim lights with different colors */}
      <spotLight position={[0, 2, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#00FF85" />
      <spotLight position={[0, 0, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#00D9FF" />
      <spotLight position={[0, -2, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#FF00E5" />
      <spotLight position={[0, 0, -5]} angle={0.5} penumbra={1} intensity={0.3} color="#00FF85" />

      {/* Three stacked slabs - each representing a concept */}
      {/* Top: TEE (Trusted Execution Environment) - Gold */}
      <Slab
        position={[0, 1.2, 0]}
        floatSpeed={1.2}
        hovered={hovered}
        delay={0}
        slabType="tee"
      />

      {/* Middle: ZK (Zero-Knowledge) - Mint green with internal light */}
      <group>
        <Slab
          position={[0, 0, 0]}
          floatSpeed={1.5}
          hovered={hovered}
          delay={0.5}
          slabType="zk"
        />
        <InternalLight hovered={hovered} />
      </group>

      {/* Bottom: Private Data - Purple */}
      <Slab
        position={[0, -1.2, 0]}
        floatSpeed={1.8}
        hovered={hovered}
        delay={1}
        slabType="private"
      />
    </>
  );
}

export function StackedMonolith() {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className="relative h-[400px] w-full md:h-[500px] flex items-center">
      {/* Left side labels */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 flex flex-col justify-around py-12 z-10">
        {/* TEE Label */}
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="pointer-events-none font-mono text-xs md:text-sm font-bold uppercase tracking-wider"
          style={{
            color: '#FFD700',
            textShadow: `0 0 20px #FFD700, 0 0 40px #FFD70080`,
          }}
        >
          TEE
        </motion.div>

        {/* ZK Label */}
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
          }}
          className="pointer-events-none font-mono text-xs md:text-sm font-bold uppercase tracking-wider"
          style={{
            color: '#00FF85',
            textShadow: `0 0 20px #00FF85, 0 0 40px #00FF8580`,
          }}
        >
          ZK
        </motion.div>

        {/* DATA Label */}
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.4 },
          }}
          className="pointer-events-none font-mono text-xs md:text-sm font-bold uppercase tracking-wider"
          style={{
            color: '#00D4FF',
            textShadow: `0 0 20px #00D4FF, 0 0 40px #00D4FF80`,
          }}
        >
          DATA
        </motion.div>
      </div>

      {/* Right side descriptions - only on hover */}
      <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 lg:w-64 flex flex-col justify-around py-12 z-10">
        {/* TEE Description */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: hovered ? 1 : 0,
            x: hovered ? 0 : 20,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
          className="pointer-events-none relative"
        >
          {/* Flowing dots */}
          {hovered && [...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                backgroundColor: '#FFD700',
                boxShadow: `0 0 8px #FFD700`,
                left: -40,
                top: '50%',
              }}
              animate={{
                x: [0, 30],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}

          <div className="font-mono text-[9px] md:text-[10px] lg:text-xs uppercase tracking-widest" style={{
            color: '#FFD700',
            textShadow: `0 0 10px #FFD700, 0 0 20px #FFD70030`,
          }}>
            TRUSTED EXECUTION
          </div>
        </motion.div>

        {/* ZK Description */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: hovered ? 1 : 0,
            x: hovered ? 0 : 20,
          }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: "easeOut"
          }}
          className="pointer-events-none relative"
        >
          {/* Binary stream */}
          {hovered && [...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute font-mono text-[8px]"
              style={{
                color: '#00FF85',
                opacity: 0.6,
                left: -50 + i * 10,
                top: '50%',
              }}
              animate={{
                opacity: [0, 0.8, 0],
                y: [0, -15, -30],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeOut"
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </motion.div>
          ))}

          <div className="font-mono text-[9px] md:text-[10px] lg:text-xs uppercase tracking-widest" style={{
            color: '#00FF85',
            textShadow: `0 0 10px #00FF85, 0 0 20px #00FF8530`,
          }}>
            ZERO-KNOWLEDGE
          </div>
        </motion.div>

        {/* DATA Description */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: hovered ? 1 : 0,
            x: hovered ? 0 : 20,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeOut"
          }}
          className="pointer-events-none relative"
        >
          {/* Encryption particles */}
          {hovered && [...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-sm"
              style={{
                backgroundColor: '#00D4FF',
                boxShadow: `0 0 6px #00D4FF`,
                left: -45 + i * 8,
                top: '50%',
              }}
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}

          <div className="font-mono text-[9px] md:text-[10px] lg:text-xs uppercase tracking-widest" style={{
            color: '#00D4FF',
            textShadow: `0 0 10px #00D4FF, 0 0 20px #00D4FF30`,
          }}>
            PRIVATE DATA
          </div>
        </motion.div>
      </div>

      {/* Center 3D Canvas area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Floating particles - different colors for each layer - always animating */}
        {[...Array(12)].map((_, i) => {
          const colorIndex = i % 3;
          const colors = ['#FFD700', '#00FF85', '#00D4FF']; // TEE, ZK, Data
          const color = colors[colorIndex];

          return (
            <motion.div
              key={i}
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 40 - 20, 0],
                opacity: [0, 0.5, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut"
              }}
              className="pointer-events-none absolute h-1 w-1 rounded-full"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
          );
        })}
      </div>

      {/* Canvas container */}
      <div
        className="h-full w-full cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Canvas
          camera={{
            position: isMobile ? [0, 0, 7] : [0, 0, 6.5],
            fov: isMobile ? 38 : 42
          }}
          gl={{
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3
          }}
          dpr={[1, 2]}
          performance={{ min: 0.5 }}
        >
          <MonolithScene hovered={hovered} />
        </Canvas>
      </div>
    </div>
  );
}
