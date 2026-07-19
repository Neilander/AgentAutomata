# Player Agent API Loop V1

This isolated experiment proves the smallest intended cognition architecture:

```text
code-owned game state
-> automatic real event generation
-> automatic signal, expectation, PQRA, emotion, and event-statistics update
-> code updates canonical subject-environment-behavior-result knowledge
-> code updates character impressions and the shared relative-strength ruler
-> code scopes combat outcome to the exact roster and re-estimates every legal replacement
-> decision API request
-> AI returns one structured action
-> code executes the action
-> attribution API request
-> AI returns evidence-bound causal attribution
-> code attaches attribution to the matching result knowledge
-> next cycle
```

Before the emotion runtime or canonical knowledge sees combat events, `signal-concept-interpreter.js` converts the engine log into a player-semantic log. The session keeps `rawEventLog` only for audit; agent requests and learned knowledge use `eventLog`, where disposable enemy identities are replaced by concepts such as `近战小怪` and `远程小怪`.

The AI is not allowed to set emotion or PQRA values. The decision response must select an allowed action. The attribution response must cite event IDs produced by the game. Low-level Frozen V3 entries are treated as event-statistics caches, not player knowledge. Canonical knowledge always contains subject, environment, behavior, and structured result observations. This experiment does not modify Frozen V3, formal combat values, production skills, or any webpage.

Player hypotheses use one measurable condition field: `targetCondition: { metric, operator, value }`. It is required for `verificationScope: "next_combat"` and optional with the same meaning for `current_action`. The full request and `compact-request.js` expose the same contract; the old mistaken name `nextCombatTargetCondition` is rejected with an explicit correction message. Run `node test-target-condition-contract.js` for contract-shaped confirmation/refutation, current-action parity, compact-request parity, and deprecated-field rejection.

`game_data/player-feedback-model.js` now owns the replaceable feedback calculations. Every accepted event emits one `player_feedback_bundle_v1` with separate Process, R, A, and EVerify channels. EVerify retains support, strength, contribution, novelty, and closure before deriving causal-knowledge evidence, `strategySatisfaction = max(support, 0) * strength`, and discovery satisfaction. The learned context-scoped causal belief is visible to the next decision request and survives compact requests and chapter inheritance. Existing target-condition-only evidence remains a conservative proxy rather than pretending that a win proves the proposed cause. Run `node projects/western_fantasy_continent/game_data/test-player-feedback-model.js` from the repository root together with the player-hypothesis regression.

Novelty and closure are intentionally inactive defaults. Without explicit player-semantic causal-chain evidence, both are `0` and discovery satisfaction is `0`; closure is not inferred from evidence strength. Their automatic generation is a separate queued task.

The isolated candidate `game_data/everify-isolated-v1.js` is not part of formal runs. Its V2 contract requires the Agent to write a claim, chosen behavior, and at least three ordered causal steps before acting. The Agent cannot submit support or strength. The program later matches only received step observations/contradictions, frozen information tiers, and event order; it derives each link and grants whole-chain support only when the complete chain survives. A supported prefix becomes local link knowledge but does not confirm the whole claim. There are no `35/65` mechanism/effect weights, step averages, custom clarity values, or result-`R` input. Run `node projects/western_fantasy_continent/game_data/test-everify-isolated-v1.js` from the repository root for complete-chain confirmation, middle-step refutation, supported-prefix learning, later-outcome refutation, reversed time, numeric-tier rejection, and incomplete-hypothesis rejection.

`game_data/causal-chain-event-matcher.js` adds the isolated non-Agent matcher. It exact-matches an allowlisted structured Agent step against already received public semantic events, chooses the strongest valid ordered path through repeated events, derives explicit opposites and exclusive-subject contradictions, and then calls the V2 resolver. It proves only that a contributing path occurred, not that the path was the sole or primary cause. `battle-information-parser.js` now preserves independently perceived, player-visible actor/target/time details in a parallel `causalEvidence` array while leaving the aggregate knowledge-summary `signals` unchanged. `received-information-organizer.js` carries this array separately and explicitly does not route it into observations or knowledge. Run `node projects/western_fantasy_continent/game_data/test-causal-chain-event-matcher.js` for 16 matcher cases and `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-causal-evidence-channel.js` for the real-fixture perception/isolation checks. The formal EVerify settlement still does not consume this new channel.

The same persisted session also owns `entityImpressionState`. Every completed battle feeds its visible four-character report into deterministic impression code. Pairwise battle differences update all known character positions together; the weakest member of the current top 30% becomes the zero boundary, and compact relative levels enter the next decision request as `playerState.characterImpressions`. This is parallel to causal knowledge, not a replacement for it, and AI output cannot write the matrix.

