# Agent Handoff: V14 stage 1 three-round playtest

- Date: 2026-08-28 14:56 Asia/Shanghai
- Agent/thread: `/root/ufs_v14_clean_full_playtest`
- Scope: sealed corrected-runtime V14 public playtest through exactly three completed rounds
- Status: complete

## User Intent

Run a fresh V14 playtest on the corrected runtime, stop exactly at the first round 4 roll boundary, preserve public evidence, and leave continuation authorization to root.

## Completed

- Created a new isolated experiment directory at `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/`.
- Used the single state directory `state_attempt_2026082814_v14` with attention seed `2026082814`.
- Recorded 38 sequential public machine records from `start` through the round 4 `next_round_roll` boundary.
- Stopped immediately after sequence `038`, where the public response is `status=random`, `reason=waiting_for_next_round_roll`, `pending.type=next_round_roll`, `pending.round=4`, and `game.completedRoundCount=3`.
- Did not call `random`, submit round 4 dice, or perform any further game operation after sequence `038`.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/`: new V14 protocol, recorder, verifier, decisions, payloads, evidence, machine records, and stage summaries.
- `coop_repo/reports/2026-08-28_1456_ufs-v14-stage1-three-round-playtest.md`: this handoff report.
- `coop_repo/LATEST.md`: added the V14 stage-1 pointer.
- `coop_repo/REPORT_INDEX.md`: added the V14 stage-1 report entry.

## Validation

- `node verify-public-evidence.js`: `public evidence OK`.
- Machine ledger: 38 records, sequences `001` to `038`.
- Strict V14 evidence condition: every record has `exitCode=0` and non-null public JSON.
- Public final boundary: sequence `038`, round 4 roll pending, completedRoundCount `3`.
- No negative energy appeared in public observations.

## Current State

The V14 stage is sealed at the requested pause boundary. Public final observation at sequence `038`: damage `1`, energy `4`, researchIndex `6`, excavatorIndex `5`, mothershipRow `5`, outcome `null`, phase `new_round`.

One public `rejected` response occurred at sequence `017` for an occupied column. The same game recovered legally at sequence `018` using the preserved public pending state and available operation.

## Unresolved

- Root has not yet run the host checkpoint replay/gate audit on this V14 stage.
- This stage does not measure full-game outcome; it intentionally stops before round 4 dice.
- The player made one legal-contract mistake at sequence `017`, preserved as public rejected evidence rather than rewritten.

## Recommended Next Step

Run the three-round gate audit on `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/`. If it passes, authorize continuation from the same state directory without restarting or changing seed.
