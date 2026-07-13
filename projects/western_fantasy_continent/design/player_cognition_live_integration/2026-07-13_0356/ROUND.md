# Round 2026-07-13 03:56

## Stage

Phase 1 final causal controls and freeze. No gameplay optimization performed.

## H And Presentation

- The real battle renderer and cognition share `combat-signals.describePresentation`.
- Visibility requires the same source/target anchors used by actual renderer methods.
- Presentation evidence uses concrete CSS class, font pixels, animation duration, color token, and DOM-unit anchor.
- Cognition performs the normalization; renderer metadata no longer supplies precomputed psychological strength.
- Attention competition uses overlapping animation intervals in the same rendered unit zone, avoiding fixed-bucket seams.
- Opening trace: 140 accepted, 36 ignored signals.

## Probability And Interruption

- Defeat sets `lootOpportunity=false`; it emits no loot probability event and cannot increment dry streak.
- Defeat closes the action ledger with `resolutionBoundary=interrupted_by_defeat` and truncates reward events.
- Real 100-attempt Main 1 trace: 93 reasonable dry, six successes, one abnormal dry at attempt 94. Reasonable dry produced zero A; abnormal dry produced `-0.6485` A.
- First-ever probability success has no invented prior and therefore no expectation-surprise A.

## Event-Derived Emotion To Action

Two players received the same deterministic 23 battle outcomes, equipment/game state, goals, available actions, and unknown Prison/Main 4 candidates.

- Visible combat/loot feedback: emotion `45.7353`, selected Prison.
- Occluded combat/loot feedback: emotion `37.4997`, selected Main 4.

No emotion field was assigned. The difference came through actual presentation -> H -> feedback stock -> risk tolerance -> action ranking.

## Calibration Changes

- `discover_new_capabilities.subjectiveValue`: `0.35 -> 0.39`.
- Optional unknown-route risk: linear `(1 - tolerance) * 0.05` -> quadratic `(1 - tolerance)^2 * 0.2`.

Reason: the earlier policy barely used event-derived feedback when evaluating risk. The quadratic form makes discouragement increasingly risk-averse while preserving moderate exploration. This is a transparent provisional human-property calibration. It was reviewed for overfitting; both reviewers accepted the causal proof and recorded human-validation risk.

## Verdict

Two independent reviewers: ACCEPT Phase 1 and freeze V1.
