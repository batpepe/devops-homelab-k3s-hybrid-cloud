---
name: Batman Museum
tagline: A walkable 3D museum with a real content pipeline
stack:
  - Next.js 15
  - React Three Fiber
  - TypeScript
  - Tailwind CSS
  - PostgreSQL
  - Docker
  - GitHub Actions
live: https://museum.batpepe.online
source: https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud/tree/main/apps/batman-museum
order: 2
---

## The concept

Two linked experiences. The landing page is an infinite zoomable star map -
each era of Batman history is a constellation, each milestone a star that
opens a Batcomputer file card. From any star you can enter that era's
gallery: a first-person walkable Batcave wing rendered with React Three
Fiber, with spotlights, a wet reflective floor and volumetric fog.

## Content is data, not copy-paste

All 49 exhibits across 7 eras are real, sourced from Wikipedia through a
scripted pipeline: a fetch script pulls lead images and extracts, a curation
file adds hand-written impact lines and fun facts, a merge script produces a
single seed file, and an idempotent seeder upserts it into PostgreSQL. The
app reads from the database at request time - fixing a typo is a data change,
not a deploy.

## Security details I care about

Exhibit artwork is proxied through a same-origin `/api/img` route with a
strict allowlist: https-only, `upload.wikimedia.org` only, re-validated after
redirects. The container is a multi-stage standalone build running as a
non-root user, with the npm CLI removed from the final image.

## Performance tiers

Touch devices get a reduced tier automatically: no shadows, smaller
reflections, fewer particles, lower device-pixel ratio. Desktop gets bloom
and vignette post-processing. All wall and floor detail is procedural - the
image weight of the whole scene is essentially zero.

## Operations

The museum deploys like everything else here: CI builds the image, Trivy
gates it, a smoke test curls `/api/health`, and the manifest gets the new
SHA. ArgoCD does the rest.
