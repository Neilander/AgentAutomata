# UFS 隔离Agent自主一回合实验 v0

## 结论

隔离子Agent完成了一回合：5次自主放骰、2次真实随机暂停/恢复、房间顺序与支付/跳过、一次挖掘、结束房间阶段、母舰自动后果，以及一个真实的二选一生成平局。运行结果为`complete`，没有`attention_stop`、`unknown`或非法动作。

子Agent的历史判断卡仍是本实验的选择来源，不代表已经有通用策略模型；但控制方式已升级为真实逐choice会话。driver先`start`，每次只提交一个`advance(operation)`，收到新的脑内环境和下一操作口以后才提交下一张判断卡。两次白骰都必须停在`random`并另行提交外部观察，生成平局也必须另行调用`choose_spawn`。

## 隔离边界

- `run-autonomous-round.js`不导入正式引擎、`scenario-fixtures`或`one-round-fixture.js`。
- 初始输入是去掉`seed/rngState/history`的公开状态快照。
- 两次白骰重投都先停在随机边界，再使用`external_random_observations.json`中的外部公开观察恢复；认知运行时不生成随机值。
- 自动后果沿用当前完整153+项概率注意、短期注意粘连、五槽Q、真实GTE矩阵和JSON认知程序。
- `audit-formal-oracle.js`是实验完成后的独立审计，才导入正式引擎；它不向认知路径返回答案。
- 没有读取或导入旧固定回合答案；本回合选择与`one-round-fixture.js`不同。

## 实验路径

1. `public_initial_state.json`：真实公开初始局面。
2. `JUDGMENT_CARDS.md`：P1—P5、R1—R5、S1逐choice判断卡。
3. `agent_decisions.json`：判断卡对应的逐步操作输入。
4. `external_random_observations.json`：两次外部随机观察。
5. `run-autonomous-round.js`：逐次调用`start/advance`、无正式引擎依赖的在线会话driver。
6. `machine-trace.json`：完整注意/Q/GTE/JSON程序trace与摘要。
7. `audit-formal-oracle.js`：实验后的合法性与最终状态oracle审计。
8. `test-autonomous-round.js`：隔离、注意、随机、生成选择和oracle测试。

## 实际选择摘要

| 边界 | 选择 | 简要理由 |
|---|---|---|
| P1 | 灰4→C5能源半房 | 不触发重投，先锁能源组合 |
| P2 | 灰3→C4能源半房 | 完成值4能源房 |
| P3 | 白5→C1战斗机 | 能源已锁；保留值4射击选项并把重投缩到两骰 |
| O1 | 外部观察：灰2→3、白1→5 | 随机不由玩家生成 |
| P4 | 新白5→路径2/C3 | 支付1能后挖两格；最后一骰独自重投 |
| O2 | 外部观察：灰3→4 | 随机不由玩家生成 |
| P5 | 新灰4→C2 AA | 安全收尾，避免研究支出和箭头变化 |
| R1 | 结算能源房 | 能源2→6 |
| R2 | 跳过战斗机 | 没有爆炸格目标，不付1能买零收益 |
| R3 | 挖掘 | 能源6→5，挖掘0→2 |
| R4/R5 | 跳过AA并结束 | 无更多正收益房间 |
| S1 | 白船生成C1 | C1/C3并列最远，公开按低编号破平局 |

最终脑内状态：新回合边界，能源5、伤害0、研究0、挖掘2、母舰H0；白船生成到C1。选择合理性自评为“可解释、偏保守但不保证最优”：前两步的能源组合与挖掘链清楚；P3的战斗机最后没有目标，是保留选项未兑现；P5放弃了可支付研究，是明显可争论的策略取舍。

## 运行

```powershell
node projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/run-autonomous-round.js --write
node --test projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/test-autonomous-round.js
node projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/audit-formal-oracle.js
```

## 当前脚手架与风险

- 操作层已经逐步化，不再一次提交完整选择表；13次操作依次得到新环境，其中两次是独立的随机观察提交。
- 判断器仍是冻结的11张子Agent判断卡，而不是每步现场调用通用AI策略。现在已经有了可供下一位AI实时调用的接口，但尚未把模型回调嵌入driver。
- 会话V0内部会从checkpoint确定性复放历史再推进一步，外部合同是真逐步的；后续可以优化成原地状态机。
- 候选发现目前是判断卡中的规则推导与聚类，不是一个新的通用合法候选生成器。
- 本次注意种子没有导致漏掉阻断行动的关键项；这只是一条样本路径。
- oracle完全一致是事后审计结果，不是认知目标，也不证明策略最优。
