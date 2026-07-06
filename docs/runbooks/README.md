# Runbooks

Operational procedures for this homelab. Each runbook follows the same
shape: Symptoms, Checks, Fix, Verify. They assume kubectl context on the
K3s cluster and the repo checked out.

| Runbook | Use when |
| --- | --- |
| [debug-failing-pod.md](debug-failing-pod.md) | A workload is CrashLooping, Pending or not Ready |
| [lost-tunnel.md](lost-tunnel.md) | Public hostnames return 5xx/1033, LAN access still works |
| [rotate-secrets.md](rotate-secrets.md) | Scheduled rotation or a suspected leak |
| [restore-postgres.md](restore-postgres.md) | Postgres data loss or PVC corruption |

Two ground rules:

1. ArgoCD runs `prune: true, selfHeal: true`. Never fix drift with
   `kubectl edit` on synced objects; it will be reverted. Fix in Git, or
   pause auto-sync first (`argocd app set <app> --sync-policy none`).
2. Secrets are not in Git and not managed by ArgoCD. Anything under
   `kubectl create secret` in these runbooks is safe from prune.
