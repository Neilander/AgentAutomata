# UFS automatic-vs-original paired protocol V4

This entirely new V4 experiment supersedes the invalid V3 pairing while retaining every V3 failure artifact. V3 cannot be compared because its old-arm shell checked for `status: choice` at a real public boundary whose shape was `status: random`, `reason: waiting_for_next_round_roll`.

`PAIR_PROTOCOL.json` is frozen before either arm runs. Both arms use the identical public initial state/map, attention seed `2026090104`, fresh xorshift32 seed `0x243f6a88` (unsigned `608135816`), and one continuous fresh session through exactly three completed rounds. Each public pending ID consumes exactly one draw, in public ID order, with ordinal/raw/value/ID/contract/round/reason recorded. Preview, retry, skip, reorder, and extra consumption are forbidden.

The only valid completed-round safety boundary is implemented by `safety-boundary.js`: status must be `random`, reason must be `waiting_for_next_round_roll`, and `submit_round_roll` must be available. The host-free structural test was executed before any formal run: the real shape returned true, V3's wrong `choice` shape returned false, and another random boundary returned false. Both arms must import this exact helper and verify the helper, test, and pre-run evidence hashes in the JSON protocol. The old arm is forbidden to author another boundary predicate.

The new arm is sealed to the existing V2 `automatic-multicutpoint-controller.js` plus `imagineSequentialPlan()`. It executes only the selected candidate's step 0 from the newest public Q. At a random pause it consumes only the externally bound public draws, discards the old suffix, and replans from the resulting new Q. Formal host inspection is allowed only after the shared predicate returns true, is post-hoc, and cannot enter later planning.

This protocol establishes paired inputs only. The new arm neither reads nor compares the old arm and makes no advantage claim. The old arm must seal the original default single-step policy without reading new-arm outputs.
