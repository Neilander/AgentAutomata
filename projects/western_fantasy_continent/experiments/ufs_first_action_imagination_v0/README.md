# UFS 第一步选择→连续一回合脑内设想 V0

这个隔离实验只做一件事：把上一轮 agent 已经选择的第一步送进脑内设想，自动后果想完以后，在“该玩家再次选择了”之前停止。

最初版本只做到第一步后停止；现在另有固定选择脚本，把同一条认知链连续推进完整一回合。策略选择仍不在本轮范围内。

## 连续一回合

`ufs-one-round-imagination.js` 现在可以在不调用正式结算引擎的前提下，按固定测试选择连续运行：

```text
固定放置5颗骰子
→ 每次动作先在完整153+项全场注意力中分配激活和有限预算
→ 被注意到的部分形成五槽Q→真实GTE轨迹→JSON程序→脑内后果
→ 白骰重投在 random 边界停止，由外部可见结果恢复
→ 全部放完进入房间阶段
→ 能源房支付与结算
→ 战斗机房支付与结算
→ 挖掘、跳过未结算研究骰
→ 母舰下降、失败线检查、所在行行动
→ 紫色飞船空列优先生成
→ 白色飞船最远投放点生成
→ 停在下一回合开始边界
```

这不是策略器：5个放置、房间顺序、支付、跳过和并列生成选择都来自 `one-round-fixture.js` 的固定脚本。随机值来自 `ROUND_ONE_RANDOM_OBSERVATIONS`，没有提供时系统在白骰重投处返回 `random`，不会自己编点数。

全注意控制组的最终脑内状态为：能源5、伤害0、研究0、挖掘机2、母舰第0行、阶段`new_round`。房间阶段使用的是放骰时经Q与JSON程序产生的房间patch，不由回合控制器重新计算房间值。认知核心从不导入正式引擎；测试文件只在全注意控制组结束后用正式引擎做接线对照。“与引擎一致”不是概率注意模拟玩家的目标。

骰子全放完后的阶段切换、跳过工人、结束房间属于控制流程，不冒充读规则生成的轨迹；trace中明确标为`trajectoryDriven: false`。当前“击毁紫机后物理棋子回到母舰队列”由世界状态reducer解释对象生命周期，尚不是一条独立五槽轨迹。

## 完整153+项概率注意已经接入

`ufs-full-attention-provider.js`把已有UFS全场注意合同接到Node连续设想：初始公开局面固定展开为153项，包括8条公共状态、5颗骰子、5架飞船、25个房间、30个基地格和80个天空格。回合中新增放置、待生成飞船等公开对象后，空间会自然增长，本固定回合最高为158项。

每项都有至少`0.04`的背景激活，不相关项不会从注意空间中消失。当前动作只是在完整场上加权：所选骰子和目标格最高，目标房间、同列飞船和路径其次，其余房间、骰子、天空格仍保留非零被注意概率。默认注意等级`0.8`给出41项有限预算，以激活度平方为权重做可复现的无放回概率抽样。

放置、放置后的飞船下降/落点链，以及房间、挖掘、母舰、生成等事件都先经过这张完整注意场，再把真正被注意的状态投影成Q。同一次放置的天空链直接复用同一份153+项注意结果：飞船字段映射到全场飞船项，落点字段映射到全场天空格，城市字段映射到伤害轨道；不再二次运行微型Top-N。旧局部入口只保留在底层隔离函数中供历史单元测试使用，不是默认玩家路径。

固定种子65自然产生了一个错误推断：AI注意到`purple-0`，却漏掉它所在的`sky_cell:3:0`爆炸格，于是战斗机房错误输出`eligibleShipIds=[]`。紫机留在脑内第3行，后续母舰阶段继续沿错误世界运行，只生成白机。这次遗漏来自153+项概率分配，不是测试手动指定。

原有`eventPerception`定点漏看仍保留为下游错误传播的精确回归口，但默认玩家已经使用全局概率注意。

