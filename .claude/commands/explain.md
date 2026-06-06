---
description: Explain existing code/infra in this repo like a senior to a junior
argument-hint: <path, glob, or concept, e.g. k8s-infrastructure/argocd-apps/my-apps.yaml>
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*)
---
Target: $ARGUMENTS

Read the target and explain it. Read-only - make no changes.

1. One-line summary: what this is and its job in the platform.
2. Walk the important parts top to bottom; for each, what it does and WHY it is written this way (tie to GitOps, supply chain, least privilege, and the constraints in CLAUDE.md).
3. Call out anything non-obvious, risky, or that would bite a junior (e.g. selfHeal reverting manual edits, immutable SHA tags, secret references, sync waves).
4. End with "what to remember" (<=3 bullets) and one question to test that I followed.

Quote only the lines you are explaining. Stay concise.
