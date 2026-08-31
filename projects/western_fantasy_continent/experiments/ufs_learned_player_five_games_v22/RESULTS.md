# V22 five consecutive full games: results

## Answer

**Game 5 did not improve over Game 1.**  Both were formal Round-7 losses for
`mothership_reached_skull_row`, with the same terminal damage 5, energy 3, research 7,
excavator 0, and mothership row 11.  The same was true of Games 2-4.

The experiment cleanly distinguishes three facts:

- **Learning was saved:** yes.  Five one-time captures advanced the player through revisions
  `1 → 2 → 3 → 4 → 5 → 6`, and the prediction ledger grew from 189 to 959 entries.
- **Saved `feedback-*` learning was activated:** no.  Across all five games, actual prediction
  tickets sourced from a `feedback-*` trajectory numbered **0**.  All 146 final learned feedback
  trajectories remained `pending_matrix_compile`.
- **Behavior or result improved:** no.  Game 1 and Game 5 had zero public-view divergences, zero
  submitted behavior divergences, and zero random-observation divergences.  They also had identical
  process and outcome metrics.

This is a strong null result for this frozen five-game sequence, not proof that feedback learning
can never help.  Storage succeeded, but the stored trajectories did not enter the active path.

## Five-game trend

| Game | Revision in→out | Formal result | Terminal round | Damage | Energy | Research | Excavator | Mothership | Actions / records | Rejected / invalid | Prediction coverage |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1→2 | loss, mothership skull row | 7 | 5 | 3 | 7 | 0 | 11 | 104 / 105 | 0 / 0 | 91/91 (100%) |
| 2 | 2→3 | loss, mothership skull row | 7 | 5 | 3 | 7 | 0 | 11 | 104 / 105 | 0 / 0 | 91/91 (100%) |
| 3 | 3→4 | loss, mothership skull row | 7 | 5 | 3 | 7 | 0 | 11 | 104 / 105 | 0 / 0 | 91/91 (100%) |
| 4 | 4→5 | loss, mothership skull row | 7 | 5 | 3 | 7 | 0 | 11 | 104 / 105 | 0 / 0 | 91/91 (100%) |
| 5 | 5→6 | loss, mothership skull row | 7 | 5 | 3 | 7 | 0 | 11 | 104 / 105 | 0 / 0 | 91/91 (100%) |

Every game had 35 die placements, 28 room resolutions, 7 research choices, 7 room-end actions,
14 spawn choices, 7 white-reroll observations, and 6 next-round rolls.  No ordinary choice,
random, or rejected boundary was treated as an endpoint.

## Predictions and learning

| Game | Confirmed | Contradicted | Unresolved | Ambiguous | New trajectories | New connections | New attention adjustments | `feedback-*` activations |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 76 | 34 | 37 | 7 | 81 | 2 | 0 | 0 |
| 2 | 76 | 34 | 37 | 7 | 11 | 0 | 0 | 0 |
| 3 | 76 | 34 | 37 | 7 | 0 | 0 | 0 | 0 |
| 4 | 76 | 34 | 37 | 7 | 0 | 0 | 0 | 0 |
| 5 | 76 | 34 | 37 | 7 | 0 | 0 | 0 | 0 |

Game 1 expanded the learned set from 54 to 135 trajectories; Game 2 reached 146.  Games 3-5
added no new trajectory or connection despite each appending another 154 resolved ledger entries.
This is persistence and deduplication/plateau evidence, not active reuse evidence.

The final revision-6 profile contains 146 learned trajectories, 11 connection updates, zero
attention adjustments, and 959 ledger entries.  All 146 feedback trajectories are still marked
`pending_matrix_compile`, which is consistent with the observed zero activation.  The experiment
does not prove that compile status is the only cause.

## Preregistered hazards

| Game | Zero-energy entries (minimum) | Partial two-cell energy moments | Incomplete energy at room boundary | Research rollback | Mothership-danger room ends | Invalid choices |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0 (min 1) | 7 | 0 | 1 | 2 | 0 |
| 2 | 0 (min 1) | 7 | 0 | 1 | 2 | 0 |
| 3 | 0 (min 1) | 7 | 0 | 1 | 2 | 0 |
| 4 | 0 (min 1) | 7 | 0 | 1 | 2 | 0 |
| 5 | 0 (min 1) | 7 | 0 | 1 | 2 | 0 |

The controller encountered one temporary partial state of the two-cell energy room in each round
and explicitly predicted no immediate income; it always filled the second cell before the room
boundary.  Therefore there were seven partial-placement moments but zero unresolved incomplete
energy rooms.  Energy never fell below 1.  Each game still suffered one visible research rollback
and two late mothership-danger room-end decisions, then lost to the mothership at the same point.

## Comparability and limits

- Frozen attention seed: `2026082920` for all games.
- Precommitted random-tape seed: `2026082922`; tape SHA-256
  `87af864441a322a5f766151e66feb60a4845b8d2a26905e6abad3bdc709d81d5`.
- Game 1 vs Game 5: 0/105 normalized public-view divergences, 0 behavior-payload divergences,
  and 0 random-payload divergences.
- Thirteen full-payload differences are optional prediction rationale wording from Game 1's live
  bootstrap steps; action type/IDs/values and formal observations are identical.  Games 2-5 have
  zero full-payload differences as well.
- One keyed random tape is a controlled sequence, not a statistical sample.  Because no behavioral
  branch occurred here, exposure was identical; this still does not establish a general causal
  claim about other seeds or a future compiled-learning path.

Machine-auditable details are in `AUDIT_SUMMARY.json`; each `records/game-NN/` directory contains
the public ledger, decision log, payloads, random observations, evidence, pre/post capture audits,
and the single capture record.

