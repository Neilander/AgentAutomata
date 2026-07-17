# Enriched Two-Chapter Player-Agent Statistics

- Runs initialized: 14/14; started 7; complete 5
- Alpha profile runs: started 5, complete 4; beta comparisons: started 2, complete 1
- Requested model: 5.5fast; actual: unknown_platform_default (unsupported_by_current_orchestrator)
- Paired seeds: paired-alpha, paired-beta

## Per-profile results

| profile | complete | C1 | C2 | fights | losses | swaps | equips | mythic drop/equip | new heroes never tested | negative roster A | final emotion mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| open_novice | 2/2 | 2 | 2 | 44 | 3 | 16 | 46 | 3/3 | hero_berserker, hero_bard, hero_assassin, hero_warlock, hero_knight, hero_alchemist | 0 | 98.5107 |
| damage_absolutist | 1/1 | 1 | 1 | 21 | 2 | 4 | 24 | 2/2 | hero_assassin, hero_warlock, hero_priest, hero_alchemist | 0 | 95.712 |
| safety_conservative | 0/2 | 0 | 0 | 26 | 7 | 4 | 35 | 1/1 | hero_berserker, hero_mage | 0 | 50.3043 |
| low_friction_optimizer | 1/1 | 1 | 1 | 21 | 2 | 9 | 25 | 2/2 | hero_alchemist | 0 | 95.7089 |
| inertial_player | 1/1 | 1 | 1 | 34 | 14 | 6 | 9 | 3/2 | hero_mage, hero_bard, hero_assassin, hero_warlock | 1 | 99.6856 |
| novelty_collector | 0/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 | - | 0 | - |
| rarity_chaser | 0/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 | - | 0 | - |

## Mechanical bottleneck enumeration

Every legal 4-character combination was tested in canonical and reversed order, both bare and with deterministic best-visible equipment.

| encounter | formations | bare win rate | geared win rate |
| --- | ---: | ---: | ---: |
| r1_main_6 | 252 | 36.9% | 55.95% |
| r1_main_7 | 252 | 35.32% | 56.75% |
| r1_main_8 | 252 | 89.68% | 99.21% |
| r1_main_9 | 420 | 44.05% | 92.62% |
| r1_main_10 | 420 | 58.57% | 95.71% |
| r1_boss | 420 | 33.1% | 92.62% |
| r2_shield_trial | 1430 | 19.79% | 94.76% |
| r2_flag_trial | 1430 | 13.36% | 91.47% |
| r2_confluence | 2002 | 12.69% | 97.9% |
| r2_boss | 2002 | 2.85% | 88.11% |

## Cross-run diagnostics

- completionRate: 0.7143
- chapter2ConfluenceLosses: 3
- chapter1Main9Losses: 0
- equipActionRatePerChallenge: 0.9521
- newCharacterTestRate: 0.6458
- uniquePairedDropItems: 117
- uniquePairedMythicItems: 4
- playerMythicExposures: 11
- playerMythicEquipResponses: 10
- observedMythicRateAcrossUniquePairedDrops: 0.03419
- mythicRuleValidation: All 19 generated rule classes contain exact mythic=0.01; the deterministic 100,000-item validator observed 988 mythics (0.988%).
- mythicRateSampleCaveat: The live-agent unique-drop sample is too small to estimate a 1% rate; its observed percentage is descriptive only.
- pairedBetaCaveat: open_novice/paired-beta had no opening mythic but received a mythic level-26 item at Chapter 2 cycle 16 (+160 active power), so only its pre-drop segment is a non-jackpot comparison.
- pairedSeedCorrelationRule: The same seed/node/attempt drop is one random observation even when several profiles experience it; profile-level mythic counts are player exposures, not independent probability samples.
- lootBatchOrderPenaltyCount: 56
- worstLootBatchOrderPenalty: -2.3646
- sameBuildRetryRecoveryCount: 0
- retrySeedConfound: Combat attempt number changes the random seed. A loss can become a win without a roster or equipment intervention, weakening causal learning about the wall.
- rawDiagnosisBoundaryLimitation: Threat knowledge currently spreads raw gameEvent.diagnosis fields into later player requests. Disposable enemy names and internal role strings can bypass concept interpretation.
- cognitionAuditLimitation: The archived trace does not expose a complete P/Q/R/kP plus Agency-to-action audit, and code-owned profile priors remain unverified_prior after contradictory evidence.
- runsEndingEmotionAtLeast95: open_novice/paired-alpha:97.3944, open_novice/paired-beta:99.627, damage_absolutist/paired-alpha:95.712, low_friction_optimizer/paired-alpha:95.7089, inertial_player/paired-alpha:99.6856
- emotionSaturationRisk: Several long runs approach the upper emotion range despite major repeated losses, which compresses later positive and negative feedback.
- profilesWithNoEquipActions: none
- profilesWithNegativeRosterA: inertial_player
- rosterPredictionSelections: 30
- rosterPredictionResolved: 9
- rosterPredictionInvalidated: 21
- rosterPredictionNaturalProgressRisk: A swap prediction is scoped to the currently selected encounter. If the player swaps after a clear and advances to the newly unlocked encounter, the prediction is invalidated as different_encounter and produces no A feedback.
- unverifiedPriorRows: 10
- modelSelectionLimitation: 5.5fast requested; current subagent interface exposes no model selector or actual model identity.
- mythicCognitionLimitation: Current probability family combines every non-common drop by node; it does not learn a cross-node 1% mythic belief or dry streak.
- mechanicalCoverage: The exhaustive formation scan now covers selected middle gates, r1_main_10, r1_boss, and r2_boss in bare and deterministic best-visible-equipment states.

