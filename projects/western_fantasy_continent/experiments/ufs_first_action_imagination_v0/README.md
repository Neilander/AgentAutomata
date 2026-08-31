# UFS 第一步选择→连续一回合脑内设想 V0

这个隔离实验只做一件事：把上一轮 agent 已经选择的第一步送进脑内设想，自动后果想完以后，在“该玩家再次选择了”之前停止。

最初版本只做到第一步后停止；现在另有固定选择脚本，把同一条认知链连续推进完整一回合。策略选择仍不在本轮范围内。

## 连续一回合

`ufs-one-round-imagination.js` 现在可以在不调用正式结算引擎的前提下，按固定测试选择连续运行：

```text
固定放置5颗骰子
→ 每次动作先在完整161+项全场注意力中分配激活和有限预算
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

## 完整161+项概率注意已经接入

`ufs-full-attention-provider.js`把已有UFS全场注意合同接到Node连续设想：初始公开局面固定展开为161项，包括8条公共状态、5颗骰子、5架飞船、25个房间、30个基地格、80个天空格和8个母舰轨道行动图标。回合中新增放置、待生成飞船等公开对象后，空间会自然增长，本固定回合最高为166项。

每项都有至少`0.04`的背景激活，不相关项不会从注意空间中消失。当前动作只是在完整场上加权：所选骰子和目标格最高，目标房间、同列飞船和路径其次，其余房间、骰子、天空格仍保留非零被注意概率。默认注意等级`0.8`给出41项有限预算，以激活度平方为权重做可复现的无放回概率抽样。

放置、放置后的飞船下降/落点链，以及房间、挖掘、母舰、生成等事件都先经过这张完整注意场，再把真正被注意的状态投影成Q。同一次放置的天空链直接复用同一份161+项注意结果：飞船字段映射到全场飞船项，落点字段映射到全场天空格，城市字段映射到伤害轨道；母舰结算则必须注意到当前行及该行的行动图标。旧局部入口只保留在底层隔离函数中供历史单元测试使用，不是默认玩家路径。

固定种子69自然产生了一个错误推断：AI注意到`purple-0`，却漏掉它所在的`sky_cell:3:0`爆炸格，于是战斗机房错误输出`eligibleShipIds=[]`。紫机留在脑内第3行，后续母舰阶段继续沿错误世界运行，只生成白机。这次遗漏来自161+项概率分配，不是测试手动指定。

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

当前操作口为`place_die / submit_random_observation / resolve_room / choose_research_advance / excavate / skip_worker / end_rooms / choose_spawn`。每次完整试玩响应除了`availableOperations`名称，还公开一一对应的`operationContracts`，列明必填字段、固定ID、公开候选或数值上下界；Agent不需要查源码或旧协议来猜payload。研究房JSON程序先返回房间预算和连续研究格成本，玩家再提交`{"type":"choose_research_advance","roomId":"…","advanceSteps":1}`选择实际推进格数；即使最大推进为0，合同也会明确公开`roomId`和`advanceSteps: 0..0`。超过当前预算允许的最大格数会被原子拒绝。生成选择必须提交当前pending公开的候选：`{"type":"choose_spawn","shipId":"…","dropPointId":"DP-C3"}`。`node attention-player-cli.js help`会列出所有最小payload。错误阶段调用、缺参数、非法对象和非法生成点返回`rejected`，不会改变checkpoint。每次响应包含新的玩家脑内环境、pending边界、当前操作口、trace增量和纯JSON checkpoint；checkpoint可以跨进程恢复。正式引擎和旧固定fixture都不在会话核心依赖中。

房间阶段的`pending.candidates`会把当前对象分为`resolvableRoomIds / incompleteRoomIds / noOutputRoomIds / unrememberedRoomIds / excavationPlacementIds / unaffordableExcavationPlacementIds / obsoleteExcavationPlacementIds / skippablePlacementIds`。这不是替玩家选择，而是把棋盘上本来就公开的合法操作目标交给操作口：两格能源房只填一格会列入`incompleteRoomIds`，防空与普通通道会列入`noOutputRoomIds`；挖掘会公开`excavationEnergyCost=1`，0能源时只列入`unaffordableExcavationPlacementIds`，已经不在挖掘机前方的旧目标列入`obsoleteExcavationPlacementIds`。放置到未挖掘格时会经过已有`excavation_placement`五槽轨迹和JSON程序，第二个未挖掘放置或点数不足会原子拒绝；若历史checkpoint仍含多个挖掘位，结算一个后也不能用较浅目标把挖掘进度倒退。

长局试玩采用分段闸门：先玩到第3回合结束，停在`waiting_for_next_round_roll`，再运行`node audit-three-round-gate.js <试玩目录> 3`。它会检查机器记录连续性、命令退出码、负能源、挖掘候选冲突、安全暂停边界，并恢复host checkpoint复核真实状态；只有`stageGatePassed=true`才继续同一局。若玩家误越过闸门，可传入边界序号（例如`... <试玩目录> 3 41`）；审计器会只用该公开记录前缀从头确定性复放、逐响应比对并在内存中导出/恢复当时checkpoint，不把当前较晚状态冒充三回合状态。

V0会话内部为保证与旧控制器一致，会依据checkpoint从回合开头确定性复放已发生的操作，再推进新操作；对调用AI而言已经是严格的一步一环境接口，后续可再把内部优化为原地状态机，不改变外部合同。

策略Agent现在应使用`ufs-attention-player-session.js`，而不是直接读取宿主会话response。宿主
会话仍私下保存完整脑内世界、trace和checkpoint；玩家包装器在每个choice边界重新从完整
161+项注意场分配41项预算，只返回真正noticed的轨道、骰子、飞船、房间、基地格、天空格和母舰轨道行动图标。
玩家response不含checkpoint、完整地图或traceDelta，非法操作也不会重抽注意。公开`attention.seed`只回显本次episode实际采用的抽样seed，便于封卷实验审计。注意痕迹会随
玩家checkpoint保存并恢复，因此跨进程继续时仍保留两步短期粘连。

两个CLI现在采用双层输出。策略Agent读取的stdout、`current-player-view.json`和
`machine-transcript.jsonl`只保留实际可见的`observation / mapView`、选择边界、操作口及
`spaceItemCount / capacity / noticedCount / omittedCount / seed`注意摘要，不再重复输出
`noticedItems`和两步注意痕迹。完整的noticed项目与`traceBefore / traceAfter`仍逐步写入
state目录下私有的`attention-audit-transcript.jsonl`供宿主事后审计；封卷玩家不得读取该文件。
这只缩短Agent上下文，不改变161+项注意抽样、41项预算或短期粘连。

需要跨回合一直玩到胜负时，使用`full-game-attention-player-cli.js`。它在原有一回合认知链
抵达`new_round`后，不再把整局标为完成，而是公开一个`next_round_roll`随机边界；调用
`random`取得下一轮五颗真实骰子后，保留能源、伤害、研究、挖掘机、母舰、飞船和机器人，
清空上一轮工人并进入同一套注意→Q→轨迹→JSON程序流程。只有研究胜利、城市毁坏或母舰
抵达骷髅线才返回终局`complete`。短期注意痕迹在回合边界清空；策略Agent自己的规则知识、
目标和工作记忆由同一Agent跨回合保留。

母舰轨道的8个印刷行动图标现在也是独立注意项，并在noticed时进入`mapView.mothershipActions`。例如母舰抵达第6行后，`research_back:1`会通过注意→五槽Q→轨迹→JSON程序把研究从1降到0；这属于规则后果，不是跨回合丢档。结算后当前行图标会作为反馈焦点粘连到下一次观察，使玩家有机会看见数值变化的原因，同时仍保留概率漏看的可能。

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
完整公开游戏状态（初始161项，回合中动态增长）
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

飞船落点根据已注意到的公开 `tile.kind` 区分箭头、母舰下降格与城市；生成事件根据各列是否为空自动区分空列优先与最远投放点。若形成Q或执行轨迹时发现某个明确槽缺失，`information-gap-resolver.js`先查询知识：知识能给答案就直接使用，知识只给定位方式就只查看对应公开槽；没有定位知识时最多进行一次带目标、有限预算的状态探索。两次都失败则保存`unknown_information_v0`与困惑，跳过依赖该值的效果，但仍抵达下一次玩家决策，不再把信息缺失当成硬停止。真正未知事件仍返回`unknown`，随机和选择不会替玩家补结果。

天空流水线产生的困惑会合并进UFS脑内状态，并作为玩家已经知道的自我不确定性直接出现在下一次`observation.uncertainties`中；它不占用新一轮随机注意预算。同一槽后来被正常注意或定向查询成功时会从困惑列表移除。纵向下降不再只查数学终点：若`fromRow → intendedToRow`穿过城市行，移动先截到城市接触点，形成`landed_city`五槽Q并只结算一次伤害；随后由规则阅读生成的`city-contact`事件轨迹把该飞船送回母舰等待队列，因此不会再产生地图外`row17`落点。

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

## 反馈学习层（原7项 + 有效性闸门）

`ufs-feedback-learning.js` 现在承接玩家可见的实际反馈，但只写入认知结果，不保存独立的“候选价值分”。核心写入仍是：

```text
q当前 → q实际后续
```

当前实现包括：

- 正常正确后果不存在就创建，已存在则更新出现次数、支持度、最近时间、来源和可信度。
- 高激活旧轨迹预测错误时，不削弱或删除旧轨迹；必须带区分当前情况的上下文，另建更具体的新轨迹，并记录纠正对象和不匹配的五槽。
- 同一`q当前`可保留多个随机后续，分别统计总次数、近期权重、中心、常见范围、历史范围和近期偏移。
- 陌生内容先保留`q当前 → 查规则`出口；查到以后新增具体后果，通用查询出口不删除。
- 经常连续出现的两段轨迹会记录连续次数、粘连强度、自动化程度以及逐渐降低的注意/查规则成本。
- 漏看只会形成对应动作、阶段和上下文中的注意增量或关系扩展；接入现有161+项完整注意场后，其他状态仍保留原来的非零背景注意。
- 教程、查规则、单次经历、多次经历和玩家猜测分别记录来源，可信度随来源和重复验证更新。
- 只有“玩家可见 + 已提交或知识查询 + 系统完整性通过”的证据可以学习。非法操作、隐藏信息、未审计结果和已知系统bug进入隔离记录，不修改轨迹或注意力。

新轨迹只会短暂标为`pending_matrix_compile`：玩家会话在本步正式反馈形成后、返回下一选择前，立即把本步所有新增反馈批量送入仓库既有的离线`gte-multilingual-base`，生成与规则记忆一致的3840维float32起点/后继矩阵并写进私有checkpoint；成功后才用`markMatrixCompiled`改成`compiled_matrix`并重装当前内存。因此同一episode后面的选择已经能查询刚学到的行，`player-capture`只做最终完整性闸门和档案持久化，不再是首次编译点。若编码器失败，当前已结算的正式动作会保留，但下一动作会明确拒绝为`feedback_gte_compile_pending`，不能静默带着未编译学习继续。下一次跨进程恢复和下一episode都从该玩家checkpoint/档案加载个人矩阵。反馈桥以当前Q对应的已编译查询行做矩阵点积和Top-K，并把已学习的连续轨迹`chainingStrength`加入候选排序，再从玩家可见、正式审计过的预测账本重建机器可验证结果，签发`gte_feedback_trajectory`票据。旧档案可以用`ufs-player-cli.js compile-feedback`单独升级，不伪造episode，也不覆盖输入档案。

Node端现在除了已编译Q之间的Top-K，也支持在选择前把本次所有候选五槽Q一次性送进同一个本地`gte-multilingual-base`，得到真实查询向量后再检索个人矩阵；不会退回字符串近似或哈希向量冒充GTE。fresh初始化模板本身完全不带个人矩阵、个人轨迹或账本，因此不会产生个人反馈激活。当前离线编码器仍会为每次决策启动一次模型，正确性已接通，但长局性能仍需要常驻服务或内容寻址缓存。

`ufs-prechoice-planner.js`把这条记忆链提前到动作提交之前：从公开operation contract枚举候选，逐个克隆当前玩家认知checkpoint并运行到下一选择/随机/稳定边界，比较能源、研究、挖掘、伤害、母舰与终局差值；命中的个人GTE轨迹只有能从正式审计账本恢复出机器可验证后果时才修正候选分数。`full-game-attention-player-cli.js plan <state-dir>`是只读接口，返回可直接提交且附带预测票据的`recommendedPayload`，不会推进正式host或污染当前checkpoint。V22自动玩家入口已改为调用该规划器；旧`choose()`只保留为历史结果复现接口，不再用于新的`run()`。

历史控制器曾把标量track写成`{itemId:"track:energy", field:"energy"}`。票据读取器现在兼容这个冗余field并直接保留标量值；旧档案里已经审计成`undefined`的结果不会被猜测性修复，新产生的反馈会记录真实数值并可进入候选打分。

研究房零收益的测试案例现在明确要求行动前预测“能源减少、研究不前进”；正式结果可见且与票据匹配后才记录新轨迹。相同结果若事前没有预测，则不会创建学习记录。下次召回这个后果以后，原有成本—条件—收益判断自然会排除它；没有额外的`candidateValue=-3`之类分数。

完整试玩外层现已由正式规则引擎掌管真实状态、合法操作、随机边界、房间结算、母舰阶段和下一环境；认知核心仍不导入正式引擎，只并行产生玩家的脑内预测。`UfsFormalFeedbackOracle`保留历史名称，但在完整试玩中已经是权威游戏会话；`UfsFullGameFeedbackBridge`会在正式操作提交前，把脑内唤醒轨迹和策略Agent显式写下的0—3条预测编成`ufs_prediction_ticket_v1`。每张票据保存关注对象、预期变化、理由和稳定结算截止点；跨白骰、研究选择与生成选择时进入checkpoint继续等待。正式结果到达后，只核对玩家本步确实注意到的票据目标：完全匹配才确认，明确相反才纠正，没看到则保持未解决。没有行动前票据时，即使结果发生也不学习。

已验证完整会话中的四类路径：已有五槽轨迹被逐票验证后只强化对应连接；显式正确预测可以形成新后果轨迹；显式错误预测在玩家看到正式反例后形成纠正后果；没有预测或没有看到验证目标时保持不学习。研究进度4、房间预算2、下一需求4时，只有行动前写下“能源下降、研究不动”的票据，正式零推进结果才会进入反馈记忆，不产生候选价值分。

母舰下降格回归保留了一个自然认知错误：正式引擎收回新到达行上的4架飞机，脑内预测只移动母舰。现在权威host仍正确收回飞机，下一步合法操作和玩家环境继续来自正式状态；错误`imaginedWorld`只能作为行动前预测，不能污染棋盘。V1不再因为“本步一共有3条预测”就全部拒绝：目标互不重叠且被看见的票据可独立确认；两张错误票据争夺同一反馈目标时才标记`overlapping_prediction_tickets_make_mismatch_attribution_ambiguous`并保持不学习。

## 初始玩家生成器与学习隔离

`ufs-player-generator.js`把玩家拆成三层，不再用一个整局checkpoint同时表示“初始知识、个人学习和当前游戏”：

```text
冻结初始模板
├─ 第1—9页规则来源与AI生成五槽轨迹
├─ 当前GTE矩阵文件
├─ 统一JSON认知程序库
└─ 161+项注意策略

