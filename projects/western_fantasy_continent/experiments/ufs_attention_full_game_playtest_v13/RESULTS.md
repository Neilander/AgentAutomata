# V13 full playtest results

Date: 2026-08-28

Experiment: `ufs_attention_full_game_playtest_v13`

Attempt/state: `state_attempt_2026082813_v13`

Attention seed: `2026082813`

## Result

- Final public record: sequence `124`.
- Final public status: `complete`.
- Final outcome: `loss`.
- Final reason: `mothership_reached_skull_row`.
- Final round: `8`.
- Final public snapshot: damage `7`, energy `2`, researchIndex `15`, excavatorIndex `10`, mothershipRow `12`.

The complete playtest continued from the original V13 attempt and did not restart or create a second attempt.

## Stage gate

- Correct three-round gate was sequence `041`.
- Sequence `041` status: `random / waiting_for_next_round_roll`.
- Sequence `041` pending: `next_round_roll` for round `4`.
- Sequence `041` completedRoundCount: `3`.
- Root replay audit result recorded earlier: `stageGatePassed=true`; restored host had round `3`, phase `new_round`, energy `6`, damage `1`, researchIndex `4`, excavatorIndex `4`, mothershipRow `4`, outcome `null`.

Sequences `042` onward were initially advanced before formal continuation authorization. They were not deleted, rewritten, or hidden. After authorization, play continued from the same checkpoint and next sequence.

## Recovery/event notes

- Sequence `061`: rejected player operation, `invalid_action:selected column is already occupied: C4`; recovered by choosing a different legal placement at sequence `062`.
- Sequence `074`: rejected player payload misuse. The operation used `rolls` where the CLI/session expected `values`, causing `submit_round_roll_requires_all_current_dice_values_1_to_6`.
- Sequence `075`: preserved pipeline recovery bug evidence. The old CLI `random` path refused to recover from a previous rejected public view and exited nonzero with no public response.
- Sequence `076`: same game recovered legally by submitting the round-6 random values with the correct `values` field.
- After root fixed the CLI recovery bug, V13's public verifier was adjusted only inside the V13 experiment to treat sequence `075` as a known preserved exception while still validating sequence continuity, public operation availability, and final stop status.

## Validation

Command:

```text
node projects\western_fantasy_continent\experiments\ufs_attention_full_game_playtest_v13\verify-public-evidence.js
```

Result:

```text
public evidence OK
```

Validation scope:

- `124` consecutive machine records from `001` to `124`.
- Single `start` record.
- Public evidence files preserved under `evidence/`.
- Payload files preserved under `payloads/`.
- Expected known nonzero exit: sequence `075` only.
- Final stop accepted because public status is `complete`.

## Unresolved risks

- Excavator regression risk remains visible in the preserved playtest: sequence `053` excavated `r4-white-4@B-r2-c5`, then sequence `054` excavated shallower `r4-gray-0@B-r1-c1`, after which public `excavatorIndex` ended round 4 at `5`. This may be a system/rules semantic issue: the candidate list allowed a shallower excavation after a deeper one. Later decisions avoided known shallower excavation candidates when a higher excavatorIndex was already reached.
- The attention-limited view intentionally omitted some dice/rooms/ships at different moments. Some decisions therefore used imperfect public information. This is desired for the simulated-player experiment, but it means the playtest is evidence of behavior under partial attention, not optimal play.
- Research reached `15` before the final loss, but no public win outcome appeared before the mothership loss. The report records the public outcome only and does not infer a hidden win condition.
