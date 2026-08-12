# Agent Handoff: Roswell A+B 挖掘路径与解锁关系

- Date: 2026-08-11
- Agent/thread: `/root`
- Scope: 把用户录入的 A/B 房间数据转成正式基地 fixture，并补全黄色挖掘通道
- Status: complete

## User Intent

用户已通过 HTML 录完基地 A/B 的可见房间信息，希望由程序补充不适合手填的解锁深度和挖掘路径，再生成复原结果核对。

## Completed

- 接收并检查用户导出的 30 个格子、25 个房间；房间引用、多格组合、修正和能耗一致。
- 从高清实物照片复原黄色通道：A 右下起点 0，A 下排向左；进入 B 后按向右、向左、向右蛇形前进，终点为 B 右下，合计 20 个路径位置。
- A 板前两排设置为开局已开放；路径上的每个格子使用其通道序号作为 `unlockIndex`。
- 复核官方规则书第 4、6、7 页，确认纯通道格也是合法放骰空间，只是房间阶段无效果；因此保留 `tunnel` 格是正确的，不应从地图删除。
- 建立可被正式引擎直接引用的 `roswell-base-ab` fixture。
- 增加专项测试，验证路径顺序、初始开放区、下一格距离 1 和首次挖掘结算。
- 生成中文简化复原 SVG，突出房间类型、多格组、能耗/修正和 0-19 路径序号。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-base-ab.js`: 用户房间数据与正式挖掘路径。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/test-roswell-base-ab.js`: A+B 专项合同与行为测试。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/render-roswell-base-ab.js`: 复原图生成器。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/artifacts/roswell-base-ab-review.svg`: 人工核对图。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/README.md`: 已核对数据入口与路径说明。

## Validation

- `node test-roswell-base-ab.js`: PASS；30 cells、25 rooms、20 path cells，起点 `A-r3-c5`、终点 `B-r3-c5`。
- 首次挖掘行为：PASS；起点已开放，下一格被识别为距离 1，支付能源后挖掘机移动到 index 1。
- `node test-standard-engine.js`: PASS，原有 13 项正式规则测试未受影响。
- SVG 以 Chrome 1420×1160 渲染检查：PASS；路线编号、多格组和底部说明无重叠。
- `git diff --check`: PASS。

## Current State

Roswell A+B 的基地局部数据已经可用，不再缺路径与解锁值。它仍是局部 `base` fixture；要运行真实 Roswell 威胁 0，还需完成天空简单面与城市/研究/能源伤害轨配置。

## Unresolved

- SVG 复原图需要用户最终目视确认，尤其是路径在 A/B 接缝处的转向。
- 天空简单面尚未逐格形成正式 `sky.rows`。
- Roswell 的研究轨成本、初始能源、能源上限和伤害上限尚未写成完整真实地图。

## Recommended Next Step

先让用户核对 `roswell-base-ab-review.svg`。通过后录入四块天空简单面，并从规则书/城市板补 Roswell 轨道参数，组装首个可运行的真实威胁 0 地图。
