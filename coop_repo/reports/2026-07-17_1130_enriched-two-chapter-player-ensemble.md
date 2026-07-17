# Agent Handoff: Enriched Two-Chapter Player Ensemble

- Date: 2026-07-17
- Agent/thread: `/root` with persistent player subagents
- Scope: richer two-chapter program variant, multi-profile player simulation, paired loot comparison, mechanical enumeration, and independent review
- Status: complete

## User Intent

Create a program-only variant of the current two chapters with more characters, a mid-route wall, richer equipment including exact 1% Mythic drops, then let several persistent player Agents run it and report what the current cognition, roster expectation, A feedback, equipment response, and encounter design actually expose.

## Completed

- Added `enriched_v1` without changing the default two-chapter route.
- Added five recruitable heroes: Berserker, Bard, Assassin, Warlock, and Alchemist.
- Added the Region 1 Main 9 late pressure and Region 2 confluence pressure.
- Added richer per-node loot tables with exact `mythic: 0.01`, and preserved paired-seed integrity independently of inventory length.
- Preserved player Agent identity, cognition, knowledge, character impressions, roster expectations, equipment, roster, and team across the chapter transition.
- Added a two-chapter persistent-Agent runner, CLI, exact request/response archive, validator, mechanical enumerator, and aggregate statistical report.
- Ran five alpha player profiles: open novice, damage absolutist, safety conservative, low-friction optimizer, and inertial player. Four cleared both chapters; safety conservative hit the Chapter 1 60-cycle cap.
- Completed an open-novice paired-beta run. It had no opening Mythic but received one at Chapter 2 cycle 16, so only its earlier segment is a non-jackpot comparison.
- Completed an independent blind review. Overall verdict: `reject` as validation of the complete cognition/progression model, while accepting most profile behaviours as plausible diagnostic trajectories.
- Extended exhaustive four-character, forward/reverse formation enumeration through `r1_main_10`, both bosses, and the Chapter 2 trials/confluence.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-roster.js`: five additional enriched heroes.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: Chapter 1 enriched milestones, pressure, and loot rules.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-chapter2-core.js`: Chapter 2 enriched unlocks, pressure, and loot rules.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: enriched environment propagation and cross-chapter state carryover.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/enriched-two-chapter-run.js`: persistent two-chapter wrapper and summary.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/enriched-two-chapter-cli.js`: file protocol with exact artifact archival.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/validate-enriched-two-chapter-run.js`: probability, unlock, pressure, paired-seed, and carryover checks.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/analyze-enriched-bottlenecks.js`: exhaustive roster/formation/gear scans including both bosses.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/generate-enriched-run-report.js`: per-run, per-profile, mechanical, A, loot-order, and diagnosis aggregation.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled_runs/2026-07-17_enriched_two_chapter/`: manifest, raw runs, summaries, mechanical results, aggregate statistics, statistical report, and independent review.

## Validation

- Enriched validator: PASS; 19/19 generated loot-rule classes contain exact Mythic 1%.
- Deterministic 100,000-item sample: 988 Mythics, 0.988%.
- Added-hero semantic unlock, Main 9 pressure, confluence pressure, paired-seed inventory independence, and cross-chapter carryover: PASS.
- Existing controlled two-chapter, player-profile ensemble, causal loop, roster-A integration, roster-A edge cases, Region 1 design intent, Chapter 2 design, and Chapter 2 signal-chain regressions: PASS.
- Mechanical enumeration: every legal four-character combination in canonical and reversed formation, bare and deterministic best-visible gear, for ten selected encounters.
- Agent archive: five complete two-chapter runs, one alpha safety cap, and one partial safety beta fragment; exact player requests/responses retained.
- Requested model was `5.5fast`; the orchestration interface did not expose model selection or identity, so every run honestly records `actualModel: unknown_platform_default`.

## Current State

The environment is substantially richer and produces differentiated player behaviour. Damage absolutist corrected a damage-only belief after the Chapter 2 boss; low-friction optimizer spent 25/55 cycles on equipment; inertial player required 34 combats and 14 losses; safety conservative could not close Chapter 1 within 60 cycles. The roster A formula works when a comparable fight occurs, but natural coverage is low: 30 predictions, 9 settlements, and 21 invalidations.

The aggregate result is diagnostic, not acceptance. Best-visible equipment raises `r1_boss` from 33.10% to 92.62% and `r2_boss` from 2.85% to 88.11%; it raises both Chapter 2 trials above 91% and confluence to 97.90%. The open beta also cleared flag trial and confluence without Knight, before its late Mythic drop, confirming that the bypass is not only an opening-jackpot artifact.

## Unresolved

- Player-visible threat knowledge spreads raw `gameEvent.diagnosis`, including disposable enemy names and internal role strings, without concept interpretation.
- Same-batch loot is learned sequentially; a Mythic followed by an ordinary item creates immediate, order-dependent negative A. Detected 56 times; worst A was -2.3646.
- Natural roster A coverage is only 30%; progression and equipment changes invalidate most predictions.
- Profile priors remain `unverified_prior`; contradictory evidence does not update the code-owned prior status.
- Full `P/Q/R/kP` and Agency-to-action calculation is not present as one auditable trace.
- All five completed runs end above emotion 95, including the high-loss inertial run; late feedback is compressed by saturation.
- Equipment largely erases intended role/mechanic discrimination, including terminal encounters.
- Combat attempt number changes the RNG seed, weakening causal claims across retries.
- The live 117-drop sample is too small to estimate a 1% rate; use the 100,000-item validator for rule verification.
- Novelty collector and rarity chaser were initialized but not run; the completed set already spans five player types plus one beta comparison.

## Recommended Next Step

Fix the two hard cognition-boundary errors first: (1) route every player-visible diagnosis field through the concept interpreter, and (2) freeze expectation priors for the whole loot batch before committing learning. Then redesign roster-prediction settlement to survive natural progression with an explicit verification window, and only after those fixes rebalance equipment versus the Chapter 2 trials/confluence/bosses.
