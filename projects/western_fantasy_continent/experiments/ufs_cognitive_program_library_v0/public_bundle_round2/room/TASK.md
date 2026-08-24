# 房间、挖掘与研究：隔离JSON程序任务

只允许读取：上级`DSL_V2.md`、本目录`rules.json`、上级`submission-template.json`和本文件。只写`../../submissions/agent_room_programs.json`，完成后只回复路径。

必须生成8个程序，trigger.relation均为空：

1. `room-energy-payment`：qKind=`room_payment`，output=`room_payment_choice`。
2. `energy-room-resolution`：qKind=`energy_room_resolution`，output=`energy_room_result`。
3. `fighter-room-resolution`：qKind=`fighter_room_resolution`，output=`fighter_room_result`。
4. `research-room-choice`：qKind=`research_room_resolution`，output=`research_room_choice`。
5. `unexcavated-placement-legality`：qKind=`excavation_placement`，output=`excavation_placement_legality`。
6. `excavation-resolution`：qKind=`excavation_resolution`，output=`excavation_result`。
7. `research-room-order-choice`：qKind=`research_order`，output=`research_order_choice`。
8. `final-research-room-restriction`：qKind=`final_research_constraint`，output=`final_research_constraint`。

允许注意路径：

```text
room.energyCost
room.value
room.type
room.zone
room.cellCount
player.energy
player.energyCap
explosionShip.ids
explosionShip:${shipId}.threshold
research.costsAhead
research.pendingRoomIds
research.room:${roomId}.value
research.targetCost
event.dieValue
event.dieId
excavation.pathDistance
excavation.targetIndex
excavation.pathIndicesBehind
round.usedUnexcavatedPlacement
```

输出字段必须恰好为：

- `room_payment_choice`: `energyCost`, `canPay`, `stopKind="choice"`。
- `energy_room_result`: `energyBefore`, `gain`, `energyAfter`（不得超过cap）, `removeDie=true`, `stopKind="automatic"`。
- `fighter_room_result`: `eligibleShipIds`, `roomValue`, `removeDie=true`, `stopKind="automatic"`。
- `research_room_choice`: `budget`, `continuousCosts`, `stopKind="choice"`；不得替玩家选推进几格。
- `excavation_placement_legality`: `dieValue`, `pathDistance`, `otherUnexcavatedAlreadyUsed`, `legal`, `stopKind="automatic"`。
- `excavation_result`: `energyDelta=-1`, `removeDieId`, `excavatorTargetIndex`, `newlyExcavatedIndices`, `stopKind="automatic"`。
- `research_order_choice`: `rooms`（每项含roomId/value）, `continuousCosts`, `combineValues=false`, `stopKind="choice"`。
- `final_research_constraint`: `targetCost`, `requiresRoomType="research"`, `requiresZone="lower"`, `requiresMinimumCells=2`, `currentRoomEligible`, `stopKind="automatic"`。

爆炸格合格条件为threshold不大于房间值。未挖掘格合法必须同时满足骰值足够且本回合未用其他未挖掘格。最终研究的当前房间合格必须同时满足类型、区域和格数。
