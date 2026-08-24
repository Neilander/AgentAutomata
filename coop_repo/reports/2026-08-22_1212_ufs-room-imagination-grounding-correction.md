# Agent Handoff: UFS房间结果改为脑内规则演算

- Date: 2026-08-22 12:12 +08:00
- Agent/thread: Codex `/root`；全新独立评审 `/root/ufs_room_imagination_reviewer`
- Scope: 修正第一步设想中由适配器直接计算房间状态的认知旁路
- Status: complete

## User Intent

用户指出 `automaticConsequences.roomProjection` 不符合脑内预想：预想结果也必须经过注意、Q、规则唤醒和脑内演算，不能由适配器直接读取公开地图后算出答案。用户不要求把结果写入长期记忆，只要求当前脑内过程来源正确。

## Correction To Previous Handoff

`2026-08-22_1124_ufs-first-action-imagination-choice-stop.md` 对飞机天空后果与“下一玩家选择停止”的描述仍有效，但其中房间状态由 `projectRoom()` 直接计算，不能作为“AI已经想到了房间后果”的证据。本报告在该点上明确取代上一份报告的认知能力声明；旧报告保留为历史记录，不覆盖。

## Completed

- 删除 `projectRoom()`、`roomProjection` 和适配器中的防空直接减一。
- 新增放置规则设想分支：当前动作建立公开注意原子，形成“同列移动”和“所在房间状态”两个严格五槽Q。
- 两个Q进入确定性五槽矩阵；默认只取Top-3且激活至少0.55，随后用当前已注意的房间类型与格数做关系门核对。
- grounding只能通过注意读取骰值、房间格占用、各格骰值、修正与能耗；移动量、房间完整性、缺失格、房间值和未结算状态都由被唤醒规则生成临时patch。
- 状态A通过 `multi_room_requires_all_spaces` 读取C4/C5后得出缺C4；状态B通过 `room_value` 得出战斗机值4；状态C通过 `aa_reduces_descent` 得出下降0，并通过 `aa_room` 得出无房间阶段产出。
- 主编排器只消费已提交的movement/room patch，再把movement量交给现有天空设想流水线；自动后果结束后仍在 `choice / next_player_decision` 停止且 `nextAction=null`。
- 新增三层认知消融：房间注意不足、全部放置规则记忆为空、只保留移动规则记忆；三者都不能由适配器补出房间答案。
- 新增低激活消融：即使关系元数据吻合，activation=0.1的候选也不能被执行。
- 全新独立评审未采用旧评审结论，最终 `accept`；其Top-K风险经修复和复查后关闭。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/placement-rule-imagination.js`: 新增注意原子、双五槽Q、Top-3/阈值、关系门、受控grounding和临时patch。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: 删除房间与防空直算，改为消费placement规则设想结果。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js`: 三场景、三层认知消融、低激活门和engine事后oracle，共8项。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-demo.js`: 输出规则来源、grounding读取和临时脑内结果，不再输出roomProjection。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/EXPERIMENT_PROTOCOL.md`: 冻结脑内演算来源与消融通过条件。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 更新当前真实链路，并标记旧评审已被用户审计取代。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/INDEPENDENT_REVIEW_V2.md`: 全新独立评审与Top-K修复后复查。
- `coop_repo/LATEST.md`: 增加本纠正入口。
- `coop_repo/REPORT_INDEX.md`: 增加本纠正报告。

## Validation

- 当前实验：`node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js` → 8/8 PASS。
- A/B/C演示：两个Q、最多Top-3候选、激活门、关系门和两个committed grounding可审计；三例均在下一玩家选择停止。
- 无注意：`attention_stop`，movement/room/sky均为空，observed state不变。
- 空记忆：`unknown`，movement/room/sky均为空，observed state不变。
- 只有移动记忆：movement可形成，但room为空，sky和placement均不提交；证明适配器不补算房间答案。
- 低激活候选：即使relation匹配，activation=0.1仍被拒绝。
- 现有天空设想流水线：10/10 PASS；Walkthrough合同4/4 PASS。
- 正式引擎仅用于测试末尾事后oracle，核心两个模块均无engine/fixture依赖。
- 全新独立评审V2与修复后复查：最终 `accept`。
- `player_agent_api_loop_v1`正式回归未运行；本实验没有修改或声称接入正式玩家API循环。

## Current State

第一步设想现在分为两条都受认知约束的并行链：

```text
已选放置
├─ 放置/房间注意 → 五槽Q → 规则矩阵 → 关系门 → grounding → movement与room临时patch
└─ movement patch → 天空注意 → 五槽Q → 规则矩阵 → grounding → 飞机与落点imaginedWorld
→ 下一玩家选择边界 → 停止
```

房间临时结果不是长期记忆；调用结束后由外层决定是否保留。重要变化是它不再由适配器直算，只有注意与规则链成功时才存在。

## Unresolved

- 当前只验收灰骰与普通天空终点；白骰随机、箭头、母舰图标和撞城不在接受范围。
- 当前房间轨迹覆盖多格房、单格能源/战斗机/研究、防空与通道合同；未验收未挖掘格、机器人和其他教程后规则。
- debug trace中的内部ID仍须留在raw audit侧，正式接入时不能直接成为玩家语义知识。
- 仍是隔离实验，尚未接入正式模拟玩家API循环。

## Recommended Next Step

保持“不生成第二动作”的边界，依次给第一步构造白骰、箭头、母舰和撞城四类真实状态；每类都要求注意/规则消融后结果消失，再用正式引擎只做事后oracle。
