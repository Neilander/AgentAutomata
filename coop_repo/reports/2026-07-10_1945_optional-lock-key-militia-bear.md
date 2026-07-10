# Agent Handoff: Optional Lock-Key, Militia, And Bear Validation

- Date: 2026-07-10
- Agent/thread: Codex main thread
- Scope: Region 1 map-lab roster scarcity, optional branch semantics, Camp-to-Prison key, Ranger proof encounter, and dual-policy cognition validation
- Status: complete

## User Intent

Replace the misleading initial roster and hard-locked branch chain with new isolated militia/monster content. Keep established formal role stats and skills untouched, make Prison and Camp optional repeatable side branches with one-time core rewards, and validate the loop using real combat and knowledge-bounded player routes.

## Completed

- Replaced the initial lab roster with two complete heroes (`warrior`, `mage`) and four deliberately incomplete militia: a no-damage self-healing body, a slow spear unit, a weak healer, and a weak tempo drummer.
- Removed the initial Knight and bow militia so future Knight/Ranger unlocks retain novelty.
- Removed Prison from mainline requirements and removed Camp preview ordering. Main 6 now follows Main 5 directly.
- Made Prison and Camp repeatable after clear while granting their unique/core rewards only once.
- Added isolated map-lab encounter assets for the Prison team, a Main 7 `狂鬃蛮熊` team, and deterministic Camp key items.
- Camp first clear now grants `旧塔破盾斧` and `裂甲铁护手`; their specialist points receive explicit Prison-only combat conversion and visible activation signals.
- Prison uses a new additive `old_tower_prison` field effect with an enemy opening shield, dangerous backline sentries, and Camp-equipment interaction.
- Main 7 uses a high-HP, high-attack-speed bear with weak support. The bear occupies the Ranger-near frontline slot so current-target mark/slow behavior is actually exercised.
- Ranger knowledge is shown only after rescue; a player who skipped Prison sees only enemy facts.
- Split batch play into `explorer` and `mainline` policies. Mainline Boss retry now waits for visible equipment improvement.
- Added automated branch invariants for immediate retry, repeatability, zero repeated core loot, unchanged gear, and no duplicate character rewards.
- Updated lock-key cognition rules with optional-branch and runtime-character-key contracts.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: new isolated encounter, monster, key-item, field-selection, and Boss-scale definitions.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-roster.js`: new two-hero/four-militia roster and Ranger reward description.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: optional branch flow, one-time rewards, new encounter use, conditional Ranger knowledge, and save schema v4.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: observation/action parity with the playable page and isolated encounter use.
- `projects/western_fantasy_continent/game_data/runtime-field-effects.js`: additive `old_tower_prison` effect and visible key-item activation signals; existing effects unchanged.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-batch.js`: explorer/mainline policies plus branch invariants.
- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/lock-key-cognition.md`: optional-branch and runtime-contract rules.
- `projects/western_fantasy_continent/map_progression_lab/index.html`: loads the isolated encounter asset.

## Validation

- JavaScript syntax checks for all touched runtime files: passed.
- `git diff --check`: passed.
- Formal `skill-assets.js` and generated `skill-data.js`: no diff.
- Explorer policy, 120 real-combat runs: 100% Region 1 completion; first Prison win 2.5%; post-Camp Prison win 100%; first Boss win 98.3%; Ranger Main 7 damage share 30.3%.
- Mainline-skip policy, 120 real-combat runs: no Prison/Camp actions; 90% completed within 36 steps; Main 7 win 96.8%; first Boss win 5%, then progressed through real Main 10 farming.
- Ranger-vs-no-Ranger Main 7 comparison after encounter placement: Ranger route averaged 13.62s; skip route averaged 16.79s on successful attempts, about 19% slower without Ranger.
- Controlled Camp key sample, 160 states before final signal-only change: Main 5 gear alone cleared Prison 20%; Camp key gear cleared Prison 94.4%; average equipment-score gain was +233.
- Branch invariant suite, 20 states: Camp repeat zero-reward 100%; Prison immediate retry 100%; Prison repeat zero-reward/no-duplicate 100%.
- Two independent read-only player agents confirmed optional-route coherence and identified knowledge leak, target-order, signal, and regression gaps; all four were addressed.
- In-app browser: Main 6, Prison, and Camp were simultaneously available after Main 5; Camp real battle awarded exactly the two fixed items; loot page showed stats and owner; Camp changed to `可复战（无首通奖励）`; neutral Main 7 text appeared before Ranger rescue; console errors: 0.
- Browser-created progression was reset to a fresh v4 state after QA.

## Current State

The first region now has two coherent paths. Explorers can fail Prison, recognize the Camp key, collect a character, and gain a fast route through the later fights. Players can ignore both branches, continue the mainline, and eventually clear through slower equipment farming. Formal class balance remains the established anchor; only new map-lab content supplies the altered values.

## Unresolved

- Camp + Ranger currently creates a very strong shortcut: the final explorer batch had 100% post-Camp Prison success and 98.3% first-Boss success. This is acceptable for a first lock-key readability pass but should be judged by the user's hands-on pacing test.
- Mainline skip has a farming tail: 10% of runs did not finish within 36 decisions, though they remained in a valid Main 10/Boss improvement loop.
- The UI exposes the two specialist item activations in combat signals, but a human readability pass should confirm they remain visible among other VFX/signals.

## Recommended Next Step

Play one fresh explorer route and one deliberate skip route. Judge whether Camp/Ranger feels like an exciting shortcut rather than the only sensible answer, and whether the pure-farming Boss tail is tolerable before integrating this region structure into the broader town shell.
