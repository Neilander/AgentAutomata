# Phase 2 Playable Candidate: Single Battle Settlement

## Problem

The human candidate previously played a battle in `BattleView`, then called the candidate core, which simulated the same encounter a second time for settlement. Matching seeds made the two results likely to agree, but the architecture still allowed a future display/result contradiction.

## Change

- `candidate-v3.js` now reads the completed unified simulation directly from the battle view.
- It serializes winner, duration, HP scores, units, signals, summary, and metrics from that played simulation.
- The serialized result is passed to the combined candidate core as `resolvedCombat`.
- The core normalizes that result and settles progression, loot, knowledge-facing events, and diagnosis without calling `resolveCombat` again.
- A fallback accepts the already played legacy `BattleView` result and normalizes ally/enemy sides to left/right.

AI routes still use the core simulation path. The human page uses the displayed-battle path. Both converge on the same settlement code after combat.

## Validation

- Combined candidate regression: pass.
- Mid-lock regression: pass.
- V3 character-affordance regression: pass.
- Display/core parity covers outcome, duration, resolution, survivors, visible feedback signals, deterministic loot, and inventory.
- Candidate page loaded successfully in Chrome at 1440x900 after the change.
- Frozen V3 runtime, policy, and adapter hashes are unchanged.
- Independent architecture review: ACCEPT.
- Independent cognition-boundary review: ACCEPT after narrowing the claim.

## Exact Claim

The battle shown in the human candidate is now the only combat result used to settle that action. The page no longer reruns combat after playback.

## Boundary

The browser candidate does not run the complete Frozen V3 runtime. It shows lightweight goal, knowledge, result, and diagnosis summaries. The full Frozen V3 event-to-emotion-to-action loop remains in the AI playtest path. Visible browser combat signals are structured for analysis, but the page does not yet feed them into a browser-side V3 state.

