# Security Policy

This document describes how security is handled in this homelab project — what is in scope, how secrets are managed, and how to report a vulnerability. Although this is a personal/portfolio project, it runs real workloads exposed through a Cloudflare Tunnel, so the policies below are treated as production-grade.

## Supported Versions
Only the `main` branch is supported. The deployed cluster always tracks the latest commit on `main`; older revisions receive no security updates.

| Branch | Status |
| --- | --- |
| `main` | ✅ Supported — receives security patches |
| any other branch / tag | ❌ Not supported |

## Reporting a Vulnerability
**Please do not open a public GitHub issue for security problems.**

Report privately through one of:
- GitHub Security Advisories — *Security → Report a vulnerability* on this repo
- Email: **oskostya25@gmail.com** (PGP key available on request)

When reporting, please include:
1. A description of the issue and the component it affects (Terraform, Ansible, K8s manifest, application code, CI workflow).
2. Steps to reproduce or a proof-of-concept.
3. The impact you believe it has (information disclosure, RCE, privilege escalation, etc.).
4. Any suggested remediation.

**Response targets**
- Acknowledgement: within **72 hours**.
- Initial assessment & severity: within **7 days**.
- Fix or mitigation for High/Critical issues: within **30 days**.

You will be credited in the commit / release notes unless you ask to remain anonymous.

## Scope
**In scope**
- Terraform modules under `terraform/` (AWS misconfiguration, overly broad IAM, exposed state).
- Ansible playbooks under `ansible/`.
- Kubernetes manifests under `k8s-infrastructure/` (RBAC, network policy gaps, privileged containers, hard-coded credentials).
- ArgoCD `Application` definitions.
- Application source code under `apps/` (`flask-app`, `nodejs-app`, `nginx-app`, `batman-app`).
- GitHub Actions workflows in `.github/workflows/` (token scope, injection, untrusted input handling).

**Out of scope**
- Vulnerabilities in upstream dependencies that have no published fix (report them upstream).
- Findings that require physical access to the homelab.
- Social-engineering or phishing scenarios.
- DoS that requires sustained traffic floods.
- The live demo domains (`*.batpepe.online`) — only the *code/config* behind them is in scope, not load testing the live services.

## Threat Model & Posture
- **Public ingress.** No inbound ports are opened on the home network. All external traffic enters through a Cloudflare Tunnel terminated by `cloudflared` running in-cluster. The Cloudflare edge provides WAF, TLS termination, and DDoS mitigation.
- **SSH to AWS.** The Terraform security group restricts port 22 to a single `/32` defined in `terraform.tfvars` (which is gitignored). HTTP is open to the world only on the cloud demo host.
- **Cluster access.** ArgoCD is exposed only via an internal `argocd.local` ingress; access requires being on the LAN (or via Pi-hole DNS).
- **Container supply chain.** Images are built in GitHub Actions, pushed to GHCR, and scanned with Trivy, which fails the build on `CRITICAL` or `HIGH` CVEs before deployment. Images are not signed yet (cosign is on the checklist below); every third-party GitHub Action is pinned to a full commit SHA. Image tags are immutable commit SHAs — `latest` is published but never referenced by manifests.
- **GitOps integrity.** ArgoCD reconciles with `prune: true` and `selfHeal: true`. Any out-of-band change to the cluster is reverted to the Git state.

## Secrets Policy
**No secret is ever committed to this repository.** The following objects are created manually with `kubectl create secret` and referenced by name from manifests; they are explicitly *not* managed by ArgoCD:

| Secret | Namespace | Used by |
| --- | --- | --- |
| `postgres-secret` | `apps` | PostgreSQL deployment, Node.js backend |
| `cloudflare-token` | `apps` | `cloudflared` tunnel |
| `grafana-admin-secret` | `monitoring` | Grafana admin login |
| `tg-secret` | `monitoring` | Grafana → Telegram alerting |
| `pihole-secret` | `pihole` | Pi-hole admin password |
| `minio-secret` | `minio` | MinIO root credentials (S3) |

Additionally:
- `terraform.tfvars` and all `*.tfstate*` files are gitignored.
- AWS credentials are sourced from the local `~/.aws/` profile, never from env vars committed anywhere.
- The SSH key referenced by Terraform (`~/.ssh/aws_ec2_key`) lives only on the operator workstation.
- The GitHub Actions workflows use the auto-issued `GITHUB_TOKEN` with `packages: write` and `contents: write` scopes — no long-lived PATs.

If you ever spot a secret in Git history, treat it as compromised: rotate it, then file a report following the process above. The step-by-step rotation procedure lives in [docs/runbooks/rotate-secrets.md](docs/runbooks/rotate-secrets.md).

## Hardening Checklist (in progress)
The following items are tracked as ongoing hardening work. PRs welcome.

- [ ] Add `NetworkPolicy` resources for namespace-to-namespace isolation.
- [ ] Move from manual `kubectl create secret` to **sealed-secrets** or **External Secrets Operator**.
- [ ] Enable image signing & verification with **cosign** + admission policy.
- [ ] Add **kube-bench** / **kube-hunter** runs as scheduled jobs.
- [x] Promote Trivy CI gating from `exit-code: '0'` (report-only) to `exit-code: '1'` on `HIGH+`.
- [ ] Remote Terraform state backend (S3 + DynamoDB lock) instead of local state.
- [ ] Add `PodSecurity` admission labels (`restricted`) on the `apps` namespace.

## Disclosure
Once a fix is shipped to `main` and rolled out by ArgoCD, the issue is considered resolved. A short note will be added to the release/commit message describing what changed, with credit to the reporter when applicable.
