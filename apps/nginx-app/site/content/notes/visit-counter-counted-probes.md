---
title: "My visit counter was counting its own liveness probes"
date: "2026-07-17"
summary: "1.1 million visits sounded great until I read the server code: a catch-all handler was logging every kubelet probe as a visitor."
tags: [kubernetes, nodejs, debugging, observability]
---

The visit counter on this site's front page crossed a million and I finally
asked the obvious question. The backend was a tiny Node HTTP server with no
router: every request on every path inserted a row into the `visits` table
and returned the count. Simple, honest, wrong.

## The math

The Deployment's liveness and readiness probes both pointed at `/`:

```yaml
livenessProbe:
  httpGet: { path: /, port: 80 }
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /, port: 80 }
  periodSeconds: 5
```

That is one "visit" every 10 seconds plus one every 5 seconds - about
26,000 rows a day, from the kubelet alone, around the clock. The counter
was mostly a measure of how long the pod had been alive.

## The fix

The rewrite gave the server actual routes: `/api/visit` is the only path
that inserts, and a new `/health` endpoint answers probes without touching
the database at all. The probes moved to `/health` in the same commit. To
keep the rollout order-independent, the new server still answers 200 on `/`
- so old probes stay green against the new image, and the old image
(which answered 200 on everything) stayed green against the new probe path.

The historical rows stay. They are not distinguishable in hindsight, and
deleting data to make a number prettier is how you learn to distrust your
own metrics. The daily-visits series simply self-heals from the deploy
forward.

## The lesson

Probes are traffic. Anything your handler does per-request - counters,
logs, cache fills, rate limits - it will do for the kubelet too, forever,
at a rate you configured and then forgot. Give infrastructure endpoints
their own path, and make them free.
