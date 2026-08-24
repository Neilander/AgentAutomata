# UFS 受注意限制现场试玩 V4 结果

## 封卷结论

唯一 Attempt 已按协议封卷，终点是第六个玩家响应的：

```text
status = attention_stop
reason = next_endpoint_not_noticed
pending = placement(r1-white-4)
availableOperations = []
```

因此本局是 partial，不重抽注意、不改最后一手、不换路线。游戏命令序列严格为：

```text
start
→ advance gray4→upper research
→ advance white5→upper energy c5
→ random（CLI外部观察：gray2/gray3/white1仍为2/3/1）
→ advance gray3→upper energy c4
→ advance gray2→AA c1
→ advance white1→upper tunnel
→ attention_stop，封卷
```

## 逐步过程

| response | 边界 | 玩家操作/外部观察 | 下一状态 |
|---|---|---|---|
| 0 | choice/place_die | 灰4→`A-r2-c2`研究 | choice；紫船从c1r0转到c2r4 |
| 1 | choice/place_die | 白5→`A-r2-c5`能源 | random |
| 2 | random | CLI返回灰2、灰3、白1 | choice；紫船c4r5可见 |
| 3 | choice/place_die | 灰3→`A-r2-c4`能源，完成计划中的双格房 | choice |
| 4 | choice/place_die | 灰2→`A-r1-c1`防空 | choice；紫船c0r0→c0r1，母舰仍-1 |
| 5 | choice/place_die | 白1→`A-r2-c3`通道 | `attention_stop`，动作未完成 |

每一步的完整可见响应在 `views/`，选择在 `choices/`，逐步注意/unknown/候选/反事实/工作记忆在 `thought-log.jsonl`，机器顺序在 `machine-transcript.json`。

## 目标核验

- 尽可能完成一回合：未完成。抵达第五颗骰子的放置尝试，但该动作的 next endpoint 未被注意，尚在 dice phase 即停止。
- 越过母舰下降格修复：本 Attempt 没有真正落到母舰下降格，因此不能据此判定修复通过或失败。step4 决策曾基于本局先前实际注意到的 `purple-0@c0r0` 与 `sky_cell:2:0 mothership_down1` 选择灰2到c0；实际裁剪响应显示飞船只到c0r1、母舰仍为-1，未触发目标轨迹。
- `choose_research_advance`：未出现、未使用。研究骰虽然作为第一手提交，但房间阶段尚未开始。
- 旧V3问题是否复现：没有到达同一类目标事件，不能比较；也没有使用任何旧路线或旧答案。

## 认知质量观察

- 玩家没有把裁剪遗漏解释为空：船、骰子和 placements 在不同 crop 中频繁消失，thought log 一律区分“当前 noticed”与“先前工作记忆”。
- step4 的母舰机会来自 V4 自己在 step1/3/4 看过的局面，不是旧路线；但公开 AA 规则修正使灰2只推进飞船一格，这是本玩家在选择时没有正确预测的规则实例化误差。
- 最后一手只使用当步唯一 noticed 的基地格 `A-r2-c3`。即便 attention_stop 后另选当前 crop 新显示的格子可能绕开缺口，协议禁止重试，所以没有执行。

## 记录限制

response 1—6 均由调用 CLI 后自动把 stdout 逐字写入对应 JSON。start response 在启用这一自动捕获前已显示，但没有逐字落盘；`step-000-start-reconstructed.json` 是当场依据已显示内容重建的结构化记录，并明确 `verbatim=false`。没有为了补日志再次 `start`，因为那会违反唯一 Attempt。该限制不影响后续六个响应的逐字证据，但意味着“每步原始 view”要求在 step0 上仅部分满足。

## 合同验证

隔离与时序合同 8/8 PASS：见 `TEST_RESULTS.md`。测试只审计 V4 公开产物，未接触私有 host state 或任何禁读实现/答案。