## 跨步骤短期注意痕迹

完整注意提供器现在会把本步真正noticed的项目留下轻量短期痕迹，而不是下一步完全重新开始。痕迹只改变下一步的注意概率，不直接把对象塞进Q，也不保证它必然再次被看到。

- 本步项目的基础激活乘`0.18`，作为下一步的残留加成。
- 若没有继续成为高相关焦点，残留每步只保留`35%`，最多影响后两步。
- 例如激活`0.95`的旧目标，下一步残留`+0.171`，再下一步约`+0.060`。
- 新动作直接目标仍约为`0.95`，明显高于旧焦点约`0.21`的总激活，因此新事件可以抢走注意。
- 随机注意到的背景项只留下约`+0.0072`，不会让整张背景长期粘住。
- 每次新的单步/回合episode都会清空短期痕迹，重复使用同一运行器不会把上局焦点带进下局。

trace为每个全场项目公开`baseActivation`、`carryoverActivation`和最终`activation`，同时记录`attentionTraceBefore/After`，可以逐步检查粘连来源。100个固定注意种子的对照中，有痕迹和无痕迹都为100/100完成回合、0次卡死；两组各有2次自然漏看战斗机目标关系，说明这组轻量参数没有把当前固定回合变成过强的强制关注。

## 逐choice暂停/恢复会话

`ufs-one-round-session.js`把原先一次接收完整脚本的控制器包装成真正的单操作会话。调用方先`start`，之后每次只能调用当前返回的一个操作口；程序执行该动作和所有确定自动后果，在下一个玩家选择、外部随机、未知或回合完成处再次停下。

```js
const session = new UfsOneRoundSession({ publicMap });
let step = session.start({ initialPublicState });
step = session.advance({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c5" });
// step.observation 是新的脑内环境；step.availableOperations 再次为 ["place_die"]
// 只有 step.status === "random" 时，才按 step.pending.dieIds 提交外部观察：
if (step.status === "random") {
  step = session.advance({ type: "submit_random_observation", values: externallyObservedValues });
}
```

当前操作口为`place_die / submit_random_observation / resolve_room / choose_research_advance / excavate / skip_worker / end_rooms / choose_spawn`。研究房JSON程序先返回房间预算和连续研究格成本，玩家再用`choose_research_advance(roomId, advanceSteps)`选择实际推进格数；超过当前预算允许的最大格数会被原子拒绝。错误阶段调用、缺参数、非法对象和非法生成点返回`rejected`，不会改变checkpoint。每次响应包含新的玩家脑内环境、pending边界、当前操作口、trace增量和纯JSON checkpoint；checkpoint可以跨进程恢复。正式引擎和旧固定fixture都不在会话核心依赖中。

V0会话内部为保证与旧控制器一致，会依据checkpoint从回合开头确定性复放已发生的操作，再推进新操作；对调用AI而言已经是严格的一步一环境接口，后续可再把内部优化为原地状态机，不改变外部合同。

策略Agent现在应使用`ufs-attention-player-session.js`，而不是直接读取宿主会话response。宿主
会话仍私下保存完整脑内世界、trace和checkpoint；玩家包装器在每个choice边界重新从完整
153+项注意场分配41项预算，只返回真正noticed的轨道、骰子、飞船、房间、基地格和天空格。
玩家response不含checkpoint、完整地图或traceDelta，非法操作也不会重抽注意。注意痕迹会随
玩家checkpoint保存并恢复，因此跨进程继续时仍保留两步短期粘连。

```js
const player = new UfsAttentionPlayerSession({ publicMap });
let view = player.start({ initialPublicState });
// view.observation / view.mapView 只包含本步真正noticed的项目
view = player.advance({ type: "place_die", dieId, cellId });
// 完整宿主状态只能由承载程序调用player.inspectHostState()，不应交给策略Agent
```

