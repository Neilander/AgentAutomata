# Long-Horizon Baseline Audit

- Date: 2026-07-13 04:08 CST
- Intended phase: Phase 2 baseline
- Result: Phase 2 paused; Phase 1 reopened for a V2 long-horizon correction

## What Was Run

Frozen V1 was exercised over five deterministic full-region traces, each capped at 20 selected actions. No gameplay rule, cognition parameter, parser, or frozen policy was changed.

Aggregate result:

```json
{
  "runs": 5,
  "bossReached": 5,
  "bossCleared": 3,
  "bossFailed": 2,
  "failedBossWithoutRetry": 2,
  "lowestByAction": {
    "challenge:r1_prison": 4,
    "challenge:r1_boss": 1
  },
  "averageFinalEmotion": 48.8581
}
```

Every run ended with seven repetitions of one action. The losing runs never reconsidered the Boss. A 40-action extension showed that one losing run grew gear from 934 at failure to 1307, about 39.9%, but still never retried.

## Smallest Failing Trace

```text
Boss reached -> Boss failed
-> known preparation/farm action selected
-> visible equipment growth occurs
-> failure memory receives no baseline-power comparison or wake condition
-> Boss does not return to consideration
-> the same terminal action becomes a stable attractor
```

The same terminal attractor also appeared after Boss victories, so this cannot be attributed only to frustration or Boss difficulty.

## Diagnosis

This is a player-model validity problem, not yet a gameplay-design finding:

1. Failure memory records fear and failure count, but not the power baseline at failure or a causal wake condition.
2. Visible equipment growth therefore cannot wake the failed objective.
3. Completed or repeatedly successful actions have no adequate satiation or goal-reconsideration rule.
4. A deterministic highest-score choice can remain trapped after the meaningful route has ended.

The Prison emotional low remains descriptive evidence only. It must not drive a gameplay change while long-horizon action selection is invalid.

## Independent Review

Two independent reviewers agreed:

- Reviewer 1: this is a model-validity bug; create V2, retain immutable V1, and first test failure-baseline growth wake-up.
- Reviewer 2: the terminal attractor occurs after wins and losses; add bounded satiation/completion and explicit reconsideration, then revalidate three deterministic traces.

## V2 Acceptance Gates

Before Phase 2 resumes, V2 must prove:

1. Boss failure stores an observed power baseline and an explicit wake condition.
2. A visible equipment-driven power increase above the configured threshold can cause Boss reconsideration using learned evidence.
3. Boss completion does not lead to indefinite unrelated farming.
4. Repetition remains possible while it visibly advances an unfinished goal.
5. The unchanged five-seed full-region baseline no longer collapses into a terminal action attractor.
6. Independent reviewers accept the new long-horizon behavior.

## Integrity

- Gameplay changes: none.
- Cognition parameter changes: none.
- Frozen V1 changes: none.
- Frozen V1 hashes were rechecked and still match `FROZEN_V1.md`.

