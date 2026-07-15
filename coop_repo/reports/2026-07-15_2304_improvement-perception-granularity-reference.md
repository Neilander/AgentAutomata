# Agent Handoff: Improvement Perception Granularity Reference

- Date: 2026-07-15
- Agent/thread: Codex current thread
- Scope: player-cognition-simulation skill reference
- Status: complete

## User Intent

Persist the accepted rule that players perceive relative improvement in discrete bands. Ordinary players remain coarse, familiar players gain extra resolution above 80%, expert players gain extra resolution above 60%, and perceived improvement caps at 150%.

## Completed

- Added a dedicated player-cognition reference for improvement perception.
- Recorded the ordinary, familiar, and expert profile tables exactly at their accepted split points.
- Recorded a shared semantic level scale so a label has the same strength across profiles.
- Prohibited per-profile maximum normalization and extra expert low-end sensitivity.
- Recorded expected-versus-actual perceptual settlement for A.
- Connected the reference from the required workflow in the main skill.
- Included the current continuous combat-performance conversion and a denominator-floor guardrail without freezing an uncalibrated floor value.

## Files Changed

- `projects/western_fantasy_continent/skills/player-cognition-simulation/references/improvement-perception-granularity.md`: new reference.
- `projects/western_fantasy_continent/skills/player-cognition-simulation/SKILL.md`: required conditional link before A settlement.

## Validation

- Node structure/link check: PASS; reference exists, is linked, and contains the 150% cap, three profiles, 80%/60% split rules, and perceived mismatch formula.
- Skill Creator `quick_validate.py`: not run successfully because the available Python runtime does not include `PyYAML`; no package was downloaded.
- No gameplay, browser, or UI tests were needed.

## Current State

Future player-model work has a durable source for converting objective relative improvement into profile-specific perceived improvement before A. The rule applies to improvement magnitude, not generic event visibility or all forms of player expertise.

## Unresolved

- The decision-specific predicted improvement ledger is not implemented yet.
- The combat relative-improvement denominator floor still requires calibration and must remain frozen during paired A/B tests.
- Negative deterioration perception remains intentionally unspecified rather than being mirrored from positive growth without testing.

## Recommended Next Step

Implement the decision expectation ledger using player knowledge to predict raw improvement, then quantize expected and actual improvement through this reference before EVerify settles A.
