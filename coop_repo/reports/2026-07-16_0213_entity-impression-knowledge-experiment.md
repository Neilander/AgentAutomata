# Agent Handoff: Entity Impression Knowledge Experiment

- Date: 2026-07-16
- Agent/thread: Codex main thread with independent reviewers and one blind report-analysis Agent
- Scope: isolated subject-strength-trait knowledge model and five-battle validation
- Status: complete

## User Intent

Test whether a real-format battle report can support player knowledge shaped as `subject + perceived strength + perceived traits`, including biased first impressions, later contextual correction, finite primacy, and observation-order effects. Have an independent Agent analyze five preset reports and verify whether its generated knowledge is correct.

## Completed

- Added an isolated executable entity-impression model; no formal skill data or production cognition runtime was changed.
- Defined HP-equivalent useful contribution, team-relative strength, three player perception profiles, trait magnitude, evidence reliability, and level-3 trait gating.
- Split append-only observation/knowledge history from revisable current general and exact-context beliefs.
- Preserved neutral observations without forcing them to become salient knowledge.
- Added finite first-impression weighting: earlier observations matter more, but repeated counterevidence can revise current belief.
- Added exact salient-context normalization, unknown-context fallback, duplicate-report rejection, and hypothesis-only Agent policy.
- Ran five preset battles in forward ordinary, forward expert, and armor-first expert order.
- Ran one accepted recorded live report and conservatively rejected an ambiguous false Warrior trait.
- Preserved a blind Agent's raw five-battle JSON and validated it against code with 118 field-level checks.
- Completed two independent reviewer cycles; both final verdicts were `PASS`.

## Files Changed

- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/`: isolated model, fixtures, tests, scripts, contract, raw Agent output, and generated validation artifacts.
- `coop_repo/reports/2026-07-16_0213_entity-impression-knowledge-experiment.md`: this handoff.
- `coop_repo/LATEST.md`: points to this report.
- `coop_repo/REPORT_INDEX.md`: indexes this report.

## Validation

- `node .../test-entity-impression-model.js`: PASS.
- `node .../test-live-report-analysis.js`: PASS.
- `node .../run-experiment.js --write`: PASS; regenerated four deterministic scenarios and 18 analyses.
- `node .../analyze-live-report.js --write`: PASS; accepted real report produced four real units, Mage area trait, and no false Warrior trait.
- `node .../validate-agent-analysis.js --write`: PASS; 118 checks, zero failures.
- Independent mathematical/implementation reviewer: final PASS.
- Independent cognition reviewer: final PASS.

## Current State

This is a credible V1 experiment. Overall strength is straightforward for an Agent when the compact report and formulas are explicit. Trait arithmetic and knowledge-update semantics are not safe to leave to free-form Agent inference, so code owns calculation, thresholds, reliability, and retrieval. The Agent owns evidence-bound wording and causal hypotheses only.

In the forward expert sequence, Warrior begins as `质变级强` beside three weak militia, then receives ordinary, two weak, and one mildly strong observations. The immutable first impression remains, while current no-context belief settles at semantic level `1.927` (`偏强`). Armor-first ordering settles at `0.851` (`有点强`), proving finite order dependence without permanent lock.

## Unresolved

- Negative strength perception bands remain provisional.
- Healing, shielding, prevention, and control currently share HP-equivalent weight and are not balance-calibrated.
- Team-average comparison intentionally permits teammate confounding; it models player impression rather than objective character power.
- Old semantic reports lack `result.meta.visibleTargetCount`, so same-concept area damage is conservatively under-classified.
- Trait knowledge currently learns positive evidence only; absence requires an explicit opportunity/attempt model later.
- Preset order effects prove implementation behavior, not a calibrated human primacy effect size.
- This experiment is not yet integrated into the formal player cognition runtime.

## Recommended Next Step

Review the five-battle knowledge story and decide whether the formulas and semantic labels match the intended player perception. If accepted, integrate the model behind an explicit experimental flag in the cognition runtime, keeping numeric calculation in code and Agent causality as hypothesis-only.
