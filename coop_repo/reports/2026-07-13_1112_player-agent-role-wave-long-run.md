# Agent Handoff: Player-Agent Role Wave Long Run

- Date: 2026-07-13
- Agent/thread: Codex with one isolated GPT-5.5 player sub-agent
- Scope: connect the playable Main 1 wave encounter to the CLI cognition loop, then run a fresh 30-cycle player-agent session against the new starter roster and Main 2 Mage onboarding
- Status: complete

## User Intent

Make the player agent see actionable character-role information, start with one Warrior plus militia, receive a complete Mage after Main 2, and then test the resulting design in a fresh long AI run. The long-run sub-agent must be explicitly closed after use.

## Completed

- Added unified reinforcement-wave simulation to `combat-sim.js`; all entries share one combat state rather than being settled as separate battles.
- Connected the experimental player-agent Main 1 to the playable 3/3/4 encounter. Entry two starts when the opening group has at most two enemies remaining; each entry emits a visible semantic reinforcement event.
- Scoped the starter-roster, Main 1 wave, and Main 2 Mage experiment behind `starterVariant: "player_agent_role_wave"` so the frozen/default Midlock core and its tests retain their prior behavior.
- Extended causal-loop verification to require ten Main 1 kills, exact 3/3/4 entries, delayed second entry, visible reinforcement signals, Mage unlock, voluntary swap, and subsequent Mage combat contribution.
- Ran one fresh 30-cycle isolated player agent under seed `role-wave-2026-07-13-105247`, preserving all 120 decision/attribution request and response files.
- The agent cleared Main 1 in 37.44 seconds with entries at 0, 6.96, and 23.68 seconds.
- Main 2 unlocked Mage on cycle 4. The agent voluntarily replaced Spear Militia with Mage on cycle 5 and tested the changed team on Main 3 on cycle 8. Mage dealt 338.95 damage, cast four skills, and led team damage.
- The run cleared Main 1 through Main 10. It did not attempt the Boss because the fixed 30-cycle budget ended after two post-Main-10 equipment decisions.
- Audited the run: no missing evidence files, response/session mismatches, invalid causal rows, or reused response hashes were found.
- Explicitly closed sub-agent `019f5bf7-b5bb-70f1-80ad-652d82711e36` after it wrote `AGENT_RUN_NOTES.md`. A second close lookup returned not found, confirming it no longer occupies a slot. No server was started.

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: added continuous multi-wave simulation, reinforcement injection, wave-entry signals, and shared result construction.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: made the next small wave enter when at most two enemies remain.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: opted only the player-agent variant into the experimental roster, wave combat, and Main 2 Mage reward.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: initializes new sessions with the named player-agent variant.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: verifies the full wave and Mage swap-to-proof chain.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/summarize-main7-run.js`: reports team swaps, character unlocks/experiments, action counts, and Main 1 wave timing.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`: documents the current wave rules and long-run evidence while retaining the older Boss run as historical evidence.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/role_wave_run_2026-07-13_105247/`: contains the complete new run, audit, trace, and agent notes.

## Validation

- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: pass.
- `node projects/western_fantasy_continent/game_data/test-map-cognition-v3-midlock.js`: pass after scoping the experiment away from the frozen default.
- `node projects/western_fantasy_continent/game_data/test-map-first-region-flow.js`: pass.
- `node projects/western_fantasy_continent/game_data/test-map-cognition-v3-combined.js`: pass.
- `node projects/western_fantasy_continent/game_data/test-player-cognition-v3-character-affordance.js`: pass.
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/summarize-main7-run.js projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/role_wave_run_2026-07-13_105247/session.json`: pass; audit reports 30 cycles, 90 knowledge rows, and no missing/invalid evidence.
- `git diff --check`: pass.

## Current State

The new CLI player-agent path now tests the intended early teaching sequence rather than assuming character value will be inferred. It exposes the complete reserve Mage as an optional affordance, and this run supplied a clean observed chain: unlock -> deliberate team swap -> combat test -> visible Mage contribution. Main 1 also now generates temporal wave pressure rather than presenting one static enemy team.

## Unresolved

- Main 6 was lost on cycle 17 and immediately won on cycle 18 with the same team and equipped power. Attempt number changes the combat seed, so variance erased the failure without any new key, build change, or growth action. This can invalidate lock-key learning and is the highest-value design/runtime issue exposed by this run.
- The player agent retried Main 6 immediately despite a recorded failure memory. Its response did not meaningfully reason about Bandit Camp, Prison, or a team/equipment intervention.
- The fixed 30-cycle run ended after Main 10 and therefore does not prove the current roster can clear or intelligently prepare for the regional Boss.
- The wave simulator is regression-tested through CLI output but has not been visually replayed in the browser in this unit.

## Recommended Next Step

Create a separately named Main 6 causality experiment. Hold combat randomness fixed across unchanged retries, or expose enough uncertainty that a same-state retry is an intentional decision rather than a silent seed reroll. Then compare immediate retry against at least two visible keys: equipment growth and a route/team intervention. Preserve this 30-cycle run unchanged as onboarding evidence.
