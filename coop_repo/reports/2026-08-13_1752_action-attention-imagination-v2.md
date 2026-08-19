# Agent Handoff: 从规则执行器改为动作—注意力预想器 V2

- Date: 2026-08-13
- Agent/thread: Codex root
- Scope: 修正“全局触发规则执行”的模型偏差，建立可复用动作入口、注意力展开、预测出口与目标匹配
- Status: complete

## User Intent

动作应当被不同上游黏上，而不是自身绑定全局触发条件；飞船下降必须展开下降注意力区域、预想路径和终点后果。整个系统服务于AI试玩时预想结果并判断是否match目标，不是代替游戏程序结算。

## Completed

- 保留V1作为错误路线证据，隔离新增`imagination_v2`。
- 动作定义不再包含全局trigger；只包含入口参数、空间展开算子、注意力形状、状态变化倾向和命名出口。
- 胶水链接独立表达“某动作出口 → 另一个动作入口”，因此同一个`ship_descend`可被放骰与随机额外移动两个上游复用。
- `ship_descend`展开有向路径注意力：动作主体、起点、沿途路径、终点、连接，以及可见格与可触发后果格的区分。
- UFS只结算最终落点不等于不注意路径：路径全部进入可见注意力，但只有endpoint进入后果匹配。
- 箭头落点从`landed`出口粘接横移；横移的新落点再次使用同一后果接口，并可继续粘接城市伤害与飞船返航。
- 运行全程复制观察世界并只修改`imaginedWorld`；原始`observedWorld`保持不变。
- 增加最小目标match：预想完成后检查“城市是否仍保持目标血量”。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/imagination_v2/imagination-runtime-v2.js`: 假想世界、动作展开、注意力区域、端口胶水与目标匹配运行器。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/imagination_v2/ufs-imagination-case-v2.js`: UFS动作定义及可重组胶水案例。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/imagination_v2/test-imagination-v2.js`: 5项核心语义测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/imagination_v2/README.md`: V1/V2差异和运行说明。

## Validation

- V2测试：PASS，5/5。
- 观察世界不变，假想世界独立改变。
- 飞船下降注意力准确包含起点、1个沿途格、终点及两段连接；全部路径可见，仅终点可触发后果。
- 完整预想链：放骰 → 下降 → 箭头横移 → 城市受伤 → 飞船返航。
- 同一个`ship_descend`被放骰出口与随机选船出口分别粘接成功。
- 移除随机胶水后，仅随机后果停止，基础下降和其他链接不受影响。
- 城市目标检测正确返回不匹配。
- V1合同7项、盲编译18项、旧注意力链5项全部回归PASS。
- 新增JS`node --check`与实验目录`git diff --check`: PASS。
- independent_review: not_run（本轮为用户纠偏后的最小架构重建，未要求子Agent）。

## Current State

V2现在表达的是“玩家脑内尝试一个动作并预想后果”：上游意图粘到动作入口，动作主动生成注意力区域，在假想世界中预测变化，再从出口继续展开后果，最终检查目标。这与V1的事件监听式规则引擎有本质差别。

## Unresolved

- 当前动作定义仍由代码手工提供；尚未让AI从规则中生成V2的动作入口、注意力展开和出口。
- 注意力目前是完整确定路径，尚未加入注意力预算、模糊、漏看和不确定预测。
- 目标match只有最小状态条件，尚未接入之前的多维概念方向或高维符文匹配。
- 目前只展开一个起始构想；还没有生成多个候选构想并比较哪个最匹配目标。
- UFS防空修正、随机边界与正式引擎对照尚未移植到V2。

## Recommended Next Step

先冻结V2动作合同，再让子Agent只依据一条“飞船下降”规则生成`入口 → 注意力路径 → 状态倾向 → landed出口`，并分别由放骰和随机移动胶水调用。通过后再逐条生成箭头、城市等链接，不能继续沿用V1的trigger-rule合同。
