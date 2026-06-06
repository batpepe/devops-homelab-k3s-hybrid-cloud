# Learning Log

Shared memory between the chat mentor (theory) and the code mentor (practice).
Keep it lean: durable facts, decisions, and open questions only - never a transcript.
Claude Code updates this automatically on `/learn`, `/practice`, `/drill`, and `/handoff`.

How to use it:
- Start a coding session by skimming "In progress" and "Weak spots".
- End a coding session with `/handoff` - it writes a "Done" entry and a paste-block for the chat mentor.
- Start a chat (theory) session by pasting the latest "Open questions".

---

## In progress
<!-- topic - lab/roadmap item - started YYYY-MM-DD -->
- (none yet)

## Done
<!-- newest first -->
| Date | Topic | What landed (paths/SHAs) | Verified by |
| --- | --- | --- | --- |
| 2026-06-06 | Trivy gate + image hardening (Phase 5) | Trivy `exit-code 1` on `CRITICAL,HIGH` across 4 `.github/workflows/ci-*.yml`; nginx/batman to `nginx:stable-alpine` + `apk upgrade`; nodejs drops bundled npm (picomatch); manifest push-retry loop. SHAs `fd879da`, `4e0ec5a` | local `docker build`+`trivy` 0 HIGH+ on all 4; nginx+nodejs CI green; batman pending re-run (push race, not gate) |
| 2026-06-06 | Setup | Installed Claude Code mentor system (commands, subagent, curriculum) | `/status`, `/agents`, `/help` show config |

## Weak spots (feed these into /drill)
- Trivy gate semantics: `exit-code`, `--ignore-unfixed`, comma-separated severity; this gates *deploy* (the manifest bump) not *publish* (the image is pushed before the scan runs).
- Where a CVE lives decides the fix: OS package (`apk upgrade`) vs tooling bundled in the base image (`npm` inside the node image - remove it or wait for upstream) vs app dependency (lockfile/override).
- GitOps CI write-contention: workflows that commit back to the same branch race on `git push`; mitigate with retry+rebase or a shared `concurrency` group.

## Open questions for the chat (theory) mentor
<!-- be specific; paste these into the claude.ai DevOps project -->
- Image CVE policy at scale: is "block HIGH+ with `--ignore-unfixed`, zero ignores" realistic, or is the mature pattern block-CRITICAL + warn-HIGH + time-boxed `.trivyignore`/VEX burndown? When is accepting a CVE with justification the right call vs chasing zero?
- Distroless tradeoffs: `gcr.io/distroless/nodejs22-debian12` shipped a CRITICAL openssl we could not patch (no apt/shell). When does distroless actually lower risk vs a patched alpine (`apk upgrade`)? How do teams keep distroless current (rebuild cadence, digest pinning, Renovate)?
- GitOps "CI writes image SHAs back to main": anti-pattern or fine? Alternatives (Argo CD Image Updater, separate config repo, write to a branch + auto-merge) and how is push-contention handled in mature setups?

## Decisions log
<!-- one line each: decision + why + date -->
- 2026-06-06: Reasoning effort pinned to MAX; rely on context hygiene to control burn.
- 2026-06-06: Gate Trivy on HIGH+ (`exit-code 1`, `CRITICAL,HIGH`, keep `--ignore-unfixed`), zero ignores by fixing images. Why: a real fail-closed gate beats a decorative scan.
- 2026-06-06: nodejs runtime stays alpine with npm removed, not distroless. Why: distroless node shipped 1 CRIT + 4 HIGH (openssl) with no apt to patch; alpine 3.23.4 is 0-OS and picomatch came only from bundled npm.
- 2026-06-06: Manifest-push race fixed with pull--rebase+push retry loop, not `concurrency`. Why: keeps app builds parallel and targets the actual contention point.
