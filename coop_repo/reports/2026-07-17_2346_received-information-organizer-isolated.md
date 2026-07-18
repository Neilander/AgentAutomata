# Agent Handoff: 接收信息整理器独立候选

- Date: 2026-07-17
- Agent/thread: Codex `/root`
- Scope: 在感知筛选和正式知识学习之间新增独立整理层，不接入真实 Agent
- Status: complete，等待用户验收

## User Intent

先单独实现“玩家接收到的信息 → 可学习知识”的整理层，验证通过并展示结果；只有用户再次确认后，才允许替换正式 Agent 的旧知识入口。

## Completed

- 新增独立 `received-information-organizer.js`。
- 战斗解析器增加仅供整理器使用的内部接收候选接口；公开 `parseBattleInformation` 输出保持不变。
- 整理器只处理该感知档玩家实际收到的候选信号。
- 输出固定知识类别、安全主体、场景、玩家可表述观察、证据权重和不透明公开信号 ID。
- 敌方主体统一为“敌方单位”，不输出内部敌人 ID、职业或原始事件 ID。
- 新增独立知识账本：
  - 同主题重复证据合并。
  - 旧证据每轮按 `0.94` 衰减。
  - 相反证据降低置信并移动判断方向。
  - 治疗和护盾等同角色、同场景的不同主题保持分离。
- 新增中文成果说明，明确当前没有接入 `player-agent-loop`。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/received-information-organizer.js`：独立整理与知识更新程序。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-received-information-organizer.js`：正式独立验证。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：复用同一接收选择结果的内部接口。
- `projects/western_fantasy_continent/design/RECEIVED_INFORMATION_ORGANIZER_V1.md`：中文成果与边界。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：登记隔离候选。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录独立通过但尚未接入。

## Validation

- 真实 355 事件战斗中，低/普通/高感知玩家分别接收并形成 `10 / 15 / 21` 个可学习候选，集合保持嵌套。
- 普通玩家候选覆盖战斗结果、场地机制、角色倒下、敌方远近程威胁、辅助能力、角色贡献、状态、奖励、地图进度和可见技能。
- 一次治疗证据权重 `0.6875`；同场重复六次仍为一条候选，权重升至 `0.8375`。
- 同一知识连续四回合后，样本数 4、置信度 `0.7206`、状态 `established`。
- 同角色同场的治疗和护盾形成两个不同知识主题。
- 低感知玩家未接收到的背景治疗形成 0 条知识。
- 同关卡连续三次胜利后，方向值 `1.0000`、置信度 `0.6321`；再出现一次失败后降为 `0.4527 / 0.3286`；最近累计五次失败后反转为 `-0.3631` 并标记 `contested`。
- 注入原始 `diagnosis`、隐藏职业和内部敌人身份后，整理结果均不包含这些信息，也不包含原始事件 ID。
- 战斗解析、八档感知、角色尝试、换人 A、确认感 C、因果闭环和游戏数据回归通过。
- JavaScript 语法、任务板 JSON 和 `git diff --check` 通过。

## Current State

独立程序已经证明接收信息可以被整理成稳定的学习候选，并且可以形成可修正的知识账本。它没有被 `player-agent-loop.js` 引用，因此正式 Agent 行为和旧 `knowledgeBase` 来源尚未改变。

## Unresolved

- 需要用户确认整理结果是否符合预期。
- 正式接入时要决定不同类别的路由：通用知识、角色印象、概率知识和内部期待结算不能全部塞进一个表。
- Agent 归因接口仍需改为只允许引用公开信号 ID。
- 旧 `diagnosis` 知识入口尚未删除，这是刻意保留的安全边界。

## Recommended Next Step

等待用户验收。如果通过，再单独规划正式接入：先并行写入新旧知识并做差异审计，确认不丢关键知识后才关闭旧 `diagnosis` 路径。