玩家个人档案
├─ 反馈新轨迹与连接强化
├─ 情境注意调整
├─ 预测历史账本
└─ 玩家ID、血缘、版本和episode历史

当前游戏checkpoint
├─ 正式棋盘与随机/选择边界
├─ 本局脑内状态
└─ 尚未到截止点的预测票据
```

冻结模板会对规则、五槽轨迹、GTE矩阵和程序库7份资产计算SHA-256总指纹；JSON资产先统一换行为LF，因此同一认知资产不会因Windows worktree的LF/CRLF组合而变成不同玩家模板。旧的原始字节指纹只有在能由当前完全相同资产的换行组合严格复现时才兼容，并在episode基线中归一到规范指纹；资产内容改变后旧玩家档案仍不会静默加载。`fresh`只复制冻结初始知识，个人学习为空；`continue`必须同时匹配玩家ID、模板指纹和档案revision；`fork`复制父玩家某一明确revision的个人学习，但之后双方各自更新。个人反馈矩阵随当前游戏checkpoint即时更新；每次`player-capture`只把已经编译完成的个人认知写回玩家档案，不把正式棋盘混入。有尚未完成的预测票据或无法编译的pending反馈时拒绝capture。capture后该state目录封存，同一玩家用更新后的档案在新目录开始下一episode。

```powershell
# 创建两个互不共享学习的新玩家
node ufs-player-cli.js fresh players/alice.json alice 20260830
node ufs-player-cli.js fresh players/bob.json bob 20260831

