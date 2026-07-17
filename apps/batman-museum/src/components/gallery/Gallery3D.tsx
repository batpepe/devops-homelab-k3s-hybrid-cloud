"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PointerLockControls,
  MeshReflectorMaterial,
  SpotLight,
  useTexture,
  useProgress,
  Sparkles
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Era, Item } from "@/lib/types";
import { imgSrc } from "@/lib/img";
import { BAY, HALL_H, HALL_W, themeFor, type HallTheme } from "./hallThemes";
import HallProps from "./HallProps";

const EYE = 1.7;
// Cinematic postprocessing grade (bloom + vignette; tone mapping stays on the renderer).
const POSTFX = true;
// Establishing 3/4 camera for validation screenshots (disables walk controls).
const DEBUG_CAM = false;

type Slot = { x: number; z: number; side: 1 | -1 };
type TouchState = {
  look: { dx: number; dy: number };
  move: { x: number; y: number };
  tap: { x: number; y: number } | null;
};

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
  register,
  spotColor = "#ffe6b8"
}: {
  item: Item;
  slot: Slot;
  onSelect: (i: Item) => void;
  register: (mesh: THREE.Object3D | null, item: Item) => void;
  spotColor?: string;
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
        color={spotColor}
        castShadow
        shadow-bias={-0.0005}
      />
    </group>
  );
}

function Room({
  zFar,
  accent,
  noise,
  lowPerf,
  theme
}: {
  zFar: number;
  accent: string;
  noise: THREE.Texture;
  lowPerf: boolean;
  theme: HallTheme;
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
          resolution={lowPerf ? 256 : 1024}
          mixBlur={1.2}
          mixStrength={4}
          blur={lowPerf ? [150, 45] : [300, 90]}
          roughness={theme.floor.roughness}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color={theme.floor.color}
          metalness={theme.floor.metalness}
          mirror={theme.floor.mirror}
          normalMap={noise}
          normalScale={[0.18, 0.18]}
        />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL_H, centerZ]}>
        <planeGeometry args={[HALL_W, lengthZ]} />
        <meshStandardMaterial color={theme.wall.ceiling} roughness={1} metalness={0} />
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
            color={theme.wall.color}
            roughness={1}
            metalness={0.05}
            normalMap={noise}
            normalScale={[theme.wall.normalScale, theme.wall.normalScale]}
          />
        </mesh>
      ))}
      {/* riveted steel girders + ceiling trusses every bay */}
      {girderZs.map((z, i) => (
        <group key={i}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (HALL_W / 2 - 0.16), HALL_H / 2, z]} castShadow>
              <boxGeometry args={[0.28, HALL_H, 0.5]} />
              <meshStandardMaterial color={theme.trim.girder} roughness={0.38} metalness={0.92} />
            </mesh>
          ))}
          <mesh position={[0, HALL_H - 0.25, z]} castShadow>
            <boxGeometry args={[HALL_W, 0.3, 0.45]} />
            <meshStandardMaterial color={theme.trim.truss} roughness={0.42} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* floor strip lighting along each wall (per-era tech glow) */}
      {[-1, 1].map((s) => (
        <mesh key={`strip${s}`} position={[s * (HALL_W / 2 - 0.14), 0.12, centerZ]}>
          <boxGeometry args={[0.06, 0.1, lengthZ]} />
          <meshStandardMaterial
            color={theme.trim.stripCore}
            emissive={theme.trim.stripEmissive}
            emissiveIntensity={theme.trim.stripIntensity}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* far wall: the Batcomputer */}
      <mesh position={[0, HALL_H / 2, zFar]} receiveShadow>
        <planeGeometry args={[HALL_W, HALL_H]} />
        <meshStandardMaterial
          color={theme.wall.farWall}
          roughness={1}
          metalness={0.08}
          normalMap={noise}
          normalScale={[0.5, 0.5]}
        />
      </mesh>
      <group position={[0, HALL_H / 2, zFar + 0.07]}>
        <mesh>
          <planeGeometry args={[6.2, 3]} />
          <meshStandardMaterial
            color="#08171e"
            emissive={theme.trim.screenEmissive}
            emissiveIntensity={theme.trim.screenIntensity}
            toneMapped={false}
          />
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
          color={theme.wall.color}
          roughness={1}
          metalness={0.05}
          normalMap={noise}
          normalScale={[theme.wall.normalScale, theme.wall.normalScale]}
        />
      </mesh>
    </group>
  );
}

