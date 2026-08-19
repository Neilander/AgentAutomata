# 隔离 Agent 参数化规则程序微型盲测 v0

## 定位与诚实边界

这是 2026-08-19 新建的、明确标注为**同构规则**的小实验。当前 worktree 没有可直接复用的原始盲编译资产；本实验没有从旧报告结果反向伪造原 UFS 实验原文，也没有修改正式玩家、正式玩家运行时或正式游戏代码。

实验让一个 `fork_turns=none` 编译子 Agent 只按公开合同、当前程序、每轮一条新公开规则和一个可见失败反例维护 `submission/submission.js`。评测负责人保管隐藏案例，并在收到每轮提交后才把该轮隐藏案例落盘。

隔离是**行为隔离，不是 OS 级隔离**。多 Agent 接口没有子 Agent 文件系统 allowlist 或系统调用审计，因此不能独立证明编译者从未越界读取；可以审计的是提示边界、允许文件、落盘顺序、路径型回复、提交哈希和运行时状态读取。详情见 `audit/compiler_boundary.json`。

## 三轮公开规则

1. 基础：同列对象按事件参数移动。
2. 简单增量例外：冻结对象不移动。
3. 复杂增量规则：对过滤后整组求最小 `city_distance`，保留所有并列最小对象，并维持输入顺序。

规则全文和唯一可见反例在 `public_bundle/`。这些材料是实验自建同构规则，不冒充缺失的原实验规则。

## 盲测顺序

- 第0轮提交后才创建3个基础隐藏案例。
- 第1轮先确认第0轮在冻结反例上失败，再公开冻结规则和一个反例；提交后才创建3个新隐藏案例，并回归第0轮。
- 第2轮先确认第1轮在相对选择反例上失败，再公开整组规则和一个反例；提交后才创建4个新隐藏案例，并回归前两轮。
- 每轮源码快照与 SHA-256 在 `submission_history/` 和 `audit/submission_provenance.json`。

## 可复跑入口

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File projects/western_fantasy_continent/experiments/blind_rule_program_micro_v0/run-local.ps1
```

也可直接运行最终累计验证：

```powershell
node projects/western_fantasy_continent/experiments/blind_rule_program_micro_v0/run_validation.js --round 2 --output projects/western_fantasy_continent/experiments/blind_rule_program_micro_v0/artifacts/validation.json
```

## 验证合同

- 参数与对象数量：列名、移动量、行号、0/多对象、混合列和多对象并列均与可见反例不同。
- 新规则隐藏案例：各轮提交只在提交后接触该轮新建的隐藏文件。
- 旧规则零退化：最终累计运行前两轮全部隐藏案例。
- 输入不变：输入由递归 Proxy 包装，任何属性写入、删除或数组原地修改都会被拒绝，并复核运行前后副本。
- 禁止隐藏字段和越权状态读取：隐藏陷阱键读取会抛错；未知键枚举会被拒绝；每条实际读取路径写入机器结果并与公开字段 allowlist 对照。
- 禁止外部能力：提交在无 `require`、无 `process` 的 `vm` 上下文加载，并先经过静态禁止项扫描。
- 补丁可追溯：每轮 `SOURCE_RULE_IDS`、`REVISION`、完整源码快照和哈希均被冻结。

## 当前产物

- `artifacts/validation.json`：最终机器可读累计结果与逐案例读取轨迹。
- `artifacts/round_0_validation.json`、`round_1_validation.json`：历史提交在当轮累计集合上的结果。
- `artifacts/old_version_failures.json`：两轮增量前的旧版真实失败。
- `audit/compiler_boundary.json`：编译者提示/文件边界与隔离限制。
- `audit/submission_provenance.json`：提交来源和哈希。

最终累计集含10个隐藏案例。该规模只足以证明本次小实验的局部行为，不能外推为真实 UFS 规则理解率，也不能把行为隔离描述成安全沙箱。
