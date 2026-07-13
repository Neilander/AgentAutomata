# Agent Handoff: Causal Knowledge and Manual Equipment Loop

- Date: 2026-07-13
- Agent/thread: Codex interactive task
- Scope: correct the isolated player-agent API experiment's knowledge causality and equipment state transition
- Status: complete for the two-cycle correction

## User Intent

Knowledge must be stored as subject, environment, behavior, and causally related result. Clearing a level causes drops and unlocks; loot does not increase power until the player explicitly equips it. Combat knowledge must describe current damage, unit contribution, and enemy threat.

## Completed

- Removed the fictitious `receive_reward` canonical behavior.
- Isolated the experiment from the map prototype's inherited auto-equip side effect without changing the formal map core.
- Added explicit `equip:<heroId>:<itemId>` player actions and inventory/fit observations.
- Added canonical knowledge for encounter outcomes, real `map_unlock` events, loot entering inventory without power growth, unit damage/support contribution, team damage profile, per-enemy threat rank, skill effects, and explicit equipment results.
- Required attribution responses to select a precise `knowledgeId`; cited evidence must belong to that knowledge row.
- Saved complete event logs in summaries so derived knowledge can be independently audited.
- Added a causal regression test and 20 representative knowledge samples.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: manual-equipment adapter, causal knowledge extraction, map-unlock event, contribution/threat summaries, scoped attribution.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/cli.js`: includes game events and event logs in summary evidence.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: two-cycle causal regression.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/causal_verification_v6/`: accepted requests, responses, session, event logs, and summary.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/KNOWLEDGE_SAMPLES.md`: readable 20-row sample.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md` and `RUN.md`: current rules and invalidation of the rejected auto-equip run.

## Validation

- Regression: PASS; two cycles, 32 canonical knowledge rows.
- Cycle 1: Main 1 cleared; two items entered inventory; equipped items stayed at 0 and equipped power stayed `0 -> 0`.
- Cycle 2: explicit equip on Gray Raven warrior; inventory changed `2 -> 1`, equipped items `0 -> 1`, equipped power `0 -> 40` in accepted evidence.
- All 32 knowledge rows have non-empty evidence IDs present in the saved real event logs; no canonical `receive_reward` behavior remains.
- Main 2 unlock knowledge cites `map_unlock:r1_main_1:1`.
- Player contribution includes damage, healing, shielding, kills, and skill casts; enemy threat records rank three enemy units by actual damage.
- The first independent reviews rejected the rule leak, attribution mismatch, missing real unlock event, and incomplete contribution/threat facts. After fixes, both independent re-reviews returned PASS.
- No formal combat values, production skills, browser, UI, commit, or push.

## Current State

The corrected minimum loop is now `challenge Main 1 -> real combat/drop/unlock events -> causal knowledge -> AI decision -> explicit equip -> power change -> scoped attribution`. The old `run/` and `verification/` evidence is retained only as invalidated history and must not be treated as current.

## Unresolved

- This validates knowledge causality and the API boundary, not the full emotional model.
- The source map prototype still auto-equips; only this isolated experiment suppresses it.
- A low-damage unit is not automatically labeled useless. The factual knowledge now includes healing/shielding so later attribution can judge role value without creating a false conclusion.
- Failure, replacement equipment, and same-encounter before/after combat verification remain untested.

## Recommended Next Step

Use the same code-owned loop for one bounded failure and recovery sequence: challenge a genuinely difficult node, let AI choose between equipment, team, and retry affordances, then verify that attribution and learned knowledge change the next action without allowing AI to set emotion.
