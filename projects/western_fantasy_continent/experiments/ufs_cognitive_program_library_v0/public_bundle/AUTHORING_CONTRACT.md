# 隔离Agent：UFS认知JSON小程序盲开发合同

## 任务与隔离

你只允许读取：

1. 本文件；
2. 同目录 `frozen_rules.json`；
3. 同目录 `submission-template.json`。

禁止读取仓库内任何其他文件，包括现有轨迹、grounding代码、场景、测试、引擎、README、报告或其他Agent答案。不要搜索仓库。

只写：

`../submissions/agent_01_programs.json`

完成后只向主Agent回复：`已写完：<路径>`。不要在消息里透露程序内容或分析。

## 目标

只根据四条冻结规则，独立开发下列5个JSON认知小程序：

- `ordinary-descent-v1`
- `aa-descent-v1`
- `aa-room-no-output-v1`
- `multi-room-completeness-v1`
- `single-room-value-v1`

这些程序只在脑内 `imaginedWorld` 形成临时patch，不执行真实游戏动作。

## 程序结构

每个程序必须严格包含：

```json
{
  "programId": "...",
  "revision": 1,
  "sourceRuleIds": ["..."],
  "trigger": {
    "qKind": "placement_movement 或 placement_room_state",
    "relation": {}
  },
  "requiredReads": ["允许读取的注意路径或模板"],
  "bindings": {
    "变量名": {"op": "..."}
  },
  "output": {
    "kind": "set_movement_amount 或 set_noticed_room_state",
    "fields": {}
  }
}
```

`bindings`按JSON字段顺序依次求值，后面的binding可以引用前面的变量。

## 触发关系

`trigger.relation`只允许使用：

- `roomTypes`: 只适用于这些房间类型；
- `excludedRoomTypes`: 排除这些房间类型；
- `cellCount`: 房间格数必须相等；
- `minimumCellCount`: 房间格数至少为多少。

房间类型只有：`aa`、`energy`、`fighter`、`research`。

## 可读取的注意路径

- `event.dieValue`
- `room.id`
- `room.type`
- `room.cellIds`
- `room.modifier`
- `room.energyCost`
- `room.cell:${cellId}.occupied`
- `room.cell:${cellId}.dieValue`

不能读取规则答案、引擎状态或不在列表中的路径。`requiredReads`必须覆盖程序可能执行的每个读取；动态格子路径用上面的`${cellId}`模板声明。

## 表达式

普通JSON数字、字符串、布尔值、null、数组和无`op`字段的对象都是字面模板；模板内部仍递归计算表达式。

只允许以下表达式：

```text
{"op":"read","path":"room.id"}
{"op":"read_template","template":"room.cell:${cellId}.occupied"}
{"op":"var","name":"cells"}
{"op":"get","from":<表达式>,"key":"occupied"}
{"op":"map","items":<表达式>,"as":"cellId","value":<表达式>}
{"op":"filter","items":<表达式>,"as":"cell","where":<表达式>}
{"op":"length","value":<表达式>}
{"op":"eq","left":<表达式>,"right":<表达式>}
{"op":"not","value":<表达式>}
{"op":"add","values":[<表达式>, ...]}
{"op":"subtract","left":<表达式>,"right":<表达式>}
{"op":"max","values":[<表达式>, ...]}
{"op":"sum","items":<表达式>}
{"op":"pluck","items":<表达式>,"key":"dieValue"}
{"op":"first","items":<表达式>}
{"op":"if","condition":<表达式>,"then":<表达式>,"else":<表达式>}
```

`map`/`filter`中的`as`变量只在内部表达式有效。`read_template`可以用当前局部变量替换`${变量名}`。

## 输出合同

`set_movement_amount.fields`必须只有：

- `amount`: 非负数字表达式。

`set_noticed_room_state.fields`必须恰好产生：

- `roomId`
- `roomType`
- `occupiedCells`: 格子ID数组
- `missingCells`: 格子ID数组
- `complete`: 布尔值
- `roomValue`: 数字或null
- `energyCost`: 数字
- `roomPhaseStatus`: `ready_but_not_resolved`、`setup_only_incomplete`或`no_room_phase_output`

规则没有说当前房间已经实际结算，因此不能直接增加能源、推进研究或击毁飞船。

## 提交要求

- 根对象采用模板schema并包含5个程序，programId不得重复。
- `authoringAudit.allowedInputsUsed`只能列出本合同允许的三个文件。
- 不得添加JavaScript、Python、正则、函数体或任意代码字符串。
- 规则不足时应保守表达，不能依据常识补规则。
