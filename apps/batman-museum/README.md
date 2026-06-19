# Batman Museum

An interactive 3D museum of Batman's history that runs in the browser, served
from the K3s homelab at **https://museum.batpepe.online**.

Two linked experiences, one Next.js app:

1. **Timeline** (`/`) - "A Constellation over Gotham": an infinite, zoomable
   canvas of every era as a star cluster. Zoom in to reveal milestones; click a
   star for a Batcomputer-style file card; filter by media type.
2. **Galleries** (`/museum/<era-slug>`) - a first-person, walkable Batcave wing
   per era, with individual spotlights, a wet reflective floor, volumetric fog
   and a Batcomputer screen. Click an exhibit to inspect it (hi-res art, story,
   fun facts).

All content is real, scraped from Wikipedia (7 eras, 49 exhibits) and stored in
Postgres. No data is hallucinated.

## Stack

Next.js 15 (App Router, `output: "standalone"`) | React 19 | TypeScript 5.8 |
Tailwind CSS v4 | React Three Fiber 9 + drei 10 + postprocessing 3 (three 0.177)
| d3-zoom / d3-selection (timeline canvas) | GSAP 3 (animation) | `pg` 8 +
PostgreSQL 15.

## Layout

```
apps/batman-museum/
  data/curation.json     hand-curated source of truth (eras + items)
  data/seed.json         merged, committed payload the seeder applies
  db/schema.sql          eras + items tables (idempotent)
  scripts/
    fetch-wiki.mjs       curation.json -> data/raw/<slug>.json (Wikipedia REST)
    merge-seed.mjs       curation.json + data/raw/* -> data/seed.json
    seed.mjs             apply schema.sql + upsert seed.json (idempotent)
  src/lib/               db pool, queries, types, image-proxy helper
  src/app/               pages (/ and /museum/[slug]) + API routes
  src/components/
    timeline/            TimelineCanvas, Backdrop, FilterBar, MilestoneCard, layout
    gallery/Gallery3D    the R3F Batcave gallery + touch controls
  Dockerfile             multi-stage standalone, non-root, CVE-patched
```

## Data pipeline

`curation.json` is the source of truth; Wikipedia only fills images, source
links and the fallback long-form story.

```
npm run fetch:wiki   # curation.json -> data/raw/<slug>.json (resumable, rate-limit aware)
npm run merge:seed   # data/raw/* + curation.json -> data/seed.json
npm run seed         # schema.sql + seed.json -> Postgres (idempotent upserts)
```

`fetch:wiki` skips already-fetched files, backs off on 429, and falls back to
full-text search on a 404. `merge:seed` warns on any item missing an image.

## Local development

There is no local Node toolchain; everything runs in `node:22-alpine`
containers against a Dockerised Postgres.

```bash
# 1. Postgres (named volume, host port 5433)
docker run -d --name batman-museum-pg -p 5433:5432 \
  -e POSTGRES_USER=batman -e POSTGRES_PASSWORD=<pw> -e POSTGRES_DB=batman_museum \
  -v batman-museum-pgdata:/var/lib/postgresql/data postgres:15-alpine

# 2. .env.local (gitignored) - NEVER print this value in logs
echo 'DATABASE_URL=postgresql://batman:<pw>@localhost:5433/batman_museum' > .env.local

# 3. seed + dev server in a container (reuses a named node_modules volume)
docker run --rm -v "$PWD":/app -v batman-museum-node-modules:/app/node_modules -w /app \
  --add-host=host.docker.internal:host-gateway \
  -e DATABASE_URL='postgresql://batman:<pw>@host.docker.internal:5433/batman_museum' \
  node:22-alpine npm install

docker run -d --name bm-preview -p 3000:3000 \
  -v "$PWD":/app -v batman-museum-node-modules:/app/node_modules -w /app \
  -e PGHOST_OVERRIDE=host.docker.internal --add-host=host.docker.internal:host-gateway \
  node:22-alpine sh -c 'npm run dev -- -H 0.0.0.0 -p 3000'
```

