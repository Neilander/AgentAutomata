# Agent Handoff: Roster Prediction A Settlement

- Date: 2026-07-16
- Agent/thread: Codex `/root`
- Scope: make selected roster-change expectation settle into next-combat A
- Status: complete

## User Intent

Modify A after the real-Agent roster audit, and clarify whether A belongs to code
or Agent instructions.

## Completed

- Confirmed and documented that A is code-owned. Agent instructions only constrain
  the decision and prohibit the Agent from setting emotion.
- Added a persisted `rosterPredictionAState` ledger to the player session.
- When a numeric swap prediction is selected, code freezes its baseline score,
  predicted score, target encounter, candidate team/build, confidence/evidence
  audit, and the session's persistent perception profile.
- On the next comparable combat, code independently maps expected and actual
  relative improvement through that same profile's semantic bands and computes
  `A_input = actual_level / 9 - expected_level / 9`.
- V3 runtime now applies the asymmetric mismatch function, with separate positive
  and negative scales/powers and the existing H/goal weighting.
- The roster-specific A replaces generic same-action A only at that action-summary
  boundary; the generic ledger is closed as superseded, preventing double A.
- Settlements are one-shot. Different encounter/team/build invalidates the pending
  prediction; a newer swap supersedes it; save/restore and chapter transition are
  handled.
- Replayed the prior ten real-Agent swap settlements: `10/10` now match the
  perception contract (`5 negative / 2 zero / 3 positive`), all with source
  `roster_prediction`.
- Independent reviewer verdict: `ACCEPT`.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-expectation-a.js`: code-owned freeze, profile quantization, comparability, one-shot settlement, invalidation, and audit history.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: persisted ledger, selected-action freeze, swap-to-challenge carry, trace and chapter handling.
- `projects/western_fantasy_continent/game_data/player-cognition-v3-event-runtime.js`: roster-specific mismatch source, asymmetric-power helper, generic-ledger suppression, and detailed trace.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-roster-expectation-a.js`: negative/zero/positive, expert, invalidation, supersede, persistence, one-shot and learning-order coverage.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-player-agent-roster-a-integration.js`: actual player-loop swap then challenge integration.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/audit-roster-expectation-a.js`: converted the previous failing ten-settlement audit into the fixed contract regression.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`: executable A contract.
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`: durable runtime architecture and limitations.
- `projects/western_fantasy_continent/player_model_runtime.json`: runtime version advanced to roster-prediction A V14.
- `coop_repo/reports/2026-07-16_2315_roster-prediction-a-settlement.md`: this handoff.
- `coop_repo/LATEST.md`: updated current-work pointer.
- `coop_repo/REPORT_INDEX.md`: appended this report.

## Validation

- `node .../test-roster-expectation-a.js`: PASS.
  - ordinary disappointment: level `2 -> 0`, `A=-0.0687`;
  - same band: level `4 -> 4`, `A=0`;
  - positive surprise: level `2 -> 4`, `A=+0.0395`;
  - expert: level `3 -> 0`, `A=-0.103`;
  - different encounter/team/equipment invalidation, supersede, save/restore: PASS.
- `node .../test-player-agent-roster-a-integration.js`: PASS; actual
  `swap:2:hero_mage -> challenge:r1_main_3`, source `roster_prediction`, one
  archived settlement.
- `node .../audit-roster-expectation-a.js`: PASS; `10/10` match, source only
  `roster_prediction` on action-summary A.
- `node .../verify-causal-loop.js`: PASS.
- `node .../test-roster-change-expectation.js`: PASS.
- `node .../test-roster-change-expectation-edge-cases.js`: PASS.
- `node .../test-player-cognition-v3-continuous-performance.js`: PASS.
- `node .../test-player-cognition-v3-player-hypothesis.js`: PASS.
- `node .../test-player-cognition-v3-character-affordance.js`: PASS.
- Runtime manifest JSON parse and scoped `git diff --check`: PASS.
- `test-map-cognition-v3-combined.js`: exceeded the 60-second command limit with
  no assertion output; not counted as passed or failed.
- Independent raw-code/trace review: `ACCEPT`.

## Current State

A is executable code, not instruction text. The current roster formula is:

```text
combat_progress = (combat_score + 1) / 2
relative_improvement = (new_progress - baseline_progress)
                     / max(baseline_progress, 0.1)
expected_level = perceive(expected_improvement, persistent_profile)
actual_level = perceive(actual_improvement, persistent_profile)
delta = actual_level / 9 - expected_level / 9
A = positive_scale * max(delta, 0)^positive_power
  - negative_scale * max(-delta, 0)^negative_power
```

The runtime then applies the existing perceptual/goal weight `H * goalWeight`.
Current defaults are `positive_scale=0.5`, `negative_scale=0.8`, and both powers
equal `1`. Feedback is computed before knowledge is updated.

## Unresolved

- Positive-improvement bands intentionally clip deterioration to level zero;
  separate negative deterioration bands remain undesigned.
- A pending record has no explicit age timeout. Fingerprints prevent a stale
  record from settling against the wrong encounter/team/build, but a never-tested
  prediction may remain pending until a later swap, challenge, or chapter change.
- Full player-loop integration currently exercises ordinary perception; expert is
  covered at formula/runtime level but not in a full natural Agent trajectory.
- The large combined map V3 test did not finish within the 60-second execution
  window and should be run in a longer-lived test environment.

## Recommended Next Step

Run the persistent real-Agent roster episode through the actual
`player-agent-loop.js` swap-then-challenge sequence for ordinary, familiar, and
expert perception profiles, and inspect whether the corrected A changes later
retry/swap behavior as intended.
