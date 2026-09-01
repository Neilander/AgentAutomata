# UFS automatic-vs-original paired protocol V3

`PAIR_PROTOCOL.json` is the machine-readable frozen protocol and the bytes hashed by each arm. Both arms must use the same public initial state, public map, attention seed `2026090102`, xorshift32 algorithm, initial random seed `0x5f3759df`, and complete exactly three rounds.

For every public pending random contract, the arm consumes values in the exact order of IDs exposed by that contract. Each draw is recorded with a single global ordinal and its bound ID. Formal host state is inspected only at a completed round's `waiting_for_next_round_roll` boundary and cannot feed subsequent choices.

The new arm is frozen to the existing V2 `automatic-multicutpoint-controller` plus `imagineSequentialPlan()`. The old arm must choose and seal the original policy without reading any new-arm result or evidence. It may read only this protocol and the frozen shared assets before its run.

This protocol establishes paired inputs, not an advantage claim. Comparison is valid only after both arm-local validators pass and both random tapes match draw-for-draw through the shared prefix required by their public pending contracts.
