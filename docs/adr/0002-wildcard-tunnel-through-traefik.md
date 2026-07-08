# ADR-0002: One wildcard tunnel rule through Traefik

Date: 2026-07-08 (decision made 2026-06-17, recorded retroactively)
Status: accepted

## Context
The Cloudflare tunnel originally mapped each public hostname directly
to its Service, bypassing Traefik. Consequences we actually hit:
same-origin paths broke (`cv.batpepe.online/api` hit nginx, 404,
"API Offline"), the live config drifted from `terraform/cloudflare`,
and adding the museum host required a one-off API script because a
terraform apply would have broken `api.batpepe.online`.

## Decision
A single wildcard ingress rule sends `*.batpepe.online` to Traefik
in-cluster; per-host and per-path routing is done by Ingress objects
that live next to each workload. DNS CNAMEs (the `tunnel_hosts` set)
act as the public allowlist. The whole control plane is
`terraform/cloudflare`, applied after importing the existing DNS
records; the live tunnel config is version 8 of that cutover.

## Consequences
- Exposing a host is one Ingress plus one `tunnel_hosts` entry, both
  reviewed in Git; no dashboard clicking, no drift.
- Same-origin path routing works (cv `/api` -> nodejs, `/` -> nginx).
- Traefik becomes a single hop for all public traffic; acceptable for
  a homelab, and it is where k3s already terminates LAN traffic.
- `api.batpepe.online` intentionally 404s until its DNS record is
  removed (tracked in ROADMAP).
- Anything NOT in `tunnel_hosts` stays unreachable even with a
  wildcard rule, because no DNS record resolves to the tunnel.
