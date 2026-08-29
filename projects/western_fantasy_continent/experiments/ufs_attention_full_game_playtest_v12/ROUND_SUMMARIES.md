# UFS attention full-game playtest V12 round summaries

- Attempt: sealed single attempt
- Seed: `2026082712`
- Evidence root: `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v12/`
- Constraint: player decisions used only public attention-limited stdout, public `mapView`, public `pending.candidates`, `availableOperations`, and rule knowledge.

## Round 1

The player filled the two-cell `A-upper-energy` room with `A-r2-c4` and `A-r2-c5`, then resolved it successfully. This confirms the V11 correction that the energy room must be filled before resolution. The player also resolved research/fighter when public candidates showed them as `resolvable`, skipped `A-upper-tunnel` when it appeared under `noOutputRoomIds`, and continued through a spawn choice instead of stopping at the boundary.

## Round 2

The player made one strategy/placement error by occupying column C4 before trying to place into `A-r2-c4`; the host rejected the later placement as `selected column is already occupied: C4`. The player recovered using public operations. Excavation candidates were used to advance deeper cells, but this created a negative energy state (`energy: -1`) that shaped the rest of the attempt.

## Round 3

The player again completed `A-upper-energy`, and public candidates listed it as `resolvableRoomIds`. However, resolving it with `pay:true` was rejected as `script chose unaffordable room: A-upper-energy` while energy was already negative. After the rejection, the player did not stop; they skipped/cleared candidates and advanced to the next round.

## Round 4

The same negative-energy energy-room failure reproduced: `A-upper-energy` was publicly listed as resolvable, but resolution was rejected as unaffordable. The player treated this as a system/contract observation, not as a terminal condition, skipped remaining unresolved or incomplete room candidates, and continued. A noticed `excavator_back` mothership action was consistent with the later excavator rollback.

## Round 5

The player used public room candidates conservatively under negative energy, skipped unaffordable/incomplete candidates, and continued through the round. A `research_back:1` mothership action was noticed in public `mothershipActions`; after the round boundary, public `researchIndex` remained at 1, which is recorded as an observation for follow-up rather than treated as private-audit knowledge.

## Round 6

The player again saw `A-upper-energy`, `A-upper-fighter`, and `A-upper-research` in `resolvableRoomIds`, with `A-path-fighter` incomplete and an excavation candidate. Because energy recovery had already twice been publicly rejected from negative energy, the player skipped the paid/economic candidates and avoided additional excavation debt. A spawn choice appeared; one invalid payload used `spawnId`, producing a public rejected response, then the documented `dropPointId` field succeeded.

## Round 7

The player prioritized low dice in AA cells to control visible top-row/edge threats and placed a high die in a less dangerous column. The room-action phase then listed only AA rooms under `noOutputRoomIds`, with all placements `skippable`; the player skipped all AA workers and ended rooms. The attempt reached a rules-explicit terminal state: `complete/loss`, reason `mothership_reached_skull_row`, in round 7.
