# Agent Handoff：装备身份词条

- Date: 2026-07-22
- Agent/thread: Codex / root
- Scope: 将装备身份词条作为独立于效果词条的系统概念加入阶段事件框架
- Status: complete

## User Intent

用户提出装备应增加身份词条层，不是战斗效果词条；首批方向包括贵族、古代锻造、赃物、流放者、宗教、具体阵营和恐怖。

## Completed

- 区分效果词条与身份词条：前者描述战斗/构筑效果，后者描述来历、归属、立场与社会意义。
- 记录用户提出的首批身份词条方向，并允许一件装备同时拥有多个身份词条。
- 明确身份词条由人物、势力、地点、任务、准入和证据规则按场景读取，不直接等同于固定全局加成。
- 用贵族、赃物、阵营、宗教、恐怖和古代锻造说明同一词条面对不同观察者可以产生相反结果。

## Files Changed

- `projects/western_fantasy_continent/design/infinite_loot_stage_event_framework_v0.md`：新增第 8.12.1 节并补充未冻结项。
- `coop_repo/reports/2026-07-22_1729_equipment-identity-tags.md`：新增本次协作报告。
- `coop_repo/LATEST.md`：更新最新协作入口。
- `coop_repo/REPORT_INDEX.md`：登记本次报告。

## Validation

- Markdown 章节与示例人工检查：PASS。
- `git diff --check`：PASS；仅有 Windows 换行转换提示，无空白错误。

## Current State

装备身份词条已成为正式讨论概念，可以作为装备与人物需求、势力规则和权谋事件之间的通用连接层。

## Unresolved

- 身份词条的正式词表、层级和互斥关系未定。
- 词条的生成、发现、隐藏、移除和伪造规则未定。
- 身份词条是否影响装备掉率和副本主题分布未定。

## Recommended Next Step

后续设计装备池时，为少量样品同时标注效果词条与身份词条，测试同一身份词条在不同NPC需求下能否产生清晰且相反的价值。