function Player({
  bounds,
  meshes,
  onSelect,
  zFar,
  isTouch,
  touch
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  meshes: React.RefObject<{ mesh: THREE.Object3D; item: Item }[]>;
  onSelect: (i: Item) => void;
  zFar: number;
  isTouch: boolean;
  touch: React.RefObject<TouchState>;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const lockRef = useRef<{ isLocked: boolean } | null>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const front = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);
  const yaw = useRef(0);
  const pitch = useRef(0);

  // Spawn near the entrance, off-centre and angled down the hall so the first
  // frame already reveals a row of lit exhibits and the cyan strips.
  useEffect(() => {
    camera.position.set(-3.1, EYE, 2.2);
    camera.lookAt(2.6, 1.5, zFar * 0.4);
    camera.rotation.order = "YXZ";
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard (desktop only).
  useEffect(() => {
    if (isTouch) return;
    const d = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, [isTouch]);

  const inspectAt = (nx: number, ny: number) => {
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const list = meshes.current ?? [];
    const hit = ray.intersectObjects(list.map((m) => m.mesh), false)[0];
    if (hit) {
      const found = list.find((m) => m.mesh === hit.object);
      if (found) onSelect(found.item);
    }
  };

  // Click while pointer-locked: raycast from screen center onto exhibits (desktop).
  useEffect(() => {
    if (isTouch) return;
    const onClick = () => {
      if (!lockRef.current?.isLocked) return;
      inspectAt(0, 0);
    };
    const el = gl.domElement;
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, meshes, onSelect, ray, isTouch]);

  useFrame((_, dt) => {
    const speed = 3.4 * Math.min(dt, 0.05);

    if (isTouch) {
      const t = touch.current;
      const s = 0.004;
      yaw.current -= t.look.dx * s;
      pitch.current = Math.max(-1.2, Math.min(1.2, pitch.current - t.look.dy * s));
      t.look.dx = 0;
      t.look.dy = 0;
      camera.rotation.set(pitch.current, yaw.current, 0);
      if (t.tap) {
        const tap = t.tap;
        t.tap = null;
        inspectAt(tap.x, tap.y);
      }
    }

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
    if (isTouch) {
      const m = touch.current.move;
      if (m.y) move.addScaledVector(front, -m.y);
      if (m.x) move.addScaledVector(side, m.x);
    }
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.add(move);
    }
    camera.position.y = EYE;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, bounds.minX, bounds.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, bounds.minZ, bounds.maxZ);
  });

  return isTouch ? null : <PointerLockControls ref={lockRef as never} />;
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
  onSelect,
  lowPerf,
  isTouch,
  touch
}: {
  era: Era;
  exhibits: Item[];
  onSelect: (i: Item) => void;
  lowPerf: boolean;
  isTouch: boolean;
  touch: React.RefObject<TouchState>;
}) {
  const { slots, zFar } = useMemo(() => buildSlots(exhibits.length), [exhibits.length]);
  const theme = themeFor(era.slug);
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
      <color attach="background" args={[theme.bg]} />
      <fogExp2 attach="fog" args={[theme.fog.color, theme.fog.density]} />

      {/* per-era ambience against warm exhibit pools */}
      <ambientLight intensity={theme.light.ambientIntensity} color={theme.light.ambient} />
      <hemisphereLight args={[theme.light.hemiSky, theme.light.hemiGround, theme.light.hemiIntensity]} />
      {/* rims raking down both walls to reveal the hall structure */}
      <spotLight position={[-HALL_W / 2, HALL_H - 0.4, 0]} angle={0.95} penumbra={1} intensity={theme.light.rimAIntensity} distance={20} color={theme.light.rimA} />
      <spotLight position={[HALL_W / 2, HALL_H - 0.4, zFar * 0.6]} angle={0.95} penumbra={1} intensity={theme.light.rimBIntensity} distance={20} color={theme.light.rimB} />
      {/* fill skimming the wet floor */}
      {[0.3, 0.65].map((f, i) => (
        <pointLight key={i} position={[0, 0.5, zFar * f]} intensity={7} distance={8} color={theme.light.fill} />
      ))}
      {/* Batcomputer key from the depth + per-era accent tint */}
      <pointLight position={[0, 2.6, zFar + 1.8]} intensity={36} distance={13} color={theme.light.batKey} />
      <pointLight position={[0, 1.5, zFar + 1.0]} intensity={12} distance={8} color={era.accent} />

      <Room zFar={zFar} accent={era.accent} noise={noise} lowPerf={lowPerf} theme={theme} />
      <HallProps theme={theme} zFar={zFar} lowPerf={lowPerf} />

      <Suspense fallback={null}>
        {exhibits.map((item, i) => (
          <ExhibitFrame
            key={item.slug}
            item={item}
            slot={slots[i]}
            onSelect={onSelect}
            register={register}
            spotColor={theme.light.exhibitSpot}
          />
        ))}
      </Suspense>

      <Sparkles count={lowPerf ? 28 : 70} scale={[HALL_W, HALL_H, Math.abs(zFar) + 4]} position={[0, HALL_H / 2, zFar / 2]} size={1.4} speed={0.2} opacity={0.35} color={theme.sparkle} />

      {DEBUG_CAM ? (
        <CameraRig zFar={zFar} />
      ) : (
        <Player bounds={bounds} meshes={meshes} onSelect={onSelect} zFar={zFar} isTouch={isTouch} touch={touch} />
      )}

      {POSTFX && (
        <EffectComposer multisampling={lowPerf ? 0 : 4}>
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
  const [isTouch, setIsTouch] = useState(false);
  const touch = useRef<TouchState>({ look: { dx: 0, dy: 0 }, move: { x: 0, y: 0 }, tap: null });
  const lowPerf = isTouch;
  // Texture-loading progress for the boot overlay; useProgress reads the
  // default THREE loading manager, so it works here outside the Canvas.
  const { active: loading, progress } = useProgress();

  useEffect(() => {
    // ?touch=1 forces the touch UI (handy for QA or touch-screen laptops).
    const force = new URLSearchParams(window.location.search).get("touch") === "1";
    setIsTouch(
      force ||
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window
    );
  }, []);

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
    <div className="relative h-dvh w-screen overflow-hidden bg-[var(--bg)]">
      <Canvas
        shadows={!lowPerf}
        dpr={lowPerf ? [1, 1.5] : [1, 1.8]}
        camera={{ position: [0, EYE, 2], fov: 72, near: 0.1, far: 60 }}
        gl={{ antialias: !lowPerf, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ touchAction: "none" }}
      >
        <Scene
          era={era}
          exhibits={exhibits}
          onSelect={setSelected}
          lowPerf={lowPerf}
          isTouch={isTouch}
          touch={touch}
        />
      </Canvas>

      {/* crosshair (desktop aim only) */}
      {!isTouch && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="h-1.5 w-1.5 rounded-full border border-[var(--cyan)]/70" />
        </div>
      )}

      {/* header / back */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-[rgba(2,4,9,0.85)] to-transparent p-4 sm:p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--dim)] sm:text-[11px]">
            Gallery wing
          </p>
          <h1 className="font-display text-xl font-bold tracking-[0.18em] sm:text-2xl" style={{ color: era.accent }}>
            {era.name}
          </h1>
        </div>
        <Link
          href="/"
          className="pointer-events-auto shrink-0 font-display border border-[var(--line)] bg-[rgba(10,16,24,0.7)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--dim)] backdrop-blur-sm transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)] sm:px-4 sm:py-2 sm:text-[11px]"
        >
          &lt;&lt; star map
        </Link>
      </div>

      {/* Batcomputer boot overlay: shows texture-stream progress, then arms
          the enter button (the click is also the PointerLock gesture). */}
      {!entered && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(2,4,9,0.66)] px-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-[var(--line)] bg-[rgba(6,10,16,0.92)] p-6">
            <span className="hud-corner left-0 top-0 border-l-2 border-t-2" style={{ borderColor: era.accent }} />
            <span className="hud-corner right-0 top-0 border-r-2 border-t-2" style={{ borderColor: era.accent }} />
            <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" style={{ borderColor: era.accent }} />
            <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" style={{ borderColor: era.accent }} />
            <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />

            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--cyan)]">
              batcomputer // gallery interface
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-[0.14em]" style={{ color: era.accent }}>
              {era.name}
            </h2>
            <div className="mt-3 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--dim)] sm:text-[11px]">
              <p>&gt; mount /archive/{era.slug} ... ok</p>
              <p>&gt; exhibit manifest ... {exhibits.length} records</p>
              <p>&gt; lighting rig ... calibrated</p>
              <p>
                &gt; texture stream ...{" "}
                {loading ? `${Math.round(progress)}%` : "complete"}
              </p>
            </div>
            <div className="mt-4 h-1 w-full bg-[rgba(255,255,255,0.08)]">
              <div
                className="h-full transition-[width] duration-300"
                style={{ width: `${loading ? Math.max(4, progress) : 100}%`, background: era.accent }}
              />
            </div>
            <button
              onClick={() => setEntered(true)}
              disabled={loading}
              className="font-display mt-5 w-full border border-[var(--line)] px-4 py-2.5 text-[12px] uppercase tracking-[0.25em] text-[var(--text)] transition-colors enabled:hover:border-[var(--cyan)] enabled:hover:text-[var(--cyan)] disabled:opacity-50"
            >
              {loading ? "decrypting archive..." : `enter ${era.name}`}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--dim)] sm:text-[10px]">
              {isTouch
                ? "drag to look // joystick to move // tap art to inspect"
                : "click to look // WASD to walk // click art to inspect // esc to release"}
            </p>
          </div>
        </div>
      )}

      {isTouch && entered && <TouchControls touch={touch} />}

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

