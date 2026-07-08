# ADR-0003: CI writes image SHAs back to main

Date: 2026-07-08
Status: accepted (revisit if app count grows past ~10 or pushes start racing weekly)

## Context
GitOps needs the manifest to reference the new image after every build.
Someone has to write that reference. Options considered:

1. CI workflow commits the SHA bump to main (current).
2. ArgoCD Image Updater watches GHCR and writes back itself.
3. A separate config repo, app repo CI opens a change there.
4. CI pushes a branch + auto-merge.

## Decision
Keep option 1: each `ci-*.yml` rewrites its manifest's `image:` line
and pushes to main with a pull-rebase retry loop (up to 5 attempts,
random backoff). Tags are immutable commit SHAs; `latest` is published
but never referenced by manifests.

## Consequences
- Simplest possible loop to reason about and debug: one workflow, one
  commit, visible in history as `gitops: update <app> ...`.
- main history carries bot commits; acceptable noise at this scale.
- Write contention between parallel app builds is real and was hit;
  the rebase-retry loop targets exactly that point (see LEARNING_LOG
  2026-06-06 decision) instead of serializing builds with concurrency
  groups.
- The workflow token needs `contents: write`, which is broader than a
  build-only pipeline would need; scoped per-workflow, actions pinned
  by SHA, and the gate runs before the bump so a vulnerable image
  never gets referenced.
- Image Updater or a config repo would decouple build from deploy
  metadata, at the cost of another controller (or repo) to operate;
  not worth it for a single-node homelab yet.
