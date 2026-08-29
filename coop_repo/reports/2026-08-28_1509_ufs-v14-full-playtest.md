# Agent Handoff: V14 full-game public playtest

- Date: 2026-08-28 15:09 Asia/Shanghai
- Agent/thread: `/root/ufs_v14_clean_full_playtest`
- Scope: root-authorized continuation of the same V14 attempt from the stage-1 checkpoint through formal public terminal state
- Status: complete

## User Intent

Continue the already-audited V14 attempt from `state_attempt_2026082814_v14` without restarting, preserve public-view isolation, continue across `choice`, `random`, and recoverable `rejected` responses until a formal public win/loss or unrecoverable hard stop, then write full-game evidence summaries and update coop handoff records.

## Completed

- Continued from existing V14 sequence `038` and state directory `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/state_attempt_2026082814_v14`.
- Appended public machine records `039` through `079`; no new attempt, seed, or state directory was created.
- Stopped immediately at sequence `079`, whose public response is `status=complete`, `reason=mothership_reached_skull_row`, `outcome.result=loss`, and `outcome.round=6`.
- Wrote full-game result and round-summary files in the V14 experiment directory.
- Preserved both public rejected responses as evidence and recovered from each within the same game.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/machine-records.ndjson`: appended continuation records through terminal sequence `079`.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/evidence/`: added stdout/stderr evidence for sequences `039` through `079`.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/payloads/`: added submitted operation payloads for continuation sequences.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/DECISIONS.md`: appended pre-operation public-view decisions for continuation sequences.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/RESULTS.md`: final outcome, integrity summary, and rejected-response notes.
- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/ROUND_SUMMARIES.md`: added rounds 4 through 6 and the terminal state.
- `coop_repo/reports/2026-08-28_1509_ufs-v14-full-playtest.md`: this handoff report.
- `coop_repo/LATEST.md`: added V14 full-game pointer.
- `coop_repo/REPORT_INDEX.md`: added V14 full-game report entry.

## Validation

- `node verify-public-evidence.js`: `public evidence OK`.
- Ledger count: 79 sequential records, `001` through `079`.
- Strict V14 evidence condition: all records have `exitCode=0` and non-null public JSON.
- Final public terminal: sequence `079`, `status=complete`, `outcome.result=loss`, reason `mothership_reached_skull_row`.
- Random boundaries were advanced only with public CLI `random`.
- No core runtime files were modified.

## Current State

The V14 attempt is complete and sealed at public terminal sequence `079`. The final public observation reports phase `lost`, damage `6`, energy `1`, research index `11`, excavator index `8`, mothership row `11`, `pending=null`, and no available operations.

Two recoverable public rejected responses are part of the evidence:

- Sequence `017`: occupied-column placement error, recovered at sequence `018`.
- Sequence `074`: player used an invalid research-advance payload field, recovered at sequence `075` with the established `roomId` + `advanceSteps` shape.

## Unresolved

- This is one fixed-seed playthrough, so it proves the corrected V14 pipeline can reach a formal public terminal state, not that the strategy is generally strong.
- The player reached research index `11` but did not reach a public win before the mothership terminal condition.
- Root should independently audit the final report and public evidence before treating V14 as the new full-game baseline.

## Recommended Next Step

Read `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v14/RESULTS.md`, then inspect `machine-records.ndjson` around sequences `073` through `079` and rerun `node verify-public-evidence.js` from the V14 experiment directory.