现场试玩暴露的普通通道缺口也已补齐：通道放置现在会唤醒
`read-rule-tunnel-placement-to-no-room-output`，经`tunnel-room-no-output-v1`形成“保持占位、
无普通房间产出”的临时房间状态，再继续飞船后果和下一choice；不再返回
`unknown: no_rule_for:placement_room_state`。

## 当前链路

```text
完整公开游戏状态（初始153项，回合中动态增长）
→ 当前动作提高相关项激活，所有周边项保留背景激活
→ 有限预算概率抽样出本步真正注意到的状态
→ 上一轮答卷的 SELECTION
→ 结构化 place_die
→ observedWorld 复制为 imaginedWorld
→ 骰子占格
→ 放置动作形成“同列移动Q + 所在房间Q”
→ 从规则阅读冻结产物加载 q当前→q后续（不再由本文件手写轨迹）
→ 真实GTE预编译矩阵Top-6且激活≥0.55，再做关系核对
→ 唤醒后续五槽Q
→ 从统一认知小程序库选择隔离Agent生成的JSON程序
→ 受限JSON解释器从已注意事实演算下降量与房间状态
→ 同列飞机下降 / 落点后果
→ choice: next_player_decision
→ nextAction = null
```

## 其余20类事件自动接线

`ufs-event-rule-imagination.js` 沿用同一套注意→五槽Q→真实GTE矩阵→关系门→JSON程序链路，现已覆盖白骰、最终落点、房间结算、挖掘、研究、母舰、生成与胜负事件。调用方提供的是普通游戏事件和公开结构化局面，不再直接提供 `qKind` 或 `sourceRuleId`。

例如：

```text
room_resolution + stage=effect + room.type=energy
→ 自动判断 qKind=energy_room_resolution
→ 从局面投影房间值、玩家能源和上限到注意区
→ 形成五槽Q
→ 查询26条真实GTE轨迹矩阵
→ 关系门确认能源房语境
→ 唤醒规则来源并选择 energy-room-resolution JSON程序
→ 形成临时脑内能源patch
```

飞船落点根据已注意到的公开 `tile.kind` 区分箭头、母舰下降格与城市；生成事件根据各列是否为空自动区分空列优先与最远投放点。轨迹程序所需事实缺失时返回`attention_stop`；如果移动已经想完、只是下一落点类型没被注意，则记录`unnoticed_endpoint_effect_omitted_from_imagination`并允许遗漏效果继续传播。真正未知事件仍返回`unknown`，随机和选择不会替玩家补结果。

这里没有 `roomProjection` 直算捷径。以状态A为例，“能源房缺C4”来自 `multi_room_requires_all_spaces` 被五槽Q唤醒后，grounding读取C4/C5占用情况产生的临时脑内结果。没有房间注意或没有规则记忆时，这个结果不会出现。

## 三个真实结果

| 状态 | 已选第一步 | 脑内自动结果 | 停止点 |
|---|---|---|---|
| A | 灰4→`A-r2-c5` | C5紫船H0→H4；能源房只占C5，尚不完整、不产能 | 下一颗骰子由玩家选择 |
| B | 灰5→`A-r2-c1` | C1紫船H0→H5；战斗机房值4、耗能1，等待房间阶段 | 下一颗骰子由玩家选择 |
| C | 灰1→`A-r1-c3` | 防空后实际下降0；C3紫船仍在H4；防空无房间产出 | 下一颗骰子由玩家选择 |

三个结果都满足：

- `status = choice`
- `reason = next_player_decision`
- `stoppedBeforeSecondAction = true`
- `nextAction = null`
- 真实公开状态没有被修改。

## 文件

