"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import {
  zoom as d3zoom,
  zoomIdentity,
  zoomTransform,
  type ZoomBehavior
} from "d3-zoom";
import gsap from "gsap";
import type { Era, Item, MediaType } from "@/lib/types";
import {
  WORLD_W,
  WORLD_H,
  computeLayout,
  decadeTicks,
  type EraLayout,
  type StarPos
} from "./layout";
import Backdrop from "./Backdrop";
import FilterBar from "./FilterBar";
import MilestoneCard from "./MilestoneCard";

const ALL: MediaType[] = ["comics", "movies", "tv", "games"];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function TimelineCanvas({
  eras,
  milestones
}: {
  eras: Era[];
  milestones: Item[];
}) {
  const layout = useMemo(() => computeLayout(eras, milestones), [eras, milestones]);
  const ticks = useMemo(() => decadeTicks(), []);
  const eraBySlug = useMemo(() => new Map(eras.map((e) => [e.slug, e])), [eras]);
  const segments = useMemo(
    () =>
      layout.flatMap((el) =>
        el.segments.map((s) => ({ ...s, accent: el.era.accent }))
      ),
    [layout]
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const segRefs = useRef<(SVGLineElement | null)[]>([]);
  const fitKRef = useRef(0.2);
  const navProxy = useRef({ x: 0, y: 0, k: 1 });
  const interacted = useRef(false);

  const [active, setActive] = useState<Set<MediaType>>(new Set(ALL));
  const [selected, setSelected] = useState<Item | null>(null);
  const [hint, setHint] = useState(true);
  const [ready, setReady] = useState(false);

  // ---- d3-zoom: infinite canvas with semantic zoom ----
  useEffect(() => {
    const vp = viewportRef.current!;
    const world = worldRef.current!;
    const bg = bgRef.current!;

    const z = d3zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.16, 2.6])
      .on("zoom", (ev) => {
        const { x, y, k } = ev.transform;
        world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
        const bk = 0.62 + k * 0.38;
        bg.style.transform = `translate3d(${x * 0.55}px, ${y * 0.55}px, 0) scale(${bk})`;
        // Semantic-zoom crossfade is driven by classes (no React re-render in hot path).
        world.classList.toggle("zoomed-in", k > 0.62);
        world.classList.toggle("galaxy", k < 0.42);
        if (!interacted.current) {
          interacted.current = true;
          setHint(false);
        }
      });

    zoomRef.current = z;
    const sel = select(vp);
    sel.call(z);
    sel.on("dblclick.zoom", null);

    const k = Math.min(vp.clientWidth / WORLD_W, vp.clientHeight / WORLD_H) * 0.92;
    fitKRef.current = k;
    const x = (vp.clientWidth - WORLD_W * k) / 2;
    const y = (vp.clientHeight - WORLD_H * k) / 2;
    sel.call(z.transform, zoomIdentity.translate(x, y).scale(k));
    setReady(true);

    return () => {
      sel.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function animateTo(cx: number, cy: number, targetK: number) {
    const vp = viewportRef.current!;
    const z = zoomRef.current!;
    const sel = select(vp);
    const t = zoomTransform(vp);
    const tx = vp.clientWidth / 2 - cx * targetK;
    const ty = vp.clientHeight / 2 - cy * targetK;
    gsap.killTweensOf(navProxy.current);
    navProxy.current.x = t.x;
    navProxy.current.y = t.y;
    navProxy.current.k = t.k;
    gsap.to(navProxy.current, {
      x: tx,
      y: ty,
      k: targetK,
      duration: 0.9,
      ease: "power3.inOut",
      onUpdate: () => {
        z.transform(
          sel as never,
          zoomIdentity
            .translate(navProxy.current.x, navProxy.current.y)
            .scale(navProxy.current.k)
        );
      }
    });
  }

  const currentCenter = () => {
    const vp = viewportRef.current!;
    const t = zoomTransform(vp);
    return {
      x: (vp.clientWidth / 2 - t.x) / t.k,
      y: (vp.clientHeight / 2 - t.y) / t.k,
      k: t.k
    };
  };

  const zoomBy = (f: number) => {
    const c = currentCenter();
    animateTo(c.x, c.y, clamp(c.k * f, 0.16, 2.6));
  };

  const resetView = () => animateTo(WORLD_W / 2, WORLD_H / 2, fitKRef.current);

  const zoomToEra = (el: EraLayout) => {
    const ys = el.stars.map((s) => s.y);
    const cy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : el.cy;
    animateTo(el.cx, cy, 1.05);
  };

  // ---- filter "moment": GSAP pop-in / dim-out by media type ----
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    ALL.forEach((t) => {
      const on = active.has(t);
      const nodes = world.querySelectorAll<HTMLElement>(`.star[data-media="${t}"]`);
      gsap.to(nodes, {
        opacity: on ? 1 : 0.07,
        scale: on ? 1 : 0.5,
        duration: 0.55,
        ease: on ? "back.out(1.7)" : "power2.inOut",
        stagger: { each: 0.012, from: "random" }
      });
    });
    segRefs.current.forEach((el, i) => {
      if (!el) return;
      const s = segments[i];
      const vis =
        active.has(s.mediaA as MediaType) && active.has(s.mediaB as MediaType);
      gsap.to(el, { attr: { "stroke-opacity": vis ? 0.5 : 0.04 }, duration: 0.5 });
    });
  }, [active, segments]);

  const toggle = (t: MediaType, elBtn: HTMLButtonElement) => {
    const ping = elBtn.querySelector(".chip-ping");
    if (ping) {
      gsap.fromTo(
        ping,
        { scale: 0, opacity: 0.45 },
        { scale: 1.7, opacity: 0, duration: 0.6, ease: "power2.out", transformOrigin: "center" }
      );
    }
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const selectedEra = selected ? eraBySlug.get(selected.eraSlug) ?? null : null;

  return (
    <div
      ref={viewportRef}
      className="relative h-screen w-screen cursor-grab overflow-hidden active:cursor-grabbing"
    >
      {/* far parallax layer */}
      <div
        ref={bgRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.7s ease" }}
      >
        <Backdrop />
      </div>

      {/* world layer (pans + zooms) */}
      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ width: WORLD_W, height: WORLD_H, opacity: ready ? 1 : 0, transition: "opacity 0.7s ease" }}
      >
        <svg
          width={WORLD_W}
          height={WORLD_H}
          className="pointer-events-none absolute inset-0 overflow-visible"
        >
          {ticks.map((t) => (
            <g key={t.year}>
              <line x1={t.x} y1={0} x2={t.x} y2={WORLD_H} stroke="#0f1d2c" strokeWidth={1.5} />
              <text
                x={t.x + 8}
                y={WORLD_H - 26}
                fill="#33485d"
                fontSize={30}
                className="font-display"
              >
                {t.year}
              </text>
            </g>
          ))}

          {segments.map((s, i) => (
            <line
              key={i}
              ref={(el) => {
                segRefs.current[i] = el;
              }}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={s.accent}
              strokeOpacity={0.5}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* era cluster labels (galaxy view) */}
        {layout.map((el) => (
          <button
            key={el.era.slug}
            onClick={() => zoomToEra(el)}
            className="era-cluster-label star-pos absolute whitespace-nowrap text-center"
            style={{ left: el.cx, top: el.cy, "--accent": el.era.accent } as React.CSSProperties}
          >
            <span className="era-halo" />
            <span
              className="font-display relative block text-[110px] font-bold leading-none"
              style={{ color: el.era.accent }}
            >
              {el.era.name}
            </span>
            <span className="relative mt-2 block font-mono text-[42px] tracking-[0.3em] text-[var(--dim)]">
              {el.era.yearStart}-{el.era.yearEnd ?? "NOW"}
            </span>
            <span className="relative mt-1 block font-mono text-[28px] tracking-[0.25em] text-[var(--cyan)]">
              {el.stars.length} milestones
            </span>
          </button>
        ))}

        {/* milestone stars */}
        {layout.map((el) =>
          el.stars.map((sp) => (
            <StarNode
              key={sp.item.slug}
              sp={sp}
              accent={el.era.accent}
              onOpen={() => setSelected(sp.item)}
            />
          ))
        )}
      </div>

      {/* cinematic vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(2,4,9,0.65) 100%)"
        }}
      />

      {/* header + filters */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-4 bg-gradient-to-b from-[rgba(2,4,9,0.85)] to-transparent p-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[0.22em] text-[var(--text)]">
            THE BAT-ARCHIVE
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--dim)]">
            a constellation of Gotham history // 1939 - present
          </p>
        </div>
        <div className="pointer-events-auto">
          <FilterBar active={active} onToggle={toggle} />
        </div>
      </div>

      {/* controls */}
      <div className="pointer-events-auto fixed bottom-5 right-5 z-20 flex flex-col gap-2">
        <CtrlBtn label="+" onClick={() => zoomBy(1.5)} />
        <CtrlBtn label="-" onClick={() => zoomBy(1 / 1.5)} />
        <CtrlBtn label="fit" onClick={resetView} small />
      </div>

      {hint && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 animate-pulse font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--dim)]">
          scroll to zoom // drag to explore // click a star
        </div>
      )}

      {selected && selectedEra && (
        <MilestoneCard item={selected} era={selectedEra} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function StarNode({
  sp,
  accent,
  onOpen
}: {
  sp: StarPos;
  accent: string;
  onOpen: () => void;
}) {
  return (
    <div className="star-pos absolute" style={{ left: sp.x, top: sp.y }}>
      <button
        className="star group"
        data-media={sp.item.mediaType}
        onClick={onOpen}
        style={{ "--accent": accent } as React.CSSProperties}
        aria-label={sp.item.title}
      >
        <span className="star-glow" />
        <span className="star-core" />
        <span className="star-label">
          <span className="font-display text-[19px] font-semibold leading-tight text-[var(--text)]">
            {sp.item.title}
          </span>
          <span className="font-mono text-[13px] tracking-[0.2em] text-[var(--dim)]">
            {sp.item.yearDisplay}
          </span>
        </span>
      </button>
    </div>
  );
}

function CtrlBtn({
  label,
  onClick,
  small
}: {
  label: string;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-display grid h-10 w-10 place-items-center border border-[var(--line)] bg-[rgba(10,16,24,0.7)] uppercase tracking-widest text-[var(--dim)] backdrop-blur-sm transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)] ${
        small ? "text-[10px]" : "text-xl"
      }`}
    >
      {label}
    </button>
  );
}
