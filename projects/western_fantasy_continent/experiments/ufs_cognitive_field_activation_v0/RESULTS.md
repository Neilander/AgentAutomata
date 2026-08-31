# Cognitive-field activation V0 results

## Outcome

The two-operation research trajectory was recalled from both directions with the real local `gte-multilingual-base`:

- visible/ready research-room `before` cue: `0.888920`;
- two-step affordability `before` cue: `0.702988`;
- research-win need `after` cue: `0.644991`.

All three cues converged on `feedback-trajectory-00001`, whose exact operation sequence was:

1. `resolve_room(A-upper-research, pay=true)`;
2. `choose_research_advance(A-upper-research, advanceSteps=2)`.

The candidate traced back to `memory-00001`. The summed V0 recall activation was `2.236899`; this number is recall relevance only and is not used as action utility.

## Knowledge ablation

The public scene was held constant.

| Supplied knowledge | Summarized cues | Operation hint | Explicit unknown |
| --- | --- | --- | --- |
| Full win + room rules | attended room (`before`), research need (`after`), affordability (`before`) | two operations | none |
| Win condition only | research need (`after`) | none | research-room mechanism unknown |
| Room method only | attended room and affordability (`before`) | two operations | why research matters unknown |

This controlled pass supports the proposed separation:

- goal knowledge changes desired-result cues;
- method knowledge changes current-affordance and operation cues;
- having only one side does not authorize the agent to invent the missing connection.

For diagnostic comparison, `run-real-gte.js` deliberately holds the two-step memory index fixed while changing only summarized cues. Consequently, goal-only cues can still semantically activate the fixed method row from its Q-after side. A deployed player must additionally restrict the searchable trajectory index to knowledge actually present in that player's profile.

## Limits

- Cue summaries are one controlled pass by the current root Codex agent, not repeated independent model trials or an accuracy estimate.
- The agent-call runtime is not wired into the player. The prompt contract and outputs are reproducible fixtures for now.
- Cue-kind convergence uses an equal, per-kind maximum and an uncalibrated `0.5` retrieval threshold.
- Activation does not perform feasibility simulation, utility comparison or formal action submission.
- No causal induction or automatic cognitive-unit discovery is attempted; the two-step rule is supplied as rulebook knowledge.
