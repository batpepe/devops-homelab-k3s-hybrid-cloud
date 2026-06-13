"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PointerLockControls,
  MeshReflectorMaterial,
  SpotLight,
  useTexture,
  Sparkles
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Era, Item } from "@/lib/types";
import { imgSrc } from "@/lib/img";

const HALL_W = 11;
const HALL_H = 6;
const BAY = 5.2;
const EYE = 1.7;
// Cinematic postprocessing grade (bloom + vignette; tone mapping stays on the renderer).
const POSTFX = true;
// Establishing 3/4 camera for validation screenshots (disables walk controls).
const DEBUG_CAM = false;

type Slot = { x: number; z: number; side: 1 | -1 };

function buildSlots(n: number): { slots: Slot[]; zFar: number } {
  const slots: Slot[] = [];
  for (let i = 0; i < n; i++) {
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const along = Math.floor(i / 2);
    slots.push({ x: side * (HALL_W / 2 - 0.1), z: -(along + 1) * BAY, side });
  }
  const lastZ = slots.length ? Math.min(...slots.map((s) => s.z)) : -BAY;
  return { slots, zFar: lastZ - BAY };
}

// Procedural micro-relief normal map so rock walls and the wet floor catch the
// spotlights without shipping any texture assets.
function makeNoiseNormal(): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 128 + (Math.random() * 2 - 1) * 55;
    data[i * 4 + 1] = 128 + (Math.random() * 2 - 1) * 55;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.needsUpdate = true;
  return tex;
}

function ExhibitFrame({
  item,
  slot,
  onSelect,
  register
}: {
  item: Item;
  slot: Slot;
  onSelect: (i: Item) => void;
  register: (mesh: THREE.Object3D | null, item: Item) => void;
}) {
  const tex = useTexture(imgSrc(item.imageUrl));
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);

  const img = tex.image as HTMLImageElement | undefined;
  const ar = img && img.height ? img.width / img.height : 0.7;
  const h = 2.7;
  const w = Math.min(h * ar, HALL_W * 0.42);
  const rotY = slot.side === 1 ? -Math.PI / 2 : Math.PI / 2;
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, -0.2, 0.1);
    return o;
  }, []);

  return (
    <group position={[slot.x, 2.6, slot.z]} rotation={[0, rotY, 0]}>
      {/* matte wall plate behind the art */}
      <mesh position={[0, 0, -0.08]} receiveShadow>
        <boxGeometry args={[w + 0.6, h + 0.6, 0.1]} />
        <meshStandardMaterial color="#070a10" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* brushed metal frame */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[w + 0.26, h + 0.26, 0.1]} />
        <meshStandardMaterial color="#20242c" roughness={0.35} metalness={0.85} />
      </mesh>
      {/* the artwork */}
      <mesh
        ref={(m) => register(m, item)}
        position={[0, 0, 0.04]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={tex}
          roughness={0.55}
          metalness={0}
          emissiveMap={tex}
          emissive={"#ffffff"}
          emissiveIntensity={0.22}
        />
      </mesh>
      <primitive object={target} />
      <SpotLight
        position={[0, 2.5, 2.0]}
        target={target}
        angle={0.6}
        penumbra={1}
        distance={9}
        intensity={110}
        attenuation={6}
        anglePower={5}
        color="#ffe6b8"
        castShadow
        shadow-bias={-0.0005}
      />
    </group>
  );
}

