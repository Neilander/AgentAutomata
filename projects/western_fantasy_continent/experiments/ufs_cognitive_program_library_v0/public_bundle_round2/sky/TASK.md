# 天空、随机与撞城：隔离JSON程序任务

只允许读取：上级`DSL_V2.md`、本目录`rules.json`、上级`submission-template.json`和本文件。只写`../../submissions/agent_sky_programs.json`，完成后只回复路径。

必须生成4个程序：

1. `white-die-reroll`：qKind=`white_die_placed`，output kind=`randomize_unplaced_dice`。
2. `arrow-final-landing`：qKind=`ship_final_arrow`，output kind=`move_ship`。
3. `mothership-down-space`：qKind=`ship_final_mothership_space`，output kind=`move_mothership`。
4. `city-contact`：qKind=`ship_city_contact`，output kind=`city_contact`。

所有`trigger.relation`使用空对象。

允许注意路径：

```text
dice.ids
dice:${dieId}.placed
event.shipId
tile.arrow.targetColumn
tile.arrow.targetRow
mothership.row
```

输出字段必须恰好为：

- `randomize_unplaced_dice`: `dieIds`, `field`固定`value`, `valueState`固定`random_unknown`, `stopKind`固定`random`, `stopReason`固定`waiting_for_actual_reroll`。
- `move_ship`: `shipId`, `column`, `row`, `stopKind`固定`automatic`。
- `move_mothership`: `fromRow`, `toRow`, `delta`固定1, `stopKind`固定`automatic`。公开行号向城市方向递增。
- `city_contact`: `shipId`, `damageDelta`固定1, `shipDestination`固定`mothership_queue`, `stopKind`固定`automatic`。

白骰程序必须从`dice.ids`筛选`placed=false`的骰子；不能生成新点数。箭头程序只使用最终落点已经确认后的目标格，不处理经过箭头。
