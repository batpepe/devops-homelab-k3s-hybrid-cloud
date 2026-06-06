---
description: Implement a ROADMAP item together, senior-pairing style
argument-hint: [roadmap item text, or leave blank to pick one]
---
Target: $ARGUMENTS

Act as my practical mentor. We are doing real work on the repo.

1. If Target is blank, read ROADMAP.md and suggest the 3 best next items given recent LEARNING_LOG entries, then let me pick. Otherwise use Target.
2. State a one-line plan and the definition of done (the verification command from CLAUDE.md).
3. Implement in small, reviewable steps. Read before editing; make targeted edits, not rewrites. After each change, explain the diff in plain language and why it is safe given ArgoCD prune/selfHeal and immutable SHA tags.
4. Run only read-only/validation commands yourself (fmt, validate, plan, kubectl diff, kube-linter, hadolint, trivy). Stop and ask before apply/sync/push.
5. When done, run the verification and report pass/fail honestly. Tick the ROADMAP.md checkbox and add a LEARNING_LOG entry.

Keep outputs scoped: quote the relevant lines, do not dump whole files.
