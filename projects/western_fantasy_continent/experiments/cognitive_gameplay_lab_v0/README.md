# Cognitive Gameplay Lab V0

这是一个与正式玩家模拟隔离的认知玩家实验室。第一阶段只做到可审计 `ThoughtTrace` 和极小 Guess 游戏闭环，不计算 Decision 四特征、不接情绪、不修改正式 Runtime。

模块按门禁逐个实现：

```text
game-visible boundary
-> attention
-> game-memory retrieval
-> ActiveCognition
-> AI-built MindToy
-> sourced Estimate
-> proposeIdea
-> local attempt / evaluateIdea
-> ThoughtController
-> ThoughtTrace
-> Guess loop
```

当前门禁命令：

```powershell
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-foundation.js
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-active-cognition.js
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-mind-toy-estimate.js
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-idea-controller-trace.js
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-guess-loop.js
node projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/test-reviewed-ai-sample.js
```

真实 AI 与确定性测试替身的证据边界见 `AI_OUTPUT_REVIEW.md`。
