# Western Fantasy Project Skills

Project skills are reusable workflows for this game. They are not global Codex skills yet; keep them here until the workflow is stable.

## Current Skills

- `skill-kit-design/`: designs class kits and archetype kits from fantasy, positioning analysis, skill volume, class assignment, signal acceptance, and shared skill-data implementation.
- `low-health-berserk-balance/`: validates and tunes low-health frenzy archetypes using combat signals and matchup argument groups.
- `game-ui-designer/`: organizes game interfaces around player decisions, information hierarchy, game-specific layouts, interaction feedback, and visual QA.
- `game-ui-flow-contract/`: repairs confusing game UI by writing page responsibility, click-action, formation, modal, and equipment-flow contracts before implementation.
- `signal-based-ui-planner/`: plans complex game interfaces from intent, core object, hierarchy, attention budget, and control choice before visual UI implementation.
- `user-review/`: reviews a designed or implemented game UI by simulating user goals, task paths, required actions, recovery paths, and feedback gaps.
- `archetype-signal-curve-design/`: turns archetype fantasy into time-series curves, state transitions, conversion metrics, composition bands, failure boundaries, and full regression checks.
- `experiment-budget-governance/`: assigns task importance and iteration budgets, defines pivot and target-review checkpoints, and governs when to continue, revise, postpone, or stop an experiment.
- `combat-causal-attribution/`: diagnoses extreme matchup outcomes as causal chains: occurrence, amplification, conversion, failed resolution, and best balance levers.
- `tutorial-level-debug/`: debugs tutorial and test combat levels by first checking visible class differences, then trying role/encounter adjustments or class-feature strengthening before any raw stat tuning.
- `phenomenon-math-modeling/`: translates observed balance, UX, or player-behavior symptoms into rough value functions, variables, contribution channels, hypotheses, and validation metrics before proposing fixes.
- `comparative-analysis/`: compares multiple attempts, observations, and math-modeling passes, then resolves contradictions, cancellations, measurement artifacts, and scope splits into a precise diagnosis.

## Related Documents

- `../design/combat_stats_design.md`: combat stat model and skill positioning checklist.
- `../game_data/skill-data.js`: shared skill definitions and execution runtime.
- `../game_data/combat-signals.js`: combat signal collection and query helpers.
