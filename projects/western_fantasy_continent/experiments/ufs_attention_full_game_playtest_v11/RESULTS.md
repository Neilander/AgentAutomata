# UFS Attention Full Game Playtest V11 — Results

- Date: 2026-08-27
- Attempt seed: `2026082711`
- Player setup: strong-model, public-only, attention-limited full-game CLI
- Protocol: one fresh sealed attempt; no V7-V10 continuation or overwrite
- Outcome: `loss`
- Terminal reason: `mothership_reached_skull_row`
- Terminal step: `073`
- Terminal round: `7`
- Machine ledger records: `73`

## Public evidence summary

Status counts from `machine-records.ndjson`:

- `choice`: 47
- `random`: 14
- `rejected`: 11
- `complete`: 1

Final public observation:

- damage: 3
- energy: 0
- excavatorIndex: 1
- mothershipRow: 11
- phase: `lost`
- researchIndex: 0
- actionCount: 61
- completedRoundCount: 6
- outcome: `{ "result": "loss", "reason": "mothership_reached_skull_row", "round": 7 }`

## Validation

- `node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\verify-public-evidence.js` → `public evidence OK`
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\record-public-step.js` → pass
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v11\verify-public-evidence.js` → pass

## What the run proves

The strong player obeyed the full-game protocol better than V10: it continued through ordinary `choice`, `random`, `rejected`, and confusion/low-information boundaries until the public CLI returned a rule-explicit terminal result. It did not stop at a non-terminal boundary.

The attempt is therefore a valid full-game sealed playtest, but it is not evidence that the player plays well. It lost in round 7.

## Main findings

1. `A-upper-energy` repeatedly rejected with `invalid_action:scripted room is incomplete: A-upper-energy`.
   - This occurred at steps 022, 032, 044, 054, 063, and 072.
   - This is the biggest gameplay-system blocker exposed by V11, because it prevents the intended energy economy from resolving even when the player tries to use that room.

2. Several visible rooms still lack complete remembered room patches.
   - `A-upper-tunnel`: step 010
   - `A-aa-c1`: step 011
   - `A-start-tunnel`: step 013
   - `A-aa-c2`: step 035

3. One placement was rejected because the selected sky column was already occupied.
   - Step 030: `invalid_action:selected column is already occupied: C2`
   - The player recovered by selecting a different operation and continued.

4. Research advancement should be audited.
   - Step 034 publicly advanced research after resolving `A-path-research`.
   - Later public observations showed `researchIndex: 0`.
   - This may be a public observation/update issue, or a real state regression. It was not inspected with private host checkpoint during play.

5. No `attention_stop` occurred.
   - V11 therefore mainly exposes program/room-resolution gaps, not the V9-style hard attention stop.

## Recorder note

Before the valid machine-ledger step 002, one PowerShell quoting mistake failed while constructing a JSON payload. It produced a duplicate human-readable `## Step 002` header in `DECISIONS.md`, but no machine ledger record and no game-state mutation. The valid machine ledger remains a single sequential `001` through `073` attempt.

## Evidence files

- `machine-records.ndjson`: machine-verifiable public ledger
- `DECISIONS.md`: human-readable decision trail
- `evidence/*.stdout.json`: public CLI responses
- `evidence/*.stderr.txt`: stderr captures
- `payloads/*.json`: submitted public operations
- `ROUND_SUMMARIES.md`: compact round-by-round human summary
