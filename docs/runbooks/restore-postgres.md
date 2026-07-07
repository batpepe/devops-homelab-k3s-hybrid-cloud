# Runbook: back up and restore Postgres

One in-cluster Postgres 15 (`postgres-service`, namespace `apps`,
PVC-backed) holds two databases: `homelab_db` (nodejs CV backend) and
`batman_museum` (museum app).

## Backup (do this before risky changes)
```bash
POD=$(kubectl -n apps get pod -l app=postgres -o name | head -1)
kubectl -n apps exec $POD -- pg_dump -U devops -Fc homelab_db > homelab_db.dump
kubectl -n apps exec $POD -- pg_dump -U devops -Fc batman_museum > batman_museum.dump
```
Store dumps outside the cluster (MinIO bucket or laptop). Velero with
the in-cluster MinIO as backend is the roadmap item that automates this.

## Restore into a healthy cluster
```bash
kubectl -n apps cp homelab_db.dump $POD:/tmp/
kubectl -n apps exec $POD -- pg_restore -U devops --clean --if-exists \
  -d homelab_db /tmp/homelab_db.dump
```
Same for `batman_museum`. Then restart consumers so connection pools
reset: `kubectl -n apps rollout restart deploy/nodejs-app deploy/batman-museum`.

## PVC lost entirely
1. Let ArgoCD recreate the StatefulSet/PVC (sync the postgres app); the
   fresh instance initializes from `postgres-secret`.
2. If the secret is gone too, recreate it FIRST (same user/db values as
   README step 4), or the consumers will boot against wrong credentials.
3. Restore both dumps as above. No dump for `batman_museum`? Re-seed:
   port-forward and `npm run seed` from `apps/batman-museum` (Job-based
   seeding is a tracked backlog item).

## Verify
```bash
kubectl -n apps exec $POD -- psql -U devops -d homelab_db -c '\dt'
curl -s https://cv.batpepe.online/api/visit | head -c 200   # writes a row
curl -s https://museum.batpepe.online/api/health            # 200
curl -s https://museum.batpepe.online/api/timeline | head -c 200
```
RPO equals the age of the last dump; write down when you took it.
