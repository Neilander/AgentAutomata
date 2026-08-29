# UFS 受注意限制现场试玩 V5：实验协议

- 日期：2026-08-24
- Attempt 上限：1（唯一 Attempt）
- 固定 attention seed：`2026082451`
- 玩家入口：`attention-player-cli.js` 的公开 `start / advance / random` 命令
- 注意预算：CLI 返回的 41 / 153+ 裁剪视图

## 隔离边界

本实验在执行前只读取：UFS 第1—9页公开规则阅读知识与策略总结、`ufs_first_action_imagination_v0/README.md` 的公开 CLI 合同、`attention-player-cli.js` 命令帮助，以及协作要求指定的最新接口修复报告。没有读取 V1/V2/V3/V4 的 views、choices、thought logs、transcripts 或私有 state；没有读取 formal engine、scenario fixtures、one-round fixtures、测试答案、会话实现源码或 host checkpoint。

私有宿主状态只写入本目录的 `.private-host-state/`，由本目录 `.gitignore` 排除。Agent 绝不打开、搜索、列举或解释其中内容。

## 唯一 Attempt 与时序

1. `start` 前先建立 `capture-cli.ps1`、`raw-stdout/` 命名约定与本协议。
2. 每条命令先有独立 choice 文件（`start`/`random` 没有玩家 choice），再经捕获器执行。
3. 捕获器将 CLI stdout 以 UTF-8 无 BOM 原样写入指定 `raw-stdout/NN-*.json`，并将 stderr 和 exit code 分开保存；决策只能在 stdout 已落盘后读取该响应。
4. `start` 仅执行一次；没有重开、换 seed 或复放路线。
5. 只有响应为 `random` 时调用 `random`；只有响应列出的 operation 才能提交；`unknown / attention_stop / complete` 后立即封卷，不再发命令。
6. 任何 operation 参数只引用当前 view 中 noticed 的对象，或玩家此前真实动作的工作记忆；未出现对象保持未知，不能视为空或不存在。

## 每步决策记录

每个 choice 边界记录：

- `noticed`
- `explicitUnknowns`
- `macroNeed`
- 当前可见合法候选的成本 / 条件 / 收益
- 至少一个真正改变选择的反事实
- `finalOperation`
- `workingMemoryAfter`

玩家可以规则理解错误、漏看并产生错误推断；不得借助隐藏状态纠正。遇到房间操作自行在 `resolve / excavate / skip / end` 中选择。真实出现 `choose_research_advance` 时，必须依据当前可见 budget / costs 选择合法 `advanceSteps` 并调用，然后继续到下一回合或 terminal 边界。

## 固定 seed 注入

捕获器在启动 CLI 子进程前同时设置公开实验约定的 `UFS_ATTENTION_SEED=2026082451` 与 `ATTENTION_SEED=2026082451`。若 CLI 响应公开回显采用的 seed，则以回显核验；若不回显，则只声明命令环境已固定，不把未可见的宿主实现当成已验证事实。

## 验收

合同测试必须检查：start 逐字捕获、单一 Attempt、operation/response 严格交替、choice 参数来自 noticed 或真实工作记忆、random 与 choice 合法、terminal 后无命令、私有 state 未泄漏到实验产物。

## 实际封卷边界

唯一 Attempt 在序号 23 收到 `status=complete`、`reason=one_round_imagined_to_next_round_boundary`、`phase=new_round`、`pending=null` 和空 `availableOperations` 后立即封卷。此后只整理公共捕获和运行合同检查，没有再次调用 CLI。

`choose_spawn` 的公开 README 与 CLI help 只列出操作名，没有给参数签名。到达真实 spawn pending 后，九次仅改变字段名且始终提交当前 noticed 候选 `DP-C3` 的请求被原子拒绝；每次响应均证明 `actionCount=12`、pending 和候选未变。允许的公开操作合同随后明确字段为 `dropPointId`，同一策略选择成功推进。拒绝序列属于同一 Attempt 的接口编码修正，不是重开或路线重试，并在逐字响应、choice 与 thought log 中完整保留。
