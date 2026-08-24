# 1—6 玩家设想流水线 v0

这是一个不接正式玩家的隔离接线实验。它把此前分别验证的六个问题压缩成一个可运行的单候选动作设想单元：

```text
候选动作
→ 动作模式实例化
→ 有限注意力场
→ 注意结果拆成多个五槽 Q
→ 矩阵激活 Top-K 轨迹
→ 激活后关系核对
→ 当前对象与参数绑定
→ imaginedWorld 封闭 preview
→ 连续设想或明确停止
```

输入是一项已经提出的候选动作；输出是一份设想结果与完整审计轨迹。它不负责第7项“主动提出和比较多个候选”，也不负责第8项“实际反馈后修改轨迹、动作模式或注意力”。

## 本次新增的薄接线

1. `instantiateActionPattern → buildAttentionField`：动作入口与空间展开转成注意力请求。
2. `attentionToInitialQueries`：只把预算内完整注意到的对象拆成一个或多个严格五槽 Q。
3. `MatrixTrajectoryMemory → relationCheck → previewTrajectoryProgram`：矩阵激活负责联想候选，结构关系门排除“经过箭头/停在箭头”等高相似矛盾，再交给参数化程序。
4. `previewTrajectoryProgram → ImaginationAttentionAccount`：preview 只在复制世界提交；自动后果形成新假设 Q 并继续，随机、选择、未知、完成、注意力不足明确停止。

## 复用和替代边界

- `D:\GithubDesktop\AgentAutomata\logs\fb2` 本身是外层仓库的正式Git worktree，分支为 `codex/player-feedback-v2-trial`。外层主worktree忽略 `logs`，不影响 `fb2` 通过自己的 `.git` 指针跟踪内部文件。
- 本实验位于另一个临时detached worktree `C:\Users\WYZ\.codex\worktrees\a73e\AgentAutomata`，是合同级微型接线；旧Python/GTE模块应继续以 `fb2` 为唯一模拟玩家工作树来源，不应重复迁移。
- 参数绑定复用已完成隔离 Agent 盲测的 `../blind_rule_program_micro_v0/submission/submission.js`。
- 五槽激活使用真实的预编译矩阵接口，但编码器是确定性测试编码器；`MatrixTrajectoryMemory` 的 encoder 端口可替换为旧实验的真实 GTE 适配器。
- `trajectory-fixtures.js` 是带规则来源引用的已编译同构轨迹，代表“教程规则编译器的输出”，不是原 UFS 教程原文。
- 所有状态和规则都是同构微案例；结果证明接线合同能闭合，不证明完整 UFS 或正式玩家已经接入。

## 注意力安全

- 注意力场先选择公开状态原子。
- 参数程序只收到已经注意到的对象子集。
- 每个实际读取路径必须存在于本次注意结果；否则抛出 `AttentionAccessError` 并转为 `attention_stop`。
- `observedWorld` 永不修改；只有控制器允许提交的 patch 才进入 `imaginedWorld`。

## 当前验证场景

- 完整链：放骰 → 同列非冻结飞船下降 → 箭头横移 → 城市受伤 → `complete`。
- 普通格明确完成，不凭空继续。
- 随机格输出 `random`。
- 选择格输出 `choice`。
- 陌生格输出 `unknown`。
- 感知预算不足时，不读取未注意事实并输出 `attention_stop`。
- 设想注意力不足时，尚未想到的状态 patch 不提交。
- 箭头自循环由重复查询保护停止。
- 空记忆不展开世界。

## 运行

从仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File projects/western_fantasy_continent/experiments/imagination_pipeline_v0/run-local.ps1
node projects/western_fantasy_continent/experiments/imagination_pipeline_v0/run-demo.js
```

`run-local.ps1` 会执行所有 JavaScript 语法检查、Node 测试和七个场景的机器可读验证，并把结果写入 `artifacts/validation.json`。任何中间 Node 命令失败都会让 PowerShell 入口以失败退出，不会被后续命令掩盖。

## 可交互 Walkthrough

`walkthrough/index.html` 是这条问题 1—6 拼接的基础审计网页。它把完整箭头城市案例拆成十个可前后点击的步骤，逐步显示：

- 六段拼接总流程；
- 当前步骤输入与产出；
- `observedWorld` / `imaginedWorld` 棋盘对照；
- 五槽 Q、矩阵激活、关系拒绝、受控读取与世界补丁；
- 连续设想的停止边界；
- 可展开的原始 JSON。

页面数据由 `walkthrough/build-walkthrough-data.js` 直接运行当前流水线生成，不另写一套演示逻辑。页面可以离线直接打开；详细用法与扩展边界见 `walkthrough/README.md`。
