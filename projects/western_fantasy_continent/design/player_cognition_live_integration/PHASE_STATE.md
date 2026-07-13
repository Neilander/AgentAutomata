# Player Cognition Live Integration

Last updated: 2026-07-13 11:58 CST

## Current Gate

- Current phase: Phase 1 V3 character-affordance gate passed; Phase 2 may resume.
- Phase 2 status: equipment-recovery candidate preserved; character onboarding optimization is now valid under Frozen V3.
- Frozen model: `FROZEN_V3.md`.
- Frozen V1 remains immutable as the bounded-loop historical baseline.

## Phase 2 Iteration 1

- Accepted isolated candidate: temporary visible Main9 Boss-preparation node after Boss failure.
- Matched loss routes: preparation actions 13 -> 4, no-growth preparation 2 -> 0, emotion per preparation action 0.8615 -> 1.835.
- Thirty-seed long-tail check: 20 loss routes, maximum five preparation actions, zero dead growth actions, all retry and finish.
- Independent gameplay review: ACCEPT / ACCEPT.
- Formal map remains unchanged; candidate files are listed in the 2026-07-13 05:16 round report.

## Phase 2 Iteration 2

- Accepted isolated candidate: reliable Prison rescue followed immediately by a scaled Main 4 high-health Ranger proof.
- Thirty paired routes: rescue before proof/Boss 1/30 -> 30/30; Ranger-specific proof 0/30 -> 30/30.
- Proof milestone emotion 43.7659 -> 45.1408; first Boss-action emotion 49.3775 -> 54.9909; emotion gain/action 1.0555 -> 1.2136.
- One hundred short routes: 100/100 rescue and proof; Ranger share average about 36.75%, minimum 32.2%.
- Independent gameplay review: ACCEPT / ACCEPT.
- Residual risk: candidate routes are lossless; the next iteration should restore a readable mid-region resistance beat without breaking onboarding.
- Formal map remains unchanged; candidate files are listed in the 2026-07-13 07:01 round report.

## Phase 2 Iteration 3

- Accepted isolated candidate: Main 6 candidate-only heavy-shield soft lock followed by the visible Bandit armory key and immediate retry.
- Thirty paired routes: 19 lock routes, 11 existing-build bypasses; all 19 lock routes choose Bandit and win the immediate retry.
- Failure-route emotion: 46.0372 -> 44.7889 -> 46.6366 -> 48.1561.
- Sixty-route width check: 30 lock routes / 30 bypasses; every key retry wins.
- Ranger onboarding and terminal remain 30/30.
- Counter activations have visible renderer-backed signals with accepted H and real source attribution.
- Independent gameplay review: ACCEPT / ACCEPT.
- Bounded claim: V3 sees named counter activation, but retry selection remains primarily power-growth driven.
- Formal map remains unchanged; candidate files are listed in the 2026-07-13 07:50 round report.

## Phase 2 Iteration 4

- Assembled Ranger onboarding, Main 6 soft lock, and Boss recovery into a separate combined core and human-playable page.
- Initial combination erased the Boss loss beat because Bandit equipment growth was too strong; the combined candidate now uses a `1.18` Boss multiplier and four-item active Main 9 preparation drops.
- Sixty routes: 60/60 Ranger onboarding and terminal; 37 Main 6 locks with 37/37 key recoveries; 13 Boss losses with 13/13 preparation/retry wins.
- Boss preparation averages 3.154 actions and never exceeds five in the sample.
- Frozen V3 hashes and player parameters remain unchanged.
- Independent review: ACCEPT / ACCEPT with bounded-claim and human-settlement risks.
- Formal map remains unchanged; the playable candidate is `map_progression_lab/candidate-v3.html`.

## Phase 2 Iteration 4 Hardening

- Removed duplicate combat simulation from the human candidate.
- The displayed unified battle now supplies the sole result used by candidate state settlement.
- AI playtests retain the internal core-simulation path; both paths use the same post-combat settlement rules.
- Display/core parity regression covers result, survivors, visible signals, loot, and inventory.
- Frozen V3 hashes remain unchanged; independent scoped review is ACCEPT / ACCEPT.
- Browser-side full V3 cognition remains intentionally unimplemented and must not be implied by the lightweight debug panel.

