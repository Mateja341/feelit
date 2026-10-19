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

/* Shared material palettes tuned to the violet theme */
const bodyMat = {
  color: "#141632",
  metalness: 0.85,
  roughness: 0.22,
};
const deckMat = {
  color: "#23274a",
  metalness: 0.6,
  roughness: 0.35,
};

function GlowPanel({
  accent,
  args,
  position,
}: {
  accent: string;
  args: [number, number, number];
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={accent}
        emissive={accent}
        emissiveIntensity={0.45}
        metalness={0.95}
        roughness={0.05}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function Pedestal() {
  return (
    <mesh position={[0, -0.62, 0]}>
      <cylinderGeometry args={[3.4, 3.8, 0.22, 48]} />
      <meshStandardMaterial
        color="#1a0f35"
        metalness={0.9}
        roughness={0.2}
        emissive="#2d1552"
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

function EstateModel({ accent }: { accent: string }) {
  return (
    <group position={[0, -0.4, 0]}>
      {/* main residence — two stacked volumes */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.2, 1.0, 1.5]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[-0.25, 1.25, -0.15]} castShadow>
        <boxGeometry args={[1.6, 0.55, 1.2]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      {/* full-height glass facade */}
      <GlowPanel accent={accent} args={[1.9, 0.85, 0.03]} position={[0, 0.5, 0.76]} />
      <GlowPanel accent={accent} args={[1.3, 0.35, 0.03]} position={[-0.25, 1.25, 0.47]} />
      {/* cantilevered flat roof with lit edge */}
      <mesh position={[-0.25, 1.58, -0.15]} castShadow>
        <boxGeometry args={[1.9, 0.08, 1.45]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      <GlowPanel accent={accent} args={[1.9, 0.02, 0.05]} position={[-0.25, 1.53, 0.58]} />
      {/* columns */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.7]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 10]} />
          <meshStandardMaterial {...deckMat} />
        </mesh>
      ))}
      {/* terrace deck */}
      <mesh position={[0, 0.02, 1.7]}>
        <boxGeometry args={[2.6, 0.06, 1.4]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      {/* infinity pool */}
      <mesh position={[0, 0.06, 1.75]}>
        <boxGeometry args={[2.2, 0.04, 1.0]} />
        <meshStandardMaterial
          color="#7dd3fc"
          emissive="#a855f7"
          emissiveIntensity={0.55}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      {/* sculpted palms */}
      {[-1.9, 1.9].map((x) => (
        <group key={x} position={[x, 0, 1.6]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 1.0, 8]} />
            <meshStandardMaterial color="#3f2d20" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <coneGeometry args={[0.45, 0.7, 6]} />
            <meshStandardMaterial
              color="#1f3d2b"
              roughness={0.8}
              flatShading
            />
          </mesh>
        </group>
      ))}
      <Pedestal />
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
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial
          color="#1e1b4b"
          emissive="#6e3aff"
          emissiveIntensity={0.3}
          metalness={0.9}
          roughness={0.12}
        />
      </mesh>
      {/* stilts */}
      {[
        [-0.8, -0.6],
        [0.8, -0.6],
        [-0.8, 0.6],
        [0.8, 0.6],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
          <meshStandardMaterial color="#2a2438" roughness={0.85} />
        </mesh>
      ))}
      {/* deck */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[2.4, 0.08, 2.0]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      {/* villa body */}
      <mesh position={[0, 1.2, -0.2]} castShadow>
        <boxGeometry args={[1.7, 1.15, 1.3]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      {/* glowing glass wall */}
      <GlowPanel accent={accent} args={[1.5, 0.85, 0.03]} position={[0, 1.2, 0.47]} />
      {/* flat roof with lit edge */}
      <mesh position={[0, 1.86, -0.2]}>
        <boxGeometry args={[2.0, 0.08, 1.6]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      <GlowPanel accent={accent} args={[2.0, 0.02, 0.05]} position={[0, 1.81, 0.62]} />
      {/* walkway */}
      <mesh position={[0, 0.58, 1.9]}>
        <boxGeometry args={[0.8, 0.06, 2.4]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      <group ref={water} />
      <Pedestal />
    </group>
  );
}

function ChaletModel({ accent }: { accent: string }) {
  return (
    <group position={[0, -0.4, 0]}>
      {/* A-frame body */}
      <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.7, 1.55, 4]} />
        <meshStandardMaterial
          color="#1c1830"
          roughness={0.75}
          metalness={0.4}
          flatShading
        />
      </mesh>
      {/* warm glowing window band */}
      <GlowPanel accent={accent} args={[0.95, 0.55, 0.03]} position={[0, 0.78, 1.03]} />
      {/* chimney + glow */}
      <mesh position={[0.55, 1.3, -0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#2a2438" roughness={0.9} />
      </mesh>
      <pointLight position={[0.55, 1.8, -0.3]} intensity={4} color={accent} />
      {/* pines */}
      {[
        [-2.1, 0.4],
        [2.1, 0.6],
        [-1.6, -1.4],
        [1.8, -1.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.45, 6]} />
            <meshStandardMaterial color="#3f2d20" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.4, 0.95, 7]} />
            <meshStandardMaterial
              color="#16321f"
              roughness={0.85}
              flatShading
            />
          </mesh>
        </group>
      ))}
      {/* snow ground */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial color="#c7cbe0" roughness={0.95} />
      </mesh>
      <Pedestal />
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
 * Procedural 3D villa preview rendered inside listing cards and detail pages.
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
  return (
    <Canvas
      shadows
      camera={{ position: [3.6, 2.6, 4.6], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 7, 4]} intensity={1.1} castShadow />
      <pointLight position={[-4, 3, -3]} intensity={14} color={accent} />
      <pointLight position={[4, 2, 4]} intensity={6} color="#c084fc" />
      {interactive ? (
        <SceneModel accent={accent} model={model} />
      ) : (
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
          <SceneModel accent={accent} model={model} />
        </Float>
      )}
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
        position={[0, -0.55, 0]}
        opacity={0.55}
        scale={10}
        blur={2.4}
        color="#000000"
      />
    </Canvas>
  );
}