`rosterExpectationState` stores encounter results with the exact active-team and equipped-build fingerprints. The next decision request includes one `rosterChangeExpectations` entry per legal one-slot swap. Exact comparable composition history wins. Otherwise a known one-member counterfactual exposes independent output/protection/buff deltas and three pure-axis scenarios but no final numeric score. The Agent returns a coarse `0–10` need ratio for the current visible problem; code normalizes it, projects and freezes the mixed prediction. Any positively weighted axis without cognition evidence keeps the prediction unknown, and the formal loop never falls back to the old composite score. A failed swap therefore applies to that team, while a materially different known replacement can reopen the expectation. Untested characters remain unknown. See `ROSTER_CHANGE_EXPECTATION_CONTRACT.md`; run `node test-roster-change-expectation.js`, `node test-roster-change-expectation-edge-cases.js`, and `node test-roster-capability-mix-expectation.js`.

`rosterPredictionAState` is the separate code-owned settlement ledger. For a counterfactual swap, `roster-expectation-a.js` freezes the Agent's normalized capability-need mix together with its weighted delta, context-trait adjustment, baseline score, predicted score, exact candidate team/build, target encounter, persistent perception profile, and axis-evidence-adjusted confidence. Settlement quantizes expected and actual relative improvement through that profile and computes the unchanged asymmetric mismatch A. Self-serving confirmation C compares visible actual and expected combat progress: above-expectation results grow by a capped square-root multiplier, slightly lower same-band results decay by a 1.5-power curve, and clear downward band crossings receive no C. Equipment changes on a capability-mix prediction apply the equipment-power ratio to the frozen mixed combat progress and retain the same mix; they never read the old composite character strength. Direct legacy records keep their compatibility rebase. A different encounter weakly carries the expectation at weight `0.25`; visible Boss/trial/field-rule signals can override it. A different team still invalidates, and a newer swap supersedes. The Agent supplies the current need ratio only; it never supplies the numeric prediction, A, C, or emotion intensity. Run `node test-expectation-repair-trio.js`, `node test-roster-expectation-a.js`, `node test-player-agent-roster-a-integration.js`, `node test-roster-capability-mix-expectation.js`, and `node audit-capability-mix-equipment-rebase.js`.

## Causal Knowledge Rules

- Fresh sessions start with one complete Warrior hero plus four militia. The active squad is Warrior, Barricade Militia, Spear Militia, and Herb Militia; Drum Militia begins in reserve.
- Main 1 uses the same two-big-wave, three-entry encounter data as the playable map. Its ten weak enemies enter as 3, then 3 when the opening group falls to two survivors, then 4 after the first big wave is cleared; every entry produces a visible cognition event.
- Clearing Main 2 for the first time adds the complete Mage hero to the roster without changing the active squad. The Mage unlock, available swap actions, and subsequent combat contribution remain explicit player-visible evidence.
- Decision requests include structured team slots and the full unlocked roster with role, unit kind, positioning, equipment occupancy, active/reserve state, and concise role descriptions.
- Decision requests do not expose evaluator-owned character experiments or the explicit `discover_new_capabilities` goal. The agent sees only the unlock, roster facts, role descriptions, legal swap actions, and hypotheses it created itself.
- Character swap experiments remain in private `evaluatorState`, where they can audit unlock -> swap -> combat evidence without instructing the player agent what to test.
- Clearing a level causes map unlocks and loot drops. There is no invented `receive_reward` player behavior.
- Loot is placed in inventory. It never changes equipped power by itself.
- `equip:<heroId>:<itemId>` is an explicit player decision. Only that action may move an item from inventory to a hero and change equipped power.
- Combat reports produce queryable knowledge about team damage, each unit's combined contribution, and enemy-role threat. Disposable enemy instances and ordinary skill events remain in the battle log instead of long-term knowledge.
- Repeated observations update the same generalized row. Character and enemy-role patterns use encounter bands such as early main, while exact unlocks and drops retain their node.
- Each knowledge row keeps at most eight recent observations; sample counts and outcome distributions continue accumulating.
- Every canonical knowledge row has `subject`, `environment`, `behavior`, and `result`; the behavior must be a real cause of the recorded result.
- Raw enemy IDs and internal enemy names must not enter the emotion runtime, attribution request, decision request, or canonical knowledge.
- Concept matching must happen before learning; post-hoc knowledge filtering is invalid.

The source map prototype still contains automatic equipment behavior. This experiment deliberately removes that side effect in its adapter and leaves the formal map prototype unchanged.