Caveats:
- **File watching is broken across the macOS->Linux bind mount** (inotify does
  not fire). After editing source you must `docker restart bm-preview` and curl
  the route to recompile; HMR will not pick up changes or new routes.
- `PGHOST_OVERRIDE` rewrites `@localhost:` in `DATABASE_URL` to
  `host.docker.internal` so a container can reach Postgres on the host.

## Configuration

The DB connection resolves in two ways (`src/lib/db.ts`):
- **Local:** `DATABASE_URL` (+ optional `PGHOST_OVERRIDE`).
- **In-cluster:** standard `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` /
  `PGDATABASE` (read natively by `pg`); no `DATABASE_URL` needed. The Deployment
  pulls `PGUSER`/`PGPASSWORD` from the shared `postgres-secret`.

Never commit or print the connection string.

## Build and deploy (GitOps)

- **Image:** `ghcr.io/batpepe/batman-museum:<commit-sha>`. Multi-stage
  `Dockerfile` produces the Next standalone server, runs as non-root, and
  patches base-image CVEs (`apk upgrade`, drops the npm CLI whose bundled
  picomatch carries a HIGH).
- **CI:** [`.github/workflows/ci-batman-museum.yml`](../../.github/workflows/ci-batman-museum.yml)
  builds (no-cache), Trivy-gates on `CRITICAL,HIGH`, smoke-tests `/api/health`,
  then bumps the image SHA in the manifest (GitOps commit).
- **K8s:** [`k8s-infrastructure/apps/batman-museum/batman-museum.yaml`](../../k8s-infrastructure/apps/batman-museum/batman-museum.yaml)
  (Deployment + Service + Ingress, namespace `apps`), registered as an ArgoCD
  `Application` in `argocd-apps/my-apps.yaml` (prune + selfHeal).
- **Database:** dedicated `batman_museum` DB in the in-cluster `postgres-service`,
  seeded once via port-forward + `npm run seed`.
- **Public routing:** the Cloudflare tunnel `k3s-homelab` sends every
  `*.batpepe.online` host to Traefik in-cluster via one wildcard ingress rule;
  Traefik then routes `museum` to this Service by the Ingress above. A proxied
  `museum` CNAME in Cloudflare DNS is the public allowlist entry. Both the
  wildcard tunnel config and the per-host DNS records are managed in
  [`terraform/cloudflare/main.tf`](../../terraform/cloudflare/main.tf).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Timeline (server-rendered, `force-dynamic`) |
| `/museum/[slug]` | First-person gallery for an era |
| `/api/timeline` | Eras + milestones JSON |
| `/api/era/[slug]` | Era + exhibits JSON (404 if unknown) |
| `/api/img?url=` | Same-origin image proxy, allowlisted to `upload.wikimedia.org` (https only, redirect re-validated) |
| `/api/health` | Liveness/readiness; no DB dependency |

## Mobile and performance

- **Timeline:** `touch-action: none` enables pinch-zoom and drag; the header,
  filter chips and hint are responsive; the backdrop is a static full-bleed
  layer (slice-scaled SVG + bottom-anchored skyline) so its edges never show.
- **Gallery:** PointerLock is desktop-only, so touch devices get drag-to-look, a
  thumb joystick and tap-to-inspect, plus a low-perf tier (no shadows, lighter
  reflector, fewer sparkles, no MSAA). `?touch=1` forces the touch UI from a
  desktop browser for QA.

Dev flags in `Gallery3D.tsx`: `DEBUG_CAM` (static 3/4 camera for screenshots,
disables walking) and `POSTFX` (bloom + vignette grade).

## Security notes

- Image proxy is a strict allowlist (https + `upload.wikimedia.org`) and
  re-checks the final URL after redirects.
- Runtime container is non-root and CVE-patched; CI fails closed on Trivy
  `CRITICAL,HIGH`.
- Secrets (`postgres-secret`) are never in Git; the DB connection string is
  never logged.