- `EXPERIMENT_PROTOCOL.md`：冻结范围、知识边界和通过条件。
- `selection-adapter.js`：上一轮自然语言选择→唯一结构化动作。
- `experiment-fixtures.js`：只为实验提供去除seed/history/rng的公开状态。
- `ufs-full-attention-provider.js`：完整153+项公开状态、动作加权、有限预算概率抽样和事件注意投影。
- `full_attention_bridge.py`：同一注意合同与原Python模块之间的调试/校验桥；连续Node运行时不启动子进程。
- `placement-rule-imagination.js`：从完整注意结果形成两个五槽Q，再进入规则矩阵、关系门和受控grounding；旧局部排序不在默认玩家路径。
- `rule_reading_trajectory_v0/`：第1—9页规则输入及现场缺口补边、26条严格轨迹、真实GTE矩阵、Node矩阵读取与连接加强overlay；当前一步实验装入6条放置相关轨迹。
- `../ufs_cognitive_program_library_v0/`：统一JSON小程序库、版本历史、受限解释器和隔离Agent盲开发提交；已取代当前5个预写grounding分支。
- `ufs-first-action-imagination.js`：将放置规则分支接到现有天空设想流水线，并设置选择停止边界。
- `ufs-event-rule-imagination.js`：20类普通游戏事件→注意→五槽Q→26轨迹矩阵→JSON程序的统一接线。
- `ufs-one-round-imagination.js`：应用脑内patch、管理随机/选择边界、推进房间和母舰阶段的一回合控制器。
- `ufs-one-round-session.js`：`start → advance`单操作会话、操作口校验、环境响应和JSON checkpoint恢复。
- `ufs-attention-player-session.js`：宿主完整状态与策略注意视图之间的强制边界；策略response不泄漏checkpoint或完整地图。
- `attention-player-cli.js`：封卷Agent逐步试玩入口；宿主checkpoint留在state目录，标准输出只返回注意裁剪后的玩家视图。
- `one-round-fixture.js`：明确标注为非策略的5骰、房间顺序、生成选择与外部随机观察。
- `test-first-action-imagination.js`：三状态后果、停止边界、无注意/空记忆消融和引擎事后oracle。
- `test-event-rule-imagination.js`：20个端到端事件和6个安全/停止边界。
- `test-one-round-imagination.js`：完整回合oracle、认知链证据、随机停止和控制/轨迹分界。
- `test-one-round-session.js`：逐操作推进、随机门、研究推进选择、拒绝不变性、checkpoint恢复和依赖隔离。
- `test-attention-player-session.js`：41/153注意裁剪、可见值来源、短期粘连、私有checkpoint恢复和拒绝不重抽。
- `test-full-attention-integration.js`：153项构成、非零周边背景、动作加权、概率抽样、全流程禁用局部注意和自然漏看错误。
- `run-demo.js`：输出三条简明机器轨迹。
- `run-one-round-demo.js`：输出完整一回合的简明步骤与最终脑内状态。
- `INDEPENDENT_REVIEW.md`：旧直投影版本的历史评审，已被用户审计推翻，不再代表当前实现。
- `INDEPENDENT_REVIEW_V2.md`：针对当前注意→Q→规则grounding版本的全新独立评审与最终复查。

## 运行

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-event-rule-imagination.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-imagination.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-session.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-attention-player-session.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-attention-integration.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-demo.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-one-round-demo.js
```

## 能说明什么

现在“主动选出的第一步”与“问题1—6脑内设想”之间有了可执行接线，而且默认入口已经是完整153+项概率注意。飞机与房间结果都必须经全场注意、AI读规则生成的 `q当前→q后续`、真实GTE矩阵唤醒、统一库中的AI生成JSON程序和受限解释器产生；确定的自动后果继续，新的主动决策不替玩家生成。重复确认可以增加连接support/observations而不复制矩阵行，但反馈自动调用尚未接入。

本实验仍是隔离认知接线，没有接入正式 `player_agent_api_loop_v1` 的真实反馈循环；但固定选择下已经从5次放骰连续设想到下一回合边界，noticed对象也会以轻量、快速衰减的方式影响后两步注意。当前参数是可审计的工程假设，不是经过人体实验标定的正确模型。下一步若进入策略，不应修改这个后果控制器，而应把固定脚本替换成每个`choice`边界上的候选判断模块。
