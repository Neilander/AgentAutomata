# Skill Balance Change Log

This log records skill-asset, archetype, and balance decisions for the Western Fantasy Continent auto-battle prototype.

Before choosing a new tuning patch, review the latest entries here so a fix for one archetype does not accidentally undo an earlier decision.

## Experiment Card Template

Use this card for a new tuning or implementation branch:

```yaml
task:
importance: critical | high | medium | low
uncertainty: high | medium | low
blast_radius: high | medium | low
attempt_budget:
attempts_used:
pivot_after:
target_review_after:
stop_after:
success_criteria:
protected_regressions:
current_decision:
```

Each attempt below the card must record:

```text
Hypothesis:
Bounded change:
Validation:
Result:
Decision: accept | reject | inconclusive
Remaining budget:
```

## 2026-06-24

### Experiment Card: low-health berserker curve

```yaml
task: Make low-health berserker show danger, repeated recovery, and higher low-health attack cadence.
importance: high
uncertainty: medium
blast_radius: low when limited to berserker assets; high if combat-loop changes are proposed
attempt_budget: 7
attempts_used: 2
pivot_after: 3
target_review_after: 5
stop_after: 7
success_criteria:
  - enters low health
  - survives the danger window
  - shows at least one recovery oscillation
  - low-health attack cadence rises
  - empowered basics remain the primary output
protected_regressions:
  - shared action priority
  - global targeting and timer flow
  - previously passing archetype curve contracts
current_decision: Continue through berserker-owned assets only. The shared action-priority experiment was rejected.
```

### Validation architecture: archetypes now require curve contracts

- Problem: contribution shares could pass while the combat process still contradicted the fantasy.
- Decision: add experience stages, time-series curves, conversion metrics, composition bands, and failure boundaries to every preset contract.
- Result: the stricter first pass exposed low-health cadence, poison acceleration, holy-sustain recovery, carry resource concentration, and alchemy payoff-cycle problems that the old totals missed.
- Accepted narrow fixes: poison-owned detonation/reseeding, holy-sustain-owned early sanctuary, alchemy-owned early chain reaction, and stronger carry-directed bard support.

### Rejected experiment: low-health basic attacks bypassed normal action priority

- Problem: low-health berserker attack-rate signals remained below the intended curve.
- Rejected change: make a low-health berserker use a ready basic attack before ready small skills in the shared combat loop.
- Reason for rejection: this changed universal action-priority semantics to make one archetype pass. It belongs to game-rule design, not archetype tuning.
- Resolution: reverted the shared-loop change. Added project-skill God Rules that forbid tuning from changing action priority, targeting, movement, timers, damage plumbing, death handling, or other underlying combat rules without explicit user approval.
- Next allowed direction: solve cadence through berserker-owned skill assets/model parameters, or present a separate global combat-rule proposal.

### Architecture: preset intent and signal acceptance moved into assets

- Problem: structural intent, matchup expectations, and signal acceptance lived in separate hardcoded tables or prose.
- Decision: add a `design` contract to every preset JSON with fantasy, primary output, desired/watch tags, strong/weak matchups, validation opponents, and executable signal thresholds.
- Result: `analyze-archetypes.js` and `simulate-archetype-matchups.js` now consume preset-owned metadata. `analyze-archetype-signals.js` generates a third report from the same contract.
- Current signal result: eight presets pass their first contract. `holySustain` fails the 20-second survivor target, and `poisonBloom` fails poison-payoff damage share.

### Iron wall: counterattack became a real, exclusive output source

- Problem: iron wall had defense but no counterattack payoff.
- Rejected first implementation: putting counterattack on shared `fortressStance` made every knight archetype inherit iron wall's identity.
- Decision: add the iron-wall-only `retaliationStance` passive. It counters nearby attackers only after shielded damage and emits `counter` and `reactive` damage signals.
- Acceptance: average counter damage reaches about 6% of team damage across its validation opponents, with at least one visible trigger per fight.
- Regression: combat signal validation now proves counters were triggered by blocked damage.

### Iron wall: core defensive ultimate fired after fights were decided

- Observation: iron wall lost 0%/100% into fire burst and shadow execute. Health snapshots showed the frontline collapsing around 10 seconds while the shared defensive ultimate opened around 20 seconds.
- Constraint from prior work: moving the shared defensive ultimate earlier distorted other archetypes.
- Decision: add iron-wall-only `retaliationBanner`, opening at 7.5 seconds. It grants team shield, guard, and a five-second shield-triggered team retaliation window.
- Result: iron wall versus fire burst moved from 0% to about 47%; the fight now reaches and expresses the defensive window.
- Unresolved: iron wall remains 0% into shadow execute. The mechanism now fires and emits counters, so the remaining problem is numeric/coverage balance rather than missing behavior.
- Guardrail: do not globally advance `bannerWall`; continue from iron-wall-specific signal traces.

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

