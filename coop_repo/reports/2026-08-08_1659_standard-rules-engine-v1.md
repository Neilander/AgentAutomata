# Agent Handoff: 正式规则引擎 V1

- Date: 2026-08-08
- Agent/thread: `/root`
- Scope: 开发地图驱动的《Under Falling Skies》正式独立游戏规则引擎
- Status: partial

## User Intent

把已研究清楚的正式规则开发成程序；用户愿意补录正式地图，程序需让规则代码与组件数据分离。

## Completed

- 新建 `standard_rules_v1`，不修改旧教学版引擎。
- 定义正式地图合同，拆分城市、研究轨、天空行、基地格、房间和挖掘路径。
- 实现白骰重掷、每列一骰、最多一个未挖掘放置、敌机同步下降、AA、箭头、母舰触发和城市伤害。
- 实现房间自由结算、能源成本、多格房间、逐格研究成本、最终多格研究门槛、战斗机和挖掘。
- 实现机器人安装、占格、疲劳、衰减、主动移除和被埋。
- 实现母舰移动、行动作、紫白敌机差异、正式出生优先级和胜负。
- 提供中文图片录入说明与待输入模板；用户可直接提供组件俯拍图，无需手填代码。
- 建立不含商业版图数据的合成地图，覆盖全部规则形状。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/`: 正式规则引擎、地图合同、合成夹具、13 项单测、100 局冒烟测试和录图指南。
- `coop_repo/LATEST.md`: 更新最新入口。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- `node test-standard-engine.js`: PASS，13 项规则测试。
- `node run-synthetic-smoke.js`: PASS，100 局全部正常结束，10 胜/90 负/0 超时，平均 3.74 回合。
- 冒烟胜率没有难度意义；合成地图只用于状态机稳定性。
- `git diff --check`: PASS。

## Current State

程序已经能加载符合合同的地图并完整运行一局正式规则游戏。当前仍不能程序试玩真实正式版，因为真实天空、基地和城市组件数据未录入；规划玩家也尚未接线。

## Unresolved

- 需要 4 块天空板正反、A/B/C 基地所有可用面、三座独立游戏城市正反面的清晰俯拍图。
- 尚未建立真实 Roswell A+B 地图，不能报告正式胜率。
- 尚未把 768 维语义召回和路线规划器适配到新的房间/状态合同。
- 机器人在机器人房内用自身重装等少数正式边角规则，需在真实地图出现对应路径后增加专项测试。

## Recommended Next Step

用户提供组件图片后，先录入并生成文字网格供用户核对；通过地图合同后接规划器，先跑 Roswell 威胁 0/1，再扩展 B+C 机器人城市和威胁 2-4。