function Room({
  zFar,
  accent,
  noise
}: {
  zFar: number;
  accent: string;
  noise: THREE.Texture;
}) {
  const zNear = 3;
  const centerZ = (zNear + zFar) / 2;
  const lengthZ = zNear - zFar;
  const girderZs: number[] = [];
  for (let z = zNear - 0.4; z > zFar; z -= BAY) girderZs.push(z);

  return (
    <group>
      {/* wet reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]} receiveShadow>
        <planeGeometry args={[HALL_W, lengthZ]} />
        <MeshReflectorMaterial
          resolution={1024}
          mixBlur={1.2}
          mixStrength={4}
          blur={[300, 90]}
          roughness={0.82}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#070809"
          metalness={0.75}
          mirror={0.5}
          normalMap={noise}
          normalScale={[0.18, 0.18]}
        />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL_H, centerZ]}>
        <planeGeometry args={[HALL_W, lengthZ]} />
        <meshStandardMaterial color="#05070c" roughness={1} metalness={0} />
      </mesh>
      {/* side walls */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          rotation={[0, -s * (Math.PI / 2), 0]}
          position={[(s * HALL_W) / 2, HALL_H / 2, centerZ]}
          receiveShadow
        >
          <planeGeometry args={[lengthZ, HALL_H]} />
          <meshStandardMaterial
            color="#14161b"
            roughness={1}
            metalness={0.05}
            normalMap={noise}
            normalScale={[0.7, 0.7]}
          />
        </mesh>
      ))}
      {/* riveted steel girders + ceiling trusses every bay */}
      {girderZs.map((z, i) => (
        <group key={i}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (HALL_W / 2 - 0.16), HALL_H / 2, z]} castShadow>
              <boxGeometry args={[0.28, HALL_H, 0.5]} />
              <meshStandardMaterial color="#3a4250" roughness={0.38} metalness={0.92} />
            </mesh>
          ))}
          <mesh position={[0, HALL_H - 0.25, z]} castShadow>
            <boxGeometry args={[HALL_W, 0.3, 0.45]} />
            <meshStandardMaterial color="#2a3038" roughness={0.42} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* cold floor strip lighting along each wall (Batcave tech glow) */}
      {[-1, 1].map((s) => (
        <mesh key={`strip${s}`} position={[s * (HALL_W / 2 - 0.14), 0.12, centerZ]}>
          <boxGeometry args={[0.06, 0.1, lengthZ]} />
          <meshStandardMaterial color="#0a2a33" emissive="#58d5f0" emissiveIntensity={1.7} toneMapped={false} />
        </mesh>
      ))}
      {/* far wall: the Batcomputer */}
      <mesh position={[0, HALL_H / 2, zFar]} receiveShadow>
        <planeGeometry args={[HALL_W, HALL_H]} />
        <meshStandardMaterial
          color="#0b0f15"
          roughness={1}
          metalness={0.08}
          normalMap={noise}
          normalScale={[0.5, 0.5]}
        />
      </mesh>
      <group position={[0, HALL_H / 2, zFar + 0.07]}>
        <mesh>
          <planeGeometry args={[6.2, 3]} />
          <meshStandardMaterial color="#08171e" emissive="#58d5f0" emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
        {/* per-era accent status bar */}
        <mesh position={[0, -1.65, 0.02]}>
          <planeGeometry args={[6.2, 0.16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>
      {/* back wall behind spawn */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, HALL_H / 2, zNear]}>
        <planeGeometry args={[HALL_W, HALL_H]} />
        <meshStandardMaterial
          color="#14161b"
          roughness={1}
          metalness={0.05}
          normalMap={noise}
          normalScale={[0.7, 0.7]}
        />
      </mesh>
    </group>
  );
}

