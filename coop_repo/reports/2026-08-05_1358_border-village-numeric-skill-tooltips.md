# Agent Handoff: 人物技能精确数值浮层

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war`人物公开技能数据与军备技能浮层
- Status: complete

## User Intent

技能与装备一样按需显示详情；鼠标悬停后必须看到可比较的真实数值，例如攻击倍率和伤害类型，而不是“稳定伤害”“小幅增伤”等模糊描述。

## Completed

- 在核心公开人物数据中为每个技能增加`details`，数据从正式技能效果与战斗结算规则生成。
- 直接伤害显示目标数量、基础伤害、物理/魔法攻击倍率、物理/火焰/毒素/奥术类型，并注明护甲结算前。
- 护盾、减伤、嘲讽、减速、中毒、标记、自伤、增攻等技能显示精确数值和持续时间。
- 战士、骑士、游侠、狂战、术士和炼金师的被动均显示真实结算比例；狂战大招使用当前正式不死、急速、吸血和战斗窗口数据。
- 人物页技能卡常态只显示槽位、名称和冷却；鼠标悬停或键盘聚焦后显示原定位描述与完整数值列表。
- 抽查全部八名当前可招募英雄，确认24套职业技能均有数值内容，而不是空浮层或重复模糊文案。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 从正式技能/战斗规则生成公开数值详情。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录人物技能公开数据边界。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 技能悬停/聚焦详情结构。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 技能数值浮层与焦点交互。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 检查技能详情数组和攻击倍率/伤害类型。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 更新技能信息层级。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新试玩说明。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 记录模糊信息修正。

## Validation

- 核心与前端`node --check`: PASS。
- 核心规则、输入边界、全日密封面、完整可胜路线、静态前端：全部PASS。
- 完整可胜路线仍以15v16守住灰谷村，共运行74场真实战斗。
- 静态契约确认每个公开技能都有非空`details`，至少一个伤害技能同时公开攻击倍率与伤害类型。
- 手工程序抽查全部八名英雄：战士、骑士、游侠、狂战、术士、炼金师详情均包含职业对应的真实数值。
- `git diff --check`: PASS，仅有既存LF/CRLF提示。
- 未启动服务器或浏览器。

## Current State

技能卡常态仍易扫视；需要比较时，悬停或键盘聚焦即可读到来自真实战斗规则的数值公式。技能浮层没有显示胜率、推荐解法或敌人隐藏数据。

## Unresolved

- 尚未在用户当前窗口中进行真人视觉确认；长技能（尤其狂战被动和大招）的浮层高度仍需实际试玩检查。
- 正式技能数据未来若增加新的效果种类，需要同步扩展公开描述器；未知效果会回退为技能原描述，不会虚构数字。

## Recommended Next Step

真人刷新人物页，重点检查技能浮层是否遮挡、文字密度和公式可读性；确认后再继续人物页或编队页的下一项改动。
