"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SpotLight } from "@react-three/drei";
import { BAY, HALL_H, HALL_W, type HallTheme } from "./hallThemes";

// Procedural era props placed on the girder rhythm along both walls. All
// geometry is three.js primitives (no assets), materials are memoized and
// shared across instances, and nothing here casts shadows - the props dress
// the hall without touching the perf budget.

type Placement = { x: number; z: number; side: 1 | -1 };

function placements(zFar: number, perBay: 1 | 2, lowPerf: boolean): Placement[] {
  const zNear = 3;
  const out: Placement[] = [];
  let i = 0;
  for (let z = zNear - 0.4 - BAY / 2; z > zFar + 1; z -= BAY) {
    if (lowPerf && i % 2 === 1) {
      i++;
      continue;
    }
    if (perBay === 2) {
      out.push({ x: HALL_W / 2 - 0.62, z, side: 1 });
      out.push({ x: -(HALL_W / 2 - 0.62), z, side: -1 });
    } else {
      const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
      out.push({ x: side * 1.7, z, side });
    }
    i++;
  }
  return out;
}

function DecoArch({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh material={mat} position={[0, 0.55, 0]}>
        <boxGeometry args={[1.0, 1.1, 0.5]} />
      </mesh>
      <mesh material={mat} position={[0, 1.5, 0]}>
        <boxGeometry args={[0.75, 0.8, 0.42]} />
      </mesh>
      <mesh material={mat} position={[0, 2.2, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.35]} />
      </mesh>
    </group>
  );
}

function ChromeOrb({ pedestal, chrome }: { pedestal: THREE.Material; chrome: THREE.Material }) {
  return (
    <group>
      <mesh material={pedestal} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 1.1, 12]} />
      </mesh>
      <mesh material={chrome} position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.3, 24, 16]} />
      </mesh>
    </group>
  );
}

function ConcretePillar({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh material={mat} position={[0, 1.2, 0]}>
        <boxGeometry args={[0.55, 2.4, 0.55]} />
      </mesh>
      <mesh material={mat} position={[0, 2.48, 0]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.7]} />
      </mesh>
    </group>
  );
}

function SteelPanel({ mat, side }: { mat: THREE.Material; side: 1 | -1 }) {
  return (
    <mesh material={mat} position={[0, 1.3, 0]} rotation={[0, 0, side * 0.1]}>
      <boxGeometry args={[0.08, 2.6, 1.3]} />
    </mesh>
  );
}

function ToonFrame({ body, glow }: { body: THREE.Material; glow: THREE.Material }) {
  return (
    <group>
      <mesh material={body} position={[0, 1.1, 0]}>
        <boxGeometry args={[0.9, 2.2, 0.14]} />
      </mesh>
      {[0.55, 1.15, 1.75].map((y, i) => (
        <mesh key={i} material={glow} position={[i % 2 === 0 ? -0.18 : 0.2, y, 0.08]}>
          <planeGeometry args={[0.16, 0.24]} />
        </mesh>
      ))}
    </group>
  );
}

function NeonStrip({ base, neon }: { base: THREE.Material; neon: THREE.Material }) {
  return (
    <group>
      <mesh material={base} position={[0, 0.12, 0]}>
        <boxGeometry args={[0.16, 0.24, 0.16]} />
      </mesh>
      <mesh material={neon} position={[0, 1.55, 0]}>
        <boxGeometry args={[0.06, 2.9, 0.06]} />
      </mesh>
    </group>
  );
}

function ProjectorCone({
  p,
  lowPerf,
  housing
}: {
  p: Placement;
  lowPerf: boolean;
  housing: THREE.Material;
}) {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, -(HALL_H - 0.5), 0.4);
    return o;
  }, []);
  return (
    <group position={[p.x, HALL_H - 0.3, p.z]}>
      <mesh material={housing}>
        <boxGeometry args={[0.26, 0.22, 0.26]} />
      </mesh>
      <primitive object={target} />
      {lowPerf ? (
        <spotLight
          target={target}
          angle={0.32}
          penumbra={0.7}
          intensity={26}
          distance={10}
          color="#9fc8ff"
        />
      ) : (
        <SpotLight
          target={target}
          angle={0.3}
          penumbra={0.8}
          distance={9}
          intensity={60}
          attenuation={5.5}
          anglePower={6}
          color="#9fc8ff"
        />
      )}
    </group>
  );
}

export default function HallProps({
  theme,
  zFar,
  lowPerf
}: {
  theme: HallTheme;
  zFar: number;
  lowPerf: boolean;
}) {
  const spots = useMemo(
    () => placements(zFar, theme.props.perBay, lowPerf),
    [zFar, theme.props.perBay, lowPerf]
  );

  const mats = useMemo(() => {
    const brass = new THREE.MeshStandardMaterial({
      color: "#7a5f2a",
      metalness: 0.8,
      roughness: 0.35
    });
    const pedestal = new THREE.MeshStandardMaterial({
      color: "#3a4250",
      metalness: 0.7,
      roughness: 0.4
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: "#cfd8e5",
      metalness: 1,
      roughness: 0.12
    });
    const concrete = new THREE.MeshStandardMaterial({
      color: "#57504a",
      metalness: 0,
      roughness: 1
    });
    const steel = new THREE.MeshStandardMaterial({
      color: "#262c34",
      metalness: 0.9,
      roughness: 0.3
    });
    const toonBody = new THREE.MeshStandardMaterial({
      color: "#1a1226",
      metalness: 0.1,
      roughness: 0.9
    });
    const toonGlow = new THREE.MeshStandardMaterial({
      color: "#2a2008",
      emissive: "#f0c040",
      emissiveIntensity: 1.3,
      toneMapped: false
    });
    const neon = new THREE.MeshStandardMaterial({
      color: theme.trim.stripCore,
      emissive: theme.trim.stripEmissive,
      emissiveIntensity: 2.2,
      toneMapped: false
    });
    const housing = new THREE.MeshStandardMaterial({
      color: "#20242c",
      metalness: 0.85,
      roughness: 0.35
    });
    return { brass, pedestal, chrome, concrete, steel, toonBody, toonGlow, neon, housing };
  }, [theme.trim.stripCore, theme.trim.stripEmissive]);

  const v = theme.props.variant;
  if (v === "none") return null;

  return (
    <group>
      {spots.map((p, i) => {
        if (v === "projector-cones") {
          return <ProjectorCone key={i} p={p} lowPerf={lowPerf} housing={mats.housing} />;
        }
        return (
          <group key={i} position={[p.x, 0, p.z]}>
            {v === "deco-arches" && <DecoArch mat={mats.brass} />}
            {v === "chrome-orbs" && <ChromeOrb pedestal={mats.pedestal} chrome={mats.chrome} />}
            {v === "concrete-pillars" && <ConcretePillar mat={mats.concrete} />}
            {v === "steel-panels" && <SteelPanel mat={mats.steel} side={p.side} />}
            {v === "toon-frames" && <ToonFrame body={mats.toonBody} glow={mats.toonGlow} />}
            {v === "neon-strips" && <NeonStrip base={mats.housing} neon={mats.neon} />}
          </group>
        );
      })}
    </group>
  );
}
