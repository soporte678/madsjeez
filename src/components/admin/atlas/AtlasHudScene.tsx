"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Mesh } from "three";

function ArcCore() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35;
      ref.current.rotation.x += delta * 0.08;
    }
  });
  return (
    <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.88} />
      </mesh>
    </Float>
  );
}

function OrbitRing({ radius, speed, opacity }: { radius: number; speed: number; opacity: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * speed;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.2, 0.3, 0]}>
      <torusGeometry args={[radius, 0.018, 12, 80]} />
      <meshBasicMaterial color="#0088ff" transparent opacity={opacity} />
    </mesh>
  );
}

function InnerGlow() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.2;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.25} />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.4, 0.008, 8, 120]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.2} />
    </mesh>
  );
}

export function AtlasHudScene() {
  return (
    <div className="atlas-hud-scene-wrap" aria-hidden>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#00e5ff" />
        <pointLight position={[-3, -2, 2]} intensity={0.4} color="#0088ff" />
        <InnerGlow />
        <ArcCore />
        <OrbitRing radius={1.65} speed={0.6} opacity={0.55} />
        <OrbitRing radius={2.05} speed={-0.35} opacity={0.35} />
        <Particles />
      </Canvas>
    </div>
  );
}
