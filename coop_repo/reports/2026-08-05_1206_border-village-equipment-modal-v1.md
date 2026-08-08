# Agent Handoff: 独立军备浮窗v1

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war`公开角色信息与`border_village_war_web`换装UI
- Status: complete

## User Intent

把难用的底部换装界面改成周围变暗的独立浮窗：上方两排横向圆形角色头像；左下长立绘、左右各4个装备槽、下方技能和悬停数值层；右侧背包，并按当前角色穿戴、未穿戴、他人穿戴排序。

## Completed

- 地图底部“队伍与装备”按钮不再展开旧多页抽屉，改为打开模态军备浮窗；左侧可配装单位方块也可直接打开对应单位。
- 上方单位轴使用两排圆形头像，当前队伍和战士在前、候补主将在后；选中单位高亮并自动滚入可见区域。
- 左侧以角色长立绘占位区为中心，左右各4个真实装备槽；已装备物品可直接点击并在背包详情中定位。
- 角色区下方常驻4个真实战斗技能及描述，保留单人和全队一键配装。
- 右下角“数值”小按钮在悬停或键盘聚焦时显示覆盖层，展示装备结算后的生命、物理/魔法威力、护甲、攻速和技能急速；不显示胜率或隐藏公式。
- 右侧背包顺序固定为当前角色已穿、未穿戴、其他角色已穿；格子显示所有权状态，详情保留装备、卸下以及他人装备的恢复说明。
- 核心观察面为每个英雄和已训练战士提供当前战斗数值与4技能公开信息，数值来自真实装备构建层。
- 用户路径审查后修复切换角色残留上一人物品选择，以及地图直达候补时头像可能不在可视区的问题。
- 旧底部抽屉代码暂时保留为隐藏兼容层，本轮入口和主操作路径已全部切到新浮窗。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 对装备目标公开真实结算数值与4技能说明。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 英雄和战士公开技能/数值回归。
- `projects/western_fantasy_continent/border_village_war_web/index.html`: 军备模态窗口三块结构。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 角色排序、装备所有权排序、浮窗渲染、装备动作与地图入口。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 两排圆形头像、立绘八槽、技能、悬停数值层和背包视觉。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 新军备路径与层级静态契约。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 意图、核心对象、层级和注意力预算。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 新军备界面用户任务路径和恢复审查。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 试玩入口与新布局说明。

## Validation

- 核心与前端`node --check`: PASS。
- 核心规则、输入边界、全日密封面、完整可胜路线、静态前端：全部PASS。
- 完整可胜路线仍以15v16守住灰谷村，共运行74场真实战斗。
- 静态契约确认模态入口、两排单位轴、队内优先、四左四右装备槽、悬停数值层、背包所有权排序和装备/卸下路径。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

换装的主路径已从底部狭窄抽屉迁移到独立三块军备浮窗。玩家可以围绕当前角色、8槽、技能和背包完成完整换装，并查看真实结算数值。

## Unresolved

- 没有正式角色美术，圆形头像和长立绘区域暂用稳定汉字徽记。
- 尚未启动浏览器人工检查具体像素、短窗口压缩和实际滚动手感。
- 背包装备目前提供属性与词条，但尚未加入装备替换前后的逐项差值比较。
- 旧底部抽屉的隐藏代码仍在，确认新界面稳定后可单独清理。

## Recommended Next Step

真人试玩新军备浮窗，先只记录布局、尺寸、切换和换装摩擦；确认结构后再逐项优化，不同时加入套装系统。
