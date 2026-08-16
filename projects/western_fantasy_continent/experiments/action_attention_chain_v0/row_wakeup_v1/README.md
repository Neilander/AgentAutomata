# 矩阵行唤醒 V1

这层只解决一个问题：Agent 在看到局部变化事实后，不再直接输出动作，而只返回稳定知识行号 `W001...` 与结构化举证。程序校验举证后，从私有 payload 读取下一动作并执行。

- Agent 可见：`rowId`、来源规则、触发描述、`requires`。
- Agent 不可见：`emit`、下一动作、调度方式。
- Agent 输出若包含 `action/emit/nextAction/payload/then` 会被拒绝。
- 无即时效果也是正式知识行，payload 为零动作并明确停止。
- 当前 8 行是知识行；embedding 的例句展开行不暴露为知识地址。

运行：

```powershell
node test-row-wakeup-runtime.js
```