## Two-Cycle Protocol

```powershell
node cli.js init session.json
node cli.js request session.json decision-1-request.json
node cli.js decision session.json decision-1-response.json
node cli.js request session.json attribution-1-request.json
node cli.js attribution session.json attribution-1-response.json

node cli.js request session.json decision-2-request.json
node cli.js decision session.json decision-2-response.json
node cli.js request session.json attribution-2-request.json
node cli.js attribution session.json attribution-2-response.json

node cli.js summary session.json summary.json
```

Each response file represents one external AI API call. The session file is the persistent code-owned state between calls.

V2 also records a stable `agentSession` id in every request. The caller should reuse one decision Agent for all requests with that id: the first turn is `bootstrap`, subsequent turns are `continue`. Conversation memory improves continuity but never replaces the repository session, retrieved knowledge, current observation, or legal-action list. Run `node validate-persistent-agent-context.js` to verify save/restore continuity.

Decision requests no longer send the full canonical knowledge store. `knowledge-retrieval.js` is an explicit pre-decision node that selects at most 18 relevant summaries while retaining the complete store in the session. Run `node validate-knowledge-retrieval-slices.js` for the ten-slice Chapter 1/2 regression.

## Selectable Player Profiles

`player-profiles.js` defines ten durable player profiles. Each profile contains fallible causal priors in subject-environment-behavior-result form plus decision preferences. The profile is stored in the code-owned session and included in every decision and attribution request; it never writes emotion or PQRA values and it is not treated as verified game knowledge.

`player-profile-ensemble.js` runs any selected subset against the same game seed while keeping cognition state, learned knowledge, history, and persistent Agent context independent. Select an exact set with `profileIds`, or select X profiles deterministically with `profileCount` and `selectionSeed`:

```js
const ENSEMBLE = require("./player-profile-ensemble");

const exactPair = ENSEMBLE.createEnsemble({
  seed: "chapter-one-paired-test",
  profileIds: ["damage_absolutist", "safety_conservative"],
  maxCycles: 12,
});

const sampledPair = ENSEMBLE.createEnsemble({
  seed: "chapter-one-paired-test",
  profileCount: 2,
  selectionSeed: "profile-sample-a",
  maxCycles: 12,
});
```

The command-line wrapper accepts either a count or comma-separated exact IDs:

```powershell
node ensemble-cli.js init ensemble.json chapter-one-paired-test 2 12
node ensemble-cli.js init ensemble.json chapter-one-paired-test damage_absolutist,safety_conservative 12
node ensemble-cli.js request ensemble.json requests.json
```

Each entry in `requests.json` has a `profileId` and one Agent request. Route every profile to its own persistent Agent using the supplied `agentSession.id`, then apply its response with `ensemble-cli.js decision` or `ensemble-cli.js attribution`. Run `node validate-player-profile-ensemble.js` for the two-profile, two-cycle regression.

## User-Controlled Two-Chapter Emotion Audit

`controlled-two-chapter-run.js` separates emotion-model validation from autonomous guidance validation. At every decision node, the caller supplies a controller directive with either one exact legal action or a constrained set of legal action prefixes. The persistent Agent must obey that directive and may only choose among `controller.eligibleActions`; game execution, signals, knowledge, PQRA, and emotion remain code-owned.

```js
const CONTROLLED = require("./controlled-two-chapter-run");

let run = CONTROLLED.createRun({
  seed: "user-route-a",
  profileId: "open_novice",
});

const request = CONTROLLED.getPendingRequest(run, {
  exactAction: "challenge:r1_main_1",
  intent: "Follow the main route before changing equipment or roster.",
});
```

Use `advanceToChapter2` only after the current attribution is complete. Unlike the older compressed handoff, this transition preserves the complete cognition state, canonical knowledge, concept state, player profile, and persistent Agent context. `summarizeEmotion` reports decision emotion and every real event's process/acquired/expectation contribution. Run `node validate-controlled-two-chapter-run.js` for the cross-chapter smoke regression.

Run `node verify-causal-loop.js` for the regression check. The current accepted evidence is under `causal_verification_v9_concept_interpreter/`; the older `run/` and `verification/` folders document rejected implementations and must not be used as current evidence.

## Long-Run Evidence

The current onboarding run is `role_wave_run_2026-07-13_105247/` with seed `role-wave-2026-07-13-105247`.

