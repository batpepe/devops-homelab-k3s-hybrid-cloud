# Roadmap

Prioritized backlog of DevOps practices to add. Effort tags: `S` (under 1h), `M` (1-4h), `L` (a day or more). Value tags: `quick-win`, `resume`, `hardening`.

Pick items independently - they are not strictly sequential, but the order within each section is a sensible default.

## This week - quick wins
- [x] Add `Makefile` with `lint`, `validate`, `apply`, `diff`, `help` targets - `S, quick-win`
- [x] Pin every `actions/*` step in `.github/workflows/*.yml` to a commit SHA - `S, hardening`
- [x] Add `hadolint` step (matrix over every Dockerfile) - `S, quick-win`
- [x] Add `kube-linter` step against `k8s-infrastructure/` - `S, quick-win`
- [ ] Flip Trivy `exit-code` from `'0'` to `'1'` on `HIGH+` to actually gate the pipeline - `S, hardening`
- [ ] Add `devcontainer.json` with terraform, kubectl, argocd, helm preinstalled - `S, quick-win`
- [ ] Drop `continue-on-error: true` on `lint.yml` once existing violations are cleaned up - `S, hardening`

## Next sprint - supply chain and GitOps
- [ ] Enable Renovate (or Dependabot) for Docker, Terraform, GitHub Actions, npm, pip - `S, hardening`
- [ ] Generate SBOM with syft and attach to each GHCR release - `M, resume`
- [ ] Sign images with cosign; add Kyverno `verifyImages` policy - `M, resume`
- [ ] Move Terraform state to S3 + DynamoDB lock; split into `modules/ec2` and `modules/network` - `M, resume`
- [ ] Introduce Kustomize overlays under `k8s-infrastructure/overlays/{dev,prod}` - `M, resume`
- [ ] Convert ArgoCD `Application` list to an `ApplicationSet` driven off the overlays - `M, resume`

## Mid-term - cluster security and reliability
- [ ] Replace manual secrets with **sealed-secrets** (simpler) or **External Secrets Operator** (richer) - `M, resume`
- [ ] Add `NetworkPolicy` per namespace, default-deny plus explicit allows - `M, hardening`
- [ ] Add `PodSecurity` admission label `restricted` to `apps` and `monitoring` namespaces - `S, hardening`
- [ ] Add `securityContext` to every workload: `runAsNonRoot`, `readOnlyRootFilesystem`, drop ALL caps - `M, hardening`
- [ ] Add `PodDisruptionBudget` + `HorizontalPodAutoscaler` to nginx, nodejs, flask - `S, resume`
- [ ] Add `ResourceQuota` and `LimitRange` per namespace - `S, hardening`
- [ ] Deploy **Velero** with S3 backend; nightly cluster + PVC snapshots - `L, resume`

## Observability completeness
- [ ] Add **Loki + Promtail** for log aggregation, wired into Grafana - `M, resume`
- [ ] Add **Tempo + OpenTelemetry collector**; instrument `nodejs-app` and `flask-app` - `L, resume`
- [ ] Define 2 SLOs (nodejs API availability, end-to-end CV page latency) with burn-rate alerts - `M, resume`
- [ ] Commit Grafana dashboards as code (`grafana-operator` or ConfigMap dashboards) - `M, resume`
- [ ] Add Blackbox Exporter for synthetic checks on `cv.batpepe.online` and `game.batpepe.online` - `S, resume`

## Policy and compliance
- [ ] Install **Kyverno**; ship policies: no `:latest`, require resources, require probes, disallow privileged - `M, resume`
- [ ] Scheduled CronJob running **kube-bench** with results posted to Telegram - `M, hardening`
- [ ] Add CIS-aligned audit policy on the K3s API server - `L, hardening`
- [ ] Add `tfsec` or `checkov` step in the CI workflow that touches `terraform/` - `S, hardening`

## DX and docs
- [ ] Add `CONTRIBUTING.md`, `CODEOWNERS`, and `docs/adr/0001-record-architecture-decisions.md` - `S, resume`
- [ ] Add runbooks under `docs/runbooks/`: rotate-secrets, debug-failing-pod, restore-postgres, lost-tunnel - `M, resume`
- [ ] Add pre-commit hooks: `terraform fmt`, `tflint`, `ansible-lint`, `yamllint`, `hadolint` - `S, hardening`
- [ ] Enforce Conventional Commits via commitlint in CI - `S, quick-win`

## Top three picks if time is limited
1. **Makefile + pinned action SHAs + hadolint/kube-linter** - one PR, ~1h, massive DX and supply-chain story for the resume.
2. **sealed-secrets + Kyverno baseline policies** - one PR, ~3h, removes the biggest missing GitOps pattern (secrets in Git) and shows admission control.
3. **Loki + 2 SLOs** - one PR, ~4h, lifts observability from "metrics-only" to "logs + reliability targets".

## Game backlog (apps/batman-app)
Tracked separately from the DevOps backlog above; same effort/value tags.
- [ ] Metroidvania multi-room structure: turn the single `makeArena()` into interconnected rooms with traversal gating and exploration. The seam already exists but is unused (`ROOMS` and `exits: []` in `js/world.js`); needs a room graph, camera/room transitions on `exits`, and per-room state (cleared, persistent enemies). Was the one real gap vs the original "2.5D Metroidvania" brief - `L, feature`
