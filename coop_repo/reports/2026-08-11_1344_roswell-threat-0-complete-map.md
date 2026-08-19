# Agent Handoff: Roswell 威胁 0 完整地图

- Date: 2026-08-11
- Agent/thread: Codex `/root`
- Scope: 合并真实城市、研究轨道、天空和基地，并跑完整状态机冒烟
- Status: complete

## User Intent

用户补充 Roswell 研究轨道从下到上的 16 个费用，完成第一张可程序试玩的正式地图。

## Completed

- 录入研究费用 `[3,1,3,1,4,1,3,2,1,6,1,3,5,1,3,11]`，方向为从起点向胜利终点。
- 固定 Roswell A+B 参数：最大伤害 7、初始能源 2、能源上限 7、机器人上限 2、无首轮特殊骰值。
- 合并真实 Roswell 城市、基地 A+B、四块天空简单面和研究轨道为完整 `ufs_standard_map_v1`。
- 验证最后费用 11 只能由多格研究室进入。
- 将原合成冒烟 runner 小幅参数化，使同一稳定性流程可以运行真实地图。
- 新增 Roswell 真实地图 100 种子冒烟脚本。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map.js`: 完整正式地图 fixture。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/test-roswell-threat-0-map.js`: 地图合同、城市值、研究轨道、开局与最终 11 测试。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/run-synthetic-smoke.js`: `runGame` 接受地图参数，默认行为保持不变。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/run-roswell-threat-0-smoke.js`: 真实地图随机稳定性冒烟。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/README.md`: 记录完整地图入口和限制。

## Validation

- `node test-roswell-threat-0-map.js`: PASS；开局能源 2、伤害上限 7、能源上限 7、机器人上限 2、研究 16 格、末格 11、68 个合法开局放置。
- `node test-standard-engine.js`: PASS；13 项。
- `node run-synthetic-smoke.js`: 100 局、0 timeout；合成回归保持可完成。
- `node run-roswell-threat-0-smoke.js`: 100 局、0 timeout、平均 7.68 回合；19 局最大伤害失败，81 局母舰骷髅失败。
- `git diff --check`: PASS。

## Current State

第一张真实 Roswell A+B、威胁 0 地图已经可以由正式规则引擎初始化并完整运行。随机策略 100 局 0 胜不代表地图难度或玩家胜率；它只验证状态机没有卡死，两种失败链能正常结算。

## Unresolved

- 尚未用具备规划能力的程序玩家验证地图是否可被合理策略打通。
- 用户录入的天空和研究轨道尚未生成一张完整复原图做最终视觉对照。
- 当前只有四块天空简单面；威胁 1–4 所需的背面尚未录入。

## Recommended Next Step

先用一个最小规则策略（优先避免母舰骷髅、保持能源并推进研究）跑确定性小样，确认真实地图至少存在可行胜路，再接规划 MindToy。
