# 15 日围剿 Demo：玩家界面契约

## Intent

玩家进入页面，是为了在 15 日内从地图观察当前局势，用每天 3 个行动点处理有限事件，用免费副本刷装并扩编队伍，最终亲自看完 4v6、10v10 或 20v10 的真实战斗。

## Screen states

- 准备：选择地点，阅读现场，只在地点旁浮窗看到该地点此刻合法的行动；左上任务条只承担关联筛选。
- 队伍：在相邻区域查看 5×2 出战阵列、候补、角色技能与换人动作。
- 背包：扫描固定格子，查看所选装备的稀有度、战力与身份词条。
- 战前：先看双方人数、我方称号、敌方称号与敌方成员，再确认或取消交战。
- 战斗：确认后地图、事件按钮与底栏退出注意中心，正式战场成为唯一核心对象。
- 结果：看到胜负、存活、伤害、治疗、护盾和主要输出，再确认返回地图。

## Core object

- 准备阶段：当前选中的地点与现场。
- 战斗阶段：共享正式战斗运行时呈现的战场。
- 队伍阶段：10 个稳定出战位置及相邻候补。
- 背包阶段：固定装备格与单件装备详情。

## Information priority

- P0：第几日、剩余行动、当前地点、这里当前有几件事、正在发生的战斗。
- P1：行动成本、三幕截止日、当前出战成员、装备战力、可见敌情。
- P2：行动后的现场变化、战斗存活与伤害/治疗/护盾贡献、盟友集结来源。
- P3：最近记录、资源与仍然可见的态势。
- P4：隐藏门槛、敌方倍率、未来事件、未满足方案、评测目标。P4 永不进入玩家界面。

## Hierarchy

```text
screen
  topbar
    chapter / 15-day rail / resources
    end day / restart
  campaign
    world
      current quest rail -> highlights related visible places
      region map
      current-region places + actionCount
    stage
      selected scene
      OR full real-combat battlefield
    actions
      current-place legal actions only
      visible threat signals
  dock
    party: 5×2 active slots + reserve + selected hero skills
    inventory: fixed grid + selected item detail + visible identity actions
    journal: recent events + persistent situation
```

## Attention budget

- 准备：地点现场 40%，地图/地点 24%，当前行动 24%，底栏摘要 12%。
- 战斗：战场 82%，标题/集结信息 8%，战后结果 10%。
- 队伍：5×2 阵列 42%，候补 16%，角色详情/技能 30%，整理装备 12%。
- 背包：固定格 60%，所选物品详情与身份动作 40%。

## Controls

- 地图只显示当前已知区域；新增矿区、沼泽、地底等区域有独立坐标，不重叠。
- 地点列表使用紧凑行，每行保留当前 `actionCount`，0 也明确显示。
- 行动显示名称、可见成本、确定的即时资源变化，以及会受影响的当前任务线；不显示隐藏结果、推荐路线或缺少的隐藏条件。
- 一个地点可以同时挂接多条当前任务线；任务条目只高亮已经出现的关联地点，不生成或预告未来节点。
- 队伍称号分七级；晋级必须完成真实战斗试炼，失败不消耗行动力，可以调整后重试。
- 所有战斗与刷装首轮都先进入战前预览；只显示敌人名单和协会称号，不显示敌方生命、伤害、倍率或胜率。
- 新角色加入时使用覆盖全屏的半透明灰色提示，显示姓名、定位和前三项公开技能，再由玩家确认返回。
- 出战成员用 5×2 稳定阵列；候补与加入动作紧邻。
- 背包使用固定格子；名称、身份词条和使用者只在所选详情中展开。
- 战斗没有跳过按钮；结算后玩家主动点击返回并应用结果。

## Expected player path

```text
看 15 日时间轴与下一截止日
→ 选区域/地点并看 actionCount
→ 阅读现场并选择当前行动
→ 若接战，完整观看真实战斗
→ 查看贡献和战后变化
→ 在底栏整理队伍/背包
→ 继续选择或结束本日
```
