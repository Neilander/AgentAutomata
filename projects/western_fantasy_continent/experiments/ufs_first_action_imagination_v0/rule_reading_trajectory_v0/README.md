# UFS 规则阅读生成轨迹 → 真实第一步设想 V0

本目录把“规则由谁写进轨迹记忆”从上一版的运行时代码手写，改成一个独立、冻结、可审计的规则阅读产物。

## 输入边界

当前初始库读取首局规则认知第1—5阶段（规则书第1—9页）。生成轨迹时不读取场景 A/B/C、Agent 选择答案或正式引擎。初始轨迹允许不完整，后续可以随新规则和可见反馈补边、修边或降低支持度。

- `source_rules.json`：从既有分段规则认知中冻结的24条规则句及来源位置。
- `ai_compiled_trajectories.json`：AI规则阅读阶段生成的25条严格 `q当前 → q后续`。
- `compiled-trajectory-loader.js`：JS侧校验来源、严格五槽、重复ID和禁止补数字；当前只把与第一步有关的5条轨迹装入放置实验。
- `compile_gte_matrix.py`：复用既有 `RuleTrajectoryCompiler` 做正式结构编译，再用本地真实GTE构建激活矩阵。
- `artifacts/initial_rule_memory.json`：可恢复的25条五槽轨迹记忆。
- `artifacts/initial_rule_memory.json.vectors.npz`：已编译的current、following与coarse矩阵缓存。
- `artifacts/node_gte_matrix_manifest.json`、`*.f32`：Node一步设想直接读取的真实GTE行清单与原始矩阵。
- `artifacts/gte_matrix_validation.json`：矩阵形状、输入哈希和激活烟测。
- `precompiled-gte-memory.js`：Node端真实GTE矩阵点积、Top-K查询和连接加强overlay。

25条初始轨迹覆盖：目标与胜负、普通同列下降、防空修正、白骰重投、挖掘放置与执行、多格/单格房、箭头、母舰下降格、撞城、能源成本、能源/战斗机/研究房、研究顺序、母舰阶段、行行动、飞船生成优先级和最终研究门槛。

## 运行链路

```text
第1—9页规则认知
→ AI生成并冻结 current Q → following Q
→ 既有编译器校验来源、五槽与禁止补值
→ 真实GTE把current/following编码成矩阵
→ 真实场景只加载冻结轨迹
→ 放置注意形成 current Q
→ 矩阵提出候选 + 关系门确认
→ following Q 被唤醒
→ 既有grounding绑定当前骰子、房间、格子与飞机
→ imaginedWorld形成一步后果
→ 下一次玩家选择边界停止
```

`placement-rule-imagination.js` 不再内嵌 `PLACEMENT_TRAJECTORIES` 的手写对象列表，也不再默认建立确定性测试矩阵。它直接读取预编译真实GTE current矩阵做点积。原有5个预写grounding分支也已删除，改为从 `ufs_cognitive_program_library_v0` 选择隔离Agent只读规则生成的JSON程序，再由受限解释器执行。

## GTE矩阵

- current矩阵：`25 × 3840`
- following矩阵：`25 × 3840`
- coarse粗筛矩阵：`25 × 768`
- 严格原始头找回：25/25
- 五条自然语言改写查询：5/5把正确轨迹放入候选集，最低正确最佳激活约0.776

矩阵只做一次矩阵乘法提出Top-K候选。挖掘候选/执行、母舰移动/行行动等相近规则可以同时激活，之后仍必须用当前注意到的事实做关系门与grounding。

## 当前真实场景结果

真实 A/B/C 三局面均通过：

- A：灰4放入多格能源房C5；唤醒普通下降与多格完整性轨迹，想到同列船下降4、C4仍缺失、房间不完整。
- B：灰5放入单格战斗机房；唤醒普通下降与单格房间值轨迹，想到同列船下降5、房间值4且等待房间阶段。
- C：灰1放入防空房；唤醒两条防空轨迹，想到下降量0且防空房没有房间阶段产出。

三例都满足 `choice / next_player_decision`、`nextAction=null`，且 observedWorld 不变。正式引擎只在测试末尾做事后对照。

## 连接如何迭代

每条记忆同时保存：

- `support`：这条连接累计得到多少支持；
- `observations`：它被确认过多少次。

再次验证同一条 `current→following` 时不增加矩阵行，只增加这两个字段。语义相似度保持不变；支持度用于让同样相似的候选连接更可信。新增Q或修改五槽文字时才需要重新GTE编码和编译矩阵。

Node端 `reinforce(edgeId)` 与 `exportLearningOverlay()` 已验证该合同；自动根据游戏反馈调用它属于后续问题8，目前没有假装接好。

## 诚实边界

- 这是由当前 Codex 完成的一次冻结AI阅读产物，不是另一个隔离模型的盲生成稳定性评测。
- 当前Node端直接读取真实GTE预编译矩阵；对于本实验固定形成的两类放置Q，可直接复用清单中的GTE查询向量。任意新措辞Q的Node在线编码尚未接入，当前由Python真实GTE烟测覆盖。
- 目前真正进入一步运行的是5条放置相关轨迹；其余20条已生成、正式编译和GTE激活，但仍需在对应阶段的真实场景中逐条接线。
- 这25条是首局初始记忆，不声称覆盖所有隐含组合、例外或玩家后来从反馈学到的轨迹。

## 验证

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js
node projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-demo.js
& projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/rule_reading_trajectory_v0/run-gte-compile.ps1
```

当前：一步实验10/10通过；上游设想流水线10/10回归通过；真实GTE矩阵编译与激活烟测通过。
