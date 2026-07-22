# 玩家反馈统一产出 V2：隔离试验说明

## 目的

这次试验不重新设计情绪公式，只把已经存在的反馈产出整理成一个可以继续扩展的统一边界。

当前正式情绪仍由 `player_feedback_bundle_v1` 驱动。`player_feedback_bundle_v2` 与它并行生成，只用于观察和对照；只要 V2 总量与 V1 不一致，运行时立即报错。

## 当前结构

```text
玩家可见语义证据
→ process / R / A / C / EVerify
→ 未来的情绪适配器（本次未接）
→ 24类情绪（本次未接）
→ 成就感、策略满足、发现满足等二层体验（本次未接）
```

V2 产出形状：

```js
{
  schema: "player_feedback_bundle_v2",
  evidence: {
    H, eventId, subject, environment, behavior, result, targets
  },
  channels: {
    process: {
      value,
      components: {
        decision: {
          EDecision,
          QDecision,
          decisionAuthorship,
          decisionContentAppraisal,
          insightEvent
        },
        reactive,
        mechanical,
        verificationEffort
      }
    },
    R,
    A,
    C,
    EVerify
  },
  stateTransitions: {
    agencyBefore,
    agencyPlanned,
    agencyAfter,
    planningRelief,
    learningControl,
    stucknessBefore,
    stucknessAfter
  },
  total,
  compatibility
}
```

## 已经做了什么

### 1. A 与 C 真正拆开

旧版换人反馈把两项相加后都放在 `A.value`：

```text
旧 A = 预期偏差 + 确认感 C
```

V2 将它们拆开：

```text
新 A = 预期偏差
新 C = 确认感
新 A + 新 C = 旧 A
```

例如旧版 `A=-0.14`，内部实际是预期偏差 `-0.20` 与确认感 `+0.06`。V2 输出：

```text
A = -0.20
C = +0.06
总量仍为 -0.14
```

没有确认感计算的普通事件输出 `C=0, status=not_applicable`，A 保持原值。

### 2. EDecision 进入过程模块

当前代码已经能从有效决策链得到粗粒度 EDecision，因此 V2 将它放入：

```text
channels.process.components.decision.EDecision
```

现有 `EDecision=0/1/4` 公式没有改变。

### 3. 未实现的值不再伪装成 0

以下内容目前还没有正式可执行计算，因此统一输出 `null`：

- `QDecision`
- `decisionAuthorship`
- `decisionContentAppraisal`
- `insightEvent`
- 全部 Agency / Stuckness 状态变化

`null` 表示“尚未建模或没有证据”，不能解释为“确定为零”。

### 4. 只接收玩家语义证据

V2 的 evidence 来自现有信号解释器之后的 `subject + environment + behavior + result`。它不新增 raw engine 输入，也不允许 Agent 自己填写反馈分数。

## 兼容保护

试验分支同时保留：

- `trace.feedback`：旧 V1，仍驱动当前 emotion；
- `trace.feedbackV2`：新 V2，影子记录；
- `feedbackV2.compatibility.oldTotal`：旧总量；
- `feedbackV2.compatibility.totalDelta`：新旧差值，必须为 0；
- `feedbackV2.compatibility.preservesLegacyTotal`：必须为 true。

运行时也会主动检查总量。这样可以先验证产出结构，再决定是否让新的情绪模型读取它，不会因为拆分 C 而重复奖励一次。

## 本次明确没有做

- 没有把隔离情绪模型接入正式玩家 Agent；
- 没有让 Agent 输出化学素或情绪值；
- 没有修改 R、A、C、EVerify 或旧过程反馈公式；
- 没有实现 QDecision、Agency、Stuckness；
- 没有把满足感、成就感压成一个总分；
- 没有改变当前玩家的下一步行为。

## 下一步试验

先由现有小案例与正式回归确认 V1/V2 信息等价，再单独设计“反馈 V2 → 生理/化学与认知输入”的适配器。适配器第一版应只使用有明确证据的少量关系；旧 emotion 与新情绪模型继续并行，禁止同时累加两套结果。

## 第一章真实 Agent 轨迹重放

使用 `inertial_player + ordinary + paired-alpha` 的历史真实 Agent 决策与归因，从同一初始状态用当前试验代码重放第一章：

- 20 轮击败第一章 Boss；
- 20/20 动作和胜负与来源轨迹一致；
- 975 条反馈记录全部同时拥有 V1/V2；
- 975 条 `V2.total` 全部等于 `V1.total`；
- EDecision 分布为 `0:11, 1:3, 4:6`；
- QDecision 和 Agency/Stuckness 预留值全部保持 `null`。

该轨迹的两次换人都换入当时没有已接受战斗认知的新角色，因此数值预测保持 unknown，没有产生 C。它证明 V2 可以覆盖完整第一章，不证明真实长流程 A/C 拆分；后者仍需一个换入已有认知角色的聚焦场景。
