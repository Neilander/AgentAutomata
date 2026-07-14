# Agent Handoff: Main 4 Single-Target Role Teaching

- Date: 2026-07-13
- Agent/thread: Codex heartbeat automation
- Scope: AI-playable natural role-swap teaching and emotion audit
- Status: partial

## User Intent

Iterate the AI-playable map until a player Agent can naturally learn `unlock character -> understand function -> adjust team -> challenge a fitting encounter -> update role knowledge`, without hidden evaluator prompting and without an unacceptable emotional trajectory.

## Completed

- Audited the clean baseline and confirmed the old Main 4 gave no Ranger-specific reason: Mage and Ranger both won 100/100 matched runs, with Mage faster.
- Added a player-agent-only Main 4 candidate consisting of one 850-HP bear and the visible sustained-single-target hint. Default and frozen map variants remain unchanged.
- Added a 20-seed causal regression: the fresh Ranger lineup wins 20/20 while the Mage lineup wins 1/20.
- Added a reusable role-swap run auditor for unlocks, raw swap reasoning, contribution evidence, knowledge deltas, emotion trajectory, private evaluator state, and information-boundary leaks.
- Ran exactly one isolated GPT-5.5 player Agent and explicitly closed it. Agent id: `019f5c7f-cb2a-7db3-bb8a-8f858ac64a33`; previous close status `running`, final status `shutdown`.
- Preserved the run as partial: 12 complete cycles plus a cycle 13 decision. The Agent naturally swapped in and proved the Mage, but repeatedly equipped the frontline, skipped the generic Prison rescue, and cleared Main 4 with one survivor before unlocking the Ranger.
- Recorded the candidate verdict as `REVISE`: mechanical role contrast passed, natural teaching path failed, emotion passed.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: adds the isolated Ranger teaching bear encounter.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: exposes and uses that encounter only in the player-agent role-wave variant.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: adds visible-hint and matched-role regressions.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/summarize-role-swap-run.js`: adds reusable post-run boundary, role, knowledge, and emotion auditing.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/role_swap_iterations/2026-07-13_130420_main4-single-target/`: preserves all request/response evidence, partial session, generated audit, and iteration verdict.

## Validation

- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-map-first-region-flow.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-map-cognition-v3-combined.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-map-cognition-v3-midlock.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-player-cognition-v3-character-affordance.js`: PASS.
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/summarize-role-swap-run.js .../session.json`: PASS; 13 requests checked, boundary PASS, minimum emotion 38, largest automatic drop -0.0014.
- `git diff --check`: PASS.

## Current State

Main 4 now has a mechanically valid sustained-single-target counter in the player-agent experiment only. The isolated Agent understood the encounter hint, but rationally preferred the known main route and seven explicit equipment actions over a Prison branch whose reward exposed only an unspecified rescue. The actual Mage clear was fragile, but it prevented the failure/wake-up path that might have reopened the branch.

Emotion was not the cause: it rose from 38 to 43.9234 with no meaningful drop. The player model also behaved plausibly, so no cognition skill rule was changed.

## Unresolved

- No Ranger was unlocked, swapped, or tested, so the core teaching objective did not pass.
- Equipment remains a valid broad solution and can probabilistically bypass the role key; simply increasing bear stats would mistake route legibility for a balance problem.
- The run is partial because the slow isolated Agent was closed during cycle 13 attribution after the design hypothesis had already been falsified.
- The candidate should not be frozen or promoted until a fresh run produces visible Ranger contribution evidence.

## Recommended Next Step

Change one variable only: make the Prison's player-visible reward after Main 3 identify a sustained-single-target Ranger instead of a generic new character. Keep the Prison optional, keep equipment as a second solution, and rerun one fresh isolated Agent to test whether the legible optional key can overcome main-route momentum without hidden prompting.
