# Agent Handoff: UFS V12 strong-model full-game attention playtest

- Date: 2026-08-27 18:56 Asia/Shanghai
- Agent/thread: `/root/ufs_v12_strong_full_playtest`
- Scope: one sealed V12 full-game attention-limited player attempt with seed `2026082712`
- Status: complete

## User Intent

Run a fresh strong-model UFS V12 full-game playtest using the current public attention-limited player CLI. Use exactly one new sealed attempt, save all evidence under the V12 experiment directory, do not read private host checkpoint/audit for decisions, continue through ordinary choice/random/rejected states, stop only at rules-explicit win/loss or true hard block, and update coop records afterward.

## Completed

- Ran a new sealed attempt with seed `2026082712`.
- Saved public stdout/stderr, payloads, continuous machine ledger, per-step decision notes, round summaries, and final results in `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/`.
- Continued through all ordinary `choice`, `random`, and `rejected` boundaries until terminal `complete/loss`.
- Final terminal result: round 7 loss, reason `mothership_reached_skull_row`.
- Recorded candidate usage for `resolvable`, `incomplete`, `noOutput`, `unremembered`, `excavation`, and `skippable` room-action categories.
- Confirmed live that a fully filled two-cell `A-upper-energy` can resolve successfully in round 1.
- Preserved evidence for later investigation of a negative-energy contradiction where `A-upper-energy` is publicly resolvable but rejected as unaffordable.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/README.md`: V12 attempt scope and evidence inventory.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/PLAYER_PROTOCOL.md`: public-only play protocol.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/record-public-step.js`: V12 recorder wrapper.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/verify-public-evidence.js`: public evidence verifier.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/DECISIONS.md`: per-step alternatives, expectations, and rejected alternatives.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/machine-records.ndjson`: 99-entry machine ledger.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/payloads/`: submitted operation payloads.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/evidence/`: per-step public stdout/stderr.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/ROUND_SUMMARIES.md`: round-by-round summary.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/RESULTS.md`: final results and findings.
- `coop_repo/reports/2026-08-27_1856_ufs-v12-strong-full-game-playtest.md`: this handoff report.
- `coop_repo/LATEST.md`: updated latest pointer.
- `coop_repo/REPORT_INDEX.md`: added V12 report entry.

## Validation

- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\record-public-step.js`: pass.
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\verify-public-evidence.js`: pass.
- `node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\verify-public-evidence.js`: `public evidence OK`.

## Current State

V12 is a valid complete full-game public-only sealed attempt. It produced 99 machine records: 79 `choice`, 15 `random`, 4 `rejected`, and 1 `complete`. The final state is `complete/loss` with `mothershipRow: 11`, `damage: 3`, `energy: -1`, `researchIndex: 1`, and `excavatorIndex: 1`.

The strongest positive result is that the V11 correction holds in live play: the player filled both cells of `A-upper-energy` and successfully resolved it. The strongest blocker is a new negative-energy trap: after excavation debt, `A-upper-energy` can be listed in `resolvableRoomIds` while resolving it is rejected as unaffordable despite `energyCost: 0`.

## Unresolved

- Investigate the contradiction between `pending.candidates.resolvableRoomIds` and `resolve_room` affordability for energy rooms when `energy < 0`.
- Audit the observed `research_back:1` public notice that did not visibly reduce `researchIndex` later in the V12 public trace.
- Improve public spawn operation ergonomics or docs: pending candidates are drop points, and accepted payload field is `dropPointId`; `spawnId` is rejected.
- Strategy quality remains poor under negative energy; this was a valid playtest, not a successful game.

## Recommended Next Step

Start with `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/RESULTS.md`, then inspect public evidence around steps `037-052` for the negative-energy energy-room contradiction and steps `070-071`/`092` for `research_back` observations.