## 当前暴露的问题

- **独立审阅总判定：reject（作为完整认知/进度验证）。** 玩家行为本身大体符合各自 profile，但当前证据只能当诊断样本，不能宣称整套玩家认知模型已经可信。
- **玩家可见信号边界有泄漏。** 威胁知识直接携带了 gameEvent.diagnosis 中的临时敌人名字和内部 role 字符串，没有先经过概念解释；因此“引用合法事件 ID”不等于“玩家只看到了合法语义”。
- **换人 A 反馈在自然推进中基本没有结算。** 已建立 30 次换人预测，只结算 9 次（30%），另有 21 次因进入下一场战斗而失效。受控的“换人后重打同一关”测试通过，但真实玩家常在胜利后换人并继续前进，当前绑定方式覆盖不了这种正常行为。
- **装备正在淹没关卡机制。** r1_boss 33.1%→92.62%；r2_shield_trial 19.79%→94.76%；r2_flag_trial 13.36%→91.47%；r2_confluence 12.69%→97.9%；r2_boss 2.85%→88.11%。这些关卡原本想检查阵容/角色理解，但最佳可见装备让绝大多数编队直接通过。
- **同批掉落存在顺序污染。** 共检测到 56 次“先出高价值装备、后出普通装备”导致的负 A，最差 -2.3646。同一场结算里的普通掉落不应因为前一件是极品就立刻被当成失望。
- **神话掉落有行为反应，但没有正确的概率认知。** 玩家共接触 11 件神话并装备 10 件；当前知识只学习“某节点出过非普通装备”，没有跨节点的 1% 神话概率、干旱期或惊喜尺度。
- **beta 不是完整无神话对照。** 它在第二章第 16 轮获得神话 Lv26 装备并增加 160 有效强度；只能把此前片段与 alpha 对照，不能用其 Boss 结果证明无神话路线更容易。掉落规则本身的 1% 由 10 万次程序抽样验证为 0.988%，真实 Agent 的 117 件独立掉落样本太小，不能反推概率。
- **战斗随机数削弱因果学习。** 重试会改变战斗随机种子，所以相同阵容和装备也可能从失败变成胜利；玩家容易把随机翻盘错误归因给路线、角色或装备。
- **玩家先验没有状态闭环。** 10 条先验在运行后仍标记为 unverified_prior；知识和行为可能已经改变，但“先验被证实/被推翻”没有程序化落盘。
- **完整认知计算仍不可审计。** 当前归档没有把 P/Q/R/kP 和 Agency→动作选择形成一条完整可复算链；所以最终情绪值和行为合理，仍不能替代对完整认知模型的验证。
- **情绪尺度出现上沿饱和。** 5 个运行结束时情绪值达到 95 以上；惯性型即使经历大量失败也接近上沿，后期装备提升和再次失败的反馈会被压扁。
- **终局也会被最佳可见装备显著软化。** 新增穷举后，第一章 Boss 从裸装 33.1% 升至装备态 92.62%；第二章 Boss 从 2.85% 升至 88.11%。Agent 的实际装备未必达到该上限，但关卡的理论判别力已经被装备大幅压缩。
- **样本口径提醒。** 当前统计包含 7 个已启动玩家运行；相同 paired seed 的同一掉落只算一个随机观测，不能把多个玩家看到同一件神话装备当成多次独立抽样。

## Run details

### open_novice / paired-alpha

