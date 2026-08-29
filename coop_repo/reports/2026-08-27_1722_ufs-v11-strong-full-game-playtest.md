# Agent Handoff: UFS V11 Strong Full-Game Playtest

- Date: 2026-08-27
- Agent/thread: Codex subagent `/root/ufs_v11_strong_full_playtest`
- Scope: Fresh UFS full-game attention-limited playtest with strong-model player, new sealed seed
- Status: complete

## User Intent

Run a stronger-model simulated player all the way to a rule-explicit UFS win/loss if possible, without reusing V7-V10 attempts, without reading private host checkpoint/audit data to make decisions, and without modifying the game/cognition implementation to make the attempt pass.

## Completed

- Created a new isolated V11 experiment under `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/`.
- Used fresh unique seed `2026082711`.
- Played one sealed public-only attempt from start until the CLI returned a terminal result.
- Preserved per-step public stdout, stderr, payloads, machine ledger, and human decision notes.
- Continued through all ordinary `choice`, `random`, and `rejected` boundaries instead of stopping early.
- Final public result: loss at step `073`, round `7`, reason `mothership_reached_skull_row`.
- Added verifier and ran public evidence validation successfully.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/README.md`: V11 experiment overview.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/PLAYER_PROTOCOL.md`: sealed public-only player protocol used for the attempt.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/record-public-step.js`: helper for recording public CLI steps, payloads, stdout/stderr, and machine ledger entries.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/verify-public-evidence.js`: read-only public evidence validator.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/machine-records.ndjson`: 73 public machine records for the sealed attempt.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/DECISIONS.md`: human-readable decision trail.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/evidence/`: captured public stdout/stderr for each recorded step.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/payloads/`: submitted operation payloads.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/state_attempt_2026082711_v11/`: V11 attempt state directory.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/RESULTS.md`: result summary and findings.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v11/ROUND_SUMMARIES.md`: compact human round-by-round summary.
- `coop_repo/reports/2026-08-27_1722_ufs-v11-strong-full-game-playtest.md`: this handoff report.
- `coop_repo/LATEST.md`: updated latest pointer.
- `coop_repo/REPORT_INDEX.md`: added V11 report entry.

## Validation

- `node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\verify-public-evidence.js`: `public evidence OK`.
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\record-public-step.js`: pass.
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\verify-public-evidence.js`: pass.

## Current State

V11 is the first post-V10 full-game attempt here that reached a rule-explicit terminal public result instead of stopping due to weak-player protocol failure or attention hard stop.

Machine-ledger status counts:

- `choice`: 47
- `random`: 14
- `rejected`: 11
- `complete`: 1

Terminal public observation:

- result: `loss`
- reason: `mothership_reached_skull_row`
- round: 7
- damage: 3
- energy: 0
- excavatorIndex: 1
- mothershipRow: 11
- phase: `lost`
- researchIndex: 0
- actionCount: 61
- completedRoundCount: 6

## Unresolved

- `A-upper-energy` repeatedly rejected as `invalid_action:scripted room is incomplete: A-upper-energy` at steps 022, 032, 044, 054, 063, and 072. This is the largest exposed blocker because it prevents the intended energy economy from resolving.
- Several visible rooms still lack complete remembered room patches: `A-upper-tunnel`, `A-aa-c1`, `A-start-tunnel`, and `A-aa-c2`.
- Step 034 publicly advanced research, but later public observations returned to `researchIndex: 0`; audit whether this is a real state regression or public observation/update artifact.
- One non-game PowerShell quoting error occurred before valid ledger step 002. It only duplicated a human `DECISIONS.md` step header; it did not create a machine record or mutate game state.
- V11 did not modify implementation to address any exposed defect.

## Recommended Next Step

Fix and regression-test `A-upper-energy` and the missing remembered room patches first. Then replay a new sealed full-game attempt with a fresh seed and compare whether the simulated player can sustain the intended energy → excavation → research loop before mothership pressure wins.
