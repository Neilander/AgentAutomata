# Skill Balance Change Log

This log records skill-asset, archetype, and balance decisions for the Western Fantasy Continent auto-battle prototype.

Before choosing a new tuning patch, review the latest entries here so a fix for one archetype does not accidentally undo an earlier decision.

## 2026-06-23

### Architecture: skill definitions were still coupled to the runtime

- Problem: `game_data/skill-data.js` held role kits, skill definitions, presets, berserker model numbers, and effect execution in one file. This made it shared, but not yet asset-like.
- Risk: future AI-generated skills would need to edit runtime code, and balancing could drift if pages copied logic again.
- Decision: add `game_data/skill-assets.js` as the skill asset layer and keep `game_data/skill-data.js` as the compatibility runtime/export layer.
- Result: current pages still consume `GAME_SKILL_DATA`, while role kits, skill effect schemas, presets, and model numbers now come from `GAME_SKILL_ASSETS`.
- Follow-up check: if a page needs a new combat mechanic, add a new effect schema kind to the runtime; if it only needs a new skill or number, edit the asset layer.

### Architecture: asset bundle is no longer the source of truth

- Problem: `game_data/skill-assets.js` was shared, but it was still a hand-edited JavaScript bundle. That was better than duplicating skills in pages, but not yet close enough to ScriptableObject-style assets.
- Risk: AI-generated skills would still have to patch one large JS file, and reviewers could not inspect one skill as one asset.
- Decision: split source assets into `game_data/skill_assets/**/*.json` and generate `game_data/skill-assets.js` with `game_data/build-skill-assets.js`.
- Result: individual skills now live as separate JSON files under `game_data/skill_assets/skills/`; browser pages still load one synchronous bundle, so existing UI initialization does not need async fetch rewrites.
- Guardrail: `game_data/validate-skill-assets.js` now loads the JSON source and fails if the generated bundle drifts.
- Follow-up check: future skill generation should create or edit JSON files, then run build and validation.

### Balance Context: low-health berserker first patch is already active

- Problem: low-health berserker could die before its recovery/frenzy window expressed itself.
- Prior decision: make `undyingRoar` open earlier, increase low-health lifesteal, and add missing-HP attack cadence scaling.
- Active numbers:
  - `undyingRoar` opening cooldown: `8s`
  - `rageEngine` lifesteal: `0.08 + missingHp * 0.11`
  - `rageEngine` low-health haste: `1 + missingHp * 0.7`
- Next validation: compare `bloodRage` against DOT, burst, shield, execute, and tempo presets using signal tags and health snapshots.

### Archetype Audit: poison preset had unclear class ownership

- Problem: `poisonBloom` used priest protection on the knight slot and the warlock passive on the priest slot. This made the preset mechanically useful but weak as training data for class-aware AI skill generation.
- Decision: keep poison payoff on assassin/warlock, return the knight to `guard + tauntLine`, and return the priest passive to `afterglowGrace`.
- Expected result: poison fantasy remains slow stack plus detonation, while frontline control and sustain read as their own class identities.
- Risk: poison team may lose some early sustain or poison payoff. Re-test against burst and execute presets before buffing poison numbers.

### Archetype Audit: asset-level intent report added

- Problem: the design audit existed as prose, but there was no repeatable way to catch missing mechanics when assets change.
- Decision: add `game_data/analyze-archetypes.js`, which reads JSON source assets and writes `design/archetype-analysis-report.md`.
- Result: current presets pass the first intent-tag scan, but this is structural evidence only.
- Risk: a flow can contain the right mechanics and still fail numerically. Do not treat this report as matchup balance proof.
- Next validation: extract or port the battle simulation core so matchup and signal reports can run outside the UI page.

### Simulation: matchup report needed side normalization

- Problem: the first matchup report used ordered left-side win rate only. Early ultimates could create misleading 100/0 results because left/right position, target timing, and seed text were not normalized.
- Decision: add `game_data/combat-sim.js` for Node signal-backed combat simulation and update `game_data/simulate-archetype-matchups.js` to run each matchup from both sides.
- Result: the report now uses 15 seeds per side, 30 games per matchup, and averages signals from the perspective of the named preset.
- Risk: the browser arena still has its original visual update loop; use the Node report for design tuning, then compare important cases in the browser.

### Balance: low-health berserker beat intended burst/execute counters too hard

- Problem: normalized matchup data showed `bloodRage` beating `fireBurst` at 97% and `shadowExecute` at 100%, even though those were intended to be at least soft counters.
- Hypothesis A: rage sustain was too high.
  - Test: lower low-health haste/leech and add shared `roarLeech`.
  - Result: little movement; the issue was not only sustain.
