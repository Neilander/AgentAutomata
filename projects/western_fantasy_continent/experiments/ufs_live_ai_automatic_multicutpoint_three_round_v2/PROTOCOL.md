# Automatic multi-cutpoint live gate protocol

1. The live controller receives only the current player response: noticed observation, visible map, pending contract and available operations.
2. It derives one round-level macro intent and retains that intent across random pauses.
3. At every non-random choice it creates at most three candidates from intent and visible environmental anchors. It does not enumerate the die × cell Cartesian product.
4. Every candidate is passed to `UfsFullGameAttentionSession.imagineSequentialPlan()`. No intermediate Q is authored by the controller.
5. Only a candidate whose first operation was actually imagined and whose status is `complete` or `paused_random` may execute. `invalidated`, `paused_uncertain` and `rejected` never execute.
6. Only the first operation of the selected candidate executes. The suffix is discarded, so the next action is generated and validated against the newest Q.
7. At `paused_random`, the live random provider supplies the exact keys from the public pending contract. The old suffix is discarded and all candidates are regenerated after observation.
8. `submit_random_observation` and `submit_round_roll` are external environment operations and cannot be authored inside a plan.
9. Formal host state may be inspected only after a completed round reaches the next-round-roll boundary. Post-hoc audit output is evidence only and is never fed back into the controller.
10. The first round is a gate. Three-round continuation is allowed only if every gate assertion passes at round 1.
