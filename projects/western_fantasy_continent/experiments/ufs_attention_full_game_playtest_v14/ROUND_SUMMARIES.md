# V14 round summaries

## Round 1

- Started with energy `2`, damage `0`, research `0`, excavator `0`.
- Completed the two-space `A-upper-energy` room and resolved it, raising energy to `7`.
- Resolved `A-upper-research` and advanced research to `1`.
- Excavated `A-r3-c3`, advancing excavator to `2`.
- Ended at sequence `012`, waiting for round 2 roll, with energy `4`, research `1`, excavator `2`, mothership row `0`.

## Round 2

- Submitted public round 2 random roll at sequence `013`.
- Resolved high-value `A-upper-research` and advanced research from `1` to `4`.
- One attempted B-tunnel placement at sequence `017` was publicly rejected for occupied column `C2`; sequence `018` recovered with `B-r1-c1`.
- Resolved `A-path-research`, but its budget allowed `0` advance.
- Excavated `B-r1-c1`, advancing excavator to `5`.
- Ended at sequence `026`, waiting for round 3 roll, with energy `0`, research `4`, excavator `5`, mothership row `2`.

## Round 3

- Submitted public round 3 random roll at sequence `027`.
- Placed `A-path-energy` first because energy was `0`.
- Avoided a second locked/unexcavated placement after placing `B-r1-c2`.
- At sequence `033`, the public room candidates correctly listed `B-r1-c2` under `unaffordableExcavationPlacementIds` while energy was `0`.
- After resolving `A-path-energy`, energy rose to `6` and `B-r1-c2` moved into affordable `excavationPlacementIds`.
- Resolved `A-path-research` and advanced research from `4` to `6`.
- Excavated `B-r1-c2`, then the mothership row 5 effect left final excavator index at `5`.
- Ended at sequence `038`, waiting for round 4 roll, with energy `4`, research `6`, excavator `5`, mothership row `5`.

## Round 4

- Continued from the root-audited stage-1 checkpoint with public random roll at sequence `039`.
- Prioritized research acceleration: placed gray `6` at `B-r1-c1`, gray `4` at `B-r1-c3`, and white dice into `A-upper-energy`/`A-upper-research`.
- Resolved `A-upper-energy`, raising energy from `4` to `7`.
- Resolved `B-upper-research-left`, whose public room effect allowed `advanceSteps=2`, raising research from `6` to `8`.
- Resolved `A-upper-research`, whose public room effect allowed `advanceSteps=1`, raising research from `8` to `9`.
- Excavated `r4-gray-0@B-r1-c3`, advancing excavator to `7`.
- Ended at sequence `053`, waiting for round 5 roll, with damage `3`, energy `4`, research `8`, excavator `7`, mothership row `6`.

## Round 5

- Submitted public round 5 random roll at sequence `054`.
- Placed gray `5` at `B-r1-c3`, white `6` at `B-r1-c4`, then used the white reroll boundary at sequence `057`.
- After reroll, placed gray `6` at `B-r1-c1`, gray `5` at `A-r2-c2`, and white `3` at `A-r1-c5`.
- Resolved `B-upper-research-left`, whose public room effect allowed `advanceSteps=1`, raising research from `8` to `9`.
- Excavated `r5-white-4@B-r1-c4`, raising excavator from `7` to `8`.
- `B-upper-research-multi` remained incomplete after that excavation, so no multi-room research payout was taken in this round.
- Ended at sequence `065`, waiting for round 6 roll, with damage `6`, energy `3`, research `8`, excavator `8`, mothership row `8`.

## Round 6

- Submitted public round 6 random roll at sequence `066`.
- Filled the now-open `B-upper-research-multi` with gray `3` at `B-r1-c3` and white `6` at `B-r1-c4`; the white placement correctly produced a reroll boundary at sequence `068`.
- After the public reroll, placed gray `3` at `B-r1-c1`, gray `1` at `A-r2-c2`, and white `2` at `A-r1-c5`.
- Resolved `B-upper-research-multi`, paying `2` energy and receiving public budget `9` with `maxAdvanceSteps=3`.
- Sequence `074` was publicly rejected because the player used the wrong JSON field name for research advancement; sequence `075` immediately recovered with the correct `roomId` + `advanceSteps` payload and advanced research from `8` to `11`.
- Resolved `B-upper-research-left`; its public budget `2` could not meet the next continuous cost `3`, so sequence `077` advanced `0` steps.
- Skipped the unaffordable `A-upper-research` worker rather than forcing a `2`-energy room with only `1` energy available.
- Ended at sequence `079` with public `status=complete`, `outcome.result=loss`, reason `mothership_reached_skull_row`, damage `6`, energy `1`, research `11`, excavator `8`, mothership row `11`.
