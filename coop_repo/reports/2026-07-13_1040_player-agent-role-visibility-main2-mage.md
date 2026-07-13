# Agent Handoff: Role Visibility And Main 2 Mage

- Date: 2026-07-13
- Agent/thread: Codex current thread
- Scope: correct the player-agent experiment's role observability and test an early complete-character reward
- Status: complete

## User Intent

Let the decision agent see concise character positioning information, start fresh simulations with one complete Warrior plus four militia, and grant a complete Mage after clearing Main 2 so a later run can test whether the agent voluntarily changes its team.

## Completed

- Added structured `teamSlots` and full unlocked `roster` data to every decision request, including active/reserve state, slot label, role, unit kind, concise role note, and occupied equipment slots.
- Exposed optional map opportunities and bounded character affordance experiments to the decision agent.
- Scoped the new starting roster to the Phase 2 Midlock core used by `player_agent_api_loop_v1`: one Warrior hero plus four militia, with Warrior/Barricade/Spear/Herb active and Drum in reserve.
- Main 2 first clear now adds the Mage to the roster without changing the active team.
- Generalized character-unlock event generation so both Main 2 Mage recruitment and Prison Ranger rescue produce visible character events.
- Persisted character recruitment as canonical causal knowledge instead of relying on transient event memory.
- Restored the missing combat settlement for a recruited-character swap experiment: after the Mage is swapped in, the next combat records its visible contribution and resolves the experiment.
- Extended the regression to cover initial role visibility, Main 2 Mage recruitment, explicit Mage swap availability, and subsequent combat verification.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: expose roster/slot/affordance data and preserve character unlock plus swap-test evidence.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: cover the complete Main 1 -> Main 2 Mage -> swap -> Main 3 verification chain.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`: document the fresh-session roster and observability contract.
- `projects/western_fantasy_continent/game_data/map-cognition-v1-event-adapter.js`: generalize visible character-unlock events.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: use the experimental initial roster and grant Mage on Main 2 first clear.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-roster.js`: make Mage available through the existing explicit reward helper.

## Validation

- `node --check` on all four modified runtime modules: PASS.
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-player-cognition-v3-character-affordance.js`: PASS.
- Deterministic smoke path: the no-Mage starter squad cleared Main 2 in 16.64 seconds with four survivors; Mage joined reserve; swapping Mage into slot 2 and clearing Main 3 recorded 321.31 Mage damage and resolved `team-experiment:hero_mage`.
- `git diff --check`: PASS.

## Current State

New player-agent sessions now provide enough stable role information for the agent to reason about team changes. Mage recruitment is visible, remembered, optional, and testable; it never silently changes the active team. The prior 30-cycle run remains untouched historical evidence.

## Unresolved

- No new external-AI long run has been started yet, so voluntary Mage selection remains untested.
- This onboarding change is intentionally scoped to the Phase 2 Midlock core used by the player-agent experiment; other playable map candidates retain their existing initial roster.
- The player-agent core still resolves Main 1 as one simultaneous enemy team even though `firstRoadWaves()` exists for the playable wave encounter. Wire that separately before claiming the next AI run tests the latest first-level pacing.

## Recommended Next Step

Start a fresh, separately named player-agent run and inspect whether the agent uses the now-visible Mage affordance after Main 2. Do not resume or overwrite `real_main7_run_2026-07-13_170746`.
