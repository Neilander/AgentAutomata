# Agent Handoff：因果证据跨职业真实存档验证

- Date: 2026-07-19
- Agent/thread: Codex `/root`
- Scope: 在不接入正式 EVerify 的前提下，用既有真实模拟存档扩展因果证据验证
- Status: partial

## User Intent

不要只用游侠案例判断新 `causalEvidence` 是否可信。先覆盖骑士、狂战、牧师、法师、吟游等不同机制和正反例，验证充分后再接入正式 EVerify。

## Completed

- 批量读取既有本地模拟存档，从 7 场真实战斗中选取狂战、骑士、牧师、游侠、法师和吟游案例，没有逐文件人工翻看。
- 因果证据新增不泄漏内部技能名的公开技能指纹 `visible_action:<hash>`；匹配器可以精确区分同一角色的不同技能。
- 新增治疗、通用增益证据，并识别血怒增伤、力量增益、加速、保护和嘲讽等已有战斗标签。
- 狂战血怒、骑士旗墙、牧师治疗护盾、游侠减速击杀、吟游连续增益五类正例均为 `confirmed`。
- 骑士已经开盾但最终战败、法师已经造成灼烧但最终战败、治疗与护盾顺序倒置三类反例均为 `refuted`。
- 用 `guard` 替代 `bannerWall` 时不能确认旗墙链；假设直接提交内部技能名时合同判定为非法。
- 三档感知严格嵌套。低感知玩家缺少中间证据时保持 `inconclusive`，不会因为最终胜负自动补齐因果链。
- 尚未接入正式 EVerify，并在任务板中明确记录两个接入前缺口。

## Files Changed

- `projects/western_fantasy_continent/game_data/causal-chain-event-matcher.js`：支持公开技能指纹、治疗与增益类谓词和限定词。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：从既有可见战斗标签生成治疗、保护、嘲讽、加速和增伤证据，并输出公开技能指纹。
- `projects/western_fantasy_continent/game_data/test-causal-evidence-cross-archetypes.js`：新增 7 场真实存档跨职业正反例与三档感知测试。
- `projects/western_fantasy_continent/game_data/test-causal-chain-event-matcher.js`：固定真实 fixture 在新增技能指纹后的感知种子。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录跨职业结果和正式接入前缺口。

## Validation

- `node projects/western_fantasy_continent/game_data/test-causal-evidence-cross-archetypes.js`：PASS；5 类正例确认，4 类负面/非法边界符合预期，7 场真实存档三档感知集合嵌套。
- `node projects/western_fantasy_continent/game_data/test-causal-chain-event-matcher.js`：PASS；原 16 个匹配器案例无回归。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-causal-evidence-channel.js`：PASS；隐藏事件仍不会进入三档证据，因果证据仍不进入知识。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-battle-information-parser.js`：PASS；原信息筛选、覆盖率、三档感知和泄漏检查无回归。

## Current State

当前证据层已经不再只适用于“游侠击杀”这一种输出链。它能分别表达施放技能、治疗、护盾、控制、增伤、加速、击杀和最终胜负，也能区分骑士自己的多个技能。匹配器证明的是“玩家实际收到的这条贡献路径出现过”，不是“它是唯一主因”。

正式接入条件仍未满足，因此本轮没有改正式 EVerify 运行时。

## Unresolved

- 狂战真实存档可以证明“血怒状态出现→后来击杀/胜利”，但不能证明“先进入低血量→因此强化”。战斗引擎内部有血条快照，但当前原始玩家事件日志只保留可见离散反馈，血条状态没有进入因果证据通道。
- 战前 Agent 尚未拿到与战后证据完全一致的公开技能指纹。现在测试可以验证匹配器，但正式 Agent 还不能可靠地在行动前引用具体技能。
- 新跨职业测试依赖本地归档存档；如果以后要作为干净环境的固定回归，需要抽取一份最小、脱敏且可追踪来源的 fixture。

## Recommended Next Step

先单独设计“玩家看见血条进入低血量区间”的状态证据：只记录阈值跨越，不把连续血条快照灌进知识，也不伪装成战斗飘字。用狂战低血量正例、未进入低血量反例和低感知漏看案例通过后，再把公开技能指纹加入战前 Agent 合同，最后才接正式 EVerify。
