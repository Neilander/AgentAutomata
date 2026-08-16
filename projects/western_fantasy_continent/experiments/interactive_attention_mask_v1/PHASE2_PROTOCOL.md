# 阶段 2：交互式注意力遮罩

你只能读取：本文件、`public_start.json`、你自己的 `agent/memory.json`，以及环境逐轮生成的 `transcript/round_N_response.json`。禁止读取 `sealed/`、`runtime/`、`masked_env.js`、期望、评分器和仓库其他 UFS 文件。

环境不会一次展示完整场景。每一轮，你必须对每个仍活跃的案例提交恰好一个命令；环境只返回该命令允许看到的局部信息或执行结果。上一轮一旦提交，不得修改。

写入 `transcript/round_N_request.json`：

```json
{
  "schema": "masked_attention_request_v1",
  "round": 1,
  "commands": [
    {
      "caseId": "case-id",
      "kind": "focus",
      "operation": "inspect_base_cell",
      "target": "base-c0",
      "reason": "为什么现在关注它",
      "expectedWakeup": "它可能唤醒什么动作；没有则为null"
    }
  ]
}
```

可用关注命令：

- `inspect_base_cell`：查看初始动作所用基地格的局部属性。
- `inspect_column_occupants`：查看指定列当前有哪些飞船及位置，target 使用列 ID，例如 `column-0`。
- `inspect_ship_cell`：查看指定飞船当前所在格的局部特征，target 使用飞船 ID。
- `inspect_mothership_row`：查看母舰当前行局部特征，target 使用 `mothership`。
- `inspect_unplaced_dice`：查看尚未放置的骰子集合，target 使用 `unplaced-dice`。

可用动作命令（`kind: "act"`）：

- `resolve_column_descent`，target 使用列 ID。
- `follow_arrow`，target 使用飞船 ID。
- `resolve_city_hit`，target 使用飞船 ID。
- `lower_mothership`，target 使用 `mothership`。
- `resolve_no_immediate_effect`，target 使用飞船 ID。
- `reroll_unplaced_dice`，target 使用 `unplaced-dice`。
- `declare_loss`，target 使用 `game`。
- `finish_case`，target 使用 `case`。

动作只有在其所需事实已由此前关注命令揭示时才会被接受。环境拒绝的命令也永久记录。不要猜测被遮罩的信息；依靠阶段 1 记忆决定下一步关注什么。

