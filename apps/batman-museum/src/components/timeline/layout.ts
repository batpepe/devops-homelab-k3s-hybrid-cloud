import type { Era, Item } from "@/lib/types";

// World coordinates for the infinite canvas. X is time, Y is hand-tuned bands
// per era so clusters read as separate constellations.
export const WORLD_W = 6400;
export const WORLD_H = 2400;
const YEAR_MIN = 1932;
const YEAR_MAX = 2032;

export const yearToX = (year: number): number =>
  ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * WORLD_W;

// Deterministic per-slug jitter (FNV-1a) so layout is stable across loads.
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const ERA_BANDS: Record<string, { y: number; spread: number }> = {
  "golden-age": { y: 0.38, spread: 0.1 },
  "silver-age": { y: 0.3, spread: 0.09 },
  "bronze-age": { y: 0.4, spread: 0.08 },
  "modern-age": { y: 0.33, spread: 0.1 },
  animated: { y: 0.16, spread: 0.06 },
  cinematic: { y: 0.58, spread: 0.07 },
  games: { y: 0.76, spread: 0.06 }
};

export interface StarPos {
  item: Item;
  x: number;
  y: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mediaA: string;
  mediaB: string;
}

export interface EraLayout {
  era: Era;
  cx: number;
  cy: number;
  stars: StarPos[];
  segments: Segment[];
}

export function computeLayout(eras: Era[], milestones: Item[]): EraLayout[] {
  return eras.map((era) => {
    const band = ERA_BANDS[era.slug] ?? { y: 0.5, spread: 0.08 };
    const stars = milestones
      .filter((m) => m.eraSlug === era.slug)
      .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""))
      .map((m) => {
        const year =
          Number((m.releaseDate ?? "1950").slice(0, 4)) + (hash01(m.slug) - 0.5) * 0.9;
        const x = yearToX(year);
        const y = (band.y + (hash01(m.slug + "y") - 0.5) * 2 * band.spread) * WORLD_H;
        return { item: m, x, y };
      });

    const segments: Segment[] = [];
    for (let i = 1; i < stars.length; i++) {
      segments.push({
        x1: stars[i - 1].x,
        y1: stars[i - 1].y,
        x2: stars[i].x,
        y2: stars[i].y,
        mediaA: stars[i - 1].item.mediaType,
        mediaB: stars[i].item.mediaType
      });
    }

    const cx = stars.reduce((s, p) => s + p.x, 0) / Math.max(1, stars.length);
    const cy =
      stars.reduce((s, p) => s + p.y, 0) / Math.max(1, stars.length) -
      band.spread * WORLD_H -
      90;
    return { era, cx, cy, stars, segments };
  });
}

export const decadeTicks = (): { year: number; x: number }[] => {
  const ticks = [];
  for (let y = 1940; y <= 2030; y += 10) ticks.push({ year: y, x: yearToX(y) });
  return ticks;
};
