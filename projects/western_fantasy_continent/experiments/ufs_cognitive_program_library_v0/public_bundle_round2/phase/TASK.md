# 母舰、生成与胜负：隔离JSON程序任务

只允许读取：上级`DSL_V2.md`、本目录`rules.json`、上级`submission-template.json`和本文件。只写`../../submissions/agent_phase_programs.json`，完成后只回复路径。

必须生成8个程序，trigger.relation均为空：

1. `research-completion-before-destruction`：qKind=`research_completion`，output=`terminal_check`。
2. `damage-track-loss`：qKind=`damage_threshold`，output=`terminal_check`。
3. `mothership-skull-loss`：qKind=`mothership_threshold`，output=`terminal_check`。
4. `mothership-phase-descent`：qKind=`mothership_phase_start`，output=`mothership_phase_descent`。
5. `mothership-row-action`：qKind=`mothership_row_action`，output=`mothership_row_action`。
6. `research-top-win`：qKind=`research_top`，output=`terminal_check`。
7. `spawn-empty-columns`：qKind=`spawn_priority_empty`，output=`spawn_candidates`。
8. `spawn-farthest-drop-point`：qKind=`spawn_priority_farthest`，output=`spawn_candidates`。

允许注意路径：

```text
research.complete
research.atTop
city.destroyed
damage.atBottom
mothership.onSkullRow
mothership.row
sky.row:${nextRow}.shipIds
mothership.rowAction.type
mothership.rowAction.value
spawn.shipId
spawn.shipColor
sky.columnIds
sky.column:${columnId}.shipIds
sky.column:${columnId}.dropPointId
spawn.availableDropPointIds
spawn.dropPoint:${dropPointId}.distanceFromHighestShip
```

输出字段必须恰好为：

- `terminal_check`: `terminal`, `result`（`win`/`loss`/`ongoing`）, `reason`, `stopKind`（terminal时`complete`，否则`automatic`）。每个程序只按自己的来源规则判断。
- `mothership_phase_descent`: `fromRow`, `toRow`, `collectedShipIds`, `stopKind="automatic"`；行号向城市方向递增。
- `mothership_row_action`: `actionType`, `amount`, `stopKind="automatic"`；只绑定当前公开图标类型与数值，不自行选择另一图标。
- `spawn_candidates`: `shipId`, `candidateDropPointIds`, `stopKind`（候选超过1个为`choice`，否则`automatic`）。空列程序只输出空列投放点；最远程序只输出最大距离并列点。
