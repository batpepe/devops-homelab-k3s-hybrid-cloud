import { getPool } from "./db";
import type { Era, GalleryPayload, Item, TimelinePayload } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToEra(r: any): Era {
  return {
    slug: r.slug,
    name: r.name,
    yearStart: r.year_start,
    yearEnd: r.year_end,
    blurb: r.blurb,
    accent: r.accent,
    sort: r.sort
  };
}

function rowToItem(r: any): Item {
  return {
    slug: r.slug,
    eraSlug: r.era_slug,
    title: r.title,
    mediaType: r.media_type,
    releaseDate: r.release_date ? String(r.release_date).slice(0, 10) : null,
    yearDisplay: r.year_display,
    isMilestone: r.is_milestone,
    isExhibit: r.is_exhibit,
    imageUrl: r.image_url,
    impact: r.impact,
    story: r.story,
    funFacts: Array.isArray(r.fun_facts) ? r.fun_facts : [],
    sourceUrl: r.source_url,
    sort: r.sort
  };
}

export async function fetchTimeline(): Promise<TimelinePayload> {
  const pool = getPool();
  const [eras, milestones] = await Promise.all([
    pool.query("SELECT * FROM eras ORDER BY sort"),
    pool.query(
      "SELECT * FROM items WHERE is_milestone ORDER BY release_date NULLS LAST, sort"
    )
  ]);
  return { eras: eras.rows.map(rowToEra), milestones: milestones.rows.map(rowToItem) };
}

export async function fetchGallery(slug: string): Promise<GalleryPayload | null> {
  const pool = getPool();
  const era = await pool.query("SELECT * FROM eras WHERE slug = $1", [slug]);
  if (era.rowCount === 0) return null;
  const exhibits = await pool.query(
    "SELECT * FROM items WHERE is_exhibit AND era_slug = $1 ORDER BY release_date NULLS LAST, sort",
    [slug]
  );
  return { era: rowToEra(era.rows[0]), exhibits: exhibits.rows.map(rowToItem) };
}