- Hypothesis B: counter ultimates were firing too late.
  - Test: add `openingCooldown` to `meteorRain` and `shadowHarvest`.
  - Result: fire and shadow entered the fight earlier, but matchup data still showed bloodRage too favored until berserker output was reduced.
- Patch:
  - Berserker `power`: `66 -> 60`
  - `undyingRoar` opening cooldown: `8 -> 9.5`
  - `rageEngine` lifesteal: `0.08 + missingHp * 0.11 -> 0.07 + missingHp * 0.09`
  - `rageEngine` low-health haste: `0.7 -> 0.55`
  - `roarLeech`: new shared field, `0.14`
  - `meteorRain.openingCooldown`: `11.5`
  - `shadowHarvest.openingCooldown`: `2`
- Result: `bloodRage` now reports about 50% into both `fireBurst` and `shadowExecute`, while staying strong into `ironWall` and `frostControl`.
- Residual risk: this makes fire/execute counters less favored than originally intended; they are now checks, not hard counters.

#### New Problem: early shadow execute overperforms into shield/sustain

- Problem: after making `shadowHarvest` early enough to interact with bloodRage, `shadowExecute` reports 100% into `ironWall` and `holySustain`.
- Tests:
  - Earlier defensive ultimates (`bannerWall`, `sanctuary`) created other distortions.
  - Lowering `shadowHarvest` damage did not reliably restore shield/sustain matchups.
- Current decision: do not stack more changes in this pass. Treat this as the next tuning branch.
- Next hypotheses:
  - Add a shield-aware execute rule so shields blunt `shadowHarvest` more than normal damage.
  - Give defensive archetypes an early anti-execute small skill rather than moving full defensive ultimates earlier.
  - Adjust expected matchup table if the desired fantasy becomes "execute punishes slow defense but loses to poison/control."

##### Root Cause: taunt existed in text but not in targeting

- Observation: lowering execute damage and moving defensive ultimates did not reliably change the matchup.
- Signal review: assassins continued selecting the lowest-health unit while the knight used `tauntLine`; the skill only granted self shield and damage reduction.
- Decision: add a five-second `tauntTimer` effect to the skill asset and make all three current battle surfaces prioritize an active taunter.
- Expected result: shield teams can redirect early focus into the protected frontliner, while execute remains effective after the taunt window or against teams without a knight.

###### Correction: global taunt increased focus-fire extremes

- Test result: forcing ranged and melee units onto the knight made many matchups more polarized because whole teams concentrated damage on one target.
- Revision: only units with melee range (`range < 20`) obey taunt. This matches the skill's "nearby enemies" description and keeps ranged targeting behavior intact.

### Validation: signal and targeting regression added

- Problem: asset validation proved references and schemas, but did not prove that combat behavior emitted analyzable signals.
- Decision: add `game_data/validate-combat-signals.js` and include it in the main game-data validation command.
- Assertions: basic damage tags, skill-cast tags, periodic health snapshots, and assassin damage redirected by an active melee taunt.

### Architecture: browser balance checks now use the shared simulator

- Problem: the browser arena had a second hidden simulation loop for its matchup matrix, separate from `game_data/combat-sim.js`.
- Risk: an asset or combat-rule change could pass the Node report while the in-app balance matrix continued running stale behavior.
- Decision: make `combat-sim.js` a browser/CommonJS module and load it before `genre-arena.js`.
- Result: the arena matchup matrix now calls `GAME_COMBAT_SIM.simulatePresetMatchup`, runs each seed from both sides, and uses the same normalized rate as the report; the duplicate `simulateOnce` implementation and its local seeded RNG were removed.
- Remaining boundary: the animated live battle still owns rendering-oriented movement and VFX state. Its skill definitions are shared, but the frame loop has not yet been replaced by the headless simulator.

### Architecture: gameplay pages no longer silently fall back to copied skills

- Problem: `genre_arena` and `team_simulator` preferred the generated skill runtime, but silently used local fallback definitions when scripts loaded in the wrong order.
- Risk: a broken asset include could look functional while actually running stale copied skills, recreating manual synchronization.
- Decision: require `GAME_SKILL_DATA` at startup and fail clearly if role kits, assets, or the effect executor are unavailable.
- Result: all successful live skill casts on these pages now come from JSON assets through `createSkillLibrary`; stale fallback code cannot become active gameplay.
