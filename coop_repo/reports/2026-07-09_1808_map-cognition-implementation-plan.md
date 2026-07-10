# Agent Handoff: Map Cognition Implementation Plan

- Date: 2026-07-09
- Agent/thread: Codex heartbeat automation
- Scope: implementation-facing plan for V1.2 + V2.1 map-lab changes
- Status: partial

## User Intent

Continue the recurring large-map cognition-chain process. The previous pass accepted V1.2 for implementation-test and V2.1 as a narrow rarity signal. This pass should turn that design into an implementation-facing map-lab update plan without starting servers or jumping into code prematurely.

## Completed

- Read latest handoff, latest report, current worktree, `lock-key-cognition.md`, V1.2, V2.1, and current `map_progression_lab` node definitions.
- Created:
  - `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-09_2127_v1.2-v2.1_map-lab-implementation-plan.md`
- The plan identifies current map-lab conflicts:
  - first-region camp currently unlocks before prison;
  - camp currently rewards `1 紫装 + 2 蓝装`, too strong/late-system for V2.1;
  - no prison failure-memory state exists;
  - no explicit role process-proof node exists.
- Proposed a minimal first-region implementation plan:
  - reveal Prison A and Camp A after `r1_main_4`;
  - focus/select Prison A first;
  - keep Camp A weak before prison failure and highlighted after failure;
  - change Camp reward to `2 高等级白装 + 1 蓝装`;
  - record `r1PrisonFailed` or equivalent;
  - use a controlled first-fail behavior for `r1_prison` before camp clear;
  - reserve M5/M6 for role process proof.

## Files Changed

- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-09_2127_v1.2-v2.1_map-lab-implementation-plan.md`: implementation-facing plan and risk notes.
- `coop_repo/LATEST.md`: updated to this report.
- `coop_repo/REPORT_INDEX.md`: indexed this report.

## Validation

- No server or browser was started.
- Two subagents were launched for review but did not return within two 180s waits; both were closed.
- Therefore the implementation plan is not independently reviewed yet.

## Current State

The implementation plan exists, but it should be reviewed before code changes. The most important implementation risk is preserving Prison-first cognition:

```text
If Camp A remains visually/procedurally first, the map regresses to the old Camp-first failure.
```

## Unresolved

- Subagent reviews timed out and produced no feedback.
- No code has been changed to implement V1.2/V2.1.
- Need to decide whether to implement soft-ordering or use the harder V1.3 gate if review finds the plan too fragile.

## Recommended Next Step

Review `2026-07-09_2127_v1.2-v2.1_map-lab-implementation-plan.md` first. If accepted, implement the smallest first-region map-lab change. If rejected, switch to V1.3 where Camp A is preview-only until Prison A failure.
