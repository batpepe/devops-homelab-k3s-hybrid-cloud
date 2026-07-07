# Runbook: rotate a secret

Secrets live only in the cluster, never in Git (SECURITY.md). Rotation
is therefore: generate a new value at the source, replace the k8s
secret in place, restart the consumers.

## The map
| Secret | Namespace | Consumers to restart |
| --- | --- | --- |
| postgres-secret | apps | postgres, nodejs-app, batman-museum |
| cloudflare-token | apps | cloudflared |
| pihole-secret | pihole | pihole |
| grafana-admin-secret | monitoring | grafana (kube-prometheus-stack) |
| tg-secret | monitoring | alertmanager/grafana alerting |
| minio-secret | minio | minio |

## Procedure (example: pihole)
```bash
# 1. Replace the secret in place (create --dry-run + apply = idempotent)
kubectl create secret generic pihole-secret -n pihole \
  --from-literal=WEBPASSWORD='<new-password>' \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Restart consumers so pods re-read env from the secret
kubectl -n pihole rollout restart deploy/pihole
kubectl -n pihole rollout status deploy/pihole
```

Postgres is the special case: changing `postgres-secret` does NOT
change the password inside an initialized database. Rotate in two
steps: `ALTER USER devops WITH PASSWORD '<new>'` via `kubectl exec`
into the postgres pod first, then update the secret and restart the
consumers listed above.

External sources (rotate at the provider first): cloudflare-token in
the Zero Trust dashboard (tunnel token), tg-secret via BotFather.

## Verify
- Consumers Running/Ready, ArgoCD apps still Healthy (secrets are not
  ArgoCD-managed, nothing should drift).
- App-level check: log into Grafana/Pi-hole/MinIO with the new value;
  `curl https://cv.batpepe.online/api/visit` exercises the Postgres path.

If a secret ever landed in Git history, treat it as leaked: rotate at
the source immediately; do not force-push history (repo convention),
just make the old value worthless.
