# V16 Round Summaries

- Attempt/state: `state_attempt_2026082816_v16`
- Attention seed: `2026082816`
- Evidence: `evidence/001.stdout.json` through `evidence/042.stdout.json`
- Stop point: `042.stdout.json`, public `status=random`, `reason=waiting_for_next_round_roll`, `pending.round=4`, `completedRoundCount=3`

## Round 1

- Public range: `001` through `017`
- Start: energy 2, excavator 0, mothership -1, research 0.
- Dice used from public view: low white die on `A-r1-c1`, gray 1 on `A-r1-c4`, gray 1 on `A-r1-c2`, gray 4 on `A-r1-c5`, white 6 on `A-r2-c3`.
- Room actions resolved: `A-aa-c5`, `A-aa-c4`, `A-aa-c2`, `A-aa-c1`, `A-upper-tunnel`, then `end_rooms`.
- Spawn choices: `purple-0 -> DP-C1`, `purple-1 -> DP-C2`, `purple-3 -> DP-C4`, `white-1 -> DP-C3`.
- Round boundary: `017`, public `status=random`, `reason=waiting_for_next_round_roll`, `completedRoundCount=1`.
- Public end snapshot: damage 0, energy 2, mothership 0, research 0, 3 visible ships.

## Round 2

- Public range: `018` through `029`
- Round roll: `018`.
- Dice placements from public view: gray 5 to `A-r2-c1`, gray 5 to `A-r3-c5`, gray 4 to `A-r2-c2`, white 6 to `A-r2-c4`, rerolled remaining white to value 2 and placed it on `A-r1-c3`.
- Room actions resolved: `A-aa-c3`, `A-upper-fighter`, `A-start-tunnel`, then `end_rooms`.
- Publicly observed `A-upper-research` became unaffordable after the fighter spend; incomplete/remaining workers were left at room end.
- Spawn choices: `white-1 -> DP-C2`.
- Round boundary: `029`, public `status=random`, `reason=waiting_for_next_round_roll`, `completedRoundCount=2`.
- Public end snapshot: damage 0, energy 1, mothership 1, research 0, 5 visible ships.

## Round 3

- Public range: `030` through `042`
- Round roll: `030`.
- Dice placements from public view: white 3 to `A-r2-c5`, reroll, gray 1 to `A-r1-c3`, gray 3 to `A-r1-c2`, gray 6 to `A-r2-c4`, white 6 to `A-r1-c1`.
- Room actions resolved: `A-upper-energy`, `A-aa-c1`, `A-aa-c3`, `A-aa-c2`, then `end_rooms`.
- Spawn choices: `white-2 -> DP-C4`.
- Round boundary: `042`, public `status=random`, `reason=waiting_for_next_round_roll`, `completedRoundCount=3`.
- Public end snapshot: damage 0, energy 7, excavator 0, mothership 4, research 0, 3 visible ships.

## Protocol Notes

- No Round 4 dice were submitted.
- No public terminal outcome occurred before the stage stop.
- No rejected operation occurred in this attempt.
- Public verifier result: `public evidence OK`.
