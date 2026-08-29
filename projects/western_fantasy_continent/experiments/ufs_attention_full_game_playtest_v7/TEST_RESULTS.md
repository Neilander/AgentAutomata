# Test results

Validation is intentionally read-only over public evidence. The verifier does not open the opaque state directory.

## Commands

```powershell
node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v7\verify-public-evidence.js
node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v7\record-public-step.js
node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v7\verify-public-evidence.js
```

All commands exited 0 on 2026-08-25.

## Contract result

`verify-public-evidence.js`: **PASS**

- 90 ordered machine records, 90 verbatim stdout files, 90 stderr files, and 90 pre-operation decisions are present.
- Every public response parses with schema `ufs_full_game_attention_response_v0` and attention seed `2026082507`.
- Exactly one `start`, 76 `advance`, and 13 `random` calls occurred; there is no second start.
- Every advance operation was offered by the preceding public response.
- Every random call followed a public `white_reroll` or `next_round_roll` boundary.
- Five rejected calls at 025/027/028/053/055 are retained and have unchanged `actionCount`.
- Six round boundaries are present; the final public response is round-7 `attention_stop/no_complete_initial_q` with no available operation.

## Scope boundary

The verifier reads only `machine-records.ndjson`, `DECISIONS.md`, `payloads/`, and `evidence/`. It does not read `state_attempt_2026082507_v7/`, host checkpoints, engine internals, fixtures, tests, or older playtest material.
