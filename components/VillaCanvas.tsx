"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import type { VillaModel } from "@/lib/types";

function EstateModel({ accent }: { accent: string }) {
  return (
    <group position={[0, -0.4, 0]}>
      {/* main residence */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.2, 1.1, 1.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* glass facade */}
      <mesh position={[0, 0.55, 0.81]}>
        <boxGeometry args={[2.0, 0.8, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.55}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* pavilion roof */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <coneGeometry args={[1.9, 0.7, 4]} />
        <meshStandardMaterial
          color={accent}
          metalness={0.85}
          roughness={0.2}
          flatShading
        />
      </mesh>
      {/* terrace deck */}
      <mesh position={[0, 0.02, 1.7]}>
        <boxGeometry args={[2.6, 0.06, 1.4]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* infinity pool */}
      <mesh position={[0, 0.06, 1.75]}>
        <boxGeometry args={[2.2, 0.04, 1.0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.7}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      {/* palms */}
      {[-1.9, 1.9].map((x) => (
        <group key={x} position={[x, 0, 1.6]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 1.0, 8]} />
            <meshStandardMaterial color="#3f2d20" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <coneGeometry args={[0.45, 0.7, 6]} />
            <meshStandardMaterial
              color="#166534"
              roughness={0.8}
              flatShading
            />
          </mesh>
        </group>
      ))}
      {/* ground */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function OverwaterModel({ accent }: { accent: string }) {
  const water = useRef<Group>(null);
  useFrame((state) => {
    if (water.current) {
      water.current.position.y =
        -0.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
    }
  });
  return (
    <group position={[0, -0.4, 0]}>
      {/* lagoon */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial
          color="#0369a1"
          emissive="#0ea5e9"
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* stilts */}
      {[
        [-0.8, -0.6],
        [0.8, -0.6],
        [-0.8, 0.6],
        [0.8, 0.6],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.25, z]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#44403c" roughness={0.9} />
        </mesh>
      ))}
      {/* deck */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[2.4, 0.08, 2.0]} />
        <meshStandardMaterial color="#57534e" roughness={0.7} />
      </mesh>
      {/* hut */}
      <mesh position={[0, 1.25, -0.2]} castShadow>
        <boxGeometry args={[1.7, 1.2, 1.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* glass wall */}
      <mesh position={[0, 1.25, 0.46]}>
        <boxGeometry args={[1.5, 0.9, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* thatched roof */}
      <mesh position={[0, 2.15, -0.2]}>
        <coneGeometry args={[1.5, 0.8, 4]} />
        <meshStandardMaterial
          color={accent}
          metalness={0.4}
          roughness={0.6}
          flatShading
        />
      </mesh>
      {/* walkway */}
      <mesh position={[0, 0.62, 1.9]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.06, 2.4]} />
        <meshStandardMaterial color="#57534e" roughness={0.7} />
      </mesh>
      <group ref={water} />
    </group>
  );
}

function ChaletModel({ accent }: { accent: string }) {
  return (
    <group position={[0, -0.4, 0]}>
      {/* A-frame body */}
      <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.7, 1.6, 4]} />
        <meshStandardMaterial color="#292524" roughness={0.8} flatShading />
      </mesh>
      {/* warm window */}
      <mesh position={[0, 0.8, 1.02]}>
        <boxGeometry args={[0.9, 0.6, 0.03]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* chimney + glow */}
      <mesh position={[0.55, 1.35, -0.3]}>
        <cylinderGeometry args={[0.09, 0.09, 0.6, 8]} />
        <meshStandardMaterial color="#44403c" roughness={0.9} />
      </mesh>
      <pointLight position={[0.55, 1.85, -0.3]} intensity={4} color={accent} />
      {/* pines */}
      {[
        [-2.1, 0.4],
        [2.1, 0.6],
        [-1.6, -1.4],
        [1.8, -1.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.5, 6]} />
            <meshStandardMaterial color="#3f2d20" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <coneGeometry args={[0.4, 1.0, 7]} />
            <meshStandardMaterial
              color="#14532d"
              roughness={0.85}
              flatShading
            />
          </mesh>
        </group>
      ))}
      {/* snow ground */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
      </mesh>
    </group>
  );
}

function SceneModel({
  accent,
  model,
}: {
  accent: string;
  model: VillaModel;
}) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
  });
  return (
    <group ref={group}>
      {model === "estate" && <EstateModel accent={accent} />}
      {model === "overwater" && <OverwaterModel accent={accent} />}
      {model === "chalet" && <ChaletModel accent={accent} />}
    </group>
  );
}

/**
 * Procedural 3D villa preview rendered inside villa cards and detail pages.
 * Swap the model components for loaded GLTF scenes (drei useGLTF) once real
 * villa models are available.
 */
export default function VillaCanvas({
  accent,
  model = "estate",
  interactive = false,
}: {
  accent: string;
  model?: VillaModel;
  interactive?: boolean;
}) {
  const scene = (
    <>
      {interactive ? (
        <SceneModel accent={accent} model={model} />
      ) : (
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
          <SceneModel accent={accent} model={model} />
        </Float>
      )}
    </>
  );

  return (
    <Canvas
      shadows
      camera={{ position: [3.6, 2.6, 4.6], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 7, 4]} intensity={1.4} castShadow />
      <pointLight position={[-4, 3, -3]} intensity={12} color={accent} />
      {scene}
      {interactive && (
        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={9}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}
      <Sparkles
        count={60}
        scale={[7, 4, 7]}
        position={[0, 1.6, 0]}
        size={2.4}
        speed={0.25}
        color={accent}
      />
      <ContactShadows
        position={[0, -0.45, 0]}
        opacity={0.5}
        scale={10}
        blur={2.4}
        color="#000000"
      />
    </Canvas>
  );
}
