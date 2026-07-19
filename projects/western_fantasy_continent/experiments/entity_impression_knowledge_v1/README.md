# Entity Impression Knowledge Experiment

This isolated experiment turns player-visible battle reports into a second knowledge family:

```text
subject + perceived strength + perceived traits
```

It does not replace causal knowledge (`subject + environment + behavior -> result`). It models what a player currently thinks a unit is like, including biased first impressions, contextual corrections, and later belief revision.

## Run

```powershell
node test-entity-impression-model.js
node test-strength-cognition-matrix.js
node test-live-report-analysis.js
node run-experiment.js --write
node analyze-live-report.js --write
node validate-agent-analysis.js --write
node test-systematic-credibility.js
node run-systematic-credibility-test.js --write
```

The five preset battles use the live semantic report shape but are controlled fixtures. `analyze-live-report.js` separately checks one accepted recorded session.

## Ownership Boundary

- Code calculates contribution, relative strength, perception bands, three independent output/protection/buff character matrices, one top-30-percent ruler per capability, trait magnitude, evidence reliability, contextual retrieval, and finite primacy synthesis.
- Agent reads compact reports, audits arithmetic, writes evidence-bound descriptions, and may emit causal hypotheses.
- Agent hypotheses cannot directly become knowledge. Later structured evidence must validate them.

## Key Artifacts

- `MODEL_CONTRACT.md`: formulas, knowledge semantics, and known signal boundary.
- `strength-cognition-matrix.js`: deterministic two-matrix update, global solve, and top-30-percent ruler.
- `test-independent-capability-cognition.js`: verifies that damage, protection, and team buffs lead separate rulers and that an unobserved axis does not move.
- `AGENT_REVIEW.md`: independent Agent successes, failures, and accepted limits.
- `generated/agent-forward-expert-analysis.json`: raw five-battle output from an Agent isolated from source and deterministic answers.
- `generated/agent-validation.json`: 118 field-level comparisons between that Agent output and executable results.
- `generated/deterministic-result.json`: forward, expert, and armor-first order experiments.
- `SYSTEMATIC_CREDIBILITY_REPORT.md`: four five-battle suites across all three perception profiles and every battle-order permutation.
- `generated/systematic-credibility-result.json`: machine-readable evidence from 1,440 five-battle sequences and 7,200 battle analyses.

## Current Limits

- Negative strength perception bands are provisional.
- HP-equivalent weights for healing, protection, and control are not balance-calibrated.
- Old semantic reports lack `result.meta.visibleTargetCount`, so same-concept area damage is conservatively under-classified.
- Preset order effects prove implementation behavior, not the quantitative size of human primacy bias.
- Strength remains team-relative, so unchanged objective output can look very different beside weak or strong teammates. Each observation now retains encounter, ally-performance band, roster fingerprint, and per-unit contribution basis; prediction must use that context instead of treating strength as unconditional.
- Current Agent-facing cognition is capability-relative: output, protection, and team buff each rebuild a separate ruler whose zero is the weakest member of that capability's top 30%. The Agent selects by current need; code does not synthesize an overall decision score. The legacy composite ruler remains only for compatibility with the already-validated roster-A path.
- V1 has no time-based stale-character policy yet. Every character with accepted battle evidence remains valid; genuinely weak valid characters intentionally affect the ruler.
- Every battle retrieves the character's current trait beliefs and revalidates domains that were actually attempted. Strong evidence reinforces, weak attempted evidence corrects, and absent or low-reliability evidence remains inconclusive.
- The attempt contract is currently report-domain based. It distinguishes an observed weak area-damage attempt from no area-damage attempt, but it does not yet infer an unrecorded tactical opportunity the character declined to take.
