---
name: The GitOps Platform
tagline: Hybrid-cloud homelab that runs everything on this domain
stack:
  - K3s
  - ArgoCD
  - Terraform
  - Ansible
  - GitHub Actions
  - Trivy
  - Cloudflare Tunnel
  - Prometheus
  - Loki
  - PostgreSQL
live: https://cv.batpepe.online/status
source: https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud
order: 1
---

## The problem

I wanted production discipline, not a toy: real workloads on my own hardware,
public on the internet, with zero open inbound ports at home and every change
flowing through version control. The constraint that shaped everything else
was simple - if it is not in git, it does not exist.

## The shape of the platform

A single K3s node runs around a dozen ArgoCD Applications managed through the
app-of-apps pattern: this site, a 3D museum, a browser game, PostgreSQL,
Pi-hole, Vaultwarden, MinIO, Uptime Kuma and the monitoring stack. Terraform
manages two independent root modules - AWS (an EC2 that can be destroyed and
recreated without touching anything else) and Cloudflare (tunnel routing and
DNS). Ansible bootstraps hosts.

## How a change ships

Every application has its own CI pipeline triggered by path filters:

1. Docker build, deliberately uncached so base-image CVE fixes always land.
2. Trivy scan gates on CRITICAL and HIGH - a red scan blocks the deploy.
3. The pipeline writes the new image tag, a full 40-character commit SHA,
   into the Kubernetes manifest and pushes to main.
4. ArgoCD notices the manifest change and syncs with prune and self-heal
   enabled, so drift gets reverted automatically.

Mutable tags never reach the cluster: `latest` is published for convenience
but no manifest references it. Rollback is `git revert`.

## Edge without open ports

Inbound traffic arrives through a Cloudflare Tunnel: a `cloudflared` pod
inside the cluster dials out, and a single wildcard rule hands every hostname
to Traefik, where per-host Ingress rules do the routing. Which hostnames are
public is controlled by an explicit DNS allowlist in Terraform - a hostname
resolves if and only if it is listed there. My home IP appears nowhere.

## Observability

kube-prometheus-stack scrapes the cluster, Loki aggregates logs, Blackbox
probes the public endpoints and Alertmanager pushes to Telegram. Uptime Kuma
watches from the user's point of view. Alert rules are part of the repo, so
a broken alert is a reviewable diff, not a dashboard mystery.

## What broke and taught me

The best parts of this platform are fixes: the Trivy gate that failed on a
stale cached layer and forced uncached builds, the tunnel cutover from
per-host rules to wildcard-plus-Ingress done without downtime, and a visit
counter that turned out to be counting its own liveness probes. Those stories
live in the [notes](/notes) section.
