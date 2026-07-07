# Coop Report Index

Reports are append-only handoff records. Prefer the timestamped report path over relying on a mutable "latest" pointer.

## 2026-07-06

- `2026-07-06_2345_project-game-analysis-iteration-skill.md`: added `projects/western_fantasy_continent/skills/game-analysis-iteration/` as a project skill package for state-machine game analysis, feedback gates, reviewer training, and iteration planning.

- `2026-07-06_2104_top10-compare-panel-visibility.md`: moved `/character_blind_lab/top10.html` comparison results directly below the action row and scrolls them into view so `对比 agent` no longer appears unresponsive.

- `2026-07-06_2058_top10-multi-step-selection.md`: updated `/character_blind_lab/top10.html` so the user can select more than 10 candidates, disable agent comparison above 10, and repeatedly narrow the selected pool with `下一步`.

- `2026-07-06_2048_user-liked-candidates.md`: recorded the user's 39 liked blind-lab candidates as a structured positive pool before final Top10 selection.

- `2026-07-06_2040_blind-lab-mixed-runs.md`: changed `/character_blind_lab/` so the default candidate pool is a stable shuffled mix across all 7 runs instead of one run at a time, while keeping individual run selection as a dropdown option.

- `2026-07-06_2032_blind-lab-skill-details.md`: fixed `/character_blind_lab/` so the main blind lab renders passive, small skill, and ultimate descriptions for both earlier structured candidates and Run 7 `skills` arrays.

- `2026-07-06_2025_blind-top10-skill-details.md`: fixed `/character_blind_lab/top10.html` so flattened candidates hydrate passive, skill, and ultimate descriptions from original run files before rendering cards.

- `2026-07-06_2010_project-overview-doc.md`: added `projects/western_fantasy_continent/PROJECT_OVERVIEW.md` as a durable project overview covering positioning, established combat/equipment/town-loop direction, UI preferences, collaboration rules, and hard lessons.

- `2026-07-06_1944_prompt-benchmark-review.md`: ran 8 evaluator-prompt variants over the same Runs 1-7 candidate pool, recorded prompt-specific Top10 lists, and updated `/character_blind_lab/top10.html` so user blind picks can be compared against each prompt's taste profile.

- `2026-07-06_1915_candidate-review-comparison.md`: ran three evaluator-agent reviews over the 70-candidate Runs 1-7 pool, aggregated a combined Top 10, and added `/character_blind_lab/top10.html` so the user can independently choose 10 candidates and compare against agent preference.

- `2026-07-06_1752_candidate-merge-audit.md`: audited Runs 1-7 candidate packs, grouped 70 candidates into repeated mechanism/build-fantasy clusters, selected representatives/components, and added negative prompt guidance so future brainstorms avoid saturated shield-cannon, low-health return, frost-bounce, generic DOT, generic long-cast, and plain mark-hunter repeats.

- `2026-07-06_1753_poe-charge-resource-loop-build-study.md`: added the seventh Path of Exile build-study artifact, using Power/Frenzy/Endurance Charges plus Rage/Berserk to document temporary internal resources, generation, uptime, spend timing, replacement risks, and resource-economy design lessons.

- `2026-07-06_1749_poe-ailment-build-study.md`: added the sixth Path of Exile build-study artifact, using Ignite/Poison/Bleed to document ailment application engines, stack/replacement rules, duration, enemy mitigation, replacement risks, and status-effect design lessons.

- `2026-07-06_1746_poe-deployed-entity-build-study.md`: added the fifth Path of Exile build-study artifact, using traps/mines/totems to document temporary deployed-entity engines, setup time, entity limits, activation reliability, replacement risks, and turret/trap design lessons.

- `2026-07-06_1740_poe-spectre-summoner-build-study.md`: added the fourth Path of Exile build-study artifact, using Spectre Summoner to document externalized minion damage ownership, minion level/count/survival, commander tax, replacement risks, and companion-system design lessons.

- `2026-07-06_1735_poe-cast-on-critical-strike-build-study.md`: added the third Path of Exile build-study artifact, using Cast on Critical Strike to document trigger breakpoint engines, hit/crit/cooldown/attack-rate alignment, replacement risks, and UI lessons for wasted triggers.

- `2026-07-06_1732_poe-righteous-fire-build-study.md`: added the second Path of Exile build-study artifact, using Righteous Fire Chieftain to document self-upkeep, maximum fire resistance/regeneration as engine stats, replacement risks, and contrast against Toxic Rain Pathfinder.

