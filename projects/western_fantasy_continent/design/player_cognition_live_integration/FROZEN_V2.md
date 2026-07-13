# Frozen Player Cognition V2

Frozen at: 2026-07-13 04:46 CST

Status: the reopened long-horizon Phase 1 gate passed two independent reviews. This version is the required player/parser configuration for resumed Phase 2 paired gameplay A/B tests.

## Strictly Frozen

| File | SHA-256 |
|---|---|
| `game_data/player-cognition-v2-event-runtime.js` | `784FADEA5D7102E238028AA0AB9387A8395DB5144C6C624E8B7A32EA4B9306A4` |
| `game_data/player-cognition-v2-action-policy.js` | `8A086F02515DF7F8BD6443BF9F6DF3C83A6174F7DEDC6722D101F0B6BB2A2FA2` |
| `game_data/map-cognition-v2-event-adapter.js` | `F608C45E23C783E994D6AA66FD65D4D0295E7474BCAA5050F66F0DB2C170917C` |

Do not change these files during gameplay A/B. A further cognition-model change creates V3, reopens Phase 1, and requires new causal controls plus independent acceptance.

## V2 Long-Horizon Contract

- Failure power baselines are learned only from visible numeric team-power evidence.
- Hidden power cannot create or wake a failure baseline.
- Failed goals remain dormant below their observed wake condition.
- Visible equipment growth of at least 30% from the failure baseline permits explicit reconsideration.
- Preparation repetition remains legal while it serves a visible unfinished goal and creates a testable power-growth hypothesis.
- A completed region with no unfinished visible node concludes instead of entering a terminal farm attractor.

## Accepted Controls

- Frozen V1 immediate/delayed event, H, P/Q/R/A, probability, interruption, hypothesis, and next-action controls remain green.
- Failure baseline with 25% growth: Boss remains dormant.
- Failure baseline with 31% growth: Boss is reconsidered.
- Hidden baseline plus arbitrarily high later power: no wake-up.
- Unfinished failed goal: bounded preparation repetition remains possible.
- Completed region: terminal conclusion rather than indefinite farming.
- Five real full-region seeds: Boss cleared 5/5, both loss runs retry, terminal conclusions 5/5, terminal attractors 0/5.
- Two independent reviewers: ACCEPT / ACCEPT.

## Parameter Record

V2 adds a 30% failure-wake growth threshold, a dormant-failure score penalty, a wake score bonus, an explicit preparation bonus, and an escalating bounded repetition penalty. These values were introduced to make the documented causal state transition operational, not to maximize emotion. They are frozen for Phase 2 and remain candidates for later human calibration.

