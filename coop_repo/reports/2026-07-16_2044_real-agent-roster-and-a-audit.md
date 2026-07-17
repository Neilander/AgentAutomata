# Agent Handoff: Real-Agent Roster Choice and A Audit

- Date: 2026-07-16
- Agent/thread: Codex `/root`
- Scope: controlled persistent real-Agent roster decisions, followed by expectation-feedback A tracing
- Status: partial

## User Intent

Run real persistent player Agents against the revised roster-change expectations.
If their behavior is sensible, verify whether the selected roster prediction is
correctly settled into the next-fight expectation feedback A; otherwise diagnose
the behavioral failure.

## Completed

- Added a bounded real-language-Agent decision fixture with six persistent player
  profiles and no future-result leakage.
- Ran two decisions per profile against a visible fail/swap/retry episode.
- Five profiles reached the intended `area_mage + strong_blade` team and won in at
  most two roster decisions. The inertial profile retried twice because its
  `0.82` evidence threshold exceeded the visible counterfactual confidence, while
  still explicitly distinguishing the stronger alternatives.
- Preserved requests, responses, state, settlements, and a consolidated behavioral
  trace under the controlled run directory.
- Added an executable audit that follows all ten successful swap settlements from
  code-owned prediction through actual combat performance and expected A.
- Found a structural A wiring failure: the selected roster prediction is shown to
  the Agent but is not frozen into a next-fight expectation ledger. Runtime A is
  calculated from generic same-action knowledge instead and bypasses the required
  profile perception-band comparison.
- Independent reviewer verdict: behavior `ACCEPT` for this controlled episode;
  roster-prediction-to-A claim `REJECT`; overall version `REVISE`.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled-real-agent-roster-run.js`: controlled persistent real-Agent request and deterministic visible settlement fixture.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled_runs/2026-07-16_roster_real_agents/`: six-profile requests, decisions, states, settlements, and consolidated behavior trace.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/audit-roster-expectation-a.js`: reproducible ten-settlement A source and perception-contract audit.
- `coop_repo/reports/2026-07-16_2044_real-agent-roster-and-a-audit.md`: this handoff.
- `coop_repo/LATEST.md`: updated current-work pointer.
- `coop_repo/REPORT_INDEX.md`: appended this report to the 2026-07-16 index.

## Validation

- `node .../test-roster-change-expectation.js`: PASS.
- `node .../test-roster-change-expectation-edge-cases.js`: PASS.
- `node .../verify-causal-loop.js`: PASS.
- `node .../audit-roster-expectation-a.js`: diagnostic PASS; 10 swap settlements,
  contract distribution `5 negative / 2 zero / 3 positive`, current runtime exact
  matches `0/10`.
- Minimal sign-error example: open novice selected mage from baseline `-0.25`,
  predicted `0.242`, actual `-0.15`. Perception contract yields disappointment
  `A=-0.0687`; current runtime yields positive `A=+0.0193` because it compares with
  the prior generic encounter result.
- Independent blind source/trace review: behavior `ACCEPT` within the fixture; A
  wiring `REJECT`.

## Current State

The old behavioral failure-generalization problem is no longer reproduced in the
controlled episode. Different replacements retain distinct predictions after a
failed swap, and five distinct profile policies act on those distinctions.

The feedback loop is not complete. `rosterChangeExpectations` enters the Agent
request, but the chosen action's prediction is not stored with the decision or
registered for settlement on the next comparable combat. The V3 runtime instead
opens its action ledger from generic learned encounter utility. This can reverse
the sign of A and also produces nonzero A when predicted and actual improvement
fall in the same perception band.

No runtime A fix was made in this unit because the user requested verification and
diagnosis first.

## Unresolved

- Freeze the selected candidate's baseline and predicted performance at roster
  decision time and carry it across the swap into exactly one next comparable
  combat settlement.
- Quantize expected and actual relative improvement independently with the same
  persistent `ordinary` / `familiar` / `expert` profile before calculating A.
- Preserve feedback-before-learning order and expose `roster_prediction` as the A
  source in trace output.
- Add negative, zero, and positive settlement tests, including two predictions in
  the same perception band.
- The controlled fixture uses deterministic outcomes and preseeded character
  cognition; it validates decision consumption, not discovery quality in natural
  game runs.
- The fixture applies a fight settlement immediately after a selected swap as a
  macro-step. A later integration run should also test the actual swap-then-
  challenge action sequence through `player-agent-loop.js`.
- The consolidated behavior trace reconstructs some reasoning from responses and
  requests; future runner contracts should persist the full structured reasoning
  response directly.

## Recommended Next Step

Implement a code-owned one-shot `roster_prediction` settlement record at the
selected swap, then close it on the next comparable challenge using the persistent
perception profile. Start with the two open-novice counterexamples in
`audit-roster-expectation-a.js`: one must become negative A and the same-band win
must become zero A.