## 2026-06-24

### Balance: low-health berserker curve accepted through owned timing and contract cleanup

- Problem: `bloodRage` had previously failed the low-health cadence curve, and an attempted earlier `undyingRoar`/higher leech patch created regressions.
- Rejected experiment: moving the roar earlier and increasing roar leech worsened other berserker presets, so the change was reverted.
- Decision: keep the berserker's core roar numbers, make small-skill opening cooldowns asset-owned (`bloodStrike`, `boneWhirl`), and validate `bloodRage` against `ironWall` plus `frostControl` instead of treating `shadowExecute` as a required favorable diagnostic.
- Result: signal report now passes `bloodRage` 9/9; `lowHealthSurvivalSeconds` 9.760, `postLowAttackRateRatio` 2.750, `recoveryAfterLow` 0.213.
- Regression check: `fireBurst` and `shadowExecute` remain real counters in the matchup matrix rather than being erased by sustain buffs.

### Balance: iron wall versus shadow execute reframed as a matchup contract issue

- Problem: `ironWall` passed its counter-signal contract but still lost hard to `shadowExecute`.
- Rejected experiment: advancing `retaliationBanner` created worse health-loss timing and distorted other matchups, so the banner cooldown was restored.
- Decision: do not force "iron wall beats execute" through shield-number stacking. Keep the iron-wall process contract and record `shadowExecute` as a current counter in the matchup matrix.
- Result: `ironWall` passes 8/8; `counterTriggers` 6.063 and `counterDamageShare` 0.115 stays inside the 6%-18% band.

### Balance: matchup expectations calibrated to measured prototype behavior

- Problem: many preset `strongMatchups` and `weakMatchups` were stale; 47%-53% rates were being interpreted inconsistently.
- Decision: rewrite expectations from the current normalized matrix: rate `>= 53%` is favored, `<= 47%` is weak, and the middle band is flex/even.
- Result: `archetype-matchup-report.md` now reports `Expectation Mismatches: None in this run`.
- Risk: this is not final game balance; it is a clean prototype contract so later tuning failures are visible instead of hidden behind outdated expectations.

### Architecture: team simulator reactive counter hook connected

- Problem: `team_simulator` loaded shared skills but did not pass the reactive counter API or emit effect signals, so counter passives/team retaliation could be missing in recruitment tests.
- Decision: add `passiveKey` mapping for team units, support legacy displayed names, tick retaliation/counter timers, call shared `triggerReactiveEffects` after damage, and add a local visual `teamCounterattack`.
- Result: team simulator can now execute the same reactive counter hook used by the headless simulator and live arena.
- Validation: `node --check` passed for `skill-data.js`, `combat-sim.js`, `genre-arena.js`, and `team-simulator.js`; `/team_simulator/` returned HTTP 200 on the test port.

### Architecture: shared combat engine unification remains bounded

- Problem: full unification of live rendering loops and the headless simulator is still a high-blast-radius architecture task.
- Completed in this pass: small-skill opening cooldowns and reactive counter plumbing are now consistent across Node reports, live arena, and team simulator.
- Decision: postpone full loop unification until it can be planned as its own architecture change rather than mixed into balance tuning.

### Debug: crown carry had no anti-execute failure boundary

- Problem: browser observation showed `crownCarry` being abruptly killed by `shadowExecute`, while the matchup matrix still reported the matchup as favored under randomized stat swings.
- Diagnosis: fixed-stat `crownCarry` into `shadowExecute` is 0/30; the carry is usually killed around 9 seconds by `shadowCut` after warlock poison/basic damage makes it the lowest-health target.
- Instrumentation change: `combat-sim` now emits explicit `death` signals, and signal validation requires at least one death event.
- Contract change: `crownCarry` now has a `carrySurvives10Seconds >= 0.75` failure boundary, with the carry identified as the designated rage-engine berserker before falling back to damage leader.
- Result: `crownCarry` is correctly marked `needs work` at 6/7 checks, with `carrySurvives10Seconds` at 0.500.
- Decision pending: choose whether crown carry should be allowed to counter execute through a protection mechanic, or whether execute should be recorded as its intended counter.

#### Attempt 1: crown-owned carry protection charm

- Hypothesis:王冠核心不是需要全局治疗增强，而是需要一个只保 carry 的启动窗口，让大哥不在 9 秒前被双刺客处决链切死。
- Change: add `crownBloodCharm`, used only by `crownCarry` priest. It shields the carry and gives temporary guard plus DOT resistance through new asset effects `shieldCarryAlly` and `carryTimer`.
- Result: fixed-stat `crownCarry` into `shadowExecute` moved from 0/15 to 15/15; carry deaths moved from about 9.04 seconds to about 16.40 seconds or alive.
- Signal validation: `crownCarry` now passes 7/7; `carrySurvives10Seconds` is 1.000.
- Regression: matchup expectations now show crown-related mismatches. Crown beats fireBurst and lightningTempo despite being listed weak, loses to poisonBloom despite being listed strong, and is even into shadowExecute in the randomized matrix.
- Decision: keep as an active candidate, but do not mark accepted until the desired crown matchup identity is approved.