# alice开始一局；advance/random会校验并继续同一玩家
node full-game-attention-player-cli.js player-start runs/alice-001 players/alice.json
node full-game-attention-player-cli.js advance runs/alice-001 choice.json

# 成对实验可提交预先冻结的外部随机观测；CLI会严格校验边界类型、公开骰子ID和值域
node full-game-attention-player-cli.js random runs/alice-001 paired-random-observation.json

# 把本局学习写回alice并封存该局
node full-game-attention-player-cli.js player-capture runs/alice-001 players/alice.json

# 从alice当前学习快照创建独立对照玩家
node ufs-player-cli.js fork players/alice.json players/alice-control.json alice-control
```

## 跨操作认知单元

规划停止边界不再强制等于一次正式操作。`ufs_temporal_cognitive_unit_v1`把一个起始Q、2—4个有因果依赖的操作和一个完成后的followingQ绑定在一起；session在checkpoint中保存当前操作下标，下一次规划优先续接同一个单元。公开随机值仍是硬暂停边界，不会被认知分支编造。

当前先接通两类可审计单元：

- 多格房投资：第一颗骰子放入房间后，继续设想第二颗骰子；若这使房间完整且进入房间阶段，再继续到房间效果结算。
- 研究房结算：`resolve_room`支付能源后不立即停止，继续枚举合法`choose_research_advance`，因此同一个followingQ同时包含能源成本与研究收益。

复合预测票据保存在独立的pending队列里；中间操作即使已经到达普通稳定边界，也不会提前把Q截断。只有认知单元完成后才用起始belief和最终正式状态核验并写入学习。受控真实状态已验证“两颗骰子投入→能源房结算”三操作Q把能源2→4作为一个后果，“研究支付→推进2格”两操作Q把能源2→0、研究0→2作为一个后果。

## 显式经历记忆与双向来源查询

个人反馈现在不再只有不可逆的GTE行和文字`provenance`。每次通过“玩家可见、正式提交、系统完整性”闸门的结果都会先形成一条`ufs_explicit_transition_memory_v1`：保存独立`memoryId`、Q前、准确有序的`operations[]`、Q后、适用上下文、证据ID、episode/票据定位和它所支持的轨迹ID。相似的Q前—操作—Q后可以汇聚为同一`trajectoryId`，但每次具体经历仍保留独立memory；轨迹用`supportingMemoryIds[]`一对多指回所有事实来源。同一个`evidenceId`重复提交是幂等的，不能重复增加记忆或支持。

GTE仍是模糊索引而不是事实存储。新轨迹把`Q前 + 有序操作序列`联合编成current矩阵行，并把Q后编成paired following行；原始三个字段继续分别保存在显式记忆里。`PlayerFeedbackGteMemory.query()`支持`Q前 + operations[] → Q后 + trajectoryId + supportingMemoryIds`，`queryPair()`同时比较current/following矩阵，支持`Q前 + Q后 (+可选operations[]) → trajectoryId + supportingMemoryIds`。会话公开只读认知接口`predictLearnedTransition()`、`traceLearnedTransition()`和`recallExplicitMemory()`分别完成正向预测、成对来源追溯和按ID还原原始经历。顺序是轨迹身份的一部分，`[A,B]`与`[B,A]`不会互相召回。

旧玩家档案继续兼容：历史轨迹没有被伪造成从未保存过的显式经历，原`provenance`仍保留；只有本次升级后真实通过反馈闸门的经历获得memory记录。fresh模板指纹和初始化内容保持不变，空`memories`集合在会话启动时惰性建立；capture、checkpoint、continue和fork都随各自玩家私有学习状态保存它，不能跨玩家激活。

## 认知场多路线索激活原型

`ufs-cognitive-field-activation.js`提供尚未接入正式控制器的只读V0入口：同一个当前认知场可以同时携带`before`线索（当前状态、注意对象、约束）和`after`线索（需求、希望或担忧的结果）。每条线索分别用真实GTE查询轨迹起点或后继端，随后按`trajectoryId`汇合，并保留线索陈述、公开状态路径、知识条目ID、通道、activation和具体memory来源。`recallActivation`只表示回忆相关性，不是行动效用。

隔离实验`../ufs_cognitive_field_activation_v0/`把同一研究局面分别交给“完整研究规则”“只有研究胜利条件”“只有研究房方法”三种知识输入。完整知识产生当前研究房、研究目标、两步可执行性三类线索；只有胜利条件时不编造研究房用法；只有房间方法时不擅自把低研究解释为目标。真实`gte-multilingual-base`中，Q前房间线索以`0.888920`、Q后研究需求以`0.644991`命中同一条`[resolve_room, choose_research_advance]`轨迹，完整三路线索都追溯到`memory-00001`。这证明多路召回机制可行，但尚未证明AI线索总结的稳定准确率，也尚未接入正式多步规划。

## 文件

- `EXPERIMENT_PROTOCOL.md`：冻结范围、知识边界和通过条件。
- `selection-adapter.js`：上一轮自然语言选择→唯一结构化动作。
- `experiment-fixtures.js`：只为实验提供去除seed/history/rng的公开状态。
- `ufs-full-attention-provider.js`：完整161+项公开状态、动作加权、有限预算概率抽样和事件注意投影。
- `full_attention_bridge.py`：同一注意合同与原Python模块之间的调试/校验桥；连续Node运行时不启动子进程。
- `placement-rule-imagination.js`：从完整注意结果形成两个五槽Q，再进入规则矩阵、关系门和受控grounding；旧局部排序不在默认玩家路径。
- `rule_reading_trajectory_v0/`：第1—9页规则输入及现场缺口补边、26条严格轨迹、真实GTE矩阵、Node矩阵读取与连接加强overlay；当前一步实验装入6条放置相关轨迹。
- `../ufs_cognitive_program_library_v0/`：统一JSON小程序库、版本历史、受限解释器和隔离Agent盲开发提交；已取代当前5个预写grounding分支。
- `ufs-first-action-imagination.js`：将放置规则分支接到现有天空设想流水线，并设置选择停止边界。
- `ufs-event-rule-imagination.js`：20类普通游戏事件→注意→五槽Q→26轨迹矩阵→JSON程序的统一接线。
- `ufs-one-round-imagination.js`：应用脑内patch、管理随机/选择边界、推进房间和母舰阶段的一回合控制器。
- `ufs-one-round-session.js`：`start → advance`单操作会话、操作口校验、环境响应和JSON checkpoint恢复。
- `ufs-attention-player-session.js`：宿主完整状态与策略注意视图之间的强制边界；策略response不泄漏checkpoint或完整地图。
- `attention-player-cli.js`：封卷Agent逐步试玩入口；宿主checkpoint和完整注意审计留在state目录，标准输出只返回精简的注意裁剪玩家视图。
- `full-game-attention-player-cli.js`：跨回合逐步试玩入口；沿用同一精简玩家视图与私有完整注意审计合同。
- `ufs-feedback-learning.js`：反馈有效性闸门、五槽后果学习、多后续统计、区分性纠错、查询出口、轨迹粘连、来源可信度与情境注意修正。
- `ufs-transition-memory.js`：有序操作序列规范化、稳定序列身份，以及Q前与行为联合GTE查询Q的生成。
- `compile-player-feedback-gte.py`、`run-player-feedback-gte-compile.ps1`：用本地真实GTE把玩家新增反馈编成3840维起点/后继矩阵。
- `player-feedback-gte.js`：增量矩阵封装、档案完整性校验、正向current查询、current/following成对来源查询与玩家情境过滤。
- `ufs-cognitive-field-activation.js`：Q前/Q后多路线索的真实GTE查询、按轨迹汇合及逐线索来源解释。
- `ufs-prechoice-planner.js`：选择前候选枚举、隔离认知试演、短期效用比较和已审计个人GTE后果修正。
- `ufs-temporal-cognitive-unit.js`：从公开房间结构形成2—4操作因果单元，管理房间投资、研究续步、随机暂停和结果完成边界。
- `test-prechoice-planner.js`：规划不改live checkpoint、两/三操作Q持久续接与跨稳定边界学习、compiled feedback改变动作、CLI只读规划，以及标量track兼容回归。
- `test-cognitive-field-activation.js`：Q前单路召回、Q前/Q后汇合、记忆来源与无关线索不伪造候选回归。
- `test-ufs-feedback-learning.js`：原7项反馈需求、系统bug隔离、研究零收益区分轨迹和完整注意场接入回归。
- `ufs-formal-feedback-oracle.js`：认知核心之外的权威正式游戏会话；生成合法操作与下一环境，管理随机、研究和生成边界，并保存checkpoint。
- `ufs-full-game-feedback-bridge.js`：本步预测提取、正式结果可见性门、确认/纠错/注意更新和重复轨迹去重。
- `ufs-prediction-ticket.js`：行动前0—3条显式/自动预测票据、验证目标、跨边界截止和逐项配对。
- `test-prediction-ticket.js`：正确、错误、漏看、重叠歧义、随机延期、checkpoint与原子拒绝回归。
- `ufs-player-generator.js`：冻结初始模板指纹、独立玩家档案，以及fresh/continue/fork/capture接口。
- `ufs-player-cli.js`：创建、分叉、检查玩家档案，以及把旧学习档案编译为新revision；不覆盖输入或已有输出档案。
- `test-player-generator.js`：玩家间学习隔离、同玩家续玩、分叉独立、revision/模板闸门和真实CLI回归。
- `test-full-game-feedback-bridge.js`：完整会话连接强化、研究零收益、单一错误注意修正及多因果歧义拒绝。
- `compact-attention-response.js`：删除玩家视图中与`observation / mapView`重复的noticed清单和内部注意痕迹，保留决策事实与注意预算摘要。
- `one-round-fixture.js`：明确标注为非策略的5骰、房间顺序、生成选择与外部随机观察。
- `test-first-action-imagination.js`：三状态后果、停止边界、无注意/空记忆消融和引擎事后oracle。
- `test-event-rule-imagination.js`：20个端到端事件和6个安全/停止边界。
- `test-one-round-imagination.js`：完整回合oracle、认知链证据、随机停止和控制/轨迹分界。
- `test-one-round-session.js`：逐操作推进、随机门、研究推进选择、拒绝不变性、checkpoint恢复和依赖隔离。
- `test-attention-player-session.js`：41/161注意裁剪、可见值来源、短期粘连、私有checkpoint恢复和拒绝不重抽。
- `test-full-attention-integration.js`：161项构成、母舰轨道图标、非零周边背景、动作加权、概率抽样、全流程禁用局部注意和自然漏看错误。
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
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-ufs-feedback-learning.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-feedback-bridge.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-demo.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-one-round-demo.js
```

## 能说明什么

现在“主动选出的第一步”与“问题1—6脑内设想”之间有了可执行接线，而且默认入口已经是完整161+项概率注意。脑内的飞机、房间和母舰轨道预测仍必须经全场注意、AI读规则生成的 `q当前→q后续`、真实GTE矩阵唤醒、统一库中的AI生成JSON程序和受限解释器产生；但实际操作只提交给正式引擎，确定后果、合法操作和下一环境均以正式结果为准。重复确认可以增加连接support/observations而不复制矩阵行，具体反例可以形成带上下文的新轨迹。

本实验仍未接入正式 `player_agent_api_loop_v1`，但隔离完整试玩已完成正式世界与脑内世界的职责分离：正式引擎是唯一host，认知流程只是预测器，玩家只能读取正式状态经过概率注意后的观察。固定选择下可以完成整回合并进入下一回合，认知错误不能再修改真实棋盘。noticed对象仍会以轻量、快速衰减的方式影响后两步注意；这些参数是可审计的工程假设，不是经过人体实验标定的正确模型。下一步可以先跑3回合正式host闸门，再让策略Agent进行完整终局试玩。
