# Agent Handoff: UFS uncertainty propagation and city crossing fix

- Date: 2026-08-27 16:43 Asia/Shanghai
- Agent/thread: root / current Codex task
- Scope: `simulatePlayer` cognitive imagination path only
- Status: complete

## User Intent

Fix the two system defects exposed by the V10 weak-player audit before running another playtest: generic sky-pipeline uncertainty must reach the player's later observation, and a ship descending through the city row must contact the city instead of becoming an unknown off-board endpoint.

## Completed

- Propagated generic sky-pipeline unknown slots into the UFS imagined state and therefore into the next attention-limited player observation.
- Deduplicated uncertainty by slot and clear it when that slot is later recovered or directly noticed.
- Added city-boundary normalization for vertical ship movement. A movement that crosses a city tile is clamped to that tile while retaining the mathematical endpoint as `intendedToRow` for audit.
- Added the affected ship IDs to grounding traces so UFS can apply the already learned city-contact event program to the correct object.
- Wired city contact to remove the ship from the sky, return it to `waitingShips`, and record the landing event without applying city damage a second time.
- Documented the new uncertainty and city-contact behavior.

## Files Changed

- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/imagination-pipeline.js`: reconcile uncertainty and normalize movement across the city boundary.
- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/test-imagination-pipeline.js`: cover crossing, single damage, endpoint audit, and uncertainty clearing.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: carry uncertainty into UFS state and delegate city-contact ship return through the learned event path.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js`: cover player-visible uncertainty, exact landing, crossing, single damage, and ship return.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: document behavior and boundaries.

## Validation

- Nine Node regression suites for `ufs_first_action_imagination_v0` and `imagination_pipeline_v0`: 97/97 passed.
- Cognitive program-library regression: 6/6 passed. Combined checked result: 103/103 passed.
- Exact replay of V10 sequence through action 029: the purple ship planned for row 17 now contacts city row 16, city damage becomes 1 exactly once, the ship leaves the sky and enters host `waitingShips`, no row-17 uncertainty remains, and play returns to `choice/waiting_for_die_placement`.
- `node --check` passed for both changed core modules.
- `git diff --check` passed apart from repository line-ending warnings.
- `git merge-base --is-ancestor 53367a4 HEAD`: passed; active branch is `simulatePlayer`.

## Current State

The cognitive path can now preserve a genuinely missing sky fact as player-visible uncertainty and later remove that uncertainty when the fact is learned. Exact city-row landings and over-city descents share the same observable result: one city damage, one city-contact event, and the involved ship returned to the waiting queue. The main equipment-grind path was not touched.

## Unresolved

- City contact is intentionally split into two traceable learned stages: the generic landed-city trajectory commits damage, then the UFS city-contact event program performs ship-return semantics. `damageApplication` explicitly prevents a double commit; a later cleanup may unify the stages if the trace format is migrated.
- The returned waiting ship can still be absent from a particular player observation when attention omits that slot. It remains present in host state; this is expected attention behavior, not state loss.
- The V10 report remains immutable evidence of the old failure and was not rewritten.

## Recommended Next Step

Run a fresh, uniquely seeded weak-agent playtest through multiple rounds and verify that it can continue after a city contact. Keep protocol compliance (continuing at ordinary choice/rejected boundaries) separate from cognitive correctness in the audit.
