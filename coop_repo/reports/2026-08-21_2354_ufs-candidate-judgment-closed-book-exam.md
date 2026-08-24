# Agent Handoff: UFS候选判断闭卷实验

- Date: 2026-08-21 23:54 +08:00
- Agent/thread: Codex `/root`；隔离答题子任务 `ufs_candidate_exam_agent_01`
- Scope: 规则知识到当前候选成本—条件—收益判断的最小验证
- Status: complete

## User Intent

保留已有“读规则生成知识”模块，由主 Agent 独立出题；让隔离子 Agent只使用现有知识，在多个场景中先列知识依据，再判断各选择成本、条件、收益、当前宏观需要、排除项与最终选择。答题者只写答卷并回复完成路径，主 Agent之后再阅卷。

## Completed

- 确认项目已有第1—9页规则知识：`rule_knowledge_reader_v0/stages/01` 至 `05`，无需重新读规则书。
- 冻结知识边界、六场景试卷和答题前评分标准；评分标准对答题者不可见。
- 六场景分别控制初期能源瓶颈、能源接近上限、立即失败、防空/战斗机条件激活、明显占优/劣势、最终研究兑现。
- 隔离答题者只读取允许知识和试卷，将完整答案写入 `submissions/agent_01.md`，对话中只回复完成路径。
- 主 Agent按冻结标准独立阅卷，结论为 `accept`；选择序列为能源、研究、防空、战斗机、能源、研究。
- 记录两处试卷改进：场景2利用自由结算顺序可使能源房实际补2而非只补1；场景4“还能承受2点”措辞应改为明确第2点即失败。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/EXPERIMENT_PROTOCOL.md`: 知识、输入、隔离和作答边界。
- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/EXAM.md`: 六个受控候选判断场景。
- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/EVALUATION_RUBRIC.md`: 答题前冻结的期待与评审标准。
- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/submissions/agent_01.md`: 隔离答题者完整答卷。
- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/REVIEW.md`: 独立阅卷、边界与下一步。
- `projects/western_fantasy_continent/experiments/ufs_candidate_judgment_exam_v0/README.md`: 实验导航与一句话结果。
- `coop_repo/LATEST.md`: 增加本实验入口。
- `coop_repo/REPORT_INDEX.md`: 增加本交接报告。

## Validation

- 沟通隔离：子 Agent最终消息只有“已写完：答卷路径”，没有直接返回答案。
- 知识来源审计：答卷42个唯一反引号标识全部来自五份允许知识或试卷候选ID，来源不明为0。
- 越界扫描：未发现第10页后内容、引擎、规划器、旧策略或胜率知识。
- 冻结标准阅卷：6/6核心选择符合预先期待，通用检查全部PASS，独立结论 `accept`。
- 可执行玩家回归：未运行；本次只新增实验文档和答卷，没有修改可执行认知循环，也不声称循环已经实现该桥接层。
- `git diff --check`: PASS；只有工作区既有的 LF/CRLF 提示，没有空白错误。

## Current State

本实验支持一个有限结论：当候选和公开状态已经给定时，自然语言 Agent能把现有规则知识实例化为生效条件、基础/状态成本、直接收益、后续用途、瓶颈匹配和排除理由，并随局面翻转选择。

它尚未证明代码可以自动生成动作判断卡、从界面发现候选、通过注意读取必要状态或连续主动决策。

## Unresolved

- 动作判断卡仍由答题者自然语言现场形成，尚未成为代码合同。
- 试卷直接给出候选和落点后果，候选发现、落点计算与注意门控未测试。
- 只有一个答题者，尚未测试多种风险/阅读倾向。
- 没有动作执行、反馈学习、observedWorld / imaginedWorld接线。

## Recommended Next Step

将答卷使用的字段固化为机器可检查的 `candidate_judgment_card_v0`，先让已有规则知识自动填充条件、成本、结果、后续用途和目标关系；复跑同一六题后，再依次撤掉“直接给落点”和“直接给候选”的脚手架。