// Touch input: a full-screen look surface (drag to look, tap to inspect) plus a
// thumb joystick for movement. Writes into the shared `touch` ref consumed by
// Player's useFrame, so no React re-renders fire per touch move.
function TouchControls({ touch }: { touch: React.RefObject<TouchState> }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lookId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const onStart = (e: React.TouchEvent) => {
    if (lookId.current !== null) return;
    const t = e.changedTouches[0];
    lookId.current = t.identifier;
    last.current = { x: t.clientX, y: t.clientY };
    moved.current = false;
  };
  const onMove = (e: React.TouchEvent) => {
    if (lookId.current === null) return;
    const t = Array.from(e.touches).find((x) => x.identifier === lookId.current);
    if (!t) return;
    const dx = t.clientX - last.current.x;
    const dy = t.clientY - last.current.y;
    last.current = { x: t.clientX, y: t.clientY };
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
    touch.current.look.dx += dx;
    touch.current.look.dy += dy;
  };
  const onEnd = (e: React.TouchEvent) => {
    const et = Array.from(e.changedTouches).find((x) => x.identifier === lookId.current);
    if (!et) return;
    if (!moved.current && surfaceRef.current) {
      const r = surfaceRef.current.getBoundingClientRect();
      touch.current.tap = {
        x: ((et.clientX - r.left) / r.width) * 2 - 1,
        y: -((et.clientY - r.top) / r.height) * 2 + 1
      };
    }
    lookId.current = null;
  };

  return (
    <>
      <div
        ref={surfaceRef}
        className="fixed inset-0 z-10"
        style={{ touchAction: "none" }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
      />
      <Joystick touch={touch} />
    </>
  );
}

function Joystick({ touch }: { touch: React.RefObject<TouchState> }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const id = useRef<number | null>(null);
  const R = 46;

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const onStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (id.current === null) id.current = e.changedTouches[0].identifier;
  };
  const onMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (id.current === null || !baseRef.current) return;
    const t = Array.from(e.touches).find((x) => x.identifier === id.current);
    if (!t) return;
    const r = baseRef.current.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2);
    let dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    setKnob(dx, dy);
    touch.current.move.x = dx / R;
    touch.current.move.y = dy / R;
  };
  const onEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!Array.from(e.changedTouches).some((x) => x.identifier === id.current)) return;
    id.current = null;
    touch.current.move.x = 0;
    touch.current.move.y = 0;
    setKnob(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="fixed bottom-6 left-6 z-20 grid h-28 w-28 touch-none place-items-center rounded-full border border-[var(--line)] bg-[rgba(10,16,24,0.45)] backdrop-blur-sm"
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <div className="pointer-events-none absolute font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--dim)]">
        move
      </div>
      <div
        ref={knobRef}
        className="h-12 w-12 rounded-full border border-[var(--cyan)]/50 bg-[rgba(88,213,240,0.18)]"
      />
    </div>
  );
}
