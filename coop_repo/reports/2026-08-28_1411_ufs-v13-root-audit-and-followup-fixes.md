# Agent Handoff: V13 root audit and follow-up fixes

- Date: 2026-08-28 14:11 Asia/Shanghai
- Agent/thread: root
- Scope: audit the staged V13 strong-model playtest, fix bugs exposed during continuation, and validate the corrected pipeline
- Status: complete

## User Intent

Fix the known system issue, improve the playtest pipeline, let an agent play three rounds first, and continue the same game only after the three-round stage shows no bug.

## Completed

- Ran one GPT-5.5 high-reasoning V13 attempt with seed `2026082813` through the public attention-limited operation interface.
- Located the exact three-round gate at sequence 041. The player mistakenly continued before authorization, so root interrupted it and used only public records 001–041 to deterministically replay every response, export/restore the in-memory checkpoint, and certify `stageGatePassed=true` before authorizing continuation.
- Preserved the premature sequences rather than rewriting evidence. Extended the stage auditor with an optional public-prefix replay mode for future overshoots.
- During continuation, fixed a CLI recovery bug: after a bad random payload was atomically rejected, the `random` command incorrectly looked only at the latest `rejected` status and could not resume the still-valid random boundary. It now uses pending type plus available operation.
- Independently confirmed the V13 excavation regression was a second system bug. The runtime accepted two unexcavated placements in one round, then allowed a deeper excavation followed by a stale shallower excavation, moving the excavator from 10 back to 5.
- Connected the already learned `excavation_placement` five-slot trajectory and JSON program to the live placement port. A second unexcavated placement or insufficient-distance die is now atomically rejected through that learned rule path.
- Added dynamic stale-target classification and a resolution guard: targets no longer ahead of the excavator appear as `obsoleteExcavationPlacementIds` and cannot move progress backward, including for legacy checkpoints.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/audit-three-round-gate.js`: optional public-prefix deterministic replay and restored checkpoint audit.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: random recovery after rejected payloads.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: live unexcavated-placement Q/trajectory/program legality connection.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: forward/obsolete excavation candidates and no-backward guard.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: rejected-random recovery regression.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-session.js`: one-unexcavated-placement and stale-target regressions.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: staged replay, recovery, and excavation contracts.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/`: sealed player decisions, stage report, 124 public machine records, evidence, summaries, and result.

## Validation

- Pre-continuation three-round audit at sequence 041: `stageGatePassed=true`, 41/41 public responses exactly replayed; restored state round 3/new_round, energy 6, damage 1, research 4, excavator 4, mothership 4, no outcome.
- Final V13 public evidence verifier: `public evidence OK`; 124 sequential records, one start, no `attention_stop`, no negative-energy observation.
- Expected preserved anomalies: sequence 074 player used `rolls` instead of `values`; sequence 075 old CLI recovery path exited 1 with null public response; sequence 076 legally recovered the same checkpoint.
- Final checkpoint restores under the corrected runtime to round 8/lost, energy 2, damage 7, research 15, excavator 10, mothership 12, reason `mothership_reached_skull_row`.
- Full related Node suites after all fixes: 126/126 passed.
- `git diff --check`: no whitespace error; repository line-ending warnings only.

## Current State

The optimized pipeline can enforce and independently verify a three-round pause before continuation, and can recover a safe stage from a player that accidentally overshoots by replaying only the public prefix. Zero-energy excavation, rejected-random recovery, multiple unexcavated placements, and backward excavation are all guarded.

V13 reached a real public loss in round 8 with research 15, much more progress than V12, but it is not a clean strategy benchmark for the final corrected runtime: its middle game benefited from the now-fixed double-excavation bug. The sealed evidence remains valuable as bug-finding evidence and is not rewritten.

## Unresolved

- A fresh corrected-runtime playtest has not yet measured whether the strategy still reaches similar research progress without double excavation.
- V13's first stage was validly audited, but the player violated the pause protocol before root interruption. The new prefix-replay audit makes this recoverable, not desirable.
- Public strategy still operates under intentional 41-item probabilistic attention and can make imperfect decisions even when operation legality is correct.

## Recommended Next Step

If another behavioral benchmark is needed, start a new V14 seed on the now-corrected runtime and use the same three-round gate. Do not reinterpret or mutate V13; use it as preserved evidence for the two follow-up fixes.
