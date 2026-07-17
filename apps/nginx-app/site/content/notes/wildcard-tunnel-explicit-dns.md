---
title: "Wildcard tunnel, explicit DNS: how this domain routes"
date: "2026-06-20"
summary: "Moving per-host tunnel rules into the cluster without downtime, and why the DNS record set became my public allowlist."
tags: [cloudflare, traefik, terraform, networking]
---

Every public hostname on this domain reaches my cluster through a Cloudflare
Tunnel: a `cloudflared` pod dials out to Cloudflare, so nothing at home
listens on the internet. Originally the tunnel configuration mapped each
hostname to its Kubernetes service one by one. That worked, but it meant two
systems knew about routing - the tunnel config and the cluster's Ingress
objects - and they could disagree.

## The two-layer model

The cutover (2026-06-17) collapsed routing into two layers with one job each:

1. **The tunnel config has a single wildcard rule.** `*.batpepe.online`
   forwards to Traefik's in-cluster service. The tunnel no longer knows or
   cares which apps exist.
2. **DNS records are the public allowlist.** A hostname is reachable from
   the internet if and only if a proxied CNAME for it exists - and those
   records are managed by Terraform in a single locals list. Adding a public
   host is a one-line diff plus an Ingress manifest.

Per-host routing happens where it belongs, in Traefik Ingress rules that
live in git next to the workloads they route.

## Doing it without downtime

The trick is that the two layers are independent. I applied the wildcard
tunnel rule first - existing DNS records kept resolving, and requests just
started taking the new path through Traefik. Only then did I import the DNS
records into Terraform so the allowlist became code. At no point did a
hostname stop resolving.

## What I like about it

The failure modes got better. Forgetting to add a DNS record fails closed:
the app simply is not public. Under the old model, a stale per-host tunnel
rule could route traffic to a service that no longer existed - failing
half-open, with a confusing error. And auditing the public surface is now
`git grep` instead of clicking through a dashboard.
