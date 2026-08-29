# UFS V18 Stage 1 Results

- Date: 2026-08-29 00:29 Asia/Shanghai
- Player profile: `player-v18-fresh.json`
- Player id: `ufs-v18-fresh-player`
- Attempt/state: `state_attempt_2026082918_v18`
- Attention seed: `2026082918`
- Status: blocked before the three-round gate

## Outcome

V18 did not reach the required Round 4 next-round-roll boundary. The unique attempt stopped at sequence `017`, still in Round 1, because the public `choose_research_advance` operation could not be submitted in a form accepted by the formal layer.

The last public response was:

- `status`: `rejected`
- `reason`: `formal_rejected:formal research choice rejected for undefined`
- `round`: 1
- `completedRoundCount`: 0

## Evidence

- Machine records written: 17
- Rejected public responses: 7
- Last sequence: `017`
- Last pending type: `room_effect`
- Last pending effect: `research_room_choice`
- Public research budget: 1
- Public max advance: 0

The player tried the natural zero-advance payload fields after the research room publicly reported `maxAdvanceSteps: 0`:

- `steps: 0`
- `advanceSteps: 0`
- `advance: 0`
- `value: 0`
- `choice: 0`

All were rejected as `formal research choice rejected for undefined`.

## Validation

- `node verify-public-evidence.js stage1`: failed, as expected, with `invalid three-round stop`.
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: failed, as expected, because the last response was not a safe Round 4 random boundary and `completedRoundCount` was 0.

## Interpretation

This is not a strategy loss. It is a public operation contract/interface failure exposed by the first live fresh-player run. The player was correctly forced to stop rather than inspect hidden source or checkpoint data to discover the private payload schema.

