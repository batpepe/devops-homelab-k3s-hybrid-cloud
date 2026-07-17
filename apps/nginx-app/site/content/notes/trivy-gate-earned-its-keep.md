---
title: "The day the Trivy gate earned its keep"
date: "2026-06-08"
summary: "A cached apk upgrade layer froze old packages into my images. The scanner caught what the build pretended to fix."
tags: [security, docker, trivy, ci]
---

Every image here starts from an Alpine base and runs `apk upgrade` early in
the Dockerfile, so OS-level CVE fixes land even when the base tag lags. Then
one day the Trivy gate went red on an image whose Dockerfile clearly ran the
upgrade. The finding (CVE-2026-45447, a HIGH) was in a package that a fresh
`apk upgrade` would have patched.

## The cache lied

Docker layer caching keyed the `RUN apk upgrade` layer on the instruction
text, which never changes. So the layer was reused from the day it was first
built - the upgrade had run once, months of CVE fixes ago, and every build
since inherited that frozen snapshot. The Dockerfile said "patched"; the
image said otherwise. Only the scanner was looking at the image.

## The fix

Builds are now deliberately uncached:

```yaml
with:
  pull: true
  no-cache: true
```

`no-cache` forces `apk upgrade` to actually execute on every build, and
`pull` refuses a stale local base image. These images are small - the
rebuild costs seconds, and in exchange the gate result reflects reality.

## The lesson

Scan artifacts, not intentions. A Dockerfile is a claim about what an image
contains; caching can quietly make the claim false. The gate sits after the
build and before anything touches the cluster, which is exactly where a
claim gets checked against the artifact itself.
