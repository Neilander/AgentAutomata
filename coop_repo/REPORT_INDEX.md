# Coop Report Index

Reports are append-only handoff records. Prefer the timestamped report path over relying on a mutable "latest" pointer.

## 2026-06-29

- `2026-06-29_2219_balance-showcase-and-open-bugs.md`: summarizes the balance showcase work and records the next two combat bugs: shadow blink target lock and mage/fire FX anchoring.
- `2026-06-29_2105_balance-showcase-single-shadow-and-fire-note.md`: added single-shadow failure scenarios to the showcase and clarified the double-shadow vs fire-burst two-mage/fire-echo behavior.
- `2026-06-29_2055_balance-showcase-page.md`: added a workbench page for watching curated no-attribute 4v4 balance showcase battles using the shared battle view.
- `2026-06-29_1245_shadow-assassin-double-branch-review.md`: reinterprets clean no-attribute results from a double-shadow anti-combo lens; single-shadow is weak, two-shadow is plausible but should be treated as its own branch.
- `2026-06-29_1238_shadow-assassin-clean-baseline.md`: reran shadow assassin baseline with no attribute routes using fixed-preset matrix and 500-team waterline; one-shadow is weak, two-shadow is spiky and still below old waterline.
- `2026-06-29_1205_shadow-assassin-report-correction.md`: corrects the previous shadow assassin tuning handoff; the reported 4v4 table was actually 2v2, and the real 4v4 remains tenacity-led.
- `2026-06-29_1155_shadow-assassin-survival-tuning.md`: completed a 3-attempt survivability tuning budget for the hidden/shadow assassin, adding hidden extension and one low-HP fade while recording waterline risk.
- `2026-06-29_1116_shadow-assassin-validation.md`: validates the new hidden/shadow assassin branch, including baseline strength, route performance, waterline results, and next reset/exit-payoff recommendation.
- `2026-06-29_1116_latest-pull-assassin-shadow-bridge.md`: bridges the top-level coop entry point to the project-local 2026-06-29 assassin hidden/shadow burst report from the latest pull.

## 2026-06-28

- `2026-06-28_2107_waterline-interpretation-and-bloodrage.md`: records how to interpret the generated 4v4 waterline, fixed-preset bucket results, and the `bloodRage`/berserker auto-trigger diagnosis.
- `2026-06-28_1449_mob-waterline-and-role-score.md`: built a 500-team generated mob waterline across five strength buckets and scored ten professions' fixed-preset-derived standard teams against it.
- `2026-06-28_0000_team-pool-evolver.md`: added a practical team-pool iteration document/script, initialized 140 logic-built teams, and validated random exploration with a dry-run.

## 2026-06-25

- `2026-06-25_2206_playable-team-composition-next.md`: summarizes the shared battle-view extraction, current assassin/matrix diagnosis, and sets next phase priority to playable character composition first, player signal system second.
- `2026-06-25_1259_encounter-lab-combat-replay.md`: corrected encounter lab from a static result board into signal-driven combat playback with feed, HP progression, and floaters.
- `2026-06-25_1242_encounter-lab-ui-redesign.md`: redesigned the encounter/level lab UI using the project `game-ui-designer` skill and browser-checked desktop/mobile usability.
- `2026-06-25_1217_signal-system-paused.md`: records the current life-recognition / signal-system state and marks it paused by user request.
- `2026-06-25_1113_life-recognition-scale-tuning.md`: retuned the life simulator recognition scale and recorded the current usable mood model with default pleasure decay 6.
- `2026-06-25_2015_signal-ui-and-life-recognition-handoff.md`: records today's shift from UI implementation failures into signal-based UI planning, attention analysis, player signal modeling, and the first life recognition simulator.

## 2026-06-24

- `2026-06-24_2104_encounter-lab-ui-and-coop-index.md`: added the Encounter Lab workbench UI and changed coop navigation toward a timestamped report index.
- `2026-06-24_1713_deterministic-ecology-encounters.md`: added deterministic ecology diagnostics and the first five encounter level data/simulation reports.
- `2026-06-24_1100_asset-intent-signal-contract-and-iron-wall.md`: previous skill/signal/balance handoff.
- `2026-06-24_2151_unpushed-local-changes-handoff.md`: broad local dirty worktree handoff from another/earlier pass; keep for context, but it is not the current UI handoff.

## 2026-06-23

- `2026-06-23_2220_goal-complete-handoff.md`
- `2026-06-23_2209_skill-assets-and-archetype-validation.md`
