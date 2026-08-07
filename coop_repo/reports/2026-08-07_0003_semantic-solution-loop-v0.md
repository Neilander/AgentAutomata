# Agent Handoff：多维感知找解闭环 V0

- Date: 2026-08-07
- Agent/thread: Codex `/root`
- Scope: `logs/fb2` 隔离worktree中的语义召回、MindToy、R/EVerify价值学习闭环
- Status: partial

## User Intent

验证多维感知空间是否真的能模拟玩家“产生模糊需求→快速找到少数候选→有限比较→实战学习”的过程，并说明后来引入的“强大”价值概念是否已与MindToy找解链路连通；不满足预期时分析并调整。

## Completed

- 新增隔离闭环：真实失败结果形成4类低精度需求，768维能力空间从16支可用队伍召回8支，需求匹配与价值共同激活3支，旧MindToy多价值排行榜选择并真实战斗。
- 复用普通感知信息筛选、假设定向注意、结构化因果事件和旧EVerify matcher；不是用胜负直接伪造因果确认。
- 使用5支不在原六环境训练中的敌队和50队×5敌队×12隐藏种子，共3000场判卷。
- 实现不学习、持续R、R＋EVerify三方消融，以及随机、职业关键词、纯语义、静态需求＋历史价值基线。
- 修正两个结构问题：价值不能在需求之前单独砍候选；玩家记忆必须在同一敌人的后续案例持续存在。
- 修正概念传播：概念是切分方向，按已知队伍30—90百分位相对激活传播，不再要求队伍坐标贴近概念向量点。
- 区分认知信心与结果波动，避免稳定五五开被当成“完全不知道”。
- 未修改正式玩家Agent。

## Files Changed

- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/build-semantic-inputs.py`：冻结4类需求、6个概念和50队能力坐标。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/build-unseen-validation.js`：生成五敌队3000场隐藏判卷。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/value-field.js`：R局部锚点、概念相对方向传播、认知信心与结果波动。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/run-closed-loop.js`：124案例、七种方法、真实MindToy与EVerify闭环。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/test-results.js`：边界和预算断言。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/README.md`：中文机制与验证边界。
- `projects/western_fantasy_continent/experiments/semantic_solution_loop_v0/RESULTS.md`：中文结果、失败和严格结论。

## Validation

- `run-local.ps1`：PASS；GTE离线输入、3000场隐藏判卷、124案例七方法和结构断言完成。
- 纯语义首选隐藏胜率0.8575，随机0.4402，人工职业关键词0.3569。
- 静态需求＋旧历史胜率0.9207，高于完整闭环0.8992。
- 持续R相对同一MindToy不学习提高0.0565；7.26%案例更好、2.42%更差。
- 完整R＋EVerify与R-only严格同分；15确认、6证伪、112不可结论，概念推广未证明收益。
- 最大语义召回8、最大MindToy候选3，隐藏真值不参与选择。

## Current State

“模糊需求作为方向，在多维空间快速找候选”获得明确开发证据；持续记住具体队伍R获得小幅正证据。EVerify概念锚点已正确按相对方向进入选择，但当前真实案例中只改变2.42%首选且没有隐藏胜率收益，不能判定完整闭环通过。

## Unresolved

- 第一轮查看隐藏分布后修改过可用队伍协议，最终不是严格封存盲测。
- 93/124需求为生存，任务方向不充分。
- 多支队伍对五环境全胜，静态泛用声誉过强。
- EVerify 112/133不可结论，真实因果学习过稀。
- 假设模板由代码按职业预设，不是玩家AI自主构建。
- 旧MindToy在此只提供有限比较与审计，没有独立优于静态排序。

## Recommended Next Step

先冻结一个无跨环境万能队、包含明确机制取舍的新测试集，并在揭晓隐藏种子前写死协议；同时提高真实EVerify结算率。之后重跑不学习/R-only/R＋EVerify三方盲测，只有EVerify稳定优于R-only才接正式玩家Agent。
