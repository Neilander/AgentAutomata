# Agent Handoff: 敌人压迫感与失败重试

- Date: 2026-08-01
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 核心、战斗结算与地图前端
- Status: complete

## User Intent

提高目前偏弱的敌人强度，并让战斗失败后可以重复挑战，而不是扣掉资源、行动力或直接结束流程。

## Completed

- 分开调高边林讨伐、民兵训练、三个据点和最终决战的敌方生命、威力、护甲或人数，没有使用一个全局倍率粗暴覆盖所有战斗。
- 粮秣营、战兽栏、萨满祭坛的守军分别调整为6、5、8名，敌方描述与实际战斗阵容一致。
- 最终普通兽人军团和三名主将同步增强；既有完整经营路线仍可通过14对16的真实最终战。
- 训练、突袭和决战只有胜利才扣除行动力与粮食。失败保留战斗记录和失败次数，但资源与行动力回到战前状态，原战斗入口继续可用。
- 最终决战失败不再把游戏写成终局失败，而是留在第7日决战阶段，可立即重新组织战斗；每次重试使用新的确定性战斗种子。
- 边林刷怪失败本来不消耗资源，现在明确提示可立即重试；连续刷怪不会因一轮战败自动停止。
- 战败结算按钮改为“返回地图并重试”，并在结果区明确说明不消耗行动力或粮食。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 敌军强度、据点阵容及胜利后才扣费的可重试结算。
- `projects/western_fantasy_continent/border_village_war/border-village-web.js`: 战败重试提示与连续刷怪战败后继续。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 可重试结算、重试种子、强化后训练/据点与经济循环回归。
- `projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: 最终战失败后仍为密封、可重试的决策面。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 前端重试提示、连续刷怪与真实战斗重试结算合同。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录分战斗调平和失败重试规则。

## Validation

- `node --check` 核心与前端脚本：PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS；失败突袭与最终战不扣费、入口保留且重试种子变化。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-input-boundary.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-sealed-surface.js`: PASS；第7日失败后仍公开可用决战入口，没有泄露内部战斗信息。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-winning-route.js`: PASS；73场战斗后占领3个据点，14v16最终战获胜。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS；未启动服务器。
- 第3日初始队伍对边林1级敌群抽样100个种子：73胜，平均0.73名我方角色存活；原基线为100胜且基本全员存活。

## Current State

敌人已经会在新手刷怪阶段制造实际失败，三个据点和最终军团的规模与数值也明显提高。失败现在是可反复尝试的战斗反馈，不会吞掉本次行动力或粮食，也不会结束第7日存档。

## Unresolved

- 73%初始刷怪胜率是程序抽样，不代表最终玩家主观体感；后续应由玩家直接试玩确认是否还需要继续提高，尤其要观察连续刷怪失败时的节奏。
- 本轮没有启动服务器或做浏览器截图，前端通过静态合同与核心真实战斗回归验证。

## Recommended Next Step

玩家刷新或重开后直接尝试边林讨伐、粮秣营和第7日决战；重点判断“有压迫但愿意再试”的区间是否合适，再基于具体战斗单独微调，而不是继续整体加倍。
