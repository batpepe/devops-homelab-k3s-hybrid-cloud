# Contributing

Solo-maintained homelab, but the conventions are real; automation and
future-me both rely on them.

## Workflow
- Direct pushes to `main` are the convention here; open a PR only when
  explicitly asked. Never amend or force-push anything already on main.
- Conventional commit messages: `type(scope): summary`, types in use:
  feat, fix, docs, chore, ci, refactor, test, perf, build, gitops (bot).
  No emojis, em-dashes or smart quotes in files or commits.
- One focused change per commit; the body says why, not what.

## Before you push
```bash
make hooks         # once per clone: installs pre-commit hooks
make lint          # hadolint, yamllint, kube-linter, tflint, actionlint, trivy config
make validate-tf   # fmt -check + validate, root module and cloudflare
```
- Terraform: `terraform plan` must show zero destructive AWS changes
  unless that is the point of the change.
- K8s manifests: remember ArgoCD applies main with prune+selfHeal; a
  merged manifest IS a deployment. `kubectl diff` first.
- Images: manifests reference immutable commit-SHA tags only; `latest`
  exists in GHCR but is never referenced.

## Secrets
Never in Git, not even realistic-looking examples. The list of manual
secrets and their consumers: [docs/runbooks/rotate-secrets.md](docs/runbooks/rotate-secrets.md);
policy: [SECURITY.md](SECURITY.md).

## Where things go
- Architecture decisions: `docs/adr/` (see ADR-0001).
- Operational procedures: `docs/runbooks/`.
- Day-to-day learning notes: `learning/LEARNING_LOG.md`.
- Backlog: `ROADMAP.md` with effort/value tags.

## Toolchain
`.devcontainer/` ships terraform, kubectl, helm and the argocd CLI.
CI mirrors local checks (lint.yml); if a linter is report-only there,
treat its findings as debt, not noise.