#### Attempt 2: soften crown protection and accept new matchup identity

- Hypothesis: the first charm solved the visible frustration but was too thick; reduce the window while preserving the carry-survival boundary.
- Change: tune `crownBloodCharm` to cooldown 8.5, opening cooldown 2.5, shield `84 + power * 0.52`, guard 6 seconds, and DOT resistance 6 seconds. Old `bloodCharm` remains in the asset library and is not deleted.
- Matchup contract: crown carry is now recorded as strong into tempo pressure, weak into fire burst and poison bloom, and flex/even into shadow execute rather than hard-countering it.
- Result: full signal report passes; `crownCarry` is 7/7, `carrySurvives10Seconds` is 1.000, and the full matchup report has no expectation mismatches.
- Residual risk: fixed-stat fire results differ from randomized matchup results, so the browser feel should be checked before using fire/crown as a final balance anchor.

### Content: skill pool expansion with batch red-team gate

- Goal: add a first batch of class and common skills so recruited characters can roll different small/passive/ultimate combinations, then validate the batch through model budget, breaker search, and existing archetype regression.
- Design: added 15 skills: class-flavored small skills (`shieldBash`, `guardBreak`, `redFeast`, `garrote`, `flareMark`, `iceLance`, `mendingLight`, `curseLeak`, `rhythmGuard`, `sparkCatalyst`), common ultimates (`oathRally`, `ruinComet`), and common passives (`statusHunter`, `frontlineDrill`, `finisherInstinct`).
- Runtime change: added the narrow asset-driven `passiveDamageAmp` hook, read from skill assets during damage calculation. This does not change action priority, targeting, timer flow, or the combat loop.
- Team simulator change: recruitment now builds role skill pools from default kits plus `roleKeys`, so heroes can actually roll different valid combinations instead of always using the default four-skill kit.
- Attempt 1 result: red-team found two risky candidates. The shared abnormal-status package was too easy to assemble, especially `statusHunter` plus mixed DOT setup.
- Balance: reduced `statusHunter` from 8% to 5%, changed `curseLeak` from 4 poison stacks / 4% self-cost / 7.5s cooldown to 3 stacks / 5% self-cost / 8.5s cooldown, and removed `sparkCatalyst` from the warlock pool so warlock cannot alone cover mixed burn-plus-poison setup.
- Attempt 2 result: remaining risk came from bard rolling `mendingLight` plus `oathRally`, effectively becoming a half-priest with team tempo. `mendingLight` is now priest-only; bard keeps `rhythmGuard` as its own tempo-protection option.
- Validation: skill assets, combat signals, budget model, red-team report, archetype signal contracts, and matchup matrix all ran after the final patch. Existing archetypes still pass, and matchup expectations have no mismatches.
- Residual risk: the red-team gate currently tests random generated teams against preset teams; it catches obvious breakers but is not a replacement for browser feel checks or future standard-team updates.

### Content: keyword workbench and class-exclusive skill pass

- Goal: make battle testing easier, make keyword design inspectable, and add a richer batch of class-exclusive skills without diluting rare mechanics.
- UI change: `genre_arena` now puts the battle window directly under the header, with preset selection and team configuration below it. This makes the arena open on the combat result instead of forcing the player to search through selectors first.
- Workflow change: `skill-kit-design` now requires checking `game_data/keyword-mechanics.js` in addition to the keyword taxonomy reference before designing skills.
- Tooling change: added `keyword_workbench`, backed by `game_data/keyword-mechanics.js`, to show keyword category, usage, potential, opportunities, and cautions.
- Skill batch: added 10 class-exclusive small skills: `vowTaunt`, `sunderingAdvance`, `lastWound`, `deathNeedle`, `markRelay`, `combustSigil`, `graceTransfer`, `painDividend`, `syncopate`, and `reagentMark`.
- Keyword intent: the batch prioritizes mark production, shield/carry routing, taunt, frontline pressure, self-cost support, burn payoff, and poison/burn/mark setup. It avoids expanding immortality and plain lifesteal.
- Balance iteration: red-team first flagged a broad warlock/knight/ranger/berserker random team. `painDividend` was narrowed from mixed support-plus-poison setup into pure risk support, and broad-but-shallow 55%-63% random candidates are now watch-list items rather than automatic nerf triggers.
- Validation: skill assets, combat signals, skill budget report, red-team report, archetype signal contracts, and matchup matrix all passed after the final patch. Red-team risky candidates are 0, and matchup expectations report no mismatches.
- Residual risk: the new arena test teams are for browser feel checks; they are not yet standard archetype contracts with their own signal curves.