- It contains 30 complete decision/attribution cycles, 60 logical external-agent calls, and 120 persisted request/response files.
- Main 1 ran all three entries in one continuous combat: 3 enemies at 0 seconds, 3 at 6.96 seconds, and 4 at 23.68 seconds. The squad cleared it in 37.44 seconds.
- Clearing Main 2 exposed the Mage as a complete reserve hero. The external agent voluntarily replaced Spear Militia with Mage on cycle 5, then verified Mage on Main 3 on cycle 8; Mage dealt 338.95 damage and led the squad.
- The same session cleared Main 1 through Main 10. The 30-cycle cap arrived after two Main 10 equipment actions, so the regional Boss was not attempted.
- Main 6 exposed a causal-confounding risk: the unchanged squad and equipped power lost on cycle 17, immediately retried on cycle 18, and won because attempt number changes the combat seed. Failure can therefore disappear without a player learning or applying a key.
- The run ended with 90 canonical knowledge rows and no missing evidence files or invalid subject-environment-behavior-result tuples.
- Loot never changed equipped power without a separate `equip` decision.
- `ACTION_KNOWLEDGE_CONCEPT_TRACE.md`, `run-audit.json`, and `AGENT_RUN_NOTES.md` contain the complete action trace, integrity audit, and player-agent notes.
- Decisions and attributions were supplied through a single isolated player sub-agent. Combat, loot, emotion, concepts, knowledge consolidation, and state transitions were computed by repository code; the sub-agent was closed after completing the run.

The earlier Boss-pressure comparison remains under `real_main7_run_2026-07-13_170746/`. It reached the regional Boss twice in 30 cycles but did not clear it; use it as historical evidence for late-region pressure, not as evidence for the current starter-roster and Mage-onboarding flow.

Large per-turn request/response transcripts and original pre-slimming sessions are stored locally under `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/`. See `LOCAL_RUN_ARCHIVE.md`. The source tree keeps compact sessions, summaries, reports, and selected formal fixtures.

## Enriched Two-Chapter Program Variant

`enriched-two-chapter-run.js` is an isolated program-only variant selected with `environmentVariant: "enriched_v1"`. It keeps the default two chapters unchanged while adding five milestone-unlocked heroes, later pressure points, richer Epic/Legendary equipment, and an exact 1% Mythic rate per normally generated item. The enriched transition preserves the same player Agent context plus the Chapter 1 roster, equipped items, and inventory.

Use `enriched-two-chapter-cli.js` for persistent real-Agent runs. Every request and response is archived beside the authoritative session:

```powershell
node enriched-two-chapter-cli.js init session.json paired-alpha open_novice ordinary
node enriched-two-chapter-cli.js request session.json request.json
node enriched-two-chapter-cli.js decision session.json response.json
node enriched-two-chapter-cli.js attribution session.json response.json
node enriched-two-chapter-cli.js advance session.json
node enriched-two-chapter-cli.js summary session.json summary.json
```

Run `node validate-enriched-two-chapter-run.js` for exact drop tables, a 100,000-item Mythic sample, new-character semantic events, bottleneck scaling, paired loot seeds, and cross-chapter persistence. Run `node analyze-enriched-bottlenecks.js <output.json>` for exhaustive four-character combination checks in canonical and reversed formation.

2026-07-18在正式认知接线后，使用相同 `paired-alpha` 种子重新跑了开放新手和惯性玩家两条独立两章轨迹。循环数由旧版各49降至30/35，知识由199/192降至112/107；新版战斗知识原始威胁形状和非公开战斗证据均为0，19/19与22/22个关卡知识保存完整四人认知坐标。Agent实际用这些坐标完成角色回换、失败后继续测试其他角色、换装二次验证和新关弱惯性。该结果只判定“行为提升通过”。长跑发现的支援/坦克整体强度低估随后已由输出、保护、增益三套独立标尺解决；假设条件字段合同不一致也已统一为 `targetCondition`。玩家被随机翻盘误导符合模拟目标，换人A/C聚焦回归正常，未知新角色不建立数值A预测是原合同。通用EVerify更广泛的玩法覆盖以及概率、失败、Progress留待以后。中文对比见 `controlled_runs/2026-07-18_post_cognition_two_agents/COMPARISON_REPORT.md`，程序数据由 `compare-post-cognition-two-agent-runs.js` 生成。

## Frozen Information Presentation Tiers

Battle information no longer derives cognitive visibility from font pixels, color coefficients, or animation duration. Frontend and cognition now share `information_presentation_tier_v2`: a `background=0.25` floor plus the continuous main-interface ladder `ambient=0.40`, `standard_low=0.50`, `standard=0.60`, `standard_high=0.70`, `prominent=0.80`, `highlight=0.90`, and forced `blocking=1.00`. These values are presentation evidence strengths, not direct reception probabilities.

