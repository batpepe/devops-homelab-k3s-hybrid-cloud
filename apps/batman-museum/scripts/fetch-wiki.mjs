// Fetches Wikipedia REST summaries (extract + lead image URL) for every era and
// item listed in data/curation.json. Output: data/raw/<slug>.json. Run with
// plain node 22+ (no deps). Misses are reported so titles can be corrected.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const curation = JSON.parse(
  readFileSync(new URL("../data/curation.json", import.meta.url), "utf8")
);
mkdirSync(new URL("../data/raw/", import.meta.url), { recursive: true });

const targets = [
  ...curation.eras.map((e) => ({ slug: `era-${e.slug}`, wiki: e.wiki })),
  ...curation.items.map((i) => ({ slug: i.slug, wiki: i.wiki }))
];

const H = {
  headers: {
    "User-Agent":
      "batman-museum-homelab/0.1 (+https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud)"
  }
};
const summaryUrl = (title) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Rate-limit aware JSON fetch: backs off and retries when Wikipedia throttles.
async function fetchJson(url) {
  const waits = [5000, 15000, 30000];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, H);
    const body = await res.text();
    if (res.status === 429 || /^you are/i.test(body) || body.startsWith("<!DOCTYPE")) {
      if (attempt >= waits.length) throw new Error(`rate limited after ${attempt} retries`);
      console.log(`     throttled, waiting ${waits[attempt] / 1000}s...`);
      await sleep(waits[attempt]);
      continue;
    }
    if (!res.ok) {
      const err = new Error(`http ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return JSON.parse(body);
  }
}

const misses = [];
for (const t of targets) {
  if (existsSync(new URL(`../data/raw/${t.slug}.json`, import.meta.url))) {
    continue; // already fetched on a previous run
  }
  try {
    let j;
    try {
      j = await fetchJson(summaryUrl(t.wiki));
    } catch (e) {
      if (e.status !== 404) throw e;
      // Fall back to full-text search and take the top hit.
      const sj = await fetchJson(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(t.wiki)}&limit=1`
      );
      const key = sj?.pages?.[0]?.key;
      if (!key) throw new Error("no search hit");
      j = await fetchJson(summaryUrl(key));
    }
    writeFileSync(
      new URL(`../data/raw/${t.slug}.json`, import.meta.url),
      JSON.stringify(
        {
          slug: t.slug,
          queried: t.wiki,
          resolved: j.title,
          description: j.description ?? null,
          extract: j.extract ?? null,
          image: j.originalimage?.source ?? null,
          thumb: j.thumbnail?.source ?? null,
          page: j.content_urls?.desktop?.page ?? null
        },
        null,
        2
      )
    );
    console.log(`ok   ${t.slug} -> ${j.title}`);
  } catch (e) {
    misses.push(t.slug);
    console.log(`MISS ${t.slug}: ${e.message}`);
  }
  await sleep(700);
}

console.log(misses.length ? `\nMISSES: ${misses.join(", ")}` : "\nall fetched");
