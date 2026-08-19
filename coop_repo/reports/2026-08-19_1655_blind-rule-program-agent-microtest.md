# Agent Handoff: 隔离 Agent 参数化规则程序微型盲测 v0

- Date: 2026-08-19
- Agent/thread: `/root/blind_rule_program_test`（评测负责人）＋`/root/blind_rule_program_test/isolated_compiler`（`fork_turns=none` 编译者）
- Scope: 只在新隔离目录验证基础规则、冻结例外与整组相对选择的逐轮盲编译；不接正式玩家
- Status: complete（小规模行为隔离盲测）

## User Intent

实际执行一次小规模但具体的参数化规则程序盲测。编译子 Agent 每轮只能看到公开合同、当前程序、一条新公开规则和一个可见失败反例；评测方保管 oracle/隐藏案例，并在收到提交后才落盘隐藏案例。验证参数泛化、复杂整组规则、旧规则零退化、preview 输入隔离、隐藏字段/越权读取拒绝和补丁来源追溯，同时诚实说明隔离强度。

## Completed

- 新建 `blind_rule_program_micro_v0`，明确将三条规则标为自建同构规则，没有冒充缺失的 UFS 原实验原文。
- 启动一个 `fork_turns=none` 编译子 Agent；其三轮正式回复都只有 submission 绝对路径。
- 第0轮只公开基础同列参数移动规则；提交后生成3个隐藏案例。
- 第1轮先实际确认第0轮在冻结反例上失败，再只公开冻结规则和一个可见失败反例；提交后生成3个新隐藏案例并回归旧集。
- 第2轮先实际确认第1轮在“整组最小距离、并列全保留”反例上失败，再只公开这一条规则和一个可见失败反例；提交后生成4个新隐藏案例并回归全部旧集。
- 冻结每轮完整 submission 快照、规则来源元数据和 SHA-256；最终文件与第2轮快照哈希一致。
- 实现可复跑 Node.js 验证器：先静态拒绝外部导入/动态执行/反射等模式，再在无 `require`、无 `process` 的 `vm` 上下文加载 submission。
- 用递归 Proxy 记录每次公开状态读取；隐藏陷阱键读取、未知键枚举、属性写入与删除都会失败，并对读取路径做公开字段 allowlist 校验。
- 保存中文 README、公开 bundle、submission、历史提交、隐藏集、运行入口、逐轮结果、旧版失败记录和编译边界审计。
- 正式玩家、正式玩家运行时、正式游戏代码均未改动。

## Files Changed

- `projects/western_fantasy_continent/experiments/blind_rule_program_micro_v0/public_bundle/`: 公开合同与三轮规则/唯一可见反例。
- `.../submission/submission.js`: 编译子 Agent 的最终提交。
- `.../submission_history/`: 三轮完整提交快照。
- `.../hidden_cases/`: 每轮提交后才落盘的3＋3＋4个隐藏案例。
- `.../run_validation.js`: 安全加载、状态读取审计、输入隔离、逐轮累计评测入口。
- `.../run-local.ps1`: 三轮一键复跑入口。
- `.../artifacts/validation.json`: 最终10例机器可读累计结果与逐案例读取轨迹。
- `.../artifacts/round_0_validation.json`、`round_1_validation.json`: 历史提交在当轮累计集合上的结果。
- `.../artifacts/old_version_failures.json`: 第1、2轮修订前旧版的真实失败。
- `.../audit/compiler_boundary.json`: 提示/文件边界、材料顺序与行为隔离限制。
- `.../audit/submission_provenance.json`: 每轮提交哈希和最终一致性。
- `.../audit/preflight_python_submission.py`: 没有正式隐藏案例时因本机缺 Python 而废弃的语言运行时预检提交；不计入正式三轮。
- `.../README.md`: 中文方法、边界、复跑方式与产物说明。
- `coop_repo/reports/2026-08-19_1655_blind-rule-program-agent-microtest.md`: 本交接报告。
- `coop_repo/LATEST.md`: 增加本盲测入口并更新当前重点。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- 运行：`powershell -ExecutionPolicy Bypass -File projects/western_fantasy_continent/experiments/blind_rule_program_micro_v0/run-local.ps1`。
- 第0轮历史提交：3/3，基础参数列名、负/大移动量、不同对象数量、异列排除和非放骰事件通过。
- 第1轮历史提交累计：6/6；新增冻结混合、全冻结为空和不同参数案例通过，第0轮3例零退化。
- 第2轮最终提交累计：10/10；新增三路并列保留、唯一最小值、排除冻结/异列后无候选、非相对模式保留旧行为通过，前两轮6例零退化。
- 旧版必要失败：第0轮会错误移动冻结对象；第1轮会在相对选择中多移动非最小对象；两项均在公开新规则前由评测方实际运行确认，记录为 `old_fails: true`。
- 最终 `validation.json`：`all_passed=true`、`input_immutability_all=true`、`hidden_field_reads=[]`、`unauthorized_state_reads=[]`、`static_security_errors=[]`。
- 最终每个隐藏案例保存实际读取路径；读取数量随对象数和整组归约增加，未读取 `_hidden_*` 陷阱字段。
- 最终提交 SHA-256 为 `91d301ca099fab96662af38afe5c05320c30265aab096d37f3ecfd6758f730ae`，与第2轮快照一致；三轮 `SOURCE_RULE_IDS` 都严格等于当时公开规则序列。
- `node` 三轮进程退出码均为0；整套一键入口退出码0。

## Current State

本次小实验在行为隔离条件下得到一个可复跑的正结果：同一个隔离编译子 Agent 能从基础参数化规则开始，根据每轮一条新规则和一个可见失败反例，依次加入冻结例外和需要整组求最小值/保留并列的相对选择，同时保持旧隐藏集不退化。最终程序没有修改 preview 输入，也没有在运行时读取隐藏陷阱或公开合同外状态字段。

结果只支持“这种受限、局部增量编译流程在本次自建同构微案例中闭合”。它不证明真实 UFS 自然语言规则理解率，不证明长期补丁稳定性，也不等于完整自主玩家已经接通。

隔离必须明确称为**行为隔离**：当前子 Agent 工具没有 OS 文件 allowlist 或系统调用读取日志。提示边界、允许文件、隐藏材料落盘顺序、提交哈希和回复内容可审计；但评测方不能独立证明编译者从未违反提示去读取其他现存文件。运行 submission 时的公开状态读取则有程序级完整审计。

## Unresolved

- 缺少 OS 级子 Agent 文件读取隔离；下一次若平台提供专用沙箱/独立 worktree allowlist，应在更强隔离下复测。
- 仅三条规则、10个隐藏案例和两次增量补丁；不能覆盖规则冲突、撤销、长补丁链或 DSL 膨胀。
- 测试规则是同构微规则，不是 UFS 原教程原文，也没有测试自然语言拆五槽的质量。
- 安全静态扫描是小实验级拒绝列表，不应被描述成通用 JavaScript 安全证明；`vm` 也不替代系统级沙箱。
- Python 预检因本机无解释器而中止；正式三轮统一使用现有 Node.js 运行时，预检不计入结果。

## Recommended Next Step

保持正式玩家不动，先把同样的“每轮提交后才生成隐藏集”协议迁移到一个带真实五槽召回输出的薄适配器：只给编译者公开五槽合同与一条真实、可公开引用的 UFS 规则，让程序输出对象绑定和 preview；优先使用可提供 OS 级只读 allowlist/读取日志的隔离环境，并把本实验的 Proxy 状态读取审计与提交哈希链继续保留。
