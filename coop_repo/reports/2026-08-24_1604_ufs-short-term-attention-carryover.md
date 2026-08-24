# Agent Handoff: UFS跨步骤短期注意粘连

- Date: 2026-08-24
- Agent/thread: `/root`
- Scope: `simulatePlayer` worktree；完整153+项概率注意的跨步骤延续
- Status: complete

## User Intent

在无法声称唯一正确人类注意模型的前提下，为连续设想增加温和的跨步骤注意粘连：上一步刚注意到的对象下一步更容易继续看到，但不能锁死焦点，也不能妨碍新动作或显眼事件抢走注意。

## Completed

- 为`UfsFullAttentionProvider`增加episode内短期注意痕迹；每次新单步或完整回合开始时清空，不跨局泄漏。
- 本步noticed项目按其基础激活的18%留下残留；若没有继续成为高相关焦点，每步衰减到35%，最多影响后两步。
- 直接焦点`0.95`会在下一步得到`+0.171`，再下一步约`+0.060`；一个随机注意到的背景项`0.04`只留下`+0.0072`。
- 残留只参与下一步153+项概率分配，不直接进入Q，也不保证对象必然再次被看到。
- 新动作直接目标仍约`0.95`；旧目标在无新动作加权时约为`0.04 + 0.171 = 0.211`，所以新动作可自然打断旧焦点。
- 注意审计新增每项`baseActivation / carryoverActivation / activation`、`carryoverAppliedItemIds`和`attentionTraceBefore/After`。
- 放置、天空后果与事件trace均保留同一短期痕迹审计；一回合demo逐步显示从前一步携带的项目数。
- 相同运行器重复跑新回合时会自动`beginEpisode()`，固定种子首步noticed集合完全一致。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-attention-provider.js`: 短期痕迹、两步衰减、episode清空和审计。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: 独立单步开始时清空痕迹。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: 完整回合开始时清空，并在事件感知trace中公开痕迹。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/placement-rule-imagination.js`: 放置Q trace公开痕迹审计。
- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/imagination-pipeline.js`: 天空链trace公开同一痕迹审计。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-attention-integration.js`: 粘连、衰减、打断、概率提升和跨回合清空专项。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/run-one-round-demo.js`: 显示每步carryover数量。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 参数、语义、实验结果和边界。

## Validation

- 完整Node相关回归：84/84 PASS。
- Python注意模块回归：14/14 PASS。
- 完整注意与短期粘连专项：9/9 PASS。
- 旧焦点直接数值：`0.95 → 0.211 → 0.09985`，其中carryover为`0 → 0.171 → 0.05985`。
- 200种子概率对照：旧焦点在下一步被注意到，有粘连181/200，无粘连36/200；仍有19次漏看，因此不是强制保留。
- 100种子完整回合对照：有粘连100/100完成、无粘连100/100完成，均0卡死；两组各2次自然漏掉战斗机目标关系。
- 新动作打断：新目标约0.95，旧焦点约0.211。
- 重用同一回合运行器：episode首步痕迹为空、固定种子结果一致。
- 一回合demo：17步完成并输出carryover审计。
- `git diff --check`: PASS（仅既有LF/CRLF提示）。
- 基线：`53367a4`仍是`simulatePlayer` HEAD `8895f8c`的祖先；未使用旧fb2或fifteen-day-web分支。

## Current State

当前默认连续注意为：全场基础激活 + 当前动作加权 + 最近两步短期残留 → 41项概率注意。脑内状态和注意焦点现在都会延续，但两者仍分开：脑内状态是玩家认为世界怎样，短期痕迹只改变下步更可能看哪里。

## Unresolved

- 18%、35%和两步寿命是温和工程参数，不是人体实验结论。
- 当前所有noticed项都会留下残留，而不只限于进入Q、被读取或发生变化的项目；背景项残留很小，但若后续观察到注意范围过黏，可比较“全部noticed”与“只粘Q/变化对象”。
- 当前固定一回合对照没有表现出完成率变化；这证明没有明显破坏该fixture，不证明参数在所有局面中都合理。
- 主动选择、疲劳、显眼突发事件的动态抢占和反馈学习不在本次范围。

## Recommended Next Step

先保留这组轻量参数进入真实多步场景观察。若出现旧焦点长期占据预算，再做一个只让“进入Q或发生变化的对象”粘连的消融对照；目前无需继续精调。
