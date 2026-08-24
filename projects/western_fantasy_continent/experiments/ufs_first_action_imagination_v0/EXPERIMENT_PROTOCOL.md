# UFS 第一步选择→单步设想隔离实验 V0

## 冻结目标

把上一轮真实状态实验已经锁定的第一步接入现有问题1—6设想流水线：只展开该动作引发的自动后果，一到下一次需要玩家选择骰子和位置时立即停止。

明确不做：

- 不选择第二步；
- 不比较第二步候选；
- 不把“完成能源房”等计划意向当成已经发生；
- 不读取白骰未来重投、隐藏seed、rngState或引擎history；
- 不做反馈学习。

## 输入

1. `ufs_real_state_candidate_exam_v0/submissions/agent_01.md` 中的三行 `SELECTION A/B/C`。
2. 与上一轮完全相同的三个玩家公开状态。
3. 用户核对过的 Roswell A+B、威胁0公开地图。
4. 现有 `imagination_pipeline_v0` 的动作→注意→五槽Q→轨迹唤醒→关系核对→参数绑定→imaginedWorld补丁→停止边界。

`selection-adapter.js`只把自然语言选择行解析成精确的 `place_die` 动作。若同色同点数未放骰不唯一，适配器拒绝猜测。

## 设想顺序

```text
选定的 place_die
→ 复制公开状态
→ 记录骰子占据基地格
→ 放置动作生成“同列移动”和“所在房间状态”两条注意Q
→ 五槽记忆Top-3且激活≥0.55才进入关系门，再核对房间类型与格数
→ grounding只读取已注意的骰值、房间格占用、修正和能耗
→ 得到防空修正后的实际下降量与暂时房间状态
→ 同列飞机在 imaginedWorld 中移动
→ 展开确定的落点自动后果
→ 若仍有骰子未放：choice / next_player_decision
```

房间结果不再由适配器直接投影。`placement-rule-imagination.js`从注意到的当前动作和房间事实生成严格五槽Q，经矩阵Top-K、关系核对和规则grounding后，才向临时 `imaginedConsequences` 提交房间状态。

若没有注意到完整房间事实，输出 `attention_stop` 且没有房间结果；若规则记忆为空，输出 `unknown` 且适配器不得补算答案。不完整房间可以产生“缺少哪些格”的脑内结果，但房间阶段尚未发生，因此不提前增加能源、研究或击毁飞机。

## 引擎隔离

- `ufs-first-action-imagination.js`不导入正式规则引擎、状态夹具或 `applyWorkerPlacement`。
- `placement-rule-imagination.js`同样不导入正式引擎；房间完整性和房间值只能由被唤醒的规则grounding产生。
- 正式引擎只在测试末尾作为事后oracle，对照脑内副本和真实动作执行后的飞机位置、骰子占用。
- oracle结果不回流到选择适配器或设想过程。

## 通过条件

- 三个选择都能从上一轮答卷解析成唯一结构化动作。
- `observedWorldUnchanged=true`。
- 自动后果与正式引擎事后结果一致。
- 最终边界为 `choice / next_player_decision`。
- `stoppedBeforeSecondAction=true` 且 `nextAction=null`。
- 删除房间注意后，不能产生房间结果；删除放置规则记忆后，不能由适配器直算移动或房间答案。
- 低激活候选不能仅靠关系元数据匹配获得执行资格。
- 独立评审未发现隐藏知识、第二步越界或把未来房间效果提前兑现。
