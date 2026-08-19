# 第 2 轮新增公开材料

## RULE-NEAREST-CITY-TIES

当且仅当 `event.selection == "nearest_city"` 时，对基础规则与冻结例外得到的候选整组做相对选择：读取这些候选各自的公开整数 `city_distance`，求整组最小值，只移动 `city_distance` 等于该最小值的所有对象；若最小值并列，必须保留全部并列对象，并仍按输入顺序输出。冻结对象与异列对象先被排除，不能参与最小值。没有候选时返回空列表。

当 `event.selection` 缺失或不是 `nearest_city` 时，不做该整组归约，继续保持前两轮行为。`nearest_city` 场景保证每个基础候选都有公开 `city_distance`。

唯一可见失败反例（第1轮旧版会多移动 `far`）：

```javascript
const state = {
  event: {type: "place_die", column: "H", amount: 2, selection: "nearest_city"},
  objects: [
    {id: "far", column: "H", row: 1, frozen: false, city_distance: 4},
    {id: "nearA", column: "H", row: 3, frozen: false, city_distance: 1},
    {id: "nearB", column: "H", row: 8, frozen: false, city_distance: 1},
    {id: "iceNear", column: "H", row: 6, frozen: true, city_distance: 0},
  ],
};
const expected = [
  {object_id: "nearA", from_row: 3, to_row: 5},
  {object_id: "nearB", from_row: 8, to_row: 10},
];
```

请只做局部修订，并把 `RULE-NEAREST-CITY-TIES` 追加到 `SOURCE_RULE_IDS`。
