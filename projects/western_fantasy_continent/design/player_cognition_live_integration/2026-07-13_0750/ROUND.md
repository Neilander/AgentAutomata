# Phase 2 Mid-Region Soft Lock A/B

Date: 2026-07-13 07:50 CST

## Design Question

Can Region 1 regain a meaningful resistance beat after the accepted Ranger onboarding, while preserving multiple solutions and making failure -> key -> retry causally readable from real signals?

## Candidate Design

- Kept the accepted Prison rescue -> Ranger swap -> Main 4 proof chain unchanged.
- Added a candidate-only `heavy_shield_lock` field to Main 6.
- Main 6 uses two Knights, one Priest, and one Ranger at a tuned candidate scale.
- The lock visibly creates opening heavy shields.
- Existing builds can bypass the lock.
- Failure makes the already-visible Bandit armory the next selected action.
- Bandit first clear grants the existing shield-break axe and armor-break gloves plus a new shield-break Ranger bow.
- The retry uses the same Main 6 enemy and field rules; enemies are not secretly weakened after key acquisition.

## Signal Corrections

- Added renderer-backed support for generic `field` signals.
- Field activation labels use their real equipment holder as `source`.
- Counter activation labels anchor on the equipment holder, avoiding enemy damage-number clustering.
- Candidate field events enter the frozen adapter through the existing visible `status` / `field_effect` contract.
- `破盾军械生效` and `裂甲军械生效` are H-accepted in the retry trace.
- The old `heavy_shield_line` combat semantics remain unchanged; the new counter rule belongs to candidate-only `heavy_shield_lock`.

## Matched 30-Route Result

| Metric | Ranger baseline | Mid-lock candidate |
|---|---:|---:|
| First Main 6 win | 30/30 | 11/30 |
| First Main 6 loss | 0/30 | 19/30 |
| Camp chosen immediately after loss | - | 19/19 |
| Main 6 retried immediately | - | 19/19 |
| Retry win | - | 19/19 |
| Existing-build bypass | 30/30 | 11/30 |
| Ranger onboarding preserved | 30/30 | 30/30 |
| Terminal route | 30/30 | 30/30 |
| Average actions | 14.0 | 14.6333 |
| Average losses | 0.0 | 0.6333 |
| Average final emotion | 54.7621 | 54.9952 |
| Emotion gain per action | 1.1973 | 1.1635 |

## Failure-Route Emotion Arc

```text
before Main 6: 46.0372
after visible loss: 44.7889
after Bandit key: 46.6366
after immediate retry win: 48.1561
```

The loss creates a contained negative signal. The key acquisition repays it, and verification rises above the pre-lock state. The lower gain per action is the cost of adding one meaningful decision/recovery loop, not hidden idle repetition.

## Width And Robustness

- A separate 60-route candidate sweep produced 30 lock routes and 30 existing-build bypasses.
- Every lock route selected Bandit next and won the immediate retry.
- The Bandit key increased visible equipment score by about 103% on loss routes in the 30-pair sample.
- All routes retained the Ranger onboarding and bounded terminal.

## Bounded Interpretation

This validates a readable power-growth soft lock with visible counter-flavored evidence. It does not prove Frozen V3 semantically reasons over a general shield/armor counter taxonomy. The retry decision is still driven primarily by visible power growth; the named counter activations support post-action causal learning.

## Independent Review

- Cognition/signal reviewer: ACCEPT.
- Lock-key/pacing reviewer: ACCEPT.
- Both found no failing route in the reviewed scope.
- Both require the bounded interpretation above.
- The broad 500-team field-effect validator exceeded the 240-second local window; direct same-team old/new field traces and focused regressions passed, so full waterline revalidation remains pending.

## Result

Accept the isolated mid-lock candidate for its narrow claim. Formal map code remains unchanged. The next useful question is whether the combined accepted candidates should be assembled into one human-playable map candidate for manual validation, rather than adding more isolated systems.
