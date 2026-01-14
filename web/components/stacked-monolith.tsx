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
  delay = 0
}: {
  position: [number, number, number];
  floatSpeed: number;
  hovered: boolean;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation animation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.05;

      // Slight scale pulse on hover
      const scale = hovered ? 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.02 : 1;
      groupRef.current.scale.setScalar(scale);
    }

    // Edge glow pulsing
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (hovered) {
        material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.3;
      } else {
        material.emissiveIntensity = THREE.MathUtils.lerp(
          material.emissiveIntensity,
          0.2,
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
            emissive="#00FF85"
            emissiveIntensity={0.2}
            clearcoat={1}
            clearcoatRoughness={0.03}
            transparent
            opacity={0.85}
            envMapIntensity={0.8}
          />
        </RoundedBox>

        {/* Edge highlights */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(3.2, 0.5, 2)]} />
          <lineBasicMaterial color="#00FF85" opacity={0.4} transparent />
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

      {/* Rim lights */}
      <spotLight position={[0, 0, 5]} angle={0.5} penumbra={1} intensity={0.6} color="#00FF85" />
      <spotLight position={[0, 0, -5]} angle={0.5} penumbra={1} intensity={0.3} color="#00FF85" />

      {/* Three stacked slabs */}
      <Slab position={[0, 1.2, 0]} floatSpeed={1.2} hovered={hovered} delay={0} />

      {/* Middle slab with internal light */}
      <group>
        <Slab position={[0, 0, 0]} floatSpeed={1.5} hovered={hovered} delay={0.5} />
        <InternalLight hovered={hovered} />
      </group>

      <Slab position={[0, -1.2, 0]} floatSpeed={1.8} hovered={hovered} delay={1} />
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
    <div className="relative h-[400px] w-full md:h-[500px]">
      {/* Corner brackets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute left-0 top-0 z-10"
      >
        <div className="h-0.5 w-16 bg-gradient-to-r from-primary to-transparent" />
        <div className="h-16 w-0.5 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="pointer-events-none absolute right-0 top-0 z-10"
      >
        <div className="ml-auto h-0.5 w-16 bg-gradient-to-l from-primary to-transparent" />
        <div className="ml-auto h-16 w-0.5 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="pointer-events-none absolute bottom-0 left-0 z-10"
      >
        <div className="h-16 w-0.5 bg-gradient-to-t from-primary to-transparent" />
        <div className="h-0.5 w-16 bg-gradient-to-r from-primary to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="pointer-events-none absolute bottom-0 right-0 z-10"
      >
        <div className="ml-auto h-16 w-0.5 bg-gradient-to-t from-primary to-transparent" />
        <div className="ml-auto h-0.5 w-16 bg-gradient-to-l from-primary to-transparent" />
      </motion.div>

      {/* Animated border */}
      <motion.div
        animate={{
          opacity: hovered ? [0.3, 0.6, 0.3] : 0.2,
          scale: hovered ? [1, 1.02, 1] : 1
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute inset-0 border border-primary/20"
      />

      {/* Scan lines effect */}
      <motion.div
        animate={{
          y: hovered ? ["-100%", "100%"] : 0,
          opacity: hovered ? [0, 0.3, 0] : 0
        }}
        transition={{
          duration: 2,
          repeat: hovered ? Infinity : 0,
          ease: "linear"
        }}
        className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent"
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: hovered ? [0, 0.6, 0] : [0, 0.3, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
        />
      ))}

      {/* Data readout text */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] text-primary/60"
      >
        SYSTEM_STATUS: ACTIVE
        <br />
        PROTOCOL: ZK-VERIFY
        <br />
        NETWORK: DECENTRALIZED
      </motion.div>

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
