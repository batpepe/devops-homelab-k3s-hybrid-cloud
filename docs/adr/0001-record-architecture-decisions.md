# ADR-0001: Record architecture decisions

Date: 2026-07-08
Status: accepted

## Context
Significant decisions in this repo (tunnel routing model, CI writing to
main, secret handling) so far live in commit messages, LEARNING_LOG.md
and README prose. Recovering the "why" months later means archaeology,
and the learning value of a decision evaporates if only its outcome is
visible.

## Decision
Keep architecture decision records in `docs/adr/`, numbered, in the
lightweight Nygard format: Context, Decision, Consequences, Status.
One ADR per decision that shapes the system's structure or its
operational model; routine changes do not get one. LEARNING_LOG.md
stays the day-to-day log; an ADR is written when a decision is worth
defending to a future reader.

## Consequences
- The why survives the person who made the decision (or the chat
  session that made it).
- Superseding a decision means a new ADR that references the old one,
  never editing history.
- Slight duplication with LEARNING_LOG decisions; the log entry links
  to the ADR when one exists.
