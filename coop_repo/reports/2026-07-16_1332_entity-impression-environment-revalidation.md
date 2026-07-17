# Agent Handoff: Entity Impression Environment And Revalidation

- Date: 2026-07-16
- Agent/thread: Codex main thread plus one independent read-only reviewer
- Scope: resolve the systematic test's team-environment and trait-correction blockers
- Status: complete

## User Intent

Make character impressions remember the environment in which a character looked strong, such as a Mage standing out among weak teammates. On every later battle, retrieve the character's existing cognition and revalidate relevant traits so a belief such as “good at area damage” can be revised rather than frozen forever.

## Completed

- Added an ally-performance environment to every analyzed unit and stored strength observation.
- Preserved focal, team, and expected contribution; active-unit count; complete roster fingerprint; and per-unit contribution evidence for later decomposition.
- Added optional exact-context retrieval filters for ally-performance band and roster fingerprint.
- Added an append-only trait-observation ledger and subject-domain current-belief synthesis with finite primacy.
- Changed battle ingestion to review existing impressions before updates, revalidate every visibly attempted domain, create correction evidence for reliable weak attempts, and leave no-attempt or low-reliability cases inconclusive.
- Kept historical trait rows immutable while allowing the current synthesized belief to become non-salient.
- Fixed contextual trait retrieval so exact-context domains override general cognition while unobserved domains fall back to current synthesized general beliefs, not stale history.
- Updated the four-suite, three-profile, all-120-order systematic matrix and its report from `REVISE` to `CREDIBLE_WITH_GUARDRAILS`.
- Fixed the direct systematic runner to return a failing process code when its verdict is `revise`.
- Independent read-only review returned `ACCEPT` with documented guardrails.

## Files Changed

- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/entity-impression-model.js`: ally environment/basis, trait revalidation ledger and synthesis, contextual fallback.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/systematic-preset-battle-suites.js`: weak attempted area-damage evidence in the five-battle trait suite.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/run-systematic-credibility-test.js`: decomposition, revalidation, current-belief order, fallback, and failure-exit checks.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/test-systematic-credibility.js`: freezes the guarded-credible verdict and required passes.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/generated/systematic-credibility-result.json`: refreshed 1,440-sequence / 7,200-analysis evidence.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/SYSTEMATIC_CREDIBILITY_REPORT.md`: updated findings, guardrails, and independent verdict.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/MODEL_CONTRACT.md`: environment and per-battle trait-update contract.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/README.md`: current behavior and limits.
- Generated deterministic and live-report artifacts were refreshed against the new observation schema.

## Validation

- `node test-entity-impression-model.js`: PASS.
- `node test-live-report-analysis.js`: PASS.
- `node run-experiment.js --write`: PASS; generated artifacts refreshed.
- `node analyze-live-report.js --write`: PASS.
- `node validate-agent-analysis.js --write`: PASS; 118 checks, zero failures.
- `node test-systematic-credibility.js`: PASS; `credible_with_guardrails`.
- `node run-systematic-credibility-test.js --write`: PASS; 1,440 five-battle sequences and 7,200 battle analyses.
- `node experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS.
- Independent read-only cognition review: `ACCEPT`.
- `git diff --check`: PASS before final handoff.

## Current State

The model can now retain “this character appeared strong among mostly weak teammates” as decomposable evidence rather than an unconditional strength fact. An expert Mage's level-3 area-damage impression is reduced to a non-salient level-2 general belief after a reliable level-0 area attempt, while a later battle with no area attempt leaves the observation count unchanged. Exact-context trait evidence overrides only its own domain; other domains use current general cognition.

## Unresolved

- Negative deterioration still uses one provisional scale for ordinary, familiar, and expert players.
- Controlled fixtures validate implementation behavior, not the correct numerical size of human perception or primacy.
- HP-equivalent utility weights are not human-calibrated.
- The attempt contract recognizes visible weak attempts but cannot infer an unused tactical opportunity.
- Low-reliability attempted evidence is correctly excluded from current belief and was independently spot-checked, but it does not yet have its own fixed systematic regression case.
- Historical prediction must consume encounter and ally comparison basis; using only the blended strength label would reintroduce confounding.

## Recommended Next Step

Begin the guarded historical success/failure prediction experiment using the decomposable strength evidence and current synthesized trait beliefs. Keep negative-scale calibration and missing-opportunity inference explicit rather than silently treating them as solved.