The human-facing rules and frozen calibration evidence are in `../../design/INFORMATION_PRESENTATION_TIER_CONTRACT.md`. Run `node test-information-presentation-tiers.js` for same-signal tier ordering, repetition, attention competition, real-battle calibration, and frontend-emitter checks.

## 三块隔离的玩家认知组合

角色认知、过滤后的类型1因果知识和换人预期保持三块职责隔离，并已经接入正式运行顺序。角色认知继续独占详细角色表现、输出/保护/增益三套独立矩阵、各自前30%标尺和特点复核；它更新完成后，`received-information-organizer.js` 才筛选玩家实际接收的非角色信号，并按旧合同生成“主体 + 环境 + 行为 → 结构化结果”；换人预期只读取更新后的角色认知、四人阵容、装备与本场结果。

`stable-character-event-adapter.js` 已接入正式角色认知入口。它按每场可见角色名称把 `left-1` 等临时站位映射回永久角色ID，不把站位固定绑定到某个角色。真实22场验证得到88/88角色覆盖、0个临时角色ID残留、2219条详细事件成功匹配和80条可用特点证据。

组合程序 `isolated-player-cognition-composition.js` 继续承担独立回归；同一整理器现已正式接入旧 `knowledgeBase` 的 `mergeKnowledgeObservation` 入口，没有创建第二套知识库。真实22场形成134条观察关系、107个合并键，其中17个可累计重复证据；22/22条关卡挑战都带站位1到4，以及每名角色当时三套能力的矩阵位置、前30%标尺、相对标尺距离、认知等级和证据数。不同队伍分键，同样四人交换站位也分键；整理层不判断历史知识是否仍适用，只把完整事实交给 Agent。地图、掉落和角色解锁改归“玩家进度”，不归因给当时角色。场地3/3、掉落21/21、地图15/15、角色解锁9/9保留，`observe_*`假行为和单句结果均为0。

正式归因使用公开语义信号ID，不再向 Agent 暴露原始战斗事件ID。正式知识检索会把历史战斗翻译成可读事实，并在完整与压缩请求中保留当时四人的站位与三套认知坐标。当前 `characterImpressions` 只给Agent输出、保护、增益三套独立标尺，不再暴露综合分；Agent指令要求先判断问题再取用相关维度。运行 `node verify-causal-loop.js`、`node ../entity_impression_knowledge_v1/test-independent-capability-cognition.js` 和 `node test-isolated-player-cognition-composition.js` 验证正式接线、维度独立性和真实22场行为。完整中文说明见 `../../design/INDEPENDENT_CHARACTER_CAPABILITY_RULERS_V1.md`、`../../design/TYPE1_FILTERED_CAUSAL_KNOWLEDGE_V1.md` 和 `../../design/ISOLATED_PLAYER_COGNITION_COMPOSITION_V1.md`。

## 纯程序战斗信息解析器

`battle-information-parser.js` 目前是独立模块，尚未接入玩家 Agent。它只使用界面可见事件，把原始战斗日志压缩成玩家语言。三档不再按单场条数硬切；每条合法信号根据自身强度独立决定是否被接收，25%/50%/75%只是大量非强制信号上的长期校准目标。

- 敌人只按本场实际可见行为描述，例如“使用过治疗的敌方单位”，不根据 `priest` 推断后排或固定职责。
- 信号强度由显眼度、画面清晰度、相对幅度、当前目标和同屏竞争共同形成；重复事件通过饱和的“有效观察机会”累积，而不是无限相加。
- 三档共用同一份确定性检测值，只改变敏感度，因此窄幅结果必然包含于普通档，普通档必然包含于宽幅档。
- 胜负是强制锚点；我方死亡和神话掉落使用接近必达的感知下限，不会被普通随机遗漏压过。
- 平淡战斗中宽幅玩家也可以什么都没多注意；大量强制展示信号出现时，窄幅玩家也可以远超 25%，没有单场配额。
- 输出不包含临时敌人名、内部 ID/role、原始 diagnosis、H、emotionDelta、精确事件 ID 或内部实验结果。
- 玩家输出不披露候选总量、漏看比例或接收概率；稳定信号 ID 为无顺序含义的语义哈希，不会用编号空洞暗示漏掉的信息。
- 重复伤害、治疗、护盾、状态和技能会先压缩，避免合法事件逐条刷屏。

运行 `node test-battle-information-parser.js` 会检查固定 17 事件样本、存档中的 355 事件真实战斗、重复积累、同屏竞争、目标相关性、无配额边界、三档嵌套和信息泄漏。
