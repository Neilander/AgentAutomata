# Agent Handoff: MindToy 地图渐进模糊研究

- Date: 2026-07-24
- Agent/thread: Codex `/root`
- Scope: 研究复杂地图中人类注意与记忆如何从个体信息过渡到群体摘要和场景gist
- Status: complete

## User Intent

判断人脑面对多个位置、不同类型敌军时，是随机遗忘一部分还是对信息进行概括，并为 MindToy 的有限注意和渐进模糊提供可信方案。

## Completed

- 查阅视觉工作记忆共享资源、集合统计、层级编码、空间类别重建、非注意盲视和场景gist的原始研究。
- 确认合理模型不是随机遮掉固定比例的信息，而是未注意遗漏、群体概括、连续精度下降和类型/位置绑定错误并存。
- 为地图敌军定义个体级、群体级、gist级和未进入注意四种状态。
- 给出数量范围化、群体均值偏移、地标位置偏移、类型位置交换和完全漏看五类可观察错误。
- 提出第一版只实现 instance/group/gist 三层和高负荷下的小概率绑定错误。

## Files Changed

- `projects/western_fantasy_continent/design/MIND_TOY_GRADED_BLUR_RESEARCH_V0.md`: 新增中文研究结论、士兵地图案例、数据结构和最小实现建议。
- `coop_repo/reports/2026-07-24_1711_mind-toy-graded-map-blur.md`: 本次调研记录。
- `coop_repo/LATEST.md`: 指向本报告。
- `coop_repo/REPORT_INDEX.md`: 增加报告索引。

## Validation

- 研究结论分别由集合统计、层级工作记忆、共享资源、空间类别原型、非注意盲视和场景gist实验交叉支持。
- 本轮没有实现代码或运行玩家Agent。
- 明确区分“程序真相侧仍存在单位”和“单位是否进入玩家ActiveMindToy”。

## Current State

地图模糊已经可以用结构化方式描述：当前目标与idea决定焦点，焦点保存个体，近邻保存群体摘要，外围保存区域gist，未注意信息不进入模型；负荷上升时允许数量误差、均值偏移和绑定错误。

## Unresolved

- 尚未确定焦点范围、组块容量、衰减速度和绑定错误概率。
- 尚未验证文字Agent能否稳定生成群体摘要，而不是偷偷保留完整单位列表。
- 真实游戏画面重新观察的成本和频率尚未建模。
- 专家如何把多个单位关系压成一个组块仍需单独验证。

## Recommended Next Step

先制作一张固定小地图，放置3个区域和8~12名不同类型敌人。只改变玩家当前目标和关注区域，让真实Agent输出 instance/group/gist 三层主观地图；先检查结构变化，不接 Flood、扫雷、Decision 或情绪。