- `2026-07-06_1729_poe-toxic-rain-build-study.md`: added the first Path of Exile build-study artifact, using Toxic Rain Pathfinder to document build core, equipment slot responsibilities, replacement effects, budget progression, and transferable loot-system design lessons.

- `2026-07-06_1651_character-brainstorm-pipeline-run7.md`: ran the seventh character brainstorm/screen/blind-review pipeline with four focused subagent directions, collected 32 raw ideas, screened 10 blind candidates, added candidate pack `2026-07-06_1651`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1619_character-brainstorm-pipeline-run6.md`: ran the sixth character brainstorm/screen/blind-review pipeline with 10 small-grain subagent directions batched by concurrency limit, collected 80 rough ideas with no subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1619`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1551_character-brainstorm-pipeline-run5.md`: ran the fifth character brainstorm/screen/blind-review pipeline as a second-pass hybrid round, recorded 32 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1551`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1519_character-brainstorm-pipeline-run4.md`: ran the fourth character brainstorm/screen/blind-review pipeline with an action-pose-first prompt, recorded 42 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1519`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1506_character-brainstorm-pipeline-run3.md`: ran the third character brainstorm/screen/blind-review pipeline with an equipment/relic-first prompt, recorded 40 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1506`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1438_character-brainstorm-pipeline-run2.md`: ran the second character brainstorm/screen/blind-review pipeline from the automation heartbeat, recorded 48 raw ideas, screened 10 blind candidates, added candidate pack `2026-07-06_1438`, and moved blind-lab run selection to `runs.json` without touching official skill assets.

- `2026-07-06_1419_character-brainstorm-pipeline-run1.md`: manually ran the first character brainstorm/screen/blind-review pipeline, recorded 42 ideas, screened 10 blind candidates, created isolated candidate pack `2026-07-06_1419`, added an inspiration pool, and exposed `/character_blind_lab/`.

## 2026-07-04

- `2026-07-04_1948_task-line-summary-update.md`: added task-board lines for `玩法信号系统` and `佣兵小镇玩法验证`, with signal work postponed and mercenary town validation active.

- `2026-07-04_1940_role-relic-angular-task-line.md`: added active task-board line `角色与藏品的棱角化、流派化` for sharper role skills, role variants, core/bridge relics, and visible build engines beyond broad trigger components.

- `2026-07-04_1930_relic-choice-and-output-modeling.md`: added AI-facing relic choice-resonance and keyword-budget checks to `special-relic-design`, plus a rough combat output formula and low-health feedback modeling notes to `phenomenon-math-modeling`.

- `2026-07-04_1920_special-relic-concept-language-correction.md`: corrected `special-relic-design` so relic concepts start as clean one-sentence game actions, with probability, ratios, caps, cooldowns, and once-per-battle limits deferred to later validation.

- `2026-07-04_1915_special-relic-readability-rules.md`: added `special-relic-design` readability rules for per-character relic target scope and simpler one-effect tuning, discouraging unclear single-ally cross-target effects and default "A but B" clauses.

- `2026-07-04_1902_special-relic-skill-width-uplift-revision.md`: revised `special-relic-design` with 20/40/30/10 width mix, bridge relics, normal/advanced/component/core grades, target uplift bands, and uplift-sum genericity caps.

- `2026-07-04_1515_special-relic-design-skill.md`: added the `special-relic-design` project skill for first-clear special relics/unique passives, including 20/40/40 width mix and target/non-target testing across 0, half, and full gear.

- `2026-07-04_1507_town-loop-app-shell-navigation.md`: converted only `town_loop V1` internal navigation toward app-shell page swaps so the global floating battle dock can persist while town pages change; shared skill/stat/combat data was not touched.

- `2026-07-04_0047_town-loop-region-global-dock-unification.md`: unified `佣兵小镇 V1` active grind display so the region page also uses the floating battle dock, avoids double battle-view load, and fixes stale `isFighting` when stopping/restarting grind.

## 2026-07-03

- `2026-07-03_2323_town-loop-global-visible-battle.md`: added visible combat to all `佣兵小镇 V1` pages while grinding, using the region page's large battle panel and a compact global battle dock on management pages.

- `2026-07-03_2310_town-loop-grind-feedback-fix.md`: fixed `佣兵小镇 V1` grind feedback so starting grind immediately launches visible combat on the region page, cross-page background ticks update top status, and warehouse/recruit pages load the shared combat simulator.

- `2026-07-03_2220_town-loop-explicit-team-slot-fix.md`: fixed `佣兵小镇 V1` team prep so clicking a position writes an explicit `teamSlot`; selecting a hero and clicking `后排 2` now places that hero in `后排 2` rather than compacting by order.

- `2026-07-03_2211_town-loop-team-recruit-correction.md`: corrected `佣兵小镇 V1` so initial heroes start at skill level 1, recruitment remains prosperity-gated, team prep uses four explicit slots, and skill levels scale combat power by 10% per average level above 1.

- `2026-07-03_1316_town-loop-v1.md`: added `佣兵小镇 V1`, a five-screen town shell with day/prosperity/event cards, region grinding, team prep, warehouse, recruitment, and shared battle/equipment integration.

- `2026-07-03_1848_equipment-grind-overall-report.md`: consolidated equipment-grind generation, drops, recommended-power validation, growth-curve pacing, UX support, implementation files, and risks into one overview report.

- `2026-07-03_1836_grand-battle-20v20-demo.md`: added a standalone `20v20 神装方阵` demo using current skill data, build layers, combat sim, and battle view with custom formation coordinates.

- `2026-07-03_1814_equipment-v3-auto-equip.md`: added `刷装备V3` equipment-page auto-equip controls for the selected hero and active team, using role-aware item scoring over usable base stats and affixes.

- `2026-07-03_1757_equipment-affix-focused-random-correction.md`: removed `刷装备V3` dungeon-themed affixes and replaced them with per-item focused random affix allocation, then regenerated concentration/drop ecology measurements.

- `2026-07-03_1739_equipment-grind-v3-drop-ecology-retune.md`: retuned `刷装备V3` rarity/drop tables to delay high rarity, added dungeon-themed affix generation, and measured mythic output/theme concentration.

- `2026-07-03_1700_equipment-grind-v3-recommendation-correction.md`: corrected misleading `刷装备V3` recommendations after D8 38k failed in play; active displayed values now use 70% similar-power combat buckets, with D8 set to 85800 and D10 flagged unresolved.

- `2026-07-03_1613_equipment-grind-v3-dust-and-session-loot.md`: added `刷装备V3` warehouse one-click dusting by rarity and a battle-page session loot strip for kept equipment during manual/continuous grind.

- `2026-07-03_1529_equipment-affix-display-merge.md`: merged duplicate same-type affixes in `刷装备V3` item detail and loot display without changing item data, scoring, or combat.

- `2026-07-03_1342_equipment-grind-v3-flow-recommended-power.md`: changed `刷装备V3` recommendation basis to fresh-run first-clear p70, added a flow calibration script/report, and updated D1-D10 displayed recommended power.

- `2026-07-03_1248_equipment-grind-v3-recommended-power.md`: recalculated `刷装备V3` dungeon recommended power with similar-power team tests, updated V3 power fields, and recorded D10 as an unresolved terminal-wall risk.

- `2026-07-03_1221_equipment-grind-v3-encoding-fix.md`: fixed `刷装备V3` mojibake/page corruption, rebuilt V3 from clean V2, separated the save key, restored D10 only in V3, and browser-validated main/team/equipment/loot pages.
- `2026-07-03_1202_equipment-grind-v3-split.md`: split the D10 output-pacing experiment into playable `刷装备V3`, restored V2 as the 9-dungeon baseline, added V3 routing/workbench entry, and verified the local page.
- `2026-07-03_1150_equipment-output-pacing-d10.md`: moved task board focus to equipment output pacing, added D10 `终焉黑冠` as a late final bottleneck, and regenerated the 8-seed 100-run clear-stage curve.
- `2026-07-03_1055_progression-curve-macro-skeleton.md`: added macro pacing skeleton rules to `progression-curve-aesthetics` and diagnosed the current `刷装备V2` curve against planned 100-run bottleneck anchors.
- `2026-07-03_1042_equipment-v2-clear-curve-fix.md`: corrected the `刷装备V2` 8-run clear-stage curve so D9-cleared runs remain at D9 through run 100, added JSON source data, and regenerated the PNG/SVG previews.

## 2026-07-02

- `2026-07-02_2525_equipment-v2-loop-optimization-goal.md`: completed the `刷装备V2` loop optimization goal, strengthened thirst multiplier, evaluated 12 candidates, and applied the `wave-supply` drop cadence.
- `2026-07-02_2505_thirst-feedback-long-run.md`: added thirst-opportunity mechanics to the `刷装备V2` feedback simulation and ran 80-round on/off comparisons across three seeds.
- `2026-07-02_2450_equipment-feedback-rule-correction.md`: corrected `刷装备V2` feedback simulation rules after user alignment: first clear +10, rarity unlock feedback, flat power feedback, and fatigue-style boredom.
- `2026-07-02_2435_equipment-grind-v2-feedback-curve.md`: added and ran an automated `刷装备V2` grind-loop feedback simulation, tracking combat time tiers, first clears, new drop-layer unlocks, power feedback, and boredom across three seeds.
- `2026-07-02_2415_equipment-grind-v2-calibrated-stage-budget.md`: added a real combat calibration script for `刷装备V2`, confirmed the prior D2 `5200` wall was over-tuned, and reduced D2-D9 enemy budgets with fixed-gear validation.
- `2026-07-02_2359_equipment-grind-v2-stage-budget.md`: raised live `刷装备V2` dungeon enemy display power and build-layer budgets so early equipment gains should hit staged walls instead of sweeping the ladder.
- `2026-07-02_2338_equipment-grind-v2-dungeon-scroll.md`: fixed `刷装备V2` lower-left dungeon list overlap by making the 9-stage list internally scrollable and browser-checking that cards no longer overlap.
- `2026-07-02_2328_equipment-grind-v2-workbench.md`: copied the existing equipment grind simulator into `刷装备V2`, wired the 9-dungeon three-wave loot table into the live page, added the workbench/server route, and browser-smoke-tested rendering plus combat start.
- `2026-07-02_2255_equipment-three-wave-budget.md`: retuned equipment dungeon/drop pacing through a 3-attempt budget to produce a three-wave progression curve, then regenerated the report and SVG curve.
- `2026-07-02_2232_progression-curve-aesthetics-skill.md`: added the `progression-curve-aesthetics` project skill to preserve the preferred wave-shaped progression structure for loot/stat/reward tuning.
- `2026-07-02_2220_equipment-grind-rarity-progression-test.md`: removed artificial dungeon wait gating, retuned rarity tables by dungeon tier, and reran the 24-tick grind curve; average end score is now 0.734 rather than near-full-clear.
- `2026-07-02_2208_equipment-grind-dungeon-progression-curve.md`: fixed the equipment grind simulation so loot comes from staged dungeons with level/rarity ranges while the waterline is only used to score each grind tick.
- `2026-07-02_2155_equipment-threshold-audit-correction.md`: audited the Mythic Lv.150 threshold result, confirming full 8-slot equipment and separating 48-sample clear from strict all-120 perfect clear.
- `2026-07-02_2145_equipment-rarity-level-waterline-thresholds.md`: added a fixed rarity/level equipment threshold scanner and measured what gear bands can clear the current super-waterline bucket.
- `2026-07-02_1938_equipment-v2-followup-and-drop-bug.md`: clarified that low super-waterline grind scores are caused by drop tier being tied to benchmark score, not weak 150 mythic gear; removed legacy percentage-style base stat production and confirmed forced 150 mythic teams beat the super bucket.
- `2026-07-02_1928_equipment-generation-v2.md`: changed equipment generation so level drives base stats, rarity drives affix point count, direct small stats covered by major attributes are blocked from affix pools, and the super-waterline equipment simulation uses the same formula.
- `2026-07-02_1910_global-mechanic-curves.md`: added a global mechanic curve asset so equipment affix points convert into real effects through shared diminishing curves; integrated it into build layers, equipment UI scoring, and super-waterline grind simulation scoring.
- `2026-07-02_1549_super-waterline-equipment-grind.md`: added a stronger generated mob waterline with attribute/equipment boosts, then ran 8 current-equipment grind simulations against it; equipment improves scores but the curve is compressed and jump rhythm is weak.
- `2026-07-02_0030_archetype-affix-width-pass.md`: re-reviewed archetype affixes with the design-width rule, broadened `fireAmp`, `stealthDuration`, `lowHpDamage`, and `auraPower`, and added direct build-layer side effects for `shadowAmp` and `arcaneAmp`.
- `2026-07-02_0015_design-width-evaluator-skill.md`: added the `design-width-evaluator` project skill for judging application width of affixes, keywords, mechanics, item stats, enemy mechanics, UI controls, and reward types using current users, future users, and extreme saturation tests.
- `2026-07-02_0000_weapon-and-archetype-affix-audit.md`: confirmed the equipment grind simulator still has a single weapon slot rather than left/right hands, and audited all 12 archetype affixes by slot coverage, role coverage, direct build-layer hook, and corrected user rule that normal affixes need at least two real user roles.

## 2026-07-01

- `2026-07-01_1513_equipment-affix-build-pool-pass.md`: rebuilt equipment grind affix generation around major attributes, small stats, and archetype affixes across 8 slots; added role-aware scoring and first late-dungeon budget correction.
- `2026-07-01_1218_shadow-assassin-engine-check.md`: verified shared combat-sim shadow assassin blink/lock/reset behavior, patched battle_view fallback shadow APIs, and added a clear generated `暗影刺客` branch to the equipment grind roster.
- `2026-07-01_1148_auto-grind-continues-after-loss.md`: changed continuous grind so losing a fight gives no loot but rerolls the next enemy group and continues instead of stopping.
- `2026-07-01_1143_equipment-auto-grind-and-dust.md`: added continuous dungeon grinding, 500-item warehouse capacity, auto-dismantle by rarity threshold, and full-warehouse stop popup.
- `2026-07-01_1132_game-ui-flow-contract-skill.md`: added the `game-ui-flow-contract` project skill and applied it to the equipment grind simulator as a page/click/formation redesign contract.
- `2026-07-01_1122_equipment-ui-team-interaction-fix.md`: corrected equipment/team page interactions: hero click only selects, details open from team-page button, and active combat order uses front/back formation controls.
- `2026-07-01_1110_equipment-dungeon-enemy-build-layer.md`: replaced the rejected dungeon enemy scaling direction with build-layer enemy construction using enemy attribute points and enemy gear budgets; no hard power gate and no direct stat multiplier.
- `2026-07-01_1044_equipment-ui-build-layer-unification.md`: unified the equipment grind simulator's hero combat spec calculation with shared `build-layers.js`, so UI equipment bonuses use the same additive layer as analysis scripts.
- `2026-07-01_2044_equipment-character-modal.md`: added a reusable character + equipment display modal to the equipment grind simulator, with center portrait, side equipment slots, four skill cards, and a seven-stat detail toggle.

## 2026-06-30

- `2026-06-30_2116_attribute-equipment-layer-direction.md`: records the agreed next architecture direction: keep character base stats unchanged, use 0 starting attribute points, and implement a shared additive attribute/equipment modifier layer instead of continuing proxy tuning.
- `2026-06-30_1338_equipment-auto-iteration-goal-complete.md`: completed the first-version equipment auto-iteration toolchain at 5/5 attempts, with static reports, combat proxy validation, and next-step recommendation for real equipment modifiers.
- `2026-06-30_1315_equipment-static-loop-attempts-2-3.md`: records attempts 2-3 of equipment auto-iteration: bridge affixes, required-group fantasy scoring, and v5 static best-so-far.
- `2026-06-30_1258_equipment-static-loop-attempt1.md`: implemented attempt 1/5 of the equipment auto-iteration loop with a global affix registry, static loot/equip evaluator, five rule variants, and first metric results.
- `2026-06-30_1239_equipment-auto-iteration-pipeline.md`: created the equipment auto-iteration pipeline and task-board entry, with four evaluation functions and a five-loop equipment-only adjustment budget.
- `2026-06-30_1224_equipment-affix-full-pool.md`: expanded equipment design from only major attributes into full first-level, second-level, and third-level affix pools distributed by slot.
- `2026-06-30_1206_equipment-affix-attribute-correction.md`: corrected equipment affix design to use the accepted v2 attributes: 武力、坚韧、敏捷、奥术、节律、韧性.
- `2026-06-30_1131_equipment-loot-design.md`: added the v1 equipment loot experience draft: slots, left/right/two-hand weapons, rarity-to-affix count, steep affix levels, and slot-restricted affix pools.
- `2026-06-30_1111_task-board-next-phase.md`: updated the task board after attribute tuning acceptance; closed/parked attribute-shadow tuning tasks and made `playable-team-composition-v1` the active next phase.
- `2026-06-30_1053_shadow-loop-and-fire-fx-check.md`: checked latest assassin target-focus work, verified fire mage active-cast signals in the showcase case, patched duplicate-name FX fallback and residual fire visuals.

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
