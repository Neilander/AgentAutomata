# 动作—注意力预想 V2

V1把规则写成“某事件发生时执行什么”，更像规则引擎。V2改成玩家预想模型：

```text
上游产生一个动作意图
→ 把意图粘到某个可复用动作的入口
→ 动作展开自己的注意力区域
→ 在假想世界中预测状态变化
→ 从动作出口继续粘接后果
→ 用假想结果匹配当前目标
```

动作定义没有全局`trigger`。例如`ship_descend`只定义：输入哪架飞船与距离、向下路径怎样成为注意力区域、预测飞船落到哪里、从`landed`出口带出什么。放骰、随机额外移动或其他规则都可以把自己的出口粘到同一个入口。

真实世界只作为预想起点，整个链条只修改`imaginedWorld`。注意力记录路径、起点、终点和沿途可见标签；UFS“只结算最终格”通过动作出口把终点标为可继续粘接的位置，不代表玩家完全看不到路径。

运行：

```powershell
node logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/imagination_v2/test-imagination-v2.js
```

