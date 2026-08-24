# 独立评审 V2：UFS 第一步选择→单步脑内设想

- 评审日期：2026-08-22（Asia/Shanghai）
- 评审身份：全新独立 reviewer；未参与实现
- 评审模型：Codex / GPT-5
- Verdict：**accept**

## 评审范围与方法

本次结论从当前代码重新得出，没有采用旧 `INDEPENDENT_REVIEW.md` 的结论。评审前完整阅读了：

- `skills/player-cognition-simulation/SKILL.md`
- `references/model-concepts-explained.md`
- `references/cognition-state.md`
- `references/signal-concept-interpretation.md`
- `references/simulation-protocol.md`

随后独立检查本目录的协议、README、选择适配器、公开状态夹具、放置规则设想、主编排器、测试和演示，并追读了所依赖的 `five-slot-activation.js`、`imagination-pipeline.js` 及正式场景夹具。没有读取旧评审正文。

实际运行：

```text
node --test .../ufs_first_action_imagination_v0/test-first-action-imagination.js
→ 7/7 PASS

node .../ufs_first_action_imagination_v0/run-demo.js
→ A/B/C 均完成一次自动后果，随后 choice / next_player_decision，nextAction=null
```

我还对 A/B/C 三例分别做了未进入文件的独立运行时消融：`placementPerceptionBudget=4` 时三例均为 `attention_stop`，movement/room/sky 全为 `null`；把 placement memory 替换成永远返回空候选的实现时三例均为 `unknown`，movement/room/sky 全为 `null`。

## 1. 注意→严格五槽 Q→矩阵候选→关系门→受控 grounding→临时补丁

**通过。当前房间状态与防空下降确实沿该链产生。**

证据如下：

1. `buildPlacementAtoms` 只从当前公开状态、公开地图与已选动作构造注意原子；新放置只先写入函数内的临时 `existingByCell`，没有改 observed state。
2. `buildQueries` 只有在 `event.type`、`event.dieValue`、`cell.roomId`、`room.type`、`room.cellIds` 全被注意选中后才产生两个 Q。Q 由 `qFor` 生成，恰好包含 `affected_object / change_trend / cause_relation / temporal_state / context` 五槽；依赖的 `MatrixTrajectoryMemory.query` 会调用 `assertFiveSlotQ`，缺槽、空槽或多槽都会抛错。
3. 两个 Q 都实际进入 `MatrixTrajectoryMemory.query`。轨迹候选随后由 `relationCheck` 依据 Q kind、已注意到的 room type 和 cell count 做门控；普通列移动、防空减一、单格房、多格房与无房间阶段规则不是由选择适配器分支选出。
4. grounding 只能经 `attention.read` 取得骰值、房间格占用、骰值、modifier 和 energyCost；缺少任一所需事实会抛出 `PlacementAttentionError` 并返回 `attention_stop`。状态 C 的下降量由被关系门接受的 `RULE-AA-REDUCES-DESCENT` grounding 读取 `event.dieValue` 与 `room.type` 后产生 `set_movement_amount(amount=0)`；不是主编排器预填。
5. grounding 先返回 patch，再由 `applyPatch` 写入临时 `imaginedConsequences`。房间不完整、房间值、能耗和 `ready_but_not_resolved / setup_only_incomplete / no_room_phase_output` 都只在这里形成。主编排器只消费已提交的 movement/room patch。
6. 演示 trace 与上述调用链一致：A 的房间 grounding 读取 C4/C5 的 occupied/dieValue 后得到缺 C4；B 读取单格占用、骰值与 modifier 后得到 roomValue=4；C 的防空 grounding 读取骰值与 room type 后得到下降 0。三例 trace 均有两个五槽 Q、矩阵候选、关系门选择和两个 committed grounding；候选不匹配时另有 relation rejection 审计记录。

因此，旧版所述由适配器直接计算 `roomProjection` 的路径在当前版本中已经不存在。

## 2. 直接投影或正式 engine 答案旁路

**未发现。**

- `selection-adapter.js` 只解析 `SELECTION` 并把唯一公开骰映射为 `place_die`，没有房间、下降或天空计算。
- `ufs-first-action-imagination.js` 与 `placement-rule-imagination.js` 都没有导入 `standard-engine`、`scenario-fixtures` 或 `applyWorkerPlacement`；代码中没有 `roomProjection`/`projectRoom`。
- 房间答案的算术只存在于已唤醒轨迹的 grounding program 内。防空 `max(0, dieValue-1)` 同样只存在于 `aa_descent` grounding 内。这是规则记忆实例化后的受控演算，不是适配器/engine oracle 旁路。
- 主编排器确实直接做了两件机械接线：把已选骰标记为 placed 并记录 placement，以及把天空流水线产生的 imaginedWorld 复制回 imaginedState；它没有重算 room 或 AA 答案。
- 正式 engine 只出现在 `test-first-action-imagination.js` 的事后 oracle，以及 `experiment-fixtures.js` 用来构造测试前置快照的场景 fixture 依赖中。oracle 在设想结束后运行，其结果没有流回选择、注意、Q、grounding 或 imagined patch。

## 3. 无注意与空记忆消融

**通过，且确实阻止答案。**

- 无注意：预算 4 只能覆盖最强的直接事件原子，无法组成完整 placement Q；返回 `attention_stop / no_complete_placement_q`，room 与 movement 都是 `null`，sky 不启动，imaginedState 等于输入公开状态。
- 空记忆：完整 Q 可以形成，但矩阵阶段没有候选；返回 `unknown / no_rule_for:placement_movement`，room 与 movement 都是 `null`，sky 不启动，imaginedState 等于输入公开状态。
- 仅保留 movement 记忆：movement grounding 虽形成临时 patch，但 room Q 无可接受规则，整体在 sky 和 placement commit 前停止；room 仍为 `null`，imaginedState 未改。这排除了主编排器在 room memory 缺失后补算房间答案。
- 仓库测试固定覆盖 A 的三种条件；我的独立运行时消融又对 B、C 重复了无注意与空记忆测试，结果相同，尤其状态 C 没有防空答案泄漏。

