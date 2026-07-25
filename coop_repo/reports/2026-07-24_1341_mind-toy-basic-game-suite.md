# Agent Handoff: MindToy 基础游戏测试集

- Date: 2026-07-24
- Agent/thread: Codex `/root`
- Scope: 调研最适合观察AI模型形成、逐次思路和有限估算的基础游戏
- Status: complete

## User Intent

寻找一组适合 MindToy 早期验证的基础游戏，重点观察 AI 自己形成了什么模型、如何提出一个思路并局部展开、以及如何从有限知识进行估算，而不是观察程序枚举多少可能。

## Completed

- 建立规则少、可复现、可调难度、状态可验证和思路操作可观察的筛选标准。
- 选择首批四个核心游戏：Guess、Light Up、Sokoban、Flood。
- 为每个核心游戏设计三档小规模问题和要观察的思路类型。
- 选择第二批压力测试：Black Box、Net、无猜测扫雷、Flip。
- 明确暂缓2048、Sudoku、棋类、复杂卡牌和三餐组合的原因。
- 规定真实Agent测试必须在求解前保存初始结构、逐个idea、按idea请求的estimate和idea评价原始输出。

## Files Changed

- `projects/western_fantasy_continent/design/MIND_TOY_GAME_TEST_SUITE_V0.md`: 新增中文测试游戏选择、难度阶梯和原始输出协议。
- `coop_repo/reports/2026-07-24_1341_mind-toy-basic-game-suite.md`: 本次调研记录。
- `coop_repo/LATEST.md`: 指向本报告。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- 规则核对来源均为游戏官方站点、作者文档或原始开源仓库。
- Simon Tatham谜题集提供规则、参数、种子与源代码，适合生成可复现小关卡。
- 本轮只完成测试集设计，没有实现游戏或运行真实Agent。

## Current State

第一批推荐顺序是 Guess A/B → Light Up A/B → Sokoban A/B → Flood A/B/C。它们依次隔离假设切分、约束压缩、空间Ordering和连续状态下的逐次策略思路。程序求解器只可用于事后裁判。

## Unresolved

- 尚未决定直接复用开源后端还是为小尺寸关卡编写最小规则引擎。
- 尚未实现 `proposeIdea → estimateForIdea → evaluateIdea` 的AI原始输出合同。
- 尚未验证真实Agent会不会用预训练解题套路替代现场模型形成。
- Guess与扫雷存在较强既有知识，测试时需要通过改名、换符号或只给有限规则降低记忆捷径。

## Recommended Next Step

先实现 Guess 的3色×2位和4色×3位两个极小规则引擎及原始AI合同，只运行真实 `buildMindStructure` 和第一至第三个 `idea`，暂不接 Decision 分数，也不让程序替Agent生成候选集合。

