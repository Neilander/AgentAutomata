# Agent Handoff: AI初设注意力的语义唤醒动作粘合MVP

- Date: 2026-08-15
- Agent/thread: Codex root
- Scope: 用一次AI注意力设置、非对象分支运行器和真实UFS规则验证在线唤醒—粘连循环
- Status: partial

## User Intent

开始唤醒机制MVP；注意力先由AI设置一次，之后再反复调试；必须检查实现没有退化成按对象或场景强硬定义答案。

## Completed

- 新建隔离`latent_wakeup_mvp_v1`，未改正式玩家Agent与V2运行器。
- AI依据6条玩家可见UFS规则一次性冻结移动/观察注意力预设和5条规则记忆。
- 实现在线循环：动作执行→注意路径/终点→局部变化→GTE语义Top-K→通用事实校验→粘动作→递归继续。
- 运行器没有箭头、城市、母舰、爆炸对象分支；规则目标概念、触发经验、必要事实与后续动作都在外部记忆预设中。
- 第一版4/8失败后只修通用召回：对象语义门槛、对象优先权重、Top-K逐条事实校验；注意力预设未调。
- 开发批次8/8，覆盖箭头→城市和母舰→骷髅两条递归链、改名换上游、负规则、路径非终点、未知和只观察。
- 冻结后新增7个留出case，6/7通过；高度换词的“白色大于号→右侧邻列”未达到对象门槛，本轮未继续调参。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/latent_wakeup_mvp_v1/ai_initial_model.json`：一次性AI注意力设置、召回设置与UFS记忆预设。
- `.../run_mvp.py`：通用在线注意—变化—召回—校验—动作循环和8个开发case。
- `.../run_holdout.py`：冻结后7个独立留出case。
- `.../test_contract.py`：检查冻结模型未泄漏场景ID、坐标、上游名称或角色改写词。
- `.../run-local.ps1`：离线GTE一键运行。
- `.../README.md`、`.../RESULTS.md`：合同、结果与边界。
- `.../artifacts/latest_results.json`、`.../artifacts/holdout_results.json`：完整结果。

## Validation

- `run-local.ps1`：PASS；合同测试通过，开发批次8/8，冻结留出6/7。
- 递归链：箭头→城市和母舰→骷髅均正确完成两次语义唤醒。
- 安全边界：路径经过、未知问号符号、只观察城市均未误粘。
- 唯一留出失败：白色大于号功能描述与右箭头记忆对象相似度0.6686，低于冻结0.70门槛。
- `py_compile`、实验目录`git diff --check`：PASS。
- independent_review: not_run（用户未要求子Agent，本轮为隔离MVP）。

## Current State

唤醒机制MVP已经能真实在线递归粘动作，并证明不需要在运行器里为每种UFS图案写分支。当前质量为开发8/8、冻结留出6/7：足以继续研究学习与记忆富集，不足以正式接玩家Agent。

## Unresolved

- 单次AI生成的少量规则表达无法稳定覆盖图形别称与高度改写。
- 注意力数值仍是未经调优的确定性初值，没有注意预算、漏看和熟练度。
- 召回阈值只在小开发批次调整过，需要更大独立测试集。
- MVP是隔离Python运行器，未封装成正式V2在线适配器。

## Recommended Next Step

保持注意力预设和阈值冻结，做“经验富集”实验：每次查规则/验证成功只给对应记忆增加一条真实表达或变化箭头，再测试右箭头留出是否被自然学会，同时扩大未知符号负集监控误召回。不要直接为失败措辞加字符串规则。
