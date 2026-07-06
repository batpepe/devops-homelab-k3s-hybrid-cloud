# Runbook: debug a failing pod

## Symptoms
- ArgoCD app shows Degraded/Progressing, or a public page is down.
- `kubectl -n apps get pods` shows CrashLoopBackOff, ImagePullBackOff,
  CreateContainerConfigError or Pending.

## Checks (in this order)
```bash
kubectl -n <ns> get pods                          # which pod, which state
kubectl -n <ns> describe pod <pod>                # events at the bottom
kubectl -n <ns> logs <pod> --previous             # why the last run died
kubectl -n <ns> get events --sort-by=.lastTimestamp | tail -20
argocd app get <app>                              # sync + health from GitOps view
```

## Common causes in this repo
| State | Usual cause here | Fix |
| --- | --- | --- |
| ImagePullBackOff | CI bump wrote a SHA that never got pushed to GHCR (Trivy gate failed after the manifest commit) | check the failed workflow run; rerun or revert the manifest bump commit |
| CreateContainerConfigError | one of the manual secrets is missing in that namespace | recreate it, see [rotate-secrets.md](rotate-secrets.md) |
| CrashLoopBackOff | app cannot reach Postgres, or probe path changed | logs --previous; check `postgres-service` and probe paths in the manifest |
| Pending | PVC unbound on the single-node cluster | `kubectl get pvc -A`; local-path provisioner logs in kube-system |

## Fix
Fix the cause in Git (manifest or image), push to main, let ArgoCD sync.
Out-of-band `kubectl` changes to synced objects self-heal back within
minutes and mask the real problem.

## Verify
```bash
kubectl -n <ns> get pods                # Running, READY 1/1
argocd app get <app>                    # Healthy / Synced
curl -I https://<host>.batpepe.online   # public path, if exposed
```
