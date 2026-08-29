# Agent Handoff: UFS V19 Clean2 Full Game Loss

- Date: 2026-08-29 01:15 Asia/Shanghai
- Agent/thread: Codex root
- Scope: Complete UFS V19 fresh-player formal playtest after the original V19 duplicate-id blocker
- Status: complete

## User Intent

Start the next formal UFS fresh-player prediction-learning playtest, pass the three-round gate, then continue the same attempt to formal win/loss with validated evidence.

## Completed

- Preserved the original V19 failed attempt as blocker evidence.
- Confirmed current code no longer reproduces the original sequence `092` duplicate full-attention item id crash from the same checkpoint and payload.
- Ran related regression tests:
  - one-round imagination tests
  - full-game attention session tests
  - full-attention integration tests
- Created `ufs_attention_full_game_playtest_v19_clean2` as a clean V19 rerun directory with the same V19 fresh player profile and recorder.
- Ran the clean2 attempt from start to the Round 4 random boundary.
- Passed the required three-round gate.
- Continued the same clean2 attempt to formal rules termination.
- Final result: Round 7 formal loss by `mothership_reached_skull_row`.
- Wrote stage, final, and round-summary files.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean/auto-clean-play.js`: temporary public-strategy driver; first clean run was abandoned after prediction-ticket schema mistakes polluted its ledger.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/record-public-step.js`: copied V19 recorder for isolated clean2 evidence.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/verify-public-evidence.js`: copied V19 verifier for isolated clean2 evidence.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/player-v19-fresh.json`: copied V19 fresh player profile.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/auto-clean-play.js`: public-only automated chooser used to complete the clean2 run.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/STAGE1_RESULTS.md`: three-round gate result.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/RESULTS.md`: final formal outcome and validation.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v19_clean2/ROUND_SUMMARIES.md`: round-by-round summary.
- `coop_repo/reports/2026-08-29_0115_ufs-v19-clean2-full-game-loss.md`: this report.

## Validation

- `node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-imagination.js`: passed, 8/8.
- `node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: passed, 10/10.
- `node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-attention-integration.js`: passed, 10/10.
- In `ufs_attention_full_game_playtest_v19_clean2`:
  - `node verify-public-evidence.js stage1`: passed.
  - `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: passed.
  - `node verify-public-evidence.js final`: passed.

Final verifier:

- records: 177
- deliberate actions: 158
- explicit prediction actions: 158
- prediction coverage: 1.0
- completed rounds: 7
- outcome: `{ result: "loss", reason: "mothership_reached_skull_row", round: 7 }`

## Current State

The full requested pipeline is now validated in clean2:

`fresh player -> public attention -> self-describing operation contract -> formal host -> prediction evidence -> three-round gate -> continued full game -> formal outcome`

The original V19 directory remains useful as a historical blocker sample. The clean2 directory is the passing evidence for the completed full-game run.

## Unresolved

- The automated chooser is weak and caused 67 public `rejected` records, mostly visible-but-illegal placement attempts. The formal host handled them safely, but this is bad player behavior.
- `ufs_attention_full_game_playtest_v19_clean` is a polluted abandoned clean attempt; use `ufs_attention_full_game_playtest_v19_clean2` for the valid evidence.
- This report did not update `coop_repo/LATEST.md` or `coop_repo/REPORT_INDEX.md` because the V19 player protocol explicitly says not to edit those files for this run.

## Recommended Next Step

Improve placement legality inference or expose clearer legal placement candidates in the public contract. The plumbing has now reached a formal terminal result; the next gain is reducing rejected actions and improving strategy quality.
