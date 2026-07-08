# Agent Handoff: Field Effect Mechanism Review Rule

- Date: 2026-07-07
- Agent/thread: Codex skill feedback update
- Scope: Add user feedback about field-effect readability and multi-stat buff overuse to the project analysis skill.
- Status: complete

## User Intent

The user reviewed the current field-effect batch and identified a design problem: many effects add too many unrelated stats at once. This makes it hard to understand what the field actually changes at first glance. A few special multi-stat fields are acceptable, such as a Blood Moon-style field where the player intentionally asks how to exploit several levers, but this cannot be the default pattern.

## Completed

- Added a `Field-Effect Mechanism Check` method to `game-analysis-iteration`.
- The rule prefers mechanism, single-axis, or conversion field effects over broad multi-stat packages.
- Added review criteria to flag "attribute soup" field effects.
- Updated reviewer-training notes so future evaluator prompts learn to detect multi-stat field effects that lack a clear unifying question.
- Added the same feedback to the step-7 implementation plan as an `Information Concentration Rule`: if one piece of information can explain the design, do not use two.

## Files Changed

- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/compare-current-game.md`: added field-effect mechanism review method.
- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/reviewer-training.md`: added reviewer-training note for attribute-soup negative examples.
- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/implementation-plan.md`: added the implementation-stage information concentration rule.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- Manually inspected the inserted `Field-Effect Mechanism Check` section.
- No automated validation was run.

## Current State

Future field-effect reviews should judge whether a field has one readable main axis, instead of accepting multi-stat buffs as the default way to favor a team. Future implementation plans should also minimize the number of distinct player-facing ideas in each change.

## Unresolved

- The existing 20 field effects have not yet been re-reviewed or rewritten under this rule.
- No trained field-effect reviewer prompt exists yet.

## Recommended Next Step

Run the new `Field-Effect Mechanism Check` over the current 20 field effects and classify each as mechanism, single stat, conversion, or multi-stat package.
