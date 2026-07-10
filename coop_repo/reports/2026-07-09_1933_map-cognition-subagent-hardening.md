# Agent Handoff: Map Cognition Subagent Hardening

- Date: 2026-07-09
- Agent/thread: Codex heartbeat automation
- Scope: integrate late subagent reviews for V1.2 + V2.1 map-lab plan
- Status: complete

## User Intent

Continue the recurring large-map cognition-chain workflow, preserving versioned design records and using subagent review when available.

## Completed

- Closed both review subagents after they returned.
- Integrated their findings into a new follow-up version rather than editing the prior review file:
  - `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-09_1933_v1.2-v2.1_subagent-hardening.md`
- Both subagents confirmed serious risk:
  - mainline M5 can bypass Prison-first;
  - Camp can be consumed before Prison failure because equipment is already a known solution axis;
  - auto-challenge and `clearNode()` victory semantics would erase Prison first-fail.
- Updated the recommended implementation from soft-ordering to hardened behavior:
  - `r1_main_5` requires `r1_prison` clear;
  - `r1_bandit` is visible but preview-only until `r1PrisonFailed`;
  - first Prison attempt fails/retreats, stops auto-challenge, and highlights Camp;
  - Camp clear wakes Prison retry;
  - Prison clear unlocks M5 role process proof.

## Files Changed

- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-09_1933_v1.2-v2.1_subagent-hardening.md`: records subagent findings and hardened implementation checklist.
- `coop_repo/reports/2026-07-09_1933_map-cognition-subagent-hardening.md`: this handoff.
- `coop_repo/LATEST.md`: updated to this report.
- `coop_repo/REPORT_INDEX.md`: indexed this report.

## Validation

- No server was started.
- No source code was changed.
- Subagents were closed after completion.
- The review agrees with the current code inspection from the previous report.

## Current State

The next implementation pass should use the hardened version:

```text
After M4:
  Prison is available and focused.
  Camp is visible but not challengeable.
  M5 is not challengeable.

After Prison first-fail:
  Camp becomes challengeable.
  Auto-challenge stops.

After Camp:
  Prison retry.

After Prison clear:
  M5 role proof.
```

## Unresolved

- `lock-key-cognition.md` has a recommended future append-only note for "bypass hardening", but it was not edited in this pass.
- No implementation has been done yet.

## Recommended Next Step

Implement only the first-region hardened map-lab slice. Start from:

```text
projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-09_1933_v1.2-v2.1_subagent-hardening.md
projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js
```
