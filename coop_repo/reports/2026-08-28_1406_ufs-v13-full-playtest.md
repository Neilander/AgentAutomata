# Agent Handoff: UFS V13 full playtest

- Date: 2026-08-28
- Agent/thread: Codex simulatePlayer worktree
- Scope: UFS attention-limited full-game playtest V13, evidence recording, public validation, coop handoff
- Status: complete

## User Intent

Run the staged UFS simulated-player pipeline from the existing V13 attempt: preserve the three-round audit gate, continue the same game after authorization, do not restart or create a new attempt, continue through ordinary choice/random/rejected boundaries, and stop only at public rules terminal or hard unrecoverable system stop.

## Completed

- Continued the existing V13 attempt `state_attempt_2026082813_v13` with attention seed `2026082813`.
- Preserved the correct stage gate at sequence `041` and the already-recorded over-gate continuation evidence.
- Continued from the existing checkpoint through sequence `124`.
- Reached public terminal status `complete` at sequence `124`.
- Final public outcome: `loss`, reason `mothership_reached_skull_row`, round `8`.
- Wrote V13 result files:
  - `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/RESULTS.md`
  - `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/ROUND_SUMMARIES.md`
- Updated the V13 public evidence verifier to allow the single preserved known pipeline bug at sequence `075`, while still checking sequence continuity, public operation availability, and final stop validity.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/machine-records.ndjson`: appended public machine records through terminal sequence `124`.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/evidence/`: added stdout/stderr evidence through sequence `124`.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/payloads/`: added operation payloads through sequence `124`.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/DECISIONS.md`: appended pre-operation public-view judgments through terminal sequence.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/RESULTS.md`: summarized final result, stage gate, recovery notes, validation, and risks.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/ROUND_SUMMARIES.md`: summarized each round from 1 through 8.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v13/verify-public-evidence.js`: accepts sequence `075` as a known preserved nonzero CLI recovery-bug record and validates using the nearest prior public response after that.
- `coop_repo/LATEST.md`: points to this V13 final playtest as the latest UFS full-game evidence.
- `coop_repo/REPORT_INDEX.md`: added this report to the timestamped index.

## Validation

- `node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v13\verify-public-evidence.js`: `public evidence OK`

Validated facts:

- `124` consecutive machine records from `001` through `124`.
- Single start record.
- Final status `complete`.
- Final outcome is public and terminal.
- Only known nonzero exit is sequence `075`.

## Current State

V13 is now a complete public-evidence playtest:

- Three-round gate: sequence `041`, `random / waiting_for_next_round_roll`, pending round `4`, completedRoundCount `3`.
- Full-game end: sequence `124`, `complete / mothership_reached_skull_row`, loss in round `8`.
- Attention-limited play remained imperfect by design; decisions used only public CLI output and preserved mistakes/recoveries.

Important recovery distinctions:

- Sequence `074`: player payload mistake, used `rolls` instead of expected `values`.
- Sequence `075`: old CLI recovery bug after rejected view; preserved with nonzero exit/public null.
- Sequence `076`: same attempt legally recovered using the correct `values` payload.

## Unresolved

- Sequence `053` then `054` exposed an excavator semantic risk: after a deeper excavation, a shallower excavation candidate was still accepted, and the later public state showed `excavatorIndex` back at `5`. This may mean the candidate system can regress excavation progress if a stale/shallower candidate is chosen.
- Research reached `15`, but no public win occurred before mothership loss. Do not infer a hidden win; the recorded terminal result is loss.
- V13 verifier now has an explicit known-exception allowance for sequence `075`; future clean attempts should not rely on that exception.

## Recommended Next Step

Run a fresh V14-style attempt after the CLI recovery fix, using the three-round gate first. If the gate passes, continue the same attempt to terminal. The highest-value system audit target is the excavation candidate/regression behavior seen around V13 sequences `053`-`054`.
