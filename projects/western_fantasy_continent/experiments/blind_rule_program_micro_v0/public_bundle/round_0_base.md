# 第 0 轮公开材料

## RULE-BASE-COLUMN-MOVE

当 `event.type == "place_die"` 时，所有 `column` 与 `event.column` 相同的对象移动 `event.amount` 格：`to_row = row + amount`。其他列对象不移动。

可见示例：

```python
state = {
  "event": {"type": "place_die", "column": "B", "amount": 2},
  "objects": [
    {"id": "p", "column": "B", "row": 1, "frozen": False},
    {"id": "q", "column": "A", "row": 7, "frozen": False},
  ],
}
expected = [{"object_id": "p", "from_row": 1, "to_row": 3}]
```
