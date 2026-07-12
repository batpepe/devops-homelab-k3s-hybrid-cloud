# DevOps Curriculum (theory <-> practice)

Shared source of truth for both mentors:
- **Claude chat (theory mentor)** drives the "Theory" column: concepts, tradeoffs, the why.
- **Claude Code (practice mentor)** drives the "Practice" column: we build it here, mapped to real ROADMAP.md items.

Work one phase at a time, but phases are not strictly sequential - jump where motivation and the roadmap pull you. After each practice block, run `/handoff` so the chat mentor sees what landed.

Legend for practice items: they mirror `ROADMAP.md`. `[R]` = exists in roadmap, `[X]` = already done in repo.

---

## Phase 0 - Foundations (refresh as needed)
- **Theory:** Linux processes/permissions/systemd, networking (DNS, TCP/TLS, CIDR, NAT), HTTP, the 12-factor app, Git internals (objects, refs, rebase vs merge).
- **Practice:** read your own repo end to end with `/explain`; trace one request from `cv.batpepe.online` through Cloudflare Tunnel -> Traefik -> nginx -> node -> Postgres.
- **Done when:** you can whiteboard that request path from memory.

## Phase 1 - Containers and images
- **Theory:** image layers, build cache, multi-stage builds, distroless/non-root, OCI, registries and digests vs tags.
- **Practice:**
  - `[X]` hadolint over every Dockerfile (already in CI - `/explain .github/workflows`).
  - `[X]` add `devcontainer.json` with terraform, kubectl, argocd, helm preinstalled (`.devcontainer/`, 2026-07-09).
  - Rebuild one app image multi-stage + non-root; compare size and Trivy findings.
- **Done when:** an app image runs as non-root with a read-only root filesystem and passes Trivy HIGH.

## Phase 2 - Infrastructure as Code (Terraform + Ansible)
- **Theory:** desired state, the state file, drift, plan/apply lifecycle, modules and remote state + locking, idempotency in Ansible.
- **Practice:**
  - `[R]` move Terraform state to S3 + DynamoDB lock.
  - `[R]` split Terraform into `modules/ec2` and `modules/network`.
  - `[X]` add `tfsec` or `checkov` to the Terraform CI job (trivy config in lint.yml, enforcing since 2026-07-05).
- **Done when:** `terraform plan` is clean from a fresh checkout using remote state, and a security scan gates the IaC job. (Second half done: the scan gates.)

## Phase 3 - Kubernetes core (K3s)
- **Theory:** API server/etcd/scheduler/kubelet, the reconcile loop, Deployment vs ReplicaSet vs Pod, Services and kube-proxy, probes, requests/limits and QoS, scheduling.
- **Practice:**
  - `[R]` add `securityContext` to every workload (runAsNonRoot, readOnlyRootFilesystem, drop ALL caps).
  - `[R]` add `ResourceQuota` + `LimitRange` per namespace.
  - `[R]` add `PodDisruptionBudget` + `HorizontalPodAutoscaler` to nginx, nodejs, flask.
- **Done when:** every pod has resources + probes + a hardened securityContext, and an HPA scales under load.

## Phase 4 - GitOps with ArgoCD
- **Theory:** pull vs push CD, reconciliation, drift detection, prune/selfHeal blast radius, App-of-Apps vs ApplicationSet, sync waves and hooks, Kustomize overlays.
- **Practice:**
  - `[X]` App-of-Apps already live - `/explain k8s-infrastructure/argocd-apps/my-apps.yaml`.
  - `[R]` introduce Kustomize overlays `overlays/{dev,prod}`.
  - `[R]` convert the Application list to an `ApplicationSet` driven off the overlays.
  - Experiment: hand-edit a synced Deployment, watch selfHeal revert it, explain why.
- **Done when:** dev/prod render from overlays via one ApplicationSet and you can predict what prune will and will not delete.

## Phase 5 - CI/CD and supply chain
- **Theory:** pipeline stages, artifact promotion, SLSA, SBOM, image signing and verification, provenance, least-privilege CI tokens.
- **Practice:**
  - `[X]` actions pinned to SHAs; kube-linter in CI.
  - `[X]` flip Trivy `exit-code` to `1` on HIGH+ to actually gate (fd879da, 2026-06-06; it has caught a real CVE since).
  - `[R]` generate SBOM with syft, attach to each GHCR release.
  - `[R]` sign images with cosign; add Kyverno `verifyImages`.
  - `[X]` enable Renovate/Dependabot across Docker, Terraform, Actions, npm, pip (.github/dependabot.yml, 2026-07-10; secret scanning via gitleaks landed the same week).
- **Done when:** an unsigned or HIGH-CVE image cannot reach the cluster.

## Phase 6 - Observability and SLOs
- **Theory:** metrics vs logs vs traces, RED/USE methods, PromQL, cardinality, alert design, SLI/SLO/error budgets and burn-rate alerts.
- **Practice:**
  - `[X]` kube-prometheus-stack + Telegram alerts live - `/explain` the PrometheusRule.
  - `[R]` add Loki + Promtail, wire into Grafana.
  - `[R]` add Tempo + OpenTelemetry; instrument nodejs and flask.
  - `[R]` define 2 SLOs (nodejs API availability, CV page latency) with burn-rate alerts.
  - `[R]` Blackbox Exporter synthetic checks on both public hostnames.
- **Done when:** a synthetic failure and an SLO burn-rate breach both page you, and you can pull the matching logs/traces.

## Phase 7 - Security, policy, reliability
- **Theory:** secrets management patterns, admission control (validating/mutating), Pod Security Standards, NetworkPolicy default-deny, CIS benchmarks, backup/restore and RTO/RPO.
- **Practice:**
  - `[R]` replace manual secrets with sealed-secrets or External Secrets Operator.
  - `[R]` NetworkPolicy per namespace (default-deny + explicit allows).
  - `[R]` PodSecurity `restricted` on apps and monitoring.
  - `[R]` Kyverno baseline policies (no :latest, require resources/probes, disallow privileged).
  - `[R]` kube-bench CronJob -> Telegram; CIS audit policy on the K3s API server.
  - `[R]` Velero with S3 backend, nightly cluster + PVC snapshots; then practice a restore.
- **Done when:** no secret lives in Git, default-deny networking is on, policies block bad manifests, and you have rehearsed a restore.

---

## Suggested first month (matches ROADMAP "top three")
1. Week 1: Phase 5 quick wins - flip Trivy gate, Renovate. (`/practice`)
2. Week 2: Phase 7 - sealed-secrets + Kyverno baseline. (`/learn "admission control"` then `/practice`)
3. Week 3: Phase 3 hardening - securityContext + resources everywhere. (`/practice`)
4. Week 4: Phase 6 - Loki + 2 SLOs. (`/learn "SLOs and burn-rate alerts"` then `/practice`)