## 4. 下一玩家选择前停止、是否生成第二动作

**通过。**

当前三例在天空自动后果 `complete` 且仍有未放骰时，只把外层边界改为：

```text
status=choice
reason=next_player_decision
stoppedBeforeSecondAction=true
nextAction=null
```

主编排器只接收调用者已经选定的一个 `selectedAction`；没有候选枚举、第二骰排序、第二格选择或递归调用自身。A/B/C 的测试分别确认剩余骰为 2/4/2，且 engine oracle 的状态只包含第一动作。演示输出也只有一个 `selectedAction`，没有第二动作。

## 5. 公开/隐藏状态边界

**在本隔离实验声明范围内通过。**

- `toPublicState` 的输出键固定为 mapId、round、phase、energy、damage、researchIndex、excavatorIndex、mothershipRow、dice、ships、placements；没有 seed、rngState、history。
- 核心设想接收的是调用者提供的 `publicState` 与 `publicMap`，没有能力自行读取正式 engine state。使用的地图字段是公开棋盘事实：列、天空格可见效果、基地格/房间、modifier/energyCost、城市耐久等。
- observed state 在 placement 与天空两层都被复制并做不变性检查；三例 `observedWorldUnchanged=true`，且测试深比较输入未变。
- 测试 harness 为复现真实局面而用正式 engine 建前置快照，并在末尾用 engine 作 oracle；这是审计侧数据，不在核心设想依赖图内。
- trace 中保留 die/object ID、trajectory ID、sourceRuleId 作为调试审计信息。本实验没有把这些 trace 字段送进情绪、知识、归因或下一决策节点，因此尚未违反 signal→concept 边界；正式接入认知玩家时必须继续把该 trace 留在 raw audit 侧，而不能把内部 rule/entity ID 当成玩家语义知识。

## 最小问题与剩余风险

没有发现需要把 verdict 降为 `revise` 的当前功能缺陷。最小的非阻断问题是：placement memory 查询把 `topK` 设为全部 6 条轨迹，且没有 activation threshold；在当前两个固定 Q 中，正确规则族仍以精确五槽匹配进入候选，并由关系门唯一选中，所以本次结论不受影响，但“矩阵 Top-K”在这里主要承担规则族排序，而不是强选择门。若以后加入相近但不完全相同的 Q，建议冻结一个小于全集的 Top-K 或 activation threshold，并增加低相似度候选不得仅靠 relation metadata 获选的测试。

另一个边界风险是当前只覆盖三种灰骰、普通落点；白骰随机重投、箭头、母舰图标和撞城不在本次 accept 的外推范围内。`publicMap` 与 debug trace 也应在正式玩家 API 接线时显式分成 player-semantic input 与 raw audit output。

## 最终结论

**accept。** 就被冻结的 A/B/C 第一步而言，房间状态和防空下降已经从适配器直投影迁移到可审计的注意→严格五槽 Q→矩阵候选→关系门→受控 grounding→临时 patch 链路；无注意与空记忆均阻止答案，正式 engine 仅为事后 oracle，且执行在下一次玩家选择前停止、没有生成第二动作。接受范围不包含尚未验证的随机/特殊落点，也不代表已经接入正式认知玩家循环。

## Final recheck：Top-K 与激活阈值修复

- 复查日期：2026-08-22（Asia/Shanghai）
- 最终 verdict：**accept**
- V2 所列非阻断 Top-K 风险：**已关闭（在本实验冻结的 A/B/C 范围内）**

我重新检查了当前 `placement-rule-imagination.js` 与新增测试，并重新运行测试和演示：

```text
node --test .../ufs_first_action_imagination_v0/test-first-action-imagination.js
→ 8/8 PASS

node .../ufs_first_action_imagination_v0/run-demo.js
→ A/B/C 结果不变，均在 next_player_decision 停止且 nextAction=null
```

关闭证据：

1. `PlacementRuleImagination` 当前默认 `topK=3`，矩阵查询不再把 6 条轨迹全集全部交给关系门；我检查三例运行 trace，每个 placement Q 最多只有 3 个候选。
2. 当前默认 `activationThreshold=0.55`。候选先通过 activation 门，再允许执行 `relationCheck`；低于阈值的候选不会因为 room type/cell count 等 relation metadata 匹配而被接受。
3. trace 现在为每个候选记录 `aboveThreshold`。A/B/C 所需的精确五槽规则激活约为 1.0，越类候选约为 0.358 并明确记为 `aboveThreshold=false`。
4. 新增消融把 relation 正确的普通移动规则伪造为 activation=0.1；结果为 `unknown / no_rule_for:placement_movement`，movement 与 room 都保持 `null`，sky 不启动。因而关系 metadata 已不能绕过矩阵激活门生成答案。
5. 原有三场景、正式 engine 事后 oracle、无注意、空记忆、仅 movement memory 消融继续通过；此次修复没有重新引入 roomProjection、engine 答案旁路或第二动作。

因此，V2 指出的“查询全集且没有 activation threshold，低相似度规则可能仅凭 relation 获选”已经被针对性关闭，最终 verdict 保持 **accept**。该结论仍只覆盖冻结的 A/B/C；白骰随机、箭头、母舰、撞城及其他未验收房间类型仍沿用上文的非外推边界。
