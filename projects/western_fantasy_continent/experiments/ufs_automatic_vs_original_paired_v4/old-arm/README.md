# UFS automatic-vs-original paired V4 — old arm

This directory contains the sealed original-policy arm only. The policy is the existing
`UfsFullGameAttentionSession.planCurrentChoice()` default single-step planner: call it exactly
once at every non-random public choice and submit the returned `recommendedPayload` unchanged.

Run order:

1. `node preflight-old-arm.js`
2. `node run-old-arm.js`
3. `node verify-old-arm.js`

The preflight imports the shared safety-boundary helper, verifies the protocol/helper/test/sealed
result and frozen public asset hashes, and runs the three host-free structural cases. The formal
runner refuses to start without the passing preflight artifact and imports the same shared helper.
It starts one fresh session and stops at exactly the third helper-recognized completed-round
boundary. Formal host inspection is guarded so it is possible only inside the post-hoc audit block.

No sequential-imagination or automatic multi-cutpoint controller is imported or called by this
arm. Random values come only from the arm-local external xorshift32 provider and are consumed once
per public pending ID in exposed order.
