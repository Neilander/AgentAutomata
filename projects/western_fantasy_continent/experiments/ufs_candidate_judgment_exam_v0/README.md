# UFS 候选成本—条件—收益判断实验 V0

本实验验证：只拥有第1—9页规则知识的答题者，能否把通用知识绑定到当前公开状态，逐项判断候选动作并主动选择下一步。

## 阅读顺序

- [`EXPERIMENT_PROTOCOL.md`](EXPERIMENT_PROTOCOL.md)：知识边界、输入和隔离条件。
- [`EXAM.md`](EXAM.md)：6个受控候选判断场景。
- [`EVALUATION_RUBRIC.md`](EVALUATION_RUBRIC.md)：在答题前冻结的评分标准。
- [`submissions/agent_01.md`](submissions/agent_01.md)：隔离答题者的完整答卷。
- [`REVIEW.md`](REVIEW.md)：主 Agent 阅卷结论、发现和未验证边界。

## 一句话结果

答题者在六个场景中依次选择能源、研究、防空、战斗机、能源、研究，能够随当前瓶颈改变选择；本次证明自然语言 Agent 可以完成知识到候选判断的绑定，但尚未证明现有代码已经实现该桥接层。

