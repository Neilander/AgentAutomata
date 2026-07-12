# Agent Handoff: Level Validation And Probability Expectation Skills

- Date: 2026-07-12
- Agent/thread: Codex
- Scope: reusable level acceptance workflow and probability-event cognition contract
- Status: complete

## User Intent

Create a reusable level-validation skill that selects exhaustive or sampled team testing from the available player state space, uses stage-standard equipment, proves intended team/character direction through real combat, and treats the map's emotional trajectory as the primary acceptance surface. Generalize loot-drop expectation into a reusable probability-event cognition model.

## Completed

- Added `level-experience-validation` with two independent acceptance proofs: combat-state teaching validity and frozen-model emotion validity.
- Small state spaces are exhaustively enumerated; large spaces use about 20 pre-labeled coherent teams split across intended, adjacent, mainstream, plausible-wrong, and negative-control groups.
- Character, skill, equipment-key, field-effect, and formation claims use matched pairs rather than unrelated team comparisons.
- Standard equipment is fixed to the player's declared progression stage and held comparable across teams.
- Added a report protocol covering design contract, search plan, combat matrix, matched pairs, emotion timeline, counterfactual checks, and final verdict.
- Linked tutorial debugging to the new acceptance skill so revision and validation remain separate.
- Added a general probability-expectation reference to the player cognition skill:
  - event-family opportunity/success/dry-streak counters
  - Beta-Bernoulli belief updates
  - expectation horizons instead of penalizing every miss
  - dry-streak surprise
  - staged reveal/pickup/appraisal/decision/verification feedback
  - explicit rule that cognition estimates probability while `A` only resolves mismatch
- Recorded that equipment build appraisal occurs between encounters in the current design, not during combat.

## Files Changed

- `projects/western_fantasy_continent/skills/level-experience-validation/SKILL.md`
- `projects/western_fantasy_continent/skills/level-experience-validation/references/validation-protocol.md`
- `projects/western_fantasy_continent/skills/level-experience-validation/agents/openai.yaml`
- `projects/western_fantasy_continent/skills/tutorial-level-debug/SKILL.md`
- `projects/western_fantasy_continent/skills/player-cognition-simulation/SKILL.md`
- `projects/western_fantasy_continent/skills/player-cognition-simulation/references/probability-expectation.md`

## Validation

- Skill Creator `quick_validate.py`: `Skill is valid!`
- `git diff --check` on skill files: passed.

## Current State

The project now has a reusable acceptance workflow that prevents a level from passing merely because one intended team wins or because aggregate completion is high. Probability rewards are modeled as learned event-family expectations upstream of `A`, with feedback calculated before updating the player's belief.

## Unresolved

- The V5 emotion runtime/control panel remains planned, not implemented.
- The new skill has not yet been forward-tested on a fresh level by an independent agent.
- Thresholds remain level-contract-specific; the skill deliberately avoids universal win-rate cutoffs.

## Recommended Next Step

Build the shared V5 emotion runtime and control panel, then use this skill to revalidate Region 1 M7, M8, and the first boss with live event-timeline emotion data.

