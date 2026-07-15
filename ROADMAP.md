# Roadmap

Prioritized backlog of DevOps practices to add. Effort tags: `S` (under 1h), `M` (1-4h), `L` (a day or more). Value tags: `quick-win`, `resume`, `hardening`.

Pick items independently - they are not strictly sequential, but the order within each section is a sensible default.

## This week - quick wins
- [x] Add `Makefile` with `lint`, `validate`, `apply`, `diff`, `help` targets - `S, quick-win`
- [x] Pin every `actions/*` step in `.github/workflows/*.yml` to a commit SHA - `S, hardening`
- [x] Add `hadolint` step (matrix over every Dockerfile) - `S, quick-win`
- [x] Add `kube-linter` step against `k8s-infrastructure/` - `S, quick-win`
- [x] Flip Trivy `exit-code` from `'0'` to `'1'` on `HIGH+` to actually gate the pipeline (done in fd879da; gate proved itself by catching CVE-2026-45447, see 8ecbaa7/50081dd for the cache fix it forced) - `S, hardening`
- [x] Add `devcontainer.json` with terraform, kubectl, argocd, helm preinstalled (`.devcontainer/devcontainer.json`: terraform + kubectl/helm features, argocd CLI via postCreate) - `S, quick-win`
- [ ] Drop `continue-on-error: true` on `lint.yml` once existing violations are cleaned up - `S, hardening`
- [ ] Finish retiring `api.batpepe.online`: drop `api` from `tunnel_hosts` in terraform/cloudflare and apply (deletes the live DNS record) - `S, hardening`

## Next sprint - supply chain and GitOps
- [x] Enable Renovate (or Dependabot) for Docker, Terraform, GitHub Actions, npm, pip (.github/dependabot.yml, weekly, plus devcontainers monthly) - `S, hardening`
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
- [ ] Deploy **Velero** with S3 backend; nightly cluster + PVC snapshots (in-cluster MinIO at minio.minio.svc:9000 is ready as the backend) - `L, resume`

## Observability completeness
- [ ] Add **Loki + Promtail** for log aggregation, wired into Grafana - `M, resume`
- [ ] Add **Tempo + OpenTelemetry collector**; instrument `nodejs-app` and `flask-app` - `L, resume`
- [ ] Define 2 SLOs (nodejs API availability, end-to-end CV page latency) with burn-rate alerts - `M, resume`
- [ ] Commit Grafana dashboards as code (`grafana-operator` or ConfigMap dashboards) - `M, resume`
- [x] Add Blackbox Exporter for synthetic checks on `cv.batpepe.online` and `game.batpepe.online` (manifests existed in argocd-apps/blackbox.yaml but were never bootstrapped; applied 2026-06-11, both apps Healthy) - `S, resume`

## Policy and compliance
- [ ] Install **Kyverno**; ship policies: no `:latest`, require resources, require probes, disallow privileged - `M, resume`
- [ ] Scheduled CronJob running **kube-bench** with results posted to Telegram - `M, hardening`
- [ ] Add CIS-aligned audit policy on the K3s API server - `L, hardening`
- [x] Add `tfsec` or `checkov` step in the CI workflow that touches `terraform/` (done as a `trivy config` job plus a `terraform fmt -check` job in lint.yml; tfsec's checks merged into trivy) - `S, hardening`

## DX and docs
- [x] Add `CONTRIBUTING.md`, `CODEOWNERS`, and `docs/adr/0001-record-architecture-decisions.md` (plus ADR-0002 tunnel routing, ADR-0003 CI bump pattern) - `S, resume`
- [x] Add runbooks under `docs/runbooks/`: rotate-secrets, debug-failing-pod, restore-postgres, lost-tunnel - `M, resume`
- [x] Add pre-commit hooks: `terraform fmt`, `tflint`, `ansible-lint`, `yamllint`, `hadolint` (.pre-commit-config.yaml + `make hooks`) - `S, hardening`
- [x] Enforce Conventional Commits via commitlint in CI (commitlint.yml + commitlint.config.mjs; type-enum extended with `gitops` for the bot bumps) - `S, quick-win`

## Top three picks if time is limited
(The 2026-06 list - Makefile, pinned SHAs, hadolint/kube-linter - is done, as is the July CI/DX sweep: IaC gate, dependabot, gitleaks, runbooks, ADRs, pre-commit, commitlint.)
1. **sealed-secrets + Kyverno baseline policies** - one change-set, ~3h, removes the biggest missing GitOps pattern (secrets outside Git) and shows admission control.
2. **securityContext + resources everywhere, PodSecurity restricted** - ~2h, turns the kube-linter report-only findings into fixes and lets lint.yml gates tighten.
3. **Loki + 2 SLOs** - ~4h, lifts observability from "metrics-only" to "logs + reliability targets".

## Game backlog (apps/batman-app)
Tracked separately from the DevOps backlog above; same effort/value tags.
- [x] Increment 4 - flow and polish: pause overlay (P/Esc + on-screen button), main-menu return from game over and pause (survival was a one-way trap before), floating score popups, prefers-reduced-motion damping for shake/flash, cached collision arrays (no per-frame concat), smoke tests for survival entry and pause flow - `M, feature`
- [x] Increment 5 - Metroidvania multi-room structure: campaign is now a 4-room graph (courtyard -> skybridge -> undercroft -> enforcer hall) with fade transitions on `exits`, per-room persistence (cleared enemies stay dead, loot is once-only), a grapple-gated crossing, a lockable boss arena and a boot-time `validateRoomGraph()` check wired into the smoke tests. Survival still runs on the untouched arena. Closed the last gap vs the original "2.5D Metroidvania" brief - `L, feature`

## Museum backlog (apps/batman-museum)
Full-stack Next.js + R3F app deployed via the same GitOps path. See [apps/batman-museum/README.md](apps/batman-museum/README.md).
- [x] Ship the museum: constellation timeline (d3-zoom + GSAP) + first-person Batcave galleries (R3F), Wikipedia-sourced data in a dedicated in-cluster `batman_museum` Postgres DB, standalone non-root CVE-patched image, `ci-batman-museum.yml`, ArgoCD app, public at `museum.batpepe.online` (SHA `699e5ab`) - `L, feature`
- [x] Full-bleed backdrop fix + mobile support: slice-scaled edge-free backdrop, touch pan/zoom on the timeline, touch look/joystick/tap controls + low-perf tier in the gallery (SHA `c83018c`) - `M, feature`
- [ ] Add `securityContext` (runAsNonRoot, readOnlyRootFilesystem, drop ALL caps) to the museum Deployment - `S, hardening`
- [ ] Seed the in-cluster DB from a Job instead of a manual port-forward - `S, resume`
