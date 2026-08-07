# Agent Handoff：队伍语义坐标 V0

- Date: 2026-08-02
- Agent/thread: Codex `/root`
- Scope: `logs/fb2` 隔离worktree中的连续队伍认知实验
- Status: partial

## User Intent

验证队伍认知能否从多维空间零点开始，被每条知识逐步拉动形成坐标；自然语言需求本身直接成为搜索方向，例如“要让队伍活下去”自然强激活治疗、保护并少量激活伤害，不再使用人工九轴和LLM数字权重。

## Completed

- 新建隔离实验，复用50队既有的玩家可见战斗知识和第二随机种子验证结果，未修改正式玩家Agent。
- 实现零点语义坐标：每条自然语言命题产生一个768维GTE位移，多条命题累加形成队伍坐标。
- 实现同类证据饱和，避免重复知识无限增长。
- 明确拆开自然语言命题与支持/反驳状态，解决Embedding把“能够治疗”和“无法治疗”错误视为同方向的问题；一正一反回到0，多条反例可反向拉动坐标。
- 自然语言“要让队伍活下去”不经权重分配直接匹配能力短语：治疗0.771、控制0.689、护盾0.673、减伤0.659、快速击杀0.616、纯伤害0.516。
- 真实50队完整知识坐标对第二种子存活相关0.757；移除旧胜负和存亡结果后，仅凭能力知识仍相关0.394，Top-10平均存活0.425、Bottom-10为0.150。
- 完整语义状态的7类需求Top-10全部优于Bottom-10；治疗保护相关0.728、伤害0.579、群攻0.642、持续伤害0.455。

## Files Changed

- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/run_experiment.py`：知识提取、坐标累积、自然语言查询、真实验证和消融。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/test_results.py`：结构、边界与结果产物回归。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/run-local.ps1`：复用本地GTE运行时的一键入口。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/README.md`：公式和边界。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/RESULTS.md`：中文结果与失败分析。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/artifacts/semantic-coordinate-results.json`：完整实验结果。

## Validation

- `run-local.ps1`：PASS；GTE离线编码、真实50队查询和结构测试完成。
- 50队、308条去重后的友方玩家知识；未读取验证战斗形成坐标。
- 完整语义状态7/7需求Top-10优于Bottom-10；能力知识消融6/7。
- 重复饱和和正负反转边界通过。

## Current State

核心几何可行：自然语言命题可以逐条移动队伍坐标，需求句可以不经人工权重直接检索该坐标。当前最可信的结果是治疗/保护、存活、伤害、群攻和持续伤害；尚不能把所有GTE绝对余弦值当成心理激活量。

## Unresolved

- “获得更多战利品”对“活下去”仍有0.621相似度，说明通用句式和游戏语境造成较高背景相似度。
- 快速启动的能力消融相关为-0.110，控制仅0.105。
- 原因是现有玩家知识常保留技能名称，却没有形成“技能会限制行动/加速启动”的语义命题；第五步知识语义化不完整。
- V0的少量语义归一规则仍由程序实现，只覆盖胜负、存亡、治疗、护盾等明确事件，不是通用知识形成器。
- 验证仍使用同六支敌队的另一随机种子，未验证未见环境。

## Recommended Next Step

不要继续扩大队伍池。先隔离实现“玩家可见观察 → 当前自然语言命题 + 支持/反驳”的知识形成层，用控制、启动、净化、锁血和组合机制验证；再让本坐标累积器读取这些命题重跑50队。
