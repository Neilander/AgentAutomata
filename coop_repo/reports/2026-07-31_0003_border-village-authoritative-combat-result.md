# Agent Handoff: 灰谷村战斗结果指纹修复

- Date: 2026-07-31 00:03
- Agent/thread: Codex primary
- Scope: 共享战斗视图与灰谷村权威结算对齐
- Status: complete

## User Intent

查明并修复网页频繁提示“战斗结果与实际模拟过程不一致，拒绝结算”的问题。

## Completed

- 定位确定原因：共享战斗视图内部使用统一`CombatSimulation`逐帧运行，但结束时提交的是`this.state.units`显示对象。显示对象使用`ally/enemy`、`hpNow`、`ally_0`等字段；核心指纹要求模拟器结果中的`left/right`、`hp`、`left-1`，因此同一场战斗也必然验签失败。
- `finishUnifiedIfNeeded`改为直接调用内部模拟器的`sim.buildResult()`，提交包含权威单位快照、signals、metrics、duration与winner的正式结果；仅额外添加视图需要的`passed`字段。
- 静态前端验证增加共享战斗源契约，禁止再次提交显示单位。
- 新增逐帧回归：用与战斗画面相同的固定步长推进`CombatSimulation`，并与核心一次性`simulatePlan`比较完整结算指纹。

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: 统一战斗结束时提交权威模拟结果。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加显示对象封口与逐帧/一次性指纹一致性测试。
- `coop_repo/LATEST.md`: 指向本报告。
- `coop_repo/REPORT_INDEX.md`: 登记本报告。

## Validation

- `node --check projects/western_fantasy_continent/battle_view/battle-view.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；逐帧播放结果与核心模拟指纹一致。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-winning-route.js`: PASS；58场战斗，最终10v18，6人存活。
- 未启动服务器或浏览器。

## Current State

战斗画面播放的正是核心统一模拟器；播放结束后同一模拟器直接生成权威结算结果，不再把渲染角色反向伪装成模拟结果。普通战斗、突袭、最终战与连续讨伐均走同一修复路径。

## Unresolved

- 旧页面若已在浏览器中加载了修复前的`battle-view.js`，必须刷新页面才能取得新脚本。
- 共享战斗视图的非统一后备模拟仍产生旧式显示结果，但灰谷村按依赖顺序必然先加载统一`combat-sim.js`；静态契约已验证此顺序。

## Recommended Next Step

刷新灰谷村页面后重新进行一次边林讨伐并点击战后变化；应正常获得装备并继续自动刷下一轮，不再出现指纹不一致。
