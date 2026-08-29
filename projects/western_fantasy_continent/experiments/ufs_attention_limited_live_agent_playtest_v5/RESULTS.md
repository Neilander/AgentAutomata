# UFS 受注意限制现场试玩 V5：结果

## 封卷结论

本次唯一 Attempt 从一次且仅一次 `start` 推进到下一回合边界。最终公开响应为 `status=complete`、`reason=one_round_imagined_to_next_round_boundary`、`phase=new_round`，无 pending、无可用操作，`actionCount=13`。按协议没有发送后续命令。

最终裁剪视图公开的轨道是：damage 0、energy 1、excavatorIndex 2、mothershipRow 0、researchIndex 1；`outcome=null` 表示这是下一回合边界而非公开的胜负终局。本报告不据此推断未出现对象或未来局势。

## 真实动作过程

1. 用灰 3 放入 `A-upper-research`。该选择保留灰 2 + 灰 4 的稳定组合，避免把能量房完成依赖到会重掷的白骰。
2. 新视图注意到紫色船出现在第 5 列后，把灰 2 放进该列的能量格，把灰 4 留给另一格；随后灰 4 完成能量房。
3. 注意到爆炸 4 目标后，把白 5 放入修正 -1 的战斗机房，形成数值 4；这触发了唯一一次真实 `random` 边界。
4. CLI `random` 公开白骰实际变为 2；把它放进距离 2 的 `A-r3-c3`，随后在房间阶段支付 1 energy 挖掘，excavatorIndex 从 0 到 2。
5. 第一次解析能量房时遗漏显式 `pay:true`，操作被原子拒绝且 actionCount 保持 6；补上公开要求后成功，energy 从 2 到 5。
6. 解析战斗机房并支付后，视图中对应紫色目标消失；随后解析研究房，energy 降到 1，并真实出现研究推进选择。
7. 当前 pending 显示 budget 3、连续成本首格 3、`maxAdvanceSteps=1`；独立选择并提交 `advanceSteps=1`，researchIndex 从 0 到 1。
8. `end_rooms` 后母舰轨道从 -1 到 0，并出现紫色船 `purple-2` 的 spawn 候选 `DP-C3 / DP-C4`。依据工作记忆中第 3 列的防御 / 路线信息选择 `DP-C3`。
9. 公开 README 与 CLI help 未说明 `choose_spawn` 参数字段。九个保持 `DP-C3` 不变的字段猜测均被原子拒绝，pending、候选及 actionCount 12 均未改变。公开合同补充明确 `dropPointId` 后，提交 `DP-C3` 成功并到达 `complete / new_round`。

## 真正改变选择的注意反事实

第二步并非预定脚本照走。若新视图没有注意到第 5 列的 `purple-4`，两枚灰骰在能量房两格上的分配近似对称；正因为它被注意到，选择才改变为让较小的灰 2 进入该列、让灰 4 去另一列，从而把已知船的下降量减少 2。另一个实际改变是白骰重掷：若仍为 1，就不满足工作记忆中的距离 2 挖掘条件，会改投 AA / tunnel；真实结果 2 才使挖掘路线成立。

## 注意限制与错误容忍

每步只把当前裁剪视图中出现的内容与自身真实动作记忆当作依据。对象没有出现在某次 placements、ships 或 map crop 中时，一律记作未知而非不存在。过程保留了玩家遗漏 `pay:true` 的规则错误，也保留了 spawn 参数文档缺口引发的九次编码错误，没有用私有 checkpoint、实现源码或旧实验动作序列回填正确答案。

## 接口观察

- 正向：被拒绝的请求保持 checkpoint 原子性；actionCount、pending 与候选都没有漂移，因此同一 Attempt 可以安全修正编码。
- 缺口：公开合同列出了 `choose_spawn`，却未公开其必需字段 `dropPointId`。这会让只读公开合同的玩家无法从 `pending.candidates` 唯一构造请求。
- 建议：在公开 README 与 CLI help 中加入最小示例：`{"type":"choose_spawn","shipId":"…","dropPointId":"DP-C3"}`，并使 pending 可选地给出参数 schema。

## 证据边界

固定 seed 只验证为子进程环境注入 `2026082451`；CLI 没有公开回显实际消费值。私有状态只由 CLI 写入被忽略目录，玩家从未读取或列举其内容。所有结论均可由 `machine-transcript.json` 指向的逐字 stdout、choice 与 thought log 复核。
