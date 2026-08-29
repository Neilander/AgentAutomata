# UFS V12 strong-model full-game attention playtest results

## Outcome

- Status: complete sealed attempt
- Result: loss
- Reason: `mothership_reached_skull_row`
- Final round: 7
- Final public state: `mothershipRow: 11`, `damage: 3`, `energy: -1`, `researchIndex: 1`, `excavatorIndex: 1`
- Seed: `2026082712`
- Machine records: 99 (`001` through `099`)
- Commands: 1 `start`, 83 `advance`, 15 `random`
- Public statuses: 79 `choice`, 15 `random`, 4 `rejected`, 1 `complete`

This was one new sealed attempt only. It did not continue or overwrite V7-V11. All evidence was saved under this V12 directory.

## Evidence files

- `README.md`: attempt scope and evidence inventory
- `PLAYER_PROTOCOL.md`: public-only player protocol used for this run
- `record-public-step.js`: recorder wrapper
- `verify-public-evidence.js`: evidence verifier
- `DECISIONS.md`: per-step alternatives, expected result, and rejected alternatives before each operation
- `machine-records.ndjson`: continuous machine ledger
- `payloads/`: submitted operation payloads
- `evidence/*.stdout.json`: public attention-limited stdout per step
- `evidence/*.stderr.txt`: stderr per step
- `ROUND_SUMMARIES.md`: round-by-round narrative

## Validation

- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\record-public-step.js`: pass
- `node --check projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\verify-public-evidence.js`: pass
- `node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v12\verify-public-evidence.js`: `public evidence OK`

## Public-only protocol adherence

- Decisions used public attention-limited stdout, public `mapView`, `pending.candidates`, `availableOperations`, and rule knowledge.
- The player did not use host checkpoint or private attention audit to decide actions.
- The attempt did not stop on ordinary `choice`, `random`, or `rejected` states.
- The attempt stopped only at the rules-explicit terminal response `complete/mothership_reached_skull_row`.

## Room-action candidate observations

- `resolvableRoomIds`: Used successfully in round 1. `A-upper-energy` was filled across two cells and resolved successfully; `A-upper-research` and `A-upper-fighter` were also resolved when candidates and affordability allowed it.
- `incompleteRoomIds`: Used to avoid premature room resolution. In later rounds, incomplete `A-upper-energy`, `A-path-fighter`, `A-path-energy`, and `A-path-research` entries were skipped or left unresolved instead of forcing them.
- `noOutputRoomIds`: Used to avoid AA/tunnel settlement. `A-upper-tunnel` and later five AA rooms were skipped when publicly labeled no-output.
- `unrememberedRoomIds`: No material unremembered-room candidate appeared in this sealed attempt.
- `excavationPlacementIds`: Used early to excavate deeper A-tile cells, but later avoided once negative energy made additional excavation debt strategically unsafe.
- `skippablePlacementIds`: Used throughout to clear no-output, incomplete, unaffordable, or strategically harmful placements without stopping the attempt.

## Notable findings

1. The V11 two-cell room correction is validated in live play: in round 1, filling both cells of `A-upper-energy` made it publicly resolvable and resolution succeeded.
2. A negative-energy trap emerged after the player excavated into debt. While `energy` was `-1`, `A-upper-energy` appeared in `resolvableRoomIds` but resolving it was rejected twice as `script chose unaffordable room: A-upper-energy`, even though the energy room has `energyCost: 0`. This prevented energy recovery and became the dominant playtest blocker.
3. Candidate state transitions were useful but occasionally surprising: skipping one worker in a multi-cell energy room could change public room state from `resolvable` to `incomplete`, and skipped placements sometimes remained visible as `resolved: true` until later views.
4. `mothershipActions` were publicly noticed and useful. The player interpreted `spawn_white`, `excavator_back`, and `research_back` as rail actions. `excavator_back` matched a later visible excavator rollback; one noticed `research_back:1` did not visibly reduce `researchIndex` afterward in this run and should be reviewed with care.
5. The spawn operation contract still exposes a usability edge: public pending candidates are `["DP-C1","DP-C5"]`, but the accepted payload field is `dropPointId`; using `spawnId` produced a public rejected response.

## Rejected responses preserved as evidence

- `019`: `invalid_action:selected column is already occupied: C4` after a player placement error.
- `038`: `invalid_action:script chose unaffordable room: A-upper-energy` while public candidates listed `A-upper-energy` as resolvable.
- `052`: same negative-energy energy-room rejection reproduced.
- `085`: `choose_spawn_requires_a_current_candidate` because the payload used `spawnId` instead of documented `dropPointId`.

## Final assessment

V12 is a valid strong-model full-game sealed playtest. The attention-limited player sustained play across choices, random rolls, rejected responses, spawn choice, room candidate categories, and seven rounds until a rules-explicit loss. The implementation should next investigate the negative-energy/resolvable energy-room contradiction, and separately audit the observed `research_back` visibility/effect behavior from the public trace.
