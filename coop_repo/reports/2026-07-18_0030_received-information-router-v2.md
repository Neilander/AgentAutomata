# Agent 交接：接收信息统一路由层 V2

- 日期：2026-07-18
- Agent/任务：Codex `/root`
- 范围：否决通用知识账本，把接收信息层重做为符合既有知识体系的纯分流层
- 状态：独立程序完成，尚未接入正式玩家 Agent

## 用户意图

重新实现“统一层”，但必须保留此前已经完成的知识设计：类型1因果知识、类型2角色强度与特征印象、概率机会账本、换人历史和期待结算各自独立，不能用一个新账本覆盖。

## 已完成

- 删除独立整理器中的通用知识账本接口、统一 `0.94` 衰减和通用置信度公式。
- 统一层现在只做“接收观察整理 + 四路分流”：
  - 类型1主体－环境－行为－结果知识。
  - 类型2角色印象证据。
  - 概率机会账本。
  - 换人历史。
- 类型2路由只提供每名角色的可见贡献、尝试领域和公开证据，不计算角色位置、强度等级、前30%标尺或特征修正。
- 换人历史要求战斗结果和队伍上下文同时存在；角色快照明确从本场更新后的旧角色印象状态读取。
- `action_summary`、`team_experiment_result` 和 A/C 等内部期待结算不进入知识路由。
- 战斗信息解析器补充“本次奖励机会成功/未成功”的玩家可见概率信号。
- 奖励机会使用独立最低接收率，避免把奖励界面信号混入并改变已经冻结的战斗画面感知均值。
- 旧 V1 文档明确标为否决；新增 V2 中文设计说明。
- 任务板改为影子接入方案，禁止一次性删除旧知识入口。

## 修改文件

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/received-information-organizer.js`：重做为 V2 纯路由器。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-received-information-organizer.js`：改为四路、四角色、概率、换人上下文和越界精准测试。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：增加玩家可见的奖励概率机会候选。
- `projects/western_fantasy_continent/design/RECEIVED_INFORMATION_ROUTER_V2.md`：新增当前中文设计与接入边界。
- `projects/western_fantasy_continent/design/RECEIVED_INFORMATION_ORGANIZER_V1.md`：明确标记旧通用账本方案已否决。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：登记 V2 隔离路由层。
- `projects/western_fantasy_continent/design/task-budget-board.json`：更新为影子接入和逐路关闭旧入口。

## 验证

- V2 路由精准测试通过：
  - 355事件固定样本低/普通/高感知接收 `11 / 16 / 22` 条观察。
  - 因果路由为 `10 / 15 / 21` 条。
  - 三档均生成一个角色印象证据包和一个换人历史路由；概率机会按接收结果进入专用账本。
  - 四名角色在同一场分别形成贡献证据，路由器不输出强度位置、等级或标尺。
  - 治疗与护盾保持不同能力领域。
  - 未接收背景治疗产生零路由。
  - 缺少队伍上下文时不会伪造换人历史。
  - 原始 `diagnosis`、事件 ID、敌方内部身份均未泄漏。
- 战斗信息解析测试通过。
- 八档信息呈现测试通过，真实战斗非锚点均值仍为低/普通/高 `0.2423 / 0.4848 / 0.7532`。
- 原角色印象矩阵测试通过。
- 原换人预测、换人边界、A结算、确认感/装备/惯性测试通过。
- 因果闭环测试通过。
- JavaScript 语法、任务板 JSON 和 `git diff --check` 通过。

## 当前状态

当前程序结构为：

```text
原始事件
→ 玩家感知筛选
→ 玩家可理解的结构化观察
→ 类型1 / 类型2 / 概率 / 换人历史
```

V2 没有被 `player-agent-loop.js` 引用，因此正式 Agent 的旧知识来源、角色印象矩阵、概率账本、换人预测和 A/C 结算都没有被替换或重写。此前一周成果仍由原代码负责。

## 未解决

- 正式知识链仍会读取旧事件输入，其中敌方威胁知识还包含原始 `diagnosis` 展开；本次刻意没有删除。
- V2 的四条路由还没有分别接入旧更新函数。
- 奖励机会最低接收率是当前界面语义下的首版固定值，需要在真实前端奖励界面确定后复核。
- Agent 归因仍未限制为只能引用公开信号 ID。

## 建议下一步

用户验收 V2 输出后，先做影子接入：一场战斗同时保留旧正式输入和 V2 路由结果，逐条比较类型1、类型2、概率和换人历史。每一路单独通过后再关闭该路旧入口；最后才删除原始 `diagnosis` 知识入口。