## V3 Character-Affordance Result

- A visible new-character unlock creates a bounded voluntary team experiment; hidden unlocks and old reserve characters do not.
- The swap starts an independent next-combat hypothesis and cannot settle that hypothesis itself.
- Only visible combat contribution can verify the character; hidden aggregates cannot.
- Only one character experiment runs at a time, preventing multi-unlock swap stacking.
- Five real routes each swap Ranger exactly once, verify contribution, resolve the experiment, and terminate.
- Two independent reviewers accepted the final V3.

## Why The Gate Reopened

- Five full-region traces all reached the Boss, but every run ended in seven repetitions of one terminal action.
- Both Boss losses produced zero retries.
- In an extended losing trace, visible gear grew from 934 to 1307 (about 39.9%) without waking Boss reconsideration.
- Failure memory lacks a power baseline and wake condition; completed/repeated actions lack sufficient satiation and goal reconsideration.
- Two independent reviewers classified this as a model-validity defect, not a gameplay-design finding.

## V2 Gate

Passed. Visible failure-baseline wake-up, hidden-power rejection, post-completion conclusion, useful unfinished-goal repetition, the five-seed full-region baseline, and two independent reviews all passed.

## Working Vertical Slice

The current slice covers one immediate stream and one delayed stream:

1. Real unified-combat signals for skill, damage, heal, shield, status, visible special movement, and death.
2. Real encounter settlement for outcome, loot, character unlock, gear change, and action duration.
3. H reception, structured `(subject, environment, behavior) -> result` knowledge, shared expectation ledger, signed appraisal, direct feedback, expectation mismatch, and feedback-before-learning.
4. Delayed loot expectations learn occurrence rate and success value, then settle at the reward boundary.

The map core only returns this analysis when `captureVisibleSignals` is explicitly requested. It is not persisted into game events or save history.

## Proven So Far

- Game events contain no direct H, R, A, Agency, progression, repetition, or emotion result fields.
- Incoming damage is negative and outgoing damage is positive from the player's perspective.
- Hidden and visible versions of the same raw event produce different reception while leaving the raw combat result unchanged.
- Feedback is calculated from the old knowledge snapshot, then knowledge is updated.
- Skill casting and skill damage no longer share a knowledge row; different roles no longer borrow partial matches.
- Encounter outcome expectation is settled once at the action summary, not once at combat result and again at summary.
- The same loot event changes with learned freshness, active desire, and prior probability knowledge.
- Cognition now ranks only visible allowed actions and executes the selected action.
- A real prison loss changes learned utility, success belief, fear, hypothesis state, active goal, and the next selected action.
- Under identical visible affordances, the pre-failure player selects Prison while the post-failure player switches to Main 4; both independent reviewers accepted this behavior closure.
- Routine comparisons produce one decision-E step. A complete goal/evidence/affordance/comparison/hypothesis chain produces four; real outcome comparison produces one verification-E step.
- Actual battle renderer anchors, CSS evidence, animation overlap, and cluster competition now drive H; a bounded opening accepted 140 and ignored 36 visible events.
- A real Prison defeat truncates reward opportunities and closes the action ledger as interrupted, without creating a false loot miss.
- A 100-attempt real loot trace produced 93 reasonable dry results, six successes, and one abnormal dry at attempt 94; only the abnormal dry produced negative A.
- Two identical 23-battle game trajectories with visible versus occluded combat/loot presentation produced emotion 45.7 versus 37.5 and different actions (Prison versus Main 4), without assigning emotion directly.

## Phase 2 Rule

Use the strict hashes in `FROZEN_V3.md` and the same player configuration on both sides of every gameplay comparison. Any model or parameter change creates V4 and reopens Phase 1.

## Frozen Rule

Any cognition-model change creates V4 and reopens Phase 1. Do not mix model calibration with gameplay optimization.
