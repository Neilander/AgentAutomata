# Agent Handoff: Border Village Town Prosperity UI

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 当前城镇状态框与可拖拽人口繁荣收益轨迹
- Status: complete

## User Intent

为未来多城镇结构重组顶部UI：人口和行动力属于当前城镇。右上角需要同时显示城镇名、当前人口/人口上限、行动力与繁荣等级；点击繁荣等级后进入可左右拖拽的人口收益轨迹，既能看当前收益，也能看未来收益。

## Completed

- 顶部金币、粮食保留为资源；人口从资源条移出。
- 右上角新增当前城镇框，常显灰谷村、人口`当前/上限`、行动`剩余/每日上限`、繁荣Lv与本级进度。
- 点击城镇框打开独立繁荣界面；顶部再次显示当前人口/上限、繁荣名称和行动力。
- 人口轨迹支持按住左右拖拽、纵向滚轮转横移和左右方向键浏览；打开时自动把当前里程碑放到靠前位置。
- 里程碑区分已获得、当前、未来和超过当前人口上限四种状态。超过容量的节点继续显示为虚线，不隐藏未来收益。
- 灰谷村繁荣沿用既有行动节奏：人口0/40/70/100对应Lv.1—4与每日3/4/5/6行动；每次繁荣升级增加1行动。
- 前期10—100人口每10人新增1个民兵单位。单位奖励与繁荣等级均由核心里程碑表提供，前端不写死永久公式，便于后续不同城镇使用不同规则。
- 修正公开战争规则中已经过时的“缺粮部队不会出战”描述。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 繁荣等级、人口单位里程碑和`town`观察对象。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 0/40/70/100门槛、行动上限及未来奖励验证。
- `projects/western_fantasy_continent/border_village_war_web/index.html`: 右上角城镇框和繁荣弹窗结构。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 城镇卡、繁荣轨迹和四类里程碑状态。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 城镇渲染、轨迹渲染与拖拽/滚轮/键盘交互。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 当前城镇和横向繁荣轨迹静态契约。
- `projects/western_fantasy_continent/border_village_war/README.md`: 多城镇观察接口说明。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 玩家界面与操作说明。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 当前城镇的信息层级。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 多城镇繁荣审查路径。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 多城镇状态与繁荣规则记录。

## Validation

- `node --check .../border-village-core.js`: PASS.
- `node --check .../border-village-web.js`: PASS.
- `node .../verify-border-village.js`: PASS.
- `node .../verify-border-village-input-boundary.js`: PASS.
- `node .../verify-border-village-sealed-surface.js`: PASS.
- `node .../verify-border-village-winning-route.js`: PASS（74场战斗，15v16最终战获胜）。
- `node .../verify-border-village-formal-playtest.js`: PASS（22轮决策、6场战斗时间线、17条知识）。
- `node .../verify-static-web.js`: PASS，`serverStarted: false`。
- `git diff --check`: PASS（仅已有LF/CRLF提示）。

## Current State

顶部UI现在明确区分“全局资源”和“当前城镇状态”。繁荣界面解释人口如何转化为单位与行动力，同时保持未来多城镇可替换里程碑规则的结构。

## Unresolved

- 遵守当前约束，未启动服务器或浏览器；未做真实窗口截图，程序和静态契约已验证。
- 当前Demo只有灰谷村，尚未实现切换城镇；`town`接口已经把这组状态收束为单一当前城镇对象。
- 里程碑目前展示到100人口。第二章的更高繁荣等级、非固定单位奖励间隔和城镇专属收益仍待设计。

## Recommended Next Step

真人打开静态页面，重点检查1080px宽窗口下右上角城镇框是否过挤、横向拖拽手感和“超过当前人口上限”的虚线状态是否足够直观。确认后再设计多城镇切换入口，不要先扩张里程碑数量。
