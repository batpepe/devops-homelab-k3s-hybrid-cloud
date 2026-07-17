---
title: "Immutable tags and a CI bot that commits to main"
date: "2026-05-28"
summary: "Why every manifest pins a full commit SHA, and how the pipeline that writes those pins survives racing against itself."
tags: [gitops, argocd, github-actions, ci]
---

Every Kubernetes manifest in my repo pins its image to a full 40-character
commit SHA. `latest` gets published to the registry for convenience, but no
manifest references it - the tag that runs in the cluster is immutable and
maps one-to-one to a commit.

## The loop

The pipeline closes the GitOps loop itself:

```
push to main
  -> docker build (uncached) + push :sha and :latest
  -> trivy gate on CRITICAL/HIGH
  -> sed the new SHA into the k8s manifest
  -> git commit + push to main as a bot
  -> ArgoCD syncs the manifest change
```

That means CI writes to the same branch that triggered it. The bump commit
touches only a manifest, and the workflows are path-filtered to their own
app directory, so the bot's push does not retrigger the build - no loops.

## The race

With several app pipelines running concurrently, two bots can try to push
manifest bumps at the same time. The fix is boring and works: a retry loop
that rebases and pushes up to five times with a small random sleep. Rebasing
is safe precisely because each bump touches a different file.

## Why not a PR-based flow

For a solo repo, a PR between me and my own bot is ceremony without review.
The protections that matter are in the pipeline itself: the Trivy gate
blocks bad images, immutable tags make every deploy attributable, and
ArgoCD's prune and self-heal revert anything done out-of-band. Rollback is
`git revert` of a one-line manifest change - the old image is still in the
registry under its SHA, forever.
