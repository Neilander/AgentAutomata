# V13 round summaries

Attempt: `state_attempt_2026082813_v13`

Attention seed: `2026082813`

Machine records: `001` through `124`

## Round 1

- Records: `001`-`014`.
- Main actions: built A-upper-energy, used A-upper-research, excavated via `r1-gray-0@A-r3-c3`.
- End state: waiting for round 2 roll; energy `4`, damage `0`, researchIndex `2`, excavatorIndex `2`, mothershipRow `0`.

## Round 2

- Records: `015`-`029`.
- Main actions: used A-upper-research and A-path-research, excavated `r2-gray-0@B-r1-c1`.
- End state: waiting for round 3 roll; energy `0`, damage `0`, researchIndex `4`, excavatorIndex `3`, mothershipRow `1`.

## Round 3

- Records: `030`-`041`.
- Main actions: rebuilt energy through A-upper-energy and A-path-energy, skipped nonproductive workers.
- Stage gate: sequence `041`, waiting for round 4 roll with completedRoundCount `3`.
- End state: energy `6`, damage `1`, researchIndex `4`, excavatorIndex `4`, mothershipRow `4`.

## Round 4

- Records: `042`-`057`.
- Main actions: used A-upper-research and A-path-research, excavated `r4-white-4@B-r2-c5`, then `r4-gray-0@B-r1-c1`.
- Important note: the second excavation was shallower and is preserved as an excavator-regression risk.
- End state: waiting for round 5 roll; energy `1`, damage `4`, researchIndex `6`, excavatorIndex `5`, mothershipRow `6`.

## Round 5

- Records: `058`-`074`.
- Main actions: placed research/energy dice, recovered from a column-occupation rejection at `061`, advanced research through A-upper-research, excavated `r5-gray-0@B-r1-c3`.
- End-of-round state before bad random payload: energy `1`, damage `4`, researchIndex `8`, excavatorIndex `7`, mothershipRow `8`.
- Sequence `074` is a preserved rejected player payload misuse: `rolls` field instead of `values`.

## Recovery boundary

- Sequence `075`: preserved nonzero CLI recovery failure after the rejected random payload.
- Sequence `076`: same attempt recovered with explicit correct `submit_round_roll` payload using `values`.

## Round 6

- Records: `076`-`092`.
- Main actions: rebuilt energy via A-path-energy, advanced A-upper-research, attempted A-path-research but max advance was `0`, excavated `r6-white-3@B-r2-c5`.
- End state: waiting for round 7 roll; energy `2`, damage `6`, researchIndex `9`, excavatorIndex `10`, mothershipRow `9`.

## Round 7

- Records: `093`-`109`.
- Main actions: advanced A-upper-research and B-middle-research; A-path-research again had max advance `0`; spawned `purple-4`.
- End state: waiting for round 8 roll; energy `1`, damage `7`, researchIndex `12`, excavatorIndex `10`, mothershipRow `10`.

## Round 8

- Records: `110`-`124`.
- Main actions: placed white 6 on B-upper-research-left, completed A-upper-energy, advanced B-upper-research-left, advanced A-upper-research.
- Research reached `15`.
- Final state: sequence `124`, status `complete`, loss by `mothership_reached_skull_row`; damage `7`, energy `2`, excavatorIndex `10`, mothershipRow `12`.
