---
description: Senior-level review of my recent changes (no edits)
argument-hint: [path or git ref; blank = uncommitted diff]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(kubectl diff:*), Bash(terraform -chdir=terraform plan:*)
---
Scope: $ARGUMENTS

Review like a senior DevOps engineer. Do NOT modify files.

1. Determine the diff: if Scope is blank use `git diff` plus staged changes; else the given path/ref.
2. Review against: correctness, our CLAUDE.md conventions, security and secret hygiene, GitOps safety (prune/selfHeal, immutable SHA tags, no :latest in manifests), supply chain (Trivy gating, SHA-pinned actions), and resource/probe/securityContext hygiene.
3. Output findings as a prioritized list: [BLOCKER] / [SHOULD] / [NIT], each with file:line, the problem in one line, and the concrete fix.
4. If it touches a ROADMAP item, say whether it satisfies the item's intent.
5. End with a verdict: ship / fix-then-ship / rework, plus the single most important next action.

Teach through the review: for each BLOCKER, add one line on the underlying principle.
