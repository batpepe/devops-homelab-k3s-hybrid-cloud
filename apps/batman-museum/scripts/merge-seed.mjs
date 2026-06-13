// Merges hand-curated data (curation.json) with fetched Wikipedia raw data
// (data/raw/*.json) into the committed data/seed.json used by the seeder.
// Curated text wins; Wikipedia supplies image URLs, source links and the
// fallback long-form story text (the page extract).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const dataDir = new URL("../data/", import.meta.url);
const curation = JSON.parse(readFileSync(new URL("curation.json", dataDir), "utf8"));

const raw = {};
for (const f of readdirSync(new URL("raw/", dataDir))) {
  if (!f.endsWith(".json")) continue;
  const j = JSON.parse(readFileSync(new URL(`raw/${f}`, dataDir), "utf8"));
  raw[j.slug] = j;
}

const approxDate = (d) => (/^\d{4}$/.test(d) ? `${d}-06-15` : d);

const eras = curation.eras.map((e, idx) => ({
  slug: e.slug,
  name: e.name,
  yearStart: e.yearStart,
  yearEnd: e.yearEnd ?? null,
  blurb: e.blurb,
  accent: e.accent,
  sort: idx
}));

let missingImages = 0;
const items = curation.items.map((i, idx) => {
  const r = raw[i.slug] ?? {};
  if (!i.imageOverride && !r.image) {
    missingImages += 1;
    console.warn(`no image: ${i.slug}`);
  }
  return {
    slug: i.slug,
    eraSlug: i.era,
    title: i.title,
    mediaType: i.media,
    releaseDate: approxDate(i.date),
    yearDisplay: i.yearDisplay ?? i.date.slice(0, 4),
    isMilestone: Boolean(i.milestone),
    isExhibit: Boolean(i.exhibit),
    imageUrl: i.imageOverride ?? r.image ?? null,
    impact: i.impact ?? "",
    story: i.story ?? r.extract ?? "",
    funFacts: i.facts ?? [],
    sourceUrl: r.page ?? null,
    sort: idx
  };
});

writeFileSync(new URL("seed.json", dataDir), JSON.stringify({ eras, items }, null, 2));
console.log(
  `seed.json written: ${eras.length} eras, ${items.length} items, ${missingImages} missing images`
);
