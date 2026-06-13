"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import type { Era, Item } from "@/lib/types";
import { imgSrc } from "@/lib/img";
import { hash01 } from "./layout";

const MEDIA_LABEL: Record<string, string> = {
  comics: "COMIC BOOK",
  movies: "FEATURE FILM",
  tv: "TELEVISION",
  games: "VIDEO GAME"
};

export default function MilestoneCard({
  item,
  era,
  onClose
}: {
  item: Item;
  era: Era;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileNo = `BAT-${Math.floor(1000 + hash01(item.slug) * 8999)}`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".card-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(
        panelRef.current,
        { clipPath: "inset(0 0 100% 0)", opacity: 1 },
        { clipPath: "inset(0 0 0% 0)", duration: 0.45, ease: "power3.out" }
      );
      gsap.fromTo(
        ".card-stagger",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.18, ease: "power2.out" }
      );
      gsap.fromTo(
        ".card-img",
        { opacity: 0, filter: "brightness(2.5) saturate(0)" },
        { opacity: 1, filter: "brightness(1) saturate(1)", duration: 0.6, delay: 0.25 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [item.slug]);

  const close = () => {
    gsap.to(panelRef.current, { autoAlpha: 0, y: 12, duration: 0.16, onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 z-40 grid place-items-center p-4 sm:p-8">
      <div
        className="card-backdrop absolute inset-0 bg-[rgba(2,4,9,0.78)] backdrop-blur-sm"
        onClick={close}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl border border-[var(--line)] bg-[linear-gradient(160deg,#0c1320_0%,#080d16_60%,#070b13_100%)] shadow-[0_0_80px_rgba(88,213,240,0.07),0_30px_60px_rgba(0,0,0,0.6)]"
        style={{ "--accent": era.accent } as React.CSSProperties}
      >
        {/* HUD frame corners */}
        <span className="hud-corner left-0 top-0 border-l-2 border-t-2" />
        <span className="hud-corner right-0 top-0 border-r-2 border-t-2" />
        <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" />
        <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" />

        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-2.5">
          <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--cyan)]">
            Batcomputer archive <span className="text-[var(--dim)]">// file {fileNo}</span>
          </p>
          <button
            onClick={close}
            aria-label="Close"
            className="font-display border border-[var(--line)] px-2 py-0.5 text-[11px] uppercase tracking-widest text-[var(--dim)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            Esc
          </button>
        </div>

        <div className="grid gap-0 sm:grid-cols-[280px_1fr]">
          <div className="relative border-b border-[var(--line)] p-4 sm:border-b-0 sm:border-r">
            <div className="relative overflow-hidden border border-[#223247] bg-black/40">
              {item.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imgSrc(item.imageUrl)}
                  alt={item.title}
                  className="card-img mx-auto max-h-[340px] w-full object-contain"
                />
              ) : (
                <div className="grid h-64 place-items-center text-xs uppercase tracking-widest text-[var(--dim)]">
                  no visual record
                </div>
              )}
              <span className="scanlines pointer-events-none absolute inset-0" />
            </div>
            <p className="card-stagger mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--dim)]">
              visual record | wikimedia archive
            </p>
          </div>

          <div className="flex flex-col gap-3 p-5">
            <div className="card-stagger flex items-baseline gap-3">
              <span
                className="font-display rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black"
                style={{ background: era.accent }}
              >
                {era.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--dim)]">
                {MEDIA_LABEL[item.mediaType]}
              </span>
            </div>

            <h2 className="card-stagger font-display text-3xl font-bold leading-tight text-[var(--text)]">
              {item.title}
            </h2>

            <div className="card-stagger flex gap-5 border-y border-[var(--line)] py-2 font-mono text-[12px] text-[var(--dim)]">
              <span>
                YEAR <b className="ml-1 text-[var(--amber)]">{item.yearDisplay}</b>
              </span>
              <span>
                ERA{" "}
                <b className="ml-1 text-[var(--text)]">
                  {era.yearStart}-{era.yearEnd ?? "now"}
                </b>
              </span>
            </div>

            <p className="card-stagger text-[13.5px] leading-relaxed text-[var(--text)]">
              {item.impact}
            </p>

            {item.funFacts.length > 0 && (
              <div className="card-stagger">
                <p className="font-display mb-1 text-[11px] uppercase tracking-[0.3em] text-[var(--cyan)]">
                  Data fragments
                </p>
                <ul className="space-y-1">
                  {item.funFacts.map((f, i) => (
                    <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-[#b8c6d4]">
                      <span className="text-[var(--amber)]">&gt;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card-stagger mt-auto flex items-center justify-between gap-3 pt-2">
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--dim)] underline-offset-4 hover:text-[var(--cyan)] hover:underline"
                >
                  source: wikipedia
                </a>
              ) : (
                <span />
              )}
              <Link
                href={`/museum/${era.slug}`}
                className="font-display group border border-[var(--amber)] bg-[rgba(245,184,28,0.08)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-black"
              >
                Enter the gallery <span className="ml-1">&gt;&gt;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
