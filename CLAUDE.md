## Approach
- Read files before writing. Don't re-read unchanged files.
- Thorough in reasoning, concise in output.
- No preamble, closing fluff, or sycophancy.
- No emojis, em-dashes, or smart quotes in files or commits.
- Verify SHAs, versions, flags, image tags, and chart versions by reading code or docs before asserting.
- Targeted edits over rewrites.

## Stack
Terraform (AWS eu-central-1) | Ansible | K3s + ArgoCD App-of-Apps | GHCR + Trivy
kube-prometheus-stack chart 58.2.2 | Cloudflare Tunnel | PostgreSQL 15

## Key paths
- terraform/main.tf                                      single EC2 + SG
- ansible/setup-server.yml                               Docker + nginx on EC2
- k8s-infrastructure/argocd-apps/my-apps.yaml            App-of-Apps root, 6 apps
- k8s-infrastructure/argocd-apps/monitoring-stack.yaml   prometheus-stack Helm app
- k8s-infrastructure/apps/<svc>/*.yaml                   per-workload manifests
- .github/workflows/ci-*.yml                             per-app build, scan, manifest bump
- apps/<svc>/                                            source + Dockerfile
- SECURITY.md                                            threat model, secrets policy
- ROADMAP.md                                             prioritized DevOps backlog

## Commands
- terraform -chdir=terraform fmt && terraform -chdir=terraform validate
- ansible-playbook -i ansible/inventory.ini ansible/setup-server.yml --check
- kubectl diff -f k8s-infrastructure/apps/<svc>/<file>.yaml
- argocd app sync <name> && argocd app diff <name>

## Secrets, never in Git
postgres-secret (apps), cloudflare-token (apps),
grafana-admin-secret (monitoring), tg-secret (monitoring).
Provision with `kubectl create secret generic`. Never commit values or realistic-looking examples.

## Constraints
- Manifest image tags are immutable commit SHAs. `latest` is published but never referenced from manifests.
- ArgoCD runs prune=true, selfHeal=true. Out-of-band kubectl edits get reverted.
- Argo UI lives at argocd.local, LAN only.
- Direct pushes to main are the project convention; do not open PRs unless asked.
- Never amend commits already pushed to main.

## Verification before claiming done
- Terraform: `terraform plan` shows zero destructive AWS changes unless requested.
- K8s manifests: `kubectl diff` clean and the owning ArgoCD app stays Healthy/Synced after sync.
- CI: workflow runs green on a feature branch before merging to main.
