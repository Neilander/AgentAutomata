# V14 stage 1 results

Date: 2026-08-28

Experiment: `ufs_attention_full_game_playtest_v14`

Attempt/state: `state_attempt_2026082814_v14`

Attention seed: `2026082814`

## Stage stop

- Final stage record: sequence `038`.
- Final public status: `random`.
- Final public reason: `waiting_for_next_round_roll`.
- Final pending type: `next_round_roll`.
- Final pending round: `4`.
- Final completedRoundCount: `3`.
- No round 4 random values were submitted after this response.

## Public stage state

- Damage: `1`.
- Energy: `4`.
- Research index: `6`.
- Excavator index: `5`.
- Mothership row: `5`.
- Outcome: `null`.
- Phase: `new_round`.

## Evidence

- Machine records: `38`, sequential from `001` through `038`.
- Strict public verifier: `node verify-public-evidence.js` -> `public evidence OK`.
- All machine records have `exitCode=0`.
- All machine records have non-null public JSON.
- No negative energy appeared in public observations.

## Rejected/recovery note

- Sequence `017` was a public `rejected` response: `invalid_action:selected column is already occupied: C2`.
- Sequence `018` recovered in the same game by choosing a different public placement.
- The rejected response was not treated as a hard stop and did not require restart.

## Gate status

The stage is sealed at the requested public boundary. The host checkpoint replay gate was not run by this player after stopping; it is left for root authorization.
