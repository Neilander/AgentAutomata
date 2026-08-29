# UFS V20 Round Summaries

Fresh player: `ufs-v20-fresh-player`  
Seed: `2026082920`  
Attempt: `state_attempt_2026082920_v20`

## Round Boundary Summary

| Boundary seq | Completed round | Energy | Research | Excavator | Mother ship | Damage | Notes |
|---:|---:|---:|---:|---:|---:|---:|---|
| 016 | 1 | 6 | 0 | 0 | 0 | 0 | Opened with energy-first play; no damage. |
| 032 | 2 | 6 | 2 | 0 | 3 | 0 | First research progress, but mother ship advanced. |
| 048 | 3 | 5 | 4 | 0 | 4 | 0 | Stage 1 gate passed here. |
| 065 | 4 | 7 | 4 | 0 | 5 | 2 | Tried too-deep excavation, then recovered; damage started. |
| 082 | 5 | 4 | 6 | 1 | 7 | 3 | First successful shallow excavation; research advanced. |
| 098 | 6 | 0 | 8 | 2 | 8 | 4 | Strong research/excavation turn, but energy collapsed to zero. |
| 112 | 7 | 0 | 8 | 2 | 9 | 4 | Energy stayed zero; excavation candidate became unaffordable. |
| 125 | 8 | 0 | 8 | 2 | 11 | 5 | Formal loss: `mothership_reached_skull_row`. |

## Key Learning Events

### Stage 1: setup and first proof of contract health

- By sequence `025`, the recorder exposed a usable `choose_research_advance` contract with `advanceSteps`.
- The player advanced research in Rounds 2 and 3, reaching researchIndex 4 by the Stage 1 gate.
- Stage 1 validation passed before continuing.

### Round 4: too-deep excavation is not valid

- The player attempted an overly deep excavation placement during live play and recovered without restarting.
- The formal run later showed that shallow excavation is valid when the unlock depth matches the current excavator progress.

### Round 5: first successful excavation

- Sequence `074` excavated `r5-gray-2@A-r3-c4`.
- Excavator advanced from 0 to 1.
- Research reached 6 by the end of the round.

### Round 6: strongest progress, then resource collapse

- Path research and upper research both advanced.
- Research reached 9 during the round, but later mother-ship effects reduced it to 8.
- Excavator advanced to 2.
- Energy fell to 0, making later research/fighter/excavation options unaffordable.

### Round 7: zero-energy trap

- The player tried to pursue energy, but only produced incomplete / non-resolvable energy placement.
- An excavation candidate appeared but was listed as unaffordable.
- This is a clean feedback case: “I can see the next excavation, but without energy it cannot happen.”

### Round 8: failure

- Energy remained 0.
- Research room was visible but unaffordable.
- Defensive AA actions did not prevent the loss.
- The game ended at sequence `125` with mother ship row 11 and formal loss.

## Interpretation

The run is useful even though it lost. It shows the loop is now playable end-to-end, and the failure is cognitive/strategic rather than a pipeline blocker:

- The player can choose actions, predict consequences, receive authoritative feedback, and continue.
- The player does not yet value “maintain energy reserve” and “prevent mother-ship penalties” strongly enough.
- The player needs to learn that partial energy rooms do not solve the energy crisis.
