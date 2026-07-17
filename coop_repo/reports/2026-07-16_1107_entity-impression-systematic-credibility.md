# Agent Handoff: Entity Impression Systematic Credibility

- Date: 2026-07-16
- Agent/thread: Codex main thread plus one independent read-only reviewer
- Scope: three perception profiles, four five-battle suites, all battle-order permutations, role replacement, and credibility audit
- Status: complete

## User Intent

Systematically test whether the current ordinary/familiar/expert perception scales and biased-but-correctable character-impression model are credible enough to support the next historical-prediction phase. Use several controlled five-battle groups, reorder the battles, replace characters, and generate character impressions.

## Completed

- Added four controlled five-battle suites: contextual correction, near-threshold multi-role traits, Ranger/Duelist replacement identity, and constant-output teammate confounding.
- Ran all three perception profiles across all 120 orders of every suite: 1,440 complete five-battle sequences and 7,200 battle analyses.
- Fixed a real primacy bug: observation weight now uses each subject's local observation order. A character joining late no longer receives an artificially weaker first impression because other characters were observed earlier.
- Preserved global campaign battle order separately for audit.
- Added direct objective-evidence invariance, profile resolution, 65% trait boundary, counterevidence, all-order strength sensitivity, late-entry invariance, strength identity isolation, full knowledge/trait identity isolation, and trait-order stability checks.
- Regenerated the original deterministic artifacts after the subject-local primacy change.
- Recorded the final systematic verdict as `REVISE`, not `credible_with_guardrails`.
- Ran an independent reviewer (Codex subagent; exact model identifier unavailable). It returned `REVISE` and identified the blocking team-relative evidence-loss issue plus two initial trait-test coverage gaps. The coverage gaps were added and now pass.

## Files Changed

- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/entity-impression-model.js`: subject-local observation order and global-order audit field.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/systematic-preset-battle-suites.js`: four systematic controlled suites.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/run-systematic-credibility-test.js`: 1,440-sequence matrix and credibility checks.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/test-systematic-credibility.js`: regression that expects the current honest `revise` verdict and freezes passed/failed checks.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/generated/systematic-credibility-result.json`: machine-readable matrix evidence.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/SYSTEMATIC_CREDIBILITY_REPORT.md`: human-readable diagnosis and next contract.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/MODEL_CONTRACT.md`: subject-local primacy contract.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/README.md`: new commands, artifacts, and limits.
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/generated/deterministic-result.json`: regenerated observation schema and primacy-rule text.

## Validation

- `node .../test-entity-impression-model.js`: PASS.
- `node .../test-live-report-analysis.js`: PASS.
- `node .../run-experiment.js --write`: PASS; original artifacts regenerated.
- `node .../analyze-live-report.js --write`: PASS.
- `node .../validate-agent-analysis.js --write`: PASS; 118 checks, zero failures.
- `node .../test-systematic-credibility.js`: PASS; correctly reports overall `revise`, with nine passed checks, one warning, and two blocking failures.
- `node .../run-systematic-credibility-test.js --write`: PASS as an audit runner; wrote 1,440-sequence / 7,200-analysis evidence.
- `node .../experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS; two-cycle and repeated-encounter causal-loop regression remains healthy.
- Independent read-only review: `REVISE`.

## Current State

The positive perception scale, finite subject-local primacy, strength correction, exact-context retrieval, order sensitivity, and replacement-character isolation are internally credible. At 65% domain magnitude only the expert profile crosses the shared level-3 trait threshold. Across every order, the largest weighted strength spread is 1.312 and the final rounded result moves by at most one semantic band.

The complete impression state is not yet safe for historical prediction. A focal Alchemist held at exactly 200 useful contribution moves from `+128.571% / level 7` to `-27.273% / level -1` only because teammate performance changes. Current strength observations do not retain absolute contribution, expected unit contribution, roster fingerprint, or teammate performance, so later prediction cannot decompose the cause.

## Unresolved

- Store absolute subject contribution, team expected contribution, roster fingerprint, and visible teammate contribution in every strength observation.
- Retrieval must expose comparable evidence groups instead of only a blended team-relative general label.
- Negative deterioration uses one provisional scale for all three player profiles; 16 negative samples were profile-invariant.
- Trait knowledge is positive-only and keeps the historical maximum. It cannot yet use explicit opportunity + attempt + weak-result evidence to reduce or contextualize a trait.
- The 7,200 analyses permute twenty controlled reports. They prove implementation consistency, not calibrated human primacy or perception constants.
- The systematic test remains isolated and is not integrated into the formal cognition runtime.

## Recommended Next Step

Revise the stored strength observation/evidence contract first: retain absolute contribution plus team/roster baseline and make retrieval expose the comparison basis. Then add explicit negative-band decisions and a trait-opportunity correction contract. Rerun the same systematic matrix and independent review before beginning historical success/failure prediction.
