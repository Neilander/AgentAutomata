# 可粘连动作合同 V1

目标不是把整条规则写成一个巨大函数，而是把玩家读到的每句话编译成若干个可重新组合的局部接口。

## 最小单位：Glue Unit

一个粘接单元表示：

```text
上一动作及其结果满足 trigger
→ 如有需要，建立 attention.region
→ 用 attention.query 筛选关注对象
→ emit 一个或多个新的原子动作
→ 新动作的结果可以继续触发别的 Glue Unit
```

机器结构：

```json
{
  "id": "稳定且不依赖案例实体编号的名字",
  "sourceRuleId": "R01",
  "trigger": { "action.type": "place" },
  "attention": {
    "region": {
      "mode": "flood",
      "seed": "$result.to",
      "maxDepth": 12,
      "connectionKinds": ["same_column", "sky_down"]
    },
    "query": {
      "mode": "all",
      "keep": { "type": "ship" }
    },
    "forEachMatch": true
  },
  "emit": [
    { "type": "notice", "entityId": "${match.entityId}", "label": "准备处理飞船" }
  ],
  "priority": 0,
  "schedule": "immediate"
}
```

## 五个组成部分

1. `sourceRuleId`：这条粘接从哪句玩家可见规则得出，防止偷加知识。
2. `trigger`：只描述已经发生的动作、动作结果、当前实体/空间或工作记忆；不能写“最后应该怎样”。
3. `attention`：可选。先定义空间区域，再筛选区域中的实体或格子。没有观察需求的纯参数修正可以省略。
4. `emit`：真正粘到链尾的原子动作。动作执行后会自然形成下一次触发输入。
5. `priority/schedule`：同一动作触发多条规则时，高优先级先入队；`chain_end`只用于确定性后果全部结束后才发生的边界。

## 原子动作

- `notice`：把某个实体/落点带到下一层注意；本身不改变世界。
- `compute`：从当前上下文写入一项临时工作记忆。
- `adjust`：修正已有数值，可带`min/max`。
- `place`、`relocate`、`move_along`、`remove`、`damage`、`reveal`、`create`：改变世界。
- `decision`、`random`、`unknown`、`outcome`：明确结束当前可确定推演的边界。

### 精确输入与输出

Action禁止携带表外字段。下面的`result`是动作完成后提供给下一条规则的字段：

| Action | 必需输入 | 可选输入 | result |
|---|---|---|---|
| `notice` | `label` | `id, entityId` | `noticed` |
| `compute` | `key, value` | - | `key, value`，同时写入`memory[key]` |
| `adjust` | `key, delta` | `min, max` | `key, value, delta` |
| `place/relocate` | `entityId, targetUnitId` | - | `entityId, from, to` |
| `move_along` | `entityId, connectionKind`以及`distance`或`distanceFrom` | `direction` | `entityId, from, to, requestedDistance, path` |
| `remove/reveal` | `entityId` | - | 对应移除/翻开结果 |
| `damage` | `entityId, amount` | - | `entityId, hpBefore, hpAfter, amount` |
| `create` | `entity` | - | `entityId, created, to` |
| `decision` | `owner, reason` | - | 自己或他人决策终点 |
| `random` | `reason` | `possibilities` | 随机结果终点 |
| `unknown` | `reason` | - | 知识缺口终点 |
| `outcome` | `outcome, reason` | - | 已知结果终点 |

`move_along`只产生一次动作完成事件，`result.to`是最终停留格，`result.path`只是数据，不会逐格触发规则。因此“只结算最终停留格”不需要发明`resolutionMode`一类字段。

### 可修正参数的标准粘接法

如果后续规则可能修正一个动作的参数，不能立刻发出该动作，也不能修改尚不存在的`pending_action`。标准形式是：

```text
compute 临时参数
→ notice“准备执行X”
→ 高优先级规则 adjust 临时参数
→ 低优先级规则读取 distanceFrom 并执行X
```

这让“防空使下降量-1”之类规则能插在准备与执行之间，也能被独立拆卸。

## 可用引用

- 精确引用：`$action.*`、`$result.*`、`$entity.*`、`$targetUnit.*`、`$resultUnit.*`、`$memory.*`、`$match.*`。
- 字符串插值：`descent-${match.entityId}`。
- 规则必须按类型、标签、连接或关系找对象，禁止写死示例飞船ID，如`ship-purple`、`ship-white`、`purple-0`。
- 世界中唯一的语义对象允许固定ID：`city`、`mothership`、`mothership-waiting`。
- 单元的类型字段叫`kind`，如`resultUnit.kind`；实体的类型字段才叫`type`。
- 条件数组运算只写成`{ "includes": "tag" }`或`{ "excludes": "tag" }`，不存在`.contains`路径。
- 实体数值位于`entity.state.*`；例如骰子点数是`$entity.state.value`。
- 每次注意只提供单个`$match`；多对象必须使用`forEachMatch: true`，不存在`$matches`集合引用。

## 注意力接口

- 区域模式：`unit`、`flood`、`rays`。
- 筛选模式：`all`、`first`、`first_by`、`nearest_per_direction`、`random_one`。
- 筛选对象默认为实体；`target: "unit"`表示筛格子。
- `forEachMatch: true`表示每个匹配对象各生成一组动作。

## 程序结构与逐句编译

```json
{
  "schema": "glue_program_v1",
  "steps": [
    {
      "sourceRuleId": "R01",
      "interpretation": "只复述本句产生的局部因果",
      "units": []
    }
  ]
}
```

编译必须按`R01 → R08`追加，不回写旧步骤。某句明确没有即时动作时，保留步骤并令`units: []`。后一句可以触发前一句产生的动作，这就是“粘连”；不允许把多句折成一个不可拆的大函数。

## 运行语义

- Glue Unit 在声明数组中的先后位置不代表因果先后；`trigger`匹配才代表连接。
- 同一触发点需要“先修正参数、后使用参数”时，用`priority`表达局部顺序。
- 随机、他人决策、自己需要重新选择、知识不足以及已知胜负都是不同终点。
- 编译器不补游戏常识。规则没有说的效果必须停在`unknown`或根本不生成。
