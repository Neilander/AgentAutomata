# Agent Handoff: UFS真实状态候选发现与判断实验

- Date: 2026-08-22 02:01 +08:00
- Agent/thread: Codex `/root`；隔离答题子任务 `ufs_real_state_exam_agent_01`
- Scope: 从真实公开游戏状态自行发现候选、计算落点并锁定下一次放置
- Status: complete

## User Intent

把上一轮“候选卡已经给好”的判断实验推进到更真实的实际游戏场景：给 agent 真实地图状态和几颗骰子，让它只依据先前读规则形成的知识，自己判断现在能做什么、各动作会发生什么、当前需要什么，以及下一步选择什么。

## Completed

- 使用用户核对过的 Roswell A+B、威胁0地图和正式规则状态机，以 seed 1 构造三个可复现的真实决策点。
- 撤掉候选列表和落点结果；答题者只看到文字化公开地图、骰子、轨道、占列、飞机和已形成房间。
- 在答题前冻结协议、试卷和隐藏评分标准；隔离答题者禁止读取引擎、地图源码、旧策略、旧答卷和第10页后规则。
- 隔离答题者自行处理26、81、27个引擎合法动作，按开放列、挖掘距离和房间结构归组，并写出候选判断卡。
- 答题者最终选择灰4→C5能源半房、灰5→C1战斗机、灰1→C3防空；主 Agent用正式状态机复放，三次均合法且即时预测精确一致。
- 独立评审结论为 `accept`。状态A选择与隐藏参考倾向不同，但规则合法、代价和后续用途自洽，不以命中参考答案作为通过条件。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/scenario-fixtures.js`: 三个正式引擎状态夹具。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/test-scenario-fixtures.js`: 公开状态与合法动作数量自检。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/EXPERIMENT_PROTOCOL.md`: 知识、输入、隔离和作答边界。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/PUBLIC_MAP_AND_STATES.md`: 文字化真实地图和三个公开状态。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/EXAM.md`: 候选发现、后果计算与判断试卷。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/EVALUATION_RUBRIC.md`: 答题前冻结的隐藏事实基线与评审边界。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/submissions/agent_01.md`: 隔离答题者原始答卷。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/test-agent-01-selection-replay.js`: 最终三次选择的引擎复放断言。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/REVIEW.md`: 独立阅卷、通过理由和未证明边界。
- `projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/README.md`: 实验入口与摘要。
- `coop_repo/LATEST.md`: 增加本实验入口。
- `coop_repo/REPORT_INDEX.md`: 增加本交接报告。

## Validation

- 状态夹具：`node projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/test-scenario-fixtures.js` → PASS，3个状态；A/C合法动作数分别为26/27，B在试卷基线中为81。
- 选择复放：`node projects/western_fantasy_continent/experiments/ufs_real_state_candidate_exam_v0/test-agent-01-selection-replay.js` → PASS，三次选择全合法，下降量4/5/0与答卷一致。
- 沟通隔离：答题者完成后只回复答卷路径，没有在对话消息中泄露答案。
- 知识来源审计：答卷反引号中的23个规则/事实/行为ID全部来自允许的五份知识；其余是C1—C5、行列和答题输出格式等局面标识。
- 越界扫描：未发现引擎、状态夹具、隐藏评分表、上一轮答卷或第10页后规则引用；“没有未来骰信息”是答题者主动保留不确定性的边界声明。
- 可执行玩家回归：未运行；本次新增隔离实验、夹具和审计测试，没有修改正式认知循环，也不声称已完成接线。
- `git diff --check`: PASS；只有工作区既有文件的LF/CRLF提示，没有空白错误。没有覆盖其他未提交研究和walkthrough改动。

## Current State

本实验支持一个更进一步但仍有限的结论：现有第1—9页规则知识不仅能在给定候选时填判断卡，也能让自然语言 agent 从文字化真实游戏状态自行发现合法候选、计算直接后果、识别当前宏观瓶颈并锁定一个可执行的下一步。

状态A没有照隐藏参考路线走，说明实验没有把“猜中出题者答案”偷换成能力；但本实验也不比较长期胜率，因此只判定该选择合理可审计，不判定为全局最优。

## Unresolved

- 公开棋盘仍被整理成文字，不是由注意力模块从网页视觉状态中读取。
- 只验证单次下一放置，没有执行一整回合的连续主动决策。
- 判断卡仍是自然语言产物，尚未固化为运行时代码合同。
- 只有一个答题者、三个局面，未覆盖不同风险偏好和长期胜率。
- 没有 observedWorld / imaginedWorld 接线和反馈学习。

## Recommended Next Step

让同一隔离玩家连续完成一个真实回合：主 Agent每次只执行它刚锁定的动作并返回新的公开状态；白骰重投只在实际发生后揭示。要求玩家每一步重新发现候选、更新宏观需要和主动提出下一步，直到骰子阶段结束，再检查房间结算顺序。
