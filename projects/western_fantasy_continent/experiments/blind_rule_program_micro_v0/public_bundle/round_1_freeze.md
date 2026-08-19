# 第 1 轮新增公开材料

## RULE-FROZEN-STAYS

在 `RULE-BASE-COLUMN-MOVE` 的目标筛选上增加例外：`frozen == true` 的对象不移动；同列且 `frozen == false` 的对象仍按基础规则移动。该例外不改变非 `place_die` 事件行为。

唯一可见失败反例（第0轮旧版会错误移动 `ice`）：

```javascript
const state = {
  event: {type: "place_die", column: "C", amount: 3},
  objects: [
    {id: "ice", column: "C", row: 4, frozen: true},
    {id: "free", column: "C", row: 8, frozen: false},
  ],
};
const expected = [{object_id: "free", from_row: 8, to_row: 11}];
```

请只做局部修订，并把 `RULE-FROZEN-STAYS` 追加到 `SOURCE_RULE_IDS`。
