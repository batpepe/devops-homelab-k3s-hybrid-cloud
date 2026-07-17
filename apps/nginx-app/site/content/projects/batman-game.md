---
name: "Batman: Shadows of Gotham"
tagline: A canvas beat-em-up with a CI smoke suite
stack:
  - JavaScript
  - Canvas 2D
  - nginx
  - Playwright
  - GitHub Actions
live: https://game.batpepe.online
source: https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud/tree/main/apps/batman-app
order: 3
---

## No framework, on purpose

The game is vanilla JavaScript ES modules on a Canvas 2D context - no
bundler, no build step, no dependencies at runtime. The browser loads the
modules directly and nginx serves the files. Keeping the toolchain at zero
makes the deploy trivially reproducible and the whole codebase readable
top to bottom.

## The engine

A fixed-timestep game loop drives separate systems: input, camera, physics,
a room-graph world (courtyard, skybridge, arena), enemies with simple AI, a
boss fight, gadgets (batarang, grapple), parry and dash mechanics with
hitstop, and an HUD with cooldown dials and a combo bar. Two modes: a short
campaign and an endless survival arena.

## Tested like a service, not like a toy

The part I am proudest of is the CI: a Playwright smoke suite boots the real
container image and verifies that the campaign starts, the HUD renders, the
room graph is consistent, state survives room transitions, and pause/resume
works - all with zero console errors. The suite runs between the Trivy scan
and the manifest update, so a broken build never reaches the cluster even
though every push deploys automatically.

## Why it exists

Partly for fun. Mostly because a static site, an API and a database do not
exercise the platform the way an interactive canvas app does - and because
demoing infrastructure is easier when something on it is worth clicking.
