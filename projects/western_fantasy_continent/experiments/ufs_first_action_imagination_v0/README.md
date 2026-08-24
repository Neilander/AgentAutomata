# UFS 第一步选择→单步脑内设想 V0

这个隔离实验只做一件事：把上一轮 agent 已经选择的第一步送进脑内设想，自动后果想完以后，在“该玩家再次选择了”之前停止。

它不是“在假想世界里继续选择第二步”的实验。

## 当前链路

```text
上一轮答卷的 SELECTION
→ 结构化 place_die
→ observedWorld 复制为 imaginedWorld
→ 骰子占格
→ 放置动作形成“同列移动Q + 所在房间Q”
→ 从规则阅读冻结产物加载 q当前→q后续（不再由本文件手写轨迹）
→ 真实GTE预编译矩阵Top-3且激活≥0.55，再做关系核对
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
→ 查询25条真实GTE轨迹矩阵
→ 关系门确认能源房语境
→ 唤醒规则来源并选择 energy-room-resolution JSON程序
→ 形成临时脑内能源patch
```

飞船落点根据公开 `tile.kind` 自动区分箭头、母舰下降格与城市；生成事件根据各列是否为空自动区分空列优先与最远投放点。未知事件返回 `unknown`，注意不足返回 `attention_stop`，随机和选择不会替玩家补结果。

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
- `placement-rule-imagination.js`：放置注意、两个五槽Q、规则矩阵、关系门和受控grounding。
- `rule_reading_trajectory_v0/`：第1—9页24条规则输入、AI生成的25条严格轨迹、真实GTE矩阵、Node矩阵读取与连接加强overlay；当前一步实验装入5条放置相关轨迹。
- `../ufs_cognitive_program_library_v0/`：统一JSON小程序库、版本历史、受限解释器和隔离Agent盲开发提交；已取代当前5个预写grounding分支。
- `ufs-first-action-imagination.js`：将放置规则分支接到现有天空设想流水线，并设置选择停止边界。
- `ufs-event-rule-imagination.js`：20类普通游戏事件→注意→五槽Q→25轨迹矩阵→JSON程序的统一接线。
- `test-first-action-imagination.js`：三状态后果、停止边界、无注意/空记忆消融和引擎事后oracle。
- `test-event-rule-imagination.js`：20个端到端事件和6个安全/停止边界。
- `run-demo.js`：输出三条简明机器轨迹。
- `INDEPENDENT_REVIEW.md`：旧直投影版本的历史评审，已被用户审计推翻，不再代表当前实现。
- `INDEPENDENT_REVIEW_V2.md`：针对当前注意→Q→规则grounding版本的全新独立评审与最终复查。

## 运行

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-event-rule-imagination.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-demo.js
```

## 能说明什么

现在“主动选出的第一步”与“问题1—6脑内设想”之间有了可执行接线。飞机与房间结果都必须经注意、AI读规则生成的 `q当前→q后续`、真实GTE矩阵唤醒、统一库中的AI生成JSON程序和受限解释器产生；确定的自动后果继续，新的主动决策不替玩家生成。重复确认可以增加连接support/observations而不复制矩阵行，但反馈自动调用尚未接入。

本实验仍是隔离认知接线，没有接入正式 `player_agent_api_loop_v1` 的连续多步执行与真实反馈循环；但白骰随机重投、母舰图标、箭头、撞城、房间/挖掘/研究/母舰/生成/终局的事件→Q→轨迹→程序链路已经分别验证。