- Complete: true; chapter 2; phase decision
- Fights 22, wins 21, losses 1; swaps 13; equips 14
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_main_4":1,"r1_prison":1,"r1_main_5":1,"r1_bandit":1,"r1_main_6":2,"r1_main_7":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":1,"r1_boss":1,"r2_entry":1,"r2_knight_rescue":1,"r2_shield_trial":1,"r2_priest_rescue":1,"r2_flag_trial":1,"r2_confluence":2,"r2_boss":1}
- Drops: {"mythic":2,"common":17,"rare":12,"legendary":6,"epic":8}; roster A: {"selections":8,"resolved":0,"invalidated":8,"invalidatedReasons":{"different_encounter":8},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### open_novice / paired-beta

- Complete: true; chapter 2; phase decision
- Fights 22, wins 20, losses 2; swaps 3; equips 32
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_prison":3,"r1_main_4":1,"r1_main_5":1,"r1_bandit":1,"r1_main_6":1,"r1_main_7":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":1,"r1_boss":1,"r2_entry":1,"r2_priest_rescue":1,"r2_flag_trial":1,"r2_knight_rescue":1,"r2_shield_trial":1,"r2_confluence":1,"r2_boss":1}
- Drops: {"common":19,"rare":12,"epic":9,"mythic":1,"legendary":2}; roster A: {"selections":2,"resolved":0,"invalidated":2,"invalidatedReasons":{"different_encounter":2},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### damage_absolutist / paired-alpha

- Complete: true; chapter 2; phase decision
- Fights 21, wins 19, losses 2; swaps 4; equips 24
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_main_4":1,"r1_main_5":1,"r1_main_6":1,"r1_main_7":2,"r1_prison":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":1,"r1_boss":1,"r2_entry":1,"r2_knight_rescue":1,"r2_shield_trial":1,"r2_priest_rescue":1,"r2_flag_trial":1,"r2_confluence":1,"r2_boss":2}
- Drops: {"mythic":2,"common":13,"rare":9,"epic":8,"legendary":8}; roster A: {"selections":4,"resolved":1,"invalidated":3,"invalidatedReasons":{"different_encounter":2,"different_equipment_build":1},"positive":1,"negative":0,"zero":0,"total":0.0247,"minimum":0.0247}
- Unresolved failures: []

### damage_absolutist / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### safety_conservative / paired-alpha

- Complete: false; chapter 1; phase complete
- Fights 24, wins 17, losses 7; swaps 4; equips 32
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_main_4":1,"r1_main_5":5,"r1_main_6":3,"r1_bandit":2,"r1_main_7":2,"r1_prison":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":3,"r1_boss":2}
- Drops: {"mythic":1,"common":21,"rare":7,"epic":3,"legendary":2}; roster A: {"selections":3,"resolved":0,"invalidated":3,"invalidatedReasons":{"different_encounter":3},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: [{},{}]

### safety_conservative / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 2, wins 2, losses 0; swaps 0; equips 3
- Attempts: {"r1_main_1":1,"r1_main_2":1}
- Drops: {"common":4}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### low_friction_optimizer / paired-alpha

- Complete: true; chapter 2; phase decision
- Fights 21, wins 19, losses 2; swaps 9; equips 25
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_main_4":1,"r1_main_5":1,"r1_main_6":1,"r1_main_7":2,"r1_prison":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":1,"r1_boss":1,"r2_entry":1,"r2_knight_rescue":1,"r2_priest_rescue":1,"r2_shield_trial":1,"r2_flag_trial":1,"r2_confluence":1,"r2_boss":2}
- Drops: {"mythic":2,"common":13,"rare":9,"epic":8,"legendary":8}; roster A: {"selections":7,"resolved":2,"invalidated":5,"invalidatedReasons":{"different_encounter":5},"positive":2,"negative":0,"zero":0,"total":0.0784,"minimum":0.0247}
- Unresolved failures: []

### low_friction_optimizer / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### inertial_player / paired-alpha

- Complete: true; chapter 2; phase decision
- Fights 34, wins 20, losses 14; swaps 6; equips 9
- Attempts: {"r1_main_1":1,"r1_main_2":1,"r1_main_3":1,"r1_main_4":1,"r1_main_5":1,"r1_main_6":3,"r1_bandit":4,"r1_main_7":2,"r1_prison":1,"r1_main_8":1,"r1_main_9":1,"r1_main_10":1,"r1_boss":1,"r2_entry":1,"r2_priest_rescue":1,"r2_flag_trial":1,"r2_knight_rescue":1,"r2_shield_trial":1,"r2_confluence":4,"r2_boss":6}
- Drops: {"mythic":3,"common":15,"rare":11,"epic":6,"legendary":8}; roster A: {"selections":6,"resolved":6,"invalidated":0,"invalidatedReasons":{},"positive":3,"negative":1,"zero":2,"total":0.0187,"minimum":-0.4667}
- Unresolved failures: []

### inertial_player / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### novelty_collector / paired-alpha

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### novelty_collector / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### rarity_chaser / paired-alpha

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

### rarity_chaser / paired-beta

- Complete: false; chapter 1; phase decision
- Fights 0, wins 0, losses 0; swaps 0; equips 0
- Attempts: {}
- Drops: {}; roster A: {"selections":0,"resolved":0,"invalidated":0,"invalidatedReasons":{},"positive":0,"negative":0,"zero":0,"total":0,"minimum":0}
- Unresolved failures: []

