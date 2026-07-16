# Entity Impression Knowledge Experiment

This isolated experiment turns player-visible battle reports into a second knowledge family:

```text
subject + perceived strength + perceived traits
```

It does not replace causal knowledge (`subject + environment + behavior -> result`). It models what a player currently thinks a unit is like, including biased first impressions, contextual corrections, and later belief revision.

## Run

```powershell
node test-entity-impression-model.js
node test-live-report-analysis.js
node run-experiment.js --write
node analyze-live-report.js --write
node validate-agent-analysis.js --write
```

The five preset battles use the live semantic report shape but are controlled fixtures. `analyze-live-report.js` separately checks one accepted recorded session.

## Ownership Boundary

- Code calculates contribution, relative strength, perception bands, trait magnitude, evidence reliability, contextual retrieval, and finite primacy synthesis.
- Agent reads compact reports, audits arithmetic, writes evidence-bound descriptions, and may emit causal hypotheses.
- Agent hypotheses cannot directly become knowledge. Later structured evidence must validate them.

## Key Artifacts

- `MODEL_CONTRACT.md`: formulas, knowledge semantics, and known signal boundary.
- `AGENT_REVIEW.md`: independent Agent successes, failures, and accepted limits.
- `generated/agent-forward-expert-analysis.json`: raw five-battle output from an Agent isolated from source and deterministic answers.
- `generated/agent-validation.json`: 118 field-level comparisons between that Agent output and executable results.
- `generated/deterministic-result.json`: forward, expert, and armor-first order experiments.

## Current Limits

- Negative strength perception bands are provisional.
- HP-equivalent weights for healing, protection, and control are not balance-calibrated.
- Old semantic reports lack `result.meta.visibleTargetCount`, so same-concept area damage is conservatively under-classified.
- Preset order effects prove implementation behavior, not the quantitative size of human primacy bias.
