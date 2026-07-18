# Agent 交接：玩家认知三块隔离与角色身份修正

- 日期：2026-07-18
- Agent/任务：Codex `/root`
- 范围：旧角色认知、非角色事件筛选、换人预期的隔离组合；修正 `left-*` 临时站位身份
- 状态：隔离组合与真实22场验证完成；身份修正已接正式角色认知，非角色过滤器仍未正式接入

## 用户意图

把旧角色认知、新的垃圾信息过滤和换人预期拆成三块各管各的，先组合成隔离模块验证；修正 `left-2` 等临时站位无法对应真实角色的问题，并展示最终会产生哪些知识。

## 已完成

- 新增稳定角色身份适配器。每场根据当前四人队伍和可见角色名称，把 `left-1` 等战斗内站位映射回永久角色ID。
- 身份适配器已经接入正式 `player-agent-loop` 的旧角色认知入口；没有修改强度矩阵、前30%标尺或特点修正规则。
- 将 `received-information-organizer.js` 收窄为“非角色事件过滤器”，只输出类型1因果候选和概率机会。
- 我方伤害、治疗、护盾、状态、技能、倒下等角色信号在非角色过滤器形成观察前就被分流，不会写角色认知或换人历史。
- 新增三块隔离组合模块：
  - 旧角色认知读取详细可见战斗表现。
  - 非角色过滤器读取胜负、敌方、场地、奖励、地图、解锁、概率机会。
  - 换人预期读取更新后的角色认知、四人阵容、装备和本场结果。
- 使用同一个真实两章22场存档重新运行三块组合。
- 更新中文设计文档、运行说明和任务板；明确旧V2统一四路设计已被取代。

## 修改文件

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/stable-character-event-adapter.js`：每场临时站位到永久角色身份的适配器。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：正式角色认知入口使用稳定身份报告，并保存身份审计。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/isolated-player-cognition-composition.js`：三块隔离组合程序。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/received-information-organizer.js`：收窄为非角色事件与概率两路，不再处理角色或换人。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-isolated-player-cognition-composition.js`：真实22场隔离验证与知识示例。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-received-information-organizer.js`：非角色边界、三档感知、概率和内部信息拦截测试。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-player-agent-roster-a-integration.js`：正式流程身份映射回归。
- `projects/western_fantasy_continent/design/ISOLATED_PLAYER_COGNITION_COMPOSITION_V1.md`：中文架构、样例与数字。
- `projects/western_fantasy_continent/design/RECEIVED_INFORMATION_ROUTER_V2.md`：标记旧V2已被取代。
- `projects/western_fantasy_continent/design/RECEIVED_INFORMATION_SHADOW_COMPARISON.md`：补充旧对比中的角色特点证据限制。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、实验README、任务板：登记新边界和下一步。

## 验证

- 三块真实22场组合：PASS。
- 角色覆盖：`88/88` 个角色场次。
- 角色知识残留 `left-*`：`0`。
- 详细可见事件成功对应永久角色：`2219` 条。
- 达到特点复核门槛的证据：`80` 条；其中高可靠 `42` 条。
- 已覆盖特点领域：治疗 `19`、群体输出 `38`、持续伤害 `23`。
- 换人历史：`22/22` 场，每场均保存四人更新后认知快照。
- 非角色过滤器精准测试：窄幅/普通/宽幅接收 `7/10/10` 条非角色信号；角色信号在形成该分支观察前分流；内部 `diagnosis`、实验结算和原始ID未暴露。
- 旧角色认知模型回归：PASS。
- 换人预期模型回归：PASS。
- 正式换人A集成与正式角色身份审计：PASS。
- 正式因果循环：PASS。

## 当前状态

第一块会产生角色强度位置、相对前30%标尺的等级、群攻/持续伤害/治疗等特点及其环境修正。第二块会产生胜负、敌方攻击表现、可见场地、实际奖励、地图/角色解锁和概率机会。第三块保存关卡、胜负、连续表现分、四人阵容、装备和更新后的四人角色认知，作为之后换人预测的依据。

旧正式流程此前虽然能靠结算伤害更新角色强度，但 `left-*` 与永久角色ID不匹配，细特点只得到低可靠兜底证据。现在恢复了旧模型原本需要的详细事件输入。

## 未解决

- 非角色过滤器仍是隔离程序，尚未替换正式类型1知识入口；必须先让用户审阅实际知识。
- 当前22场真实样本只产生了治疗、群体输出、持续伤害三类合格特点证据；单体输出、护盾、控制、耐久没有在这批记录中达到门槛，不能把“未覆盖”误报成“已验证”。
- `left-*` 当前以同场唯一可见角色名称为主要对应依据；适配器会拒绝无法对应或同名歧义，但还没有专门的“同队两个同名角色”游戏样本。
- 概率分布模型本身仍是后续任务；本次只保证概率机会进入专属分支。

## 建议下一步

先让用户确认本次展示的三类知识是否符合预期。通过后，只把“非角色事件过滤器”接入正式类型1和概率入口；保留旧角色认知的详细报告入口，并补单体、护盾、控制、耐久及同名角色的精准边界测试。
