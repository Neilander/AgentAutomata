# Agent Handoff: Multi-Profile Player Simulation Protocol

- Date: 2026-07-15
- Agent/thread: Codex current task
- Scope: prevent single-personality Agent playtests from hiding composition and learning bypasses
- Status: protocol complete; executable multi-Agent runner not yet implemented

## User Intent

Future player simulations should use multiple persistent Agents with different inherent starting beliefs and habits. One example is a player who strongly believes damage is everything and considers healing unnecessary. Gameplay changes will be discussed later.

## Completed

- Added a multi-profile requirement to the canonical player-cognition skill.
- Defined profile differences as player-owned initial beliefs, confidence, attention, risk tolerance, experimentation, action friction, and preference weights while freezing the game and cognition engine.
- Required prior beliefs to use the existing subject/environment/behavior/result causal schema with confidence, provenance, and an unverified status.
- Explicitly prohibited hard-coded actions or treating profile prejudice as designer truth.
- Defined six minimum profiles: open novice, damage absolutist, safety conservative, low-friction optimizer, inertial player, and novelty/collector player.
- Required persistent identity across a run, paired seeds, per-profile reporting before aggregates, and separate independent review.
- Required mechanical team enumeration as a backstop when the roster is small; Agent diversity explains discovery and adaptation but does not prove unvisited compositions are safe.

## Files Changed

- `projects/western_fantasy_continent/skills/player-cognition-simulation/SKILL.md`: ensemble workflow and hard rules.
- `projects/western_fantasy_continent/skills/player-cognition-simulation/references/player-profile-ensemble.md`: profile schema, minimum ensemble, execution, evaluation, and mechanical backstop.

## Validation

- Frontmatter and reference path manually checked.
- `git diff --check`: PASS for both skill files.
- The bundled `quick_validate.py` could not run because the bundled Python environment lacks `PyYAML`; no dependency was installed or fetched.

## Current State

The testing standard now rejects a single cooperative Agent as sufficient evidence. It also prevents averaging away a damage-stacking bypass or a profile-specific dead end.

No level data, enemy values, drops, player-model formulas, or gameplay UI changed in this unit.

## Unresolved

- The current decision runtime still needs an executable profile loader and orchestration layer that maintains one Agent context per profile.
- Initial confidence and preference magnitudes need calibration through real traces; the protocol intentionally does not invent final constants.

## Recommended Next Step

Before redesigning Chapter 1, implement the profile loader and run the existing map unchanged with paired profiles. Use exhaustive roster enumeration to locate mechanical bypasses, then use the profile ensemble to observe which players discover, reinforce, or abandon them.
