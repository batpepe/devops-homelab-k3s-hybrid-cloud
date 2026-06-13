// Applies db/schema.sql and upserts data/seed.json into Postgres.
// Connection comes from DATABASE_URL; PGHOST_OVERRIDE rewrites localhost when
// running inside a container. Idempotent: safe to run on every boot.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const override = process.env.PGHOST_OVERRIDE;
const client = new pg.Client({
  connectionString: override ? url.replace("@localhost:", `@${override}:`) : url
});

await client.connect();
await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));

const seed = JSON.parse(readFileSync(new URL("../data/seed.json", import.meta.url), "utf8"));

for (const e of seed.eras) {
  await client.query(
    `INSERT INTO eras (slug, name, year_start, year_end, blurb, accent, sort)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (slug) DO UPDATE
       SET name = $2, year_start = $3, year_end = $4, blurb = $5, accent = $6, sort = $7`,
    [e.slug, e.name, e.yearStart, e.yearEnd, e.blurb, e.accent, e.sort]
  );
}

for (const i of seed.items) {
  await client.query(
    `INSERT INTO items (slug, era_slug, title, media_type, release_date, year_display,
                        is_milestone, is_exhibit, image_url, impact, story, fun_facts,
                        source_url, sort)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (slug) DO UPDATE
       SET era_slug = $2, title = $3, media_type = $4, release_date = $5,
           year_display = $6, is_milestone = $7, is_exhibit = $8, image_url = $9,
           impact = $10, story = $11, fun_facts = $12, source_url = $13, sort = $14`,
    [
      i.slug, i.eraSlug, i.title, i.mediaType, i.releaseDate, i.yearDisplay,
      i.isMilestone, i.isExhibit, i.imageUrl, i.impact, i.story,
      JSON.stringify(i.funFacts), i.sourceUrl, i.sort
    ]
  );
}

const eras = await client.query("SELECT count(*) FROM eras");
const items = await client.query("SELECT count(*) FROM items");
console.log(`db now has ${eras.rows[0].count} eras, ${items.rows[0].count} items`);
await client.end();
