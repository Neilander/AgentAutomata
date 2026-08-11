# Agent Handoff: Ancient Ruins Challenge

- Date: 2026-08-11
- Agent/thread: Codex `/root`
- Scope: 新增远古遗迹两段式高难剧情挑战
- Status: complete

## User Intent

增加名为“远古遗迹”的剧情挑战关：富家探险小姐与担任女保镖兼老师的同伴被困数日，老师魔力枯竭、虚弱地躺在小姐怀里，两人已经没有补给；遗迹内的战斗均应为高难本。

## Completed

- 第3日经营阶段地图东南侧出现独立紫灰色“远古遗迹”高危节点，开场剧情期间不可见。
- 入口只公开昂贵探险器材、单向脚印和高危守卫，不提前泄露薇奥拉、艾琳、密室或机关解法。
- 第一场“封锁回廊”使用真实战斗系统，4单位上限、7名高强度敌人；敌方平均生命与威力均高于边林难度5。
- 入口胜利后才揭示密室场景：探险家小姐薇奥拉抱着魔剑导师艾琳；两人被困数日、补给耗尽，艾琳魔力枯竭且无法站稳。
- 密室提供两种会改变下一场权威战斗计划的选择：
  - 消耗12粮与恢复药，让艾琳以虚弱固定盟友参战，不占8单位编队容量。
  - 不消耗资源，听薇奥拉复盘机关并走密道，移除核心战中的两组古代守卫，艾琳不参战。
- 补给不足时该选项继续显示为红色不可用并说明缺粮数量；密道方案保持可选。
- 第二场“守秘者大厅”为8单位极高难战，单位强度继续高于入口；战前仍完整经过编队选择、敌人预览和军粮大锅。
- 两场失败均不消耗行动力、粮食或推进剧情，可更换编队后原地重试。
- 入口胜利奖励一件史诗与一件传说装备；最终胜利救出并招募薇奥拉和艾琳，必定获得一件15词条永恒“远古遗珍”以及两件高阶装备。
- 完成后地图节点变为绿色完成态，两名角色进入人物、编队、装备和地图活动体系。
- 正式模拟玩家观察面增加当前挑战阶段，但继续剥离内部目标字段。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 挑战状态、两名角色、两场战斗、密室选择、奖励、招募、观察面和旧存档默认状态。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证信息延迟揭示、高于难度5的敌人、失败重试、两条真实阵容分支、招募与永恒奖励。
- `projects/western_fantasy_continent/border_village_war/border-village-formal-player-loop.js`: 将挑战阶段纳入密封观察面。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录挑战完整规则与奖励边界。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 挑战地图节点、动态4/8单位编队规则、固定盟友说明和新角色地图表现。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 高危与完成态遗迹节点材质。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定挑战节点与阶段编队契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录网页交互和静态验证范围。

## Validation

- `node --check` 核心、正式玩家循环与网页脚本：PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS；真实模拟两场挑战并完整走通救援路线。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS；17次请求审计、真实战斗与最终重试保持有效。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check`: PASS；仅输出仓库既有LF/CRLF提示。
- 未启动服务器，未打开浏览器。

## Current State

旧存档刷新后会通过兼容默认值获得尚未探索的远古遗迹，不要求重开。挑战在完成开场剧情、进入第3日经营后出现。已有最终决战阶段不能回头挑战；未完成时会保留节点但没有可执行行动。

## Unresolved

- 两场敌人的相对强度已通过数值对比和真实失败/胜利模拟确认，但最终玩家体感仍需实际试玩。
- 薇奥拉与艾琳沿用现有炼金师/法师技能套组，正式角色专属技能与立绘尚未制作。
- 当前远古遗迹是一次性剧情挑战；尚未设计完成后的重复深层挑战。

## Recommended Next Step

刷新现有网页存档，完成开场进入第3日后拖动地图到东南侧试玩“远古遗迹”；优先确认入口是否足够压迫、密室文字节奏和两种核心战分支是否都值得选择。