function Player({
  bounds,
  meshes,
  onSelect,
  zFar
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  meshes: React.RefObject<{ mesh: THREE.Object3D; item: Item }[]>;
  onSelect: (i: Item) => void;
  zFar: number;
}) {
  const { camera, gl } = useThree();

  // Spawn near the entrance, off-centre and angled down the hall so the first
  // frame already reveals a row of lit exhibits and the cyan strips.
  useEffect(() => {
    camera.position.set(-3.1, EYE, 2.2);
    camera.lookAt(2.6, 1.5, zFar * 0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const keys = useRef<Record<string, boolean>>({});
  const lockRef = useRef<{ isLocked: boolean } | null>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const front = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const d = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, []);

  // Click while pointer-locked: raycast from screen center onto exhibits.
  useEffect(() => {
    const onClick = () => {
      if (!lockRef.current?.isLocked) return;
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const list = meshes.current ?? [];
      const hit = ray.intersectObjects(list.map((m) => m.mesh), false)[0];
      if (hit) {
        const found = list.find((m) => m.mesh === hit.object);
        if (found) onSelect(found.item);
      }
    };
    const el = gl.domElement;
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [camera, gl, meshes, onSelect, ray]);

  useFrame((_, dt) => {
    const speed = 3.4 * Math.min(dt, 0.05);
    camera.getWorldDirection(front);
    front.y = 0;
    front.normalize();
    side.crossVectors(front, camera.up).normalize();
    move.set(0, 0, 0);
    const k = keys.current;
    if (k["KeyW"] || k["ArrowUp"]) move.add(front);
    if (k["KeyS"] || k["ArrowDown"]) move.sub(front);
    if (k["KeyD"] || k["ArrowRight"]) move.add(side);
    if (k["KeyA"] || k["ArrowLeft"]) move.sub(side);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.add(move);
    }
    camera.position.y = EYE;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, bounds.minX, bounds.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, bounds.minZ, bounds.maxZ);
  });

  return <PointerLockControls ref={lockRef as never} />;
}

function CameraRig({ zFar }: { zFar: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(4.2, 3.2, 5);
    camera.lookAt(0, 1.8, zFar / 2);
  }, [camera, zFar]);
  return null;
}

function Scene({
  era,
  exhibits,
  onSelect
}: {
  era: Era;
  exhibits: Item[];
  onSelect: (i: Item) => void;
}) {
  const { slots, zFar } = useMemo(() => buildSlots(exhibits.length), [exhibits.length]);
  const noise = useMemo(() => makeNoiseNormal(), []);
  const meshes = useRef<{ mesh: THREE.Object3D; item: Item }[]>([]);
  const register = (mesh: THREE.Object3D | null, item: Item) => {
    if (!mesh) return;
    if (!meshes.current.find((m) => m.item.slug === item.slug)) {
      meshes.current.push({ mesh, item });
    }
  };

  const bounds = {
    minX: -(HALL_W / 2 - 0.7),
    maxX: HALL_W / 2 - 0.7,
    minZ: zFar + 0.9,
    maxZ: 2.2
  };

  return (
    <>
      <color attach="background" args={["#04060a"]} />
      <fogExp2 attach="fog" args={["#06090f", 0.034]} />

      {/* cold steel-blue cave ambience against warm exhibit pools */}
      <ambientLight intensity={0.34} color="#6f86a8" />
      <hemisphereLight args={["#33506e", "#04060a", 0.35]} />
      {/* cold rims raking down both walls to reveal the cave structure */}
      <spotLight position={[-HALL_W / 2, HALL_H - 0.4, 0]} angle={0.95} penumbra={1} intensity={55} distance={20} color="#3fa9d6" />
      <spotLight position={[HALL_W / 2, HALL_H - 0.4, zFar * 0.6]} angle={0.95} penumbra={1} intensity={40} distance={20} color="#3a6ea0" />
      {/* cold fill skimming the wet floor */}
      {[0.3, 0.65].map((f, i) => (
        <pointLight key={i} position={[0, 0.5, zFar * f]} intensity={7} distance={8} color="#3fa9d6" />
      ))}
      {/* Batcomputer cold key from the depth + per-era accent tint */}
      <pointLight position={[0, 2.6, zFar + 1.8]} intensity={36} distance={13} color="#58d5f0" />
      <pointLight position={[0, 1.5, zFar + 1.0]} intensity={12} distance={8} color={era.accent} />

      <Room zFar={zFar} accent={era.accent} noise={noise} />

      <Suspense fallback={null}>
        {exhibits.map((item, i) => (
          <ExhibitFrame
            key={item.slug}
            item={item}
            slot={slots[i]}
            onSelect={onSelect}
            register={register}
          />
        ))}
      </Suspense>

      <Sparkles count={70} scale={[HALL_W, HALL_H, Math.abs(zFar) + 4]} position={[0, HALL_H / 2, zFar / 2]} size={1.4} speed={0.2} opacity={0.35} color="#cfe0f5" />

      {DEBUG_CAM ? (
        <CameraRig zFar={zFar} />
      ) : (
        <Player bounds={bounds} meshes={meshes} onSelect={onSelect} zFar={zFar} />
      )}

      {POSTFX && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.35} />
          <Vignette eskil={false} offset={0.22} darkness={0.82} />
        </EffectComposer>
      )}
    </>
  );
}

