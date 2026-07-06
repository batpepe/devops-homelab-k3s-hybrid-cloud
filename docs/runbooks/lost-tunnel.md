# Runbook: public hostnames down (Cloudflare tunnel)

## Symptoms
- `cv.` / `game.` / `museum.batpepe.online` return Cloudflare 5xx or
  error 1033; LAN access to the same services still works.
- All public hosts fail together (single tunnel, wildcard rule).

## How routing works (one minute)
DNS: each public host is a proxied CNAME to
`<tunnel-id>.cfargotunnel.com`, managed in `terraform/cloudflare`
(`tunnel_hosts` is the allowlist). Tunnel: one wildcard ingress rule
sends `*.batpepe.online` to Traefik; per-host routing is the Ingress
objects in `k8s-infrastructure/apps/*`. A host is public only if BOTH
its CNAME and an Ingress exist.

## Checks
```bash
kubectl -n apps get pods -l app=cloudflared        # pod up?
kubectl -n apps logs deploy/cloudflared --tail=50  # register/heartbeat errors?
kubectl -n apps get secret cloudflare-token        # token still there?
terraform -chdir=terraform/cloudflare plan         # config drift vs repo?
```
One host down, others fine: it is not the tunnel. Check that host's
Ingress and Service, then its DNS entry in `tunnel_hosts`.

## Fix
- Pod crashlooping on auth: token was rotated or deleted. Recreate:
  `kubectl create secret generic cloudflare-token -n apps
  --from-literal=token='<tunnel-token>'` then
  `kubectl -n apps rollout restart deploy/cloudflared`.
- Tunnel config drifted (someone edited the dashboard): `terraform
  -chdir=terraform/cloudflare apply` restores the wildcard design.
- New host missing publicly: add it to `tunnel_hosts` AND ship an
  Ingress; apply the module.

## Verify
```bash
curl -I https://cv.batpepe.online          # 200, server: cloudflare
kubectl -n apps logs deploy/cloudflared --tail=5   # heartbeats clean
```
