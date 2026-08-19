# 阶段 1：只读规则，冻结记忆

你是第一次接触这组局部规则的玩家。只允许读取本文件与 `rules/R01.txt` 至 `rules/R08.txt`。

把规则整理成可复用的动作 schema、注意力预设、动作粘连记忆、明确的无动作边界与随机停止边界。不得读取阶段 2 协议、公开开局、密封场景、期望、环境代码或其他仓库文件。

输出到 `agent/memory.json`。JSON 至少包含：`schema`、`sourceRuleIds`、`actionSchemas`、`attentionPresets`、`glueMemories`、`noActionMemories`、`stopBoundaries`。