export default function Gallery3D({ era, exhibits }: { era: Era; exhibits: Item[] }) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Release pointer lock when an exhibit opens so the inspect panel is usable.
  useEffect(() => {
    if (selected && document.pointerLockElement) document.exitPointerLock();
  }, [selected]);

  return (
    <div className="relative h-screen w-screen bg-[var(--bg)]">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, EYE, 2], fov: 72, near: 0.1, far: 60 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <Scene era={era} exhibits={exhibits} onSelect={setSelected} />
      </Canvas>

      {/* crosshair */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-1.5 w-1.5 rounded-full border border-[var(--cyan)]/70" />
      </div>

      {/* header / back */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-[rgba(2,4,9,0.85)] to-transparent p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--dim)]">
            Gallery wing
          </p>
          <h1 className="font-display text-2xl font-bold tracking-[0.18em]" style={{ color: era.accent }}>
            {era.name}
          </h1>
        </div>
        <Link
          href="/"
          className="pointer-events-auto font-display border border-[var(--line)] bg-[rgba(10,16,24,0.7)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--dim)] backdrop-blur-sm transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
        >
          &lt;&lt; star map
        </Link>
      </div>

      {/* enter prompt */}
      {!entered && (
        <button
          onClick={() => setEntered(true)}
          className="fixed inset-0 z-30 grid place-items-center bg-[rgba(2,4,9,0.6)] backdrop-blur-sm"
        >
          <div className="text-center">
            <p className="font-display text-lg uppercase tracking-[0.3em] text-[var(--text)]">
              Enter {era.name}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--dim)]">
              click to look // WASD to walk // click art to inspect // esc to release
            </p>
          </div>
        </button>
      )}

      {selected && (
        <InspectView item={selected} accent={era.accent} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function InspectView({
  item,
  accent,
  onClose
}: {
  item: Item;
  accent: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-[rgba(2,4,9,0.82)] backdrop-blur-md" onClick={onClose} />
      <div
        className="relative grid max-h-[88vh] w-full max-w-4xl gap-0 overflow-hidden border bg-[linear-gradient(160deg,#0c1320,#070b13)] sm:grid-cols-[1fr_360px]"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="grid place-items-center bg-black/50 p-4">
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imgSrc(item.imageUrl)}
              alt={item.title}
              className="max-h-[80vh] w-full object-contain"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto p-5">
          <span
            className="font-display w-fit rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black"
            style={{ background: accent }}
          >
            {item.yearDisplay}
          </span>
          <h2 className="font-display text-2xl font-bold leading-tight text-[var(--text)]">
            {item.title}
          </h2>
          <p className="text-[13.5px] leading-relaxed text-[var(--text)]">
            {item.story || item.impact}
          </p>
          {item.funFacts.length > 0 && (
            <div>
              <p className="font-display mb-1 text-[11px] uppercase tracking-[0.3em] text-[var(--cyan)]">
                Fun facts
              </p>
              <ul className="space-y-1">
                {item.funFacts.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-[#b8c6d4]">
                    <span style={{ color: accent }}>&gt;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={onClose}
            className="font-display mt-auto w-fit border border-[var(--line)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--dim)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            close [esc]
          </button>
        </div>
      </div>
    </div>
  );
}
