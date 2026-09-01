# Results

## Verdict

The minimal memory-led room-completion boundary passes.

The real UFS public response exposes only `place_die` with required fields `type`, `dieId`, and `cellId`. Visible rooms expose their visible cell identities, but neither the action contract nor room view exposes `requiredDiceCount`, `requiresAllCells`, or an equivalent completion instruction.

Using the real local GTE matrices:

- the Q-after energy cue recalls `read-rule-energy-room-to-energy-gain`;
- the Q-before visible multi-cell scene recalls `read-rule-multi-room-placement-to-completeness`;
- combining the two memories grounds the real two-cell energy room to two primitive placements;
- the same recalled all-cells relation grounds a synthetic three-cell version to three placements;
- when the Q-before completion memory is removed, the multi-cell result is rejected as `missing_recalled_multicell_completion_relation` instead of being inferred from `room.cellIds.length` alone.

The real two-placement candidate was passed to `imagineSequentialPlan()`. Its automatic GTE/cognitive trace marked the room incomplete after the first placement and complete after the second.

## Architectural change

V2 remains frozen for historical paired evidence. V3 adds a separate controller whose algorithm has no `energy => 2 dice`, `Math.min(2, ...)`, `requiredDiceCount`, or equivalent special case.

Knowledge is separated into:

- environment: visible cells and the primitive placement operation;
- planning memory: a structured projection of existing rule-reading trajectories;
- recall: independent Q-before and Q-after GTE routes;
- grounding: repeat the recalled primitive operation over the currently visible unoccupied cells;
- imagination: reuse the existing automatic sequential Q rollout.

## Validation

- Focused tests: 7/7 PASS.
- Full related regression including the new tests: 195/195 PASS.
- Real attention seed: `2026090104`.
- No long game was started.
- The default `planCurrentChoice()`, player initializer, player profiles, V4 sealed controller, and V4 evidence were not modified.

## Limits

- `planning-affordance-memory.json` is currently a manually structured projection of existing rule-reading trajectories, not yet an automatically emitted planning view of arbitrary learned `operations[]` memories.
- Macro-intent generation still uses the V2 deterministic scaffold.
- Non-dice choices currently delegate to the V2 controller.
- This unit verifies candidate discovery and grounding at a real placement cutpoint; it does not yet prove full-round or multi-round outcome improvement.

## Next step

Use this controller in one fresh single-round runner. Require every multi-cell completion package to carry both Q-after result provenance and Q-before all-cells provenance, then compare its chosen anchors against V2 without starting a long game.
