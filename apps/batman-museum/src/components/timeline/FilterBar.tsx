"use client";

import type { MediaType } from "@/lib/types";

const TYPES: { key: MediaType; label: string }[] = [
  { key: "comics", label: "Comics" },
  { key: "movies", label: "Movies" },
  { key: "tv", label: "TV" },
  { key: "games", label: "Games" }
];

export default function FilterBar({
  active,
  onToggle
}: {
  active: Set<MediaType>;
  onToggle: (t: MediaType, el: HTMLButtonElement) => void;
}) {
  return (
    <div className="pointer-events-auto flex gap-2">
      {TYPES.map((t) => {
        const on = active.has(t.key);
        return (
          <button
            key={t.key}
            onClick={(e) => onToggle(t.key, e.currentTarget)}
            className={`chip font-display relative overflow-hidden rounded-sm border px-4 py-1.5 text-xs uppercase tracking-[0.22em] transition-colors duration-300 ${
              on
                ? "border-[var(--amber)] bg-[rgba(245,184,28,0.12)] text-[var(--amber)]"
                : "border-[var(--line)] text-[var(--dim)] hover:text-[var(--text)]"
            }`}
          >
            <span className="chip-ping pointer-events-none absolute inset-0 rounded-sm bg-[var(--amber)] opacity-0" />
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
