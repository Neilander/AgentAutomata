# UFS V15 Round Summaries

Attempt: `state_attempt_2026082815_v15`

Public evidence scope:

- Decisions were made from the V15 player protocol plus public recorder output/evidence only.
- The run used `record-public-step.js` from `001 start`.
- Host checkpoint, attention/feedback audit files, implementation source, old playtests, and old reports were not used while choosing.
- The run stopped immediately at `evidence/083.stdout.json`, the first observed Round 4 next-round-roll boundary after three completed rounds.
- No Round 4 dice were submitted.

Important evidence caveat:

- `node verify-public-evidence.js` failed because `evidence/002` records a nonzero CLI invocation failure.
- The game was then continued in the same attempt from later public steps and reached the requested three-round boundary.
- Therefore this run is useful as a public play transcript, but it is not a clean verifier-passing stage-gate artifact.

## Round 1

Starting public state:

- `completedRoundCount=0`
- `damage=0`
- `energy=2`
- `researchIndex=0`
- `mothershipRow=-1`
- Visible dice included gray `2/3/4` and white `5/1`.

Main choices:

- Placed white `1` at `A-r1-c3`.
- After white reroll, placed gray `3` at `A-r1-c1`.
- Placed gray `6` at `A-r2-c4`.
- Placed white `4` at `A-r2-c5`.
- After reroll, placed gray `3` at `A-r2-c2`.
- Resolved `A-upper-energy`, `A-upper-research`, `A-aa-c1`, and `A-aa-c3`.
- Chose one research advance at `A-upper-research`.
- Spawn choices placed ships at `DP-C5`, `DP-C4`, `DP-C3`, and `DP-C2`.

Rejected/recovered public steps:

- `010` rejected because formal room resolution required explicit `pay:true`.
- `013` through `031` were rejected research-choice payload probes, including a rejected `skip_worker` attempt before the later clarification.
- `032` recovered with `choose_research_advance` using `roomId` plus `advanceSteps`.
- `036` through `045` were rejected spawn-choice payload probes.
- `046` recovered with the correct `dropPointId` field.

Round 1 boundary:

- Reached at `049`.
- `completedRoundCount=1`.
- `energy=5`.
- `researchIndex=1`.
- `mothershipRow=1`.
- Pending state waited for the Round 2 next-round roll.

## Round 2

Starting public roll:

- Submitted the Round 2 roll at `050`.
- Public last action values: gray `1/2/6`, white `1/5`.
- Public observation showed available dice gray `2/6` and white `1/5`.
- `energy=5`, `researchIndex=1`, `mothershipRow=1`.

Main choices:

- Placed white `1` at `A-r1-c3`.
- After reroll, placed gray `3` at `A-r1-c4`.
- Placed white `6` at `A-r3-c5`.
- After reroll, placed gray `1` at `A-r1-c2`.
- Placed gray `6` at `A-r1-c1`.
- Resolved `A-aa-c4`, `A-aa-c3`, `A-aa-c2`, `A-aa-c1`, and `A-start-tunnel`.
- Spawn choices placed ships at `DP-C4` and `DP-C1`.

Round 2 boundary:

- Reached at `065`.
- `completedRoundCount=2`.
- `energy=5`.
- `researchIndex=1`.
- `mothershipRow=2`.
- Pending state waited for the Round 3 next-round roll.

## Round 3

Starting public roll:

- Submitted the Round 3 roll at `066`.
- Public last action values: gray `2/2/5`, white `1/1`.
- Public observation showed available dice gray `2`, white `1/1`.
- `energy=5`, `researchIndex=1`, `mothershipRow=2`.

Main choices:

- Placed white `1` at `A-r1-c3`.
- After reroll, placed gray `2` at `A-r1-c5`.
- Placed white `6` at `A-r2-c1`.
- After reroll, placed gray `5` at `A-r1-c4`.
- Placed gray `6` at `A-r2-c2`.
- Resolved `A-upper-fighter`.
- Resolved `A-upper-research` and chose three research advances.
- Resolved `A-aa-c5`, `A-aa-c4`, and `A-aa-c3`.
- Spawn choices placed ships at `DP-C5`, `DP-C4`, and `DP-C1`.

Round 3 / Stage 1 boundary:

- Reached at `083`.
- `status=random`.
- `reason=waiting_for_next_round_roll`.
- `pending.type=next_round_roll`.
- `pending.round=4`.
- `game.completedRoundCount=3`.
- `game.damage=0`.
- `game.energy=2`.
- `game.researchIndex=4`.
- `game.mothershipRow=3`.
- `game.outcome=null`.
- No Round 4 roll was submitted.
