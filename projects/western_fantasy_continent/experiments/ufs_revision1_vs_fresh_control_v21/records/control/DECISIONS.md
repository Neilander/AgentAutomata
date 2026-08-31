# V21 fresh-control decisions

- Controller contract: same Codex task, model configuration, public information boundary, and
  macro policy as the revision 1 treatment.
- Macro policy: preserve an energy recovery route; do not resolve incomplete rooms; account for
  visible research rollback and mothership deadline; submit only fields exposed by the current
  operation contract.
- Private host checkpoints and feedback audit transcripts are not strategy inputs.


## Step 001 - snapshot

- Recorded before operation: 2026-08-29T05:22:21.375Z
- Judgment: 已核验setup基线；当前宏观需求是建立能源循环并避免把不完整双格能源房当成立即收益。

## Step 002 - advance

- Recorded before operation: 2026-08-29T05:22:42.083Z
- Judgment: 优先把高值灰骰放入可见能源房格，但不把单格放置当成立即产能；保留2能源等待完整房间合同。

## Step 003 - advance

- Recorded before operation: 2026-08-29T05:23:05.638Z
- Judgment: A-r2-c4已有一骰；选择公开显示同属A-upper-energy的A-r2-c5，明确以补齐两格为目标，而不是结算单格。

## Step 004 - advance

- Recorded before operation: 2026-08-29T05:23:28.487Z
- Judgment: 能源房已补齐；用剩余灰骰占单格隧道，争取推进挖掘并打开后续单格能源路线。

## Step 005 - advance

- Recorded before operation: 2026-08-29T05:23:49.485Z
- Judgment: 选择0费单格防空位，避免在能源补给前新增资源成本；接受白骰可能触发的外部随机边界。

## Step 006 - random

- Recorded before operation: 2026-08-29T05:24:05.300Z
- Judgment: 使用预提交white_reroll第1次观测，不作策略选择。

## Step 007 - advance

- Recorded before operation: 2026-08-29T05:24:28.474Z
- Judgment: 最后一骰选择0费单格防空，保留能源并结束放骰；不选择需1能源的战斗机房。

## Step 008 - advance

- Recorded before operation: 2026-08-29T05:24:44.886Z
- Judgment: A-upper-energy明确列入resolvable且两格完整；先结算它建立能源安全线，再处理其他房间。

## Step 009 - advance

- Recorded before operation: 2026-08-29T05:25:12.885Z
- Judgment: 能源已到6；结算单格隧道，但预期只是打开挖掘候选，不把房间结算本身误当挖掘推进。

## Step 010 - advance

- Recorded before operation: 2026-08-29T05:25:30.389Z
- Judgment: A-aa-c1是0费合法候选；结算它清理房间，但不指望能源或研究收益。

## Step 011 - advance

- Recorded before operation: 2026-08-29T05:25:38.835Z
- Judgment: 继续结算剩余0费防空房；当前能源安全线6不应下降。

## Step 012 - advance

- Recorded before operation: 2026-08-29T05:26:00.713Z
- Judgment: 无剩余房间候选，结束房间阶段；开始把母舰推进视为明确期限，而不是忽略的背景事件。

## Step 013 - advance

- Recorded before operation: 2026-08-29T05:26:22.542Z
- Judgment: C2已有两艘可见船，选择较空C1，避免继续堆叠同列压力。

## Step 014 - advance

- Recorded before operation: 2026-08-29T05:26:39.698Z
- Judgment: white-1只有DP-C2一个合法候选，按合同提交，不虚构其他入口。

## Step 015 - random

- Recorded before operation: 2026-08-29T05:27:00.643Z
- Judgment: 使用预提交next_round_roll第1次观测进入Round 2。

## Step 016 - advance

- Recorded before operation: 2026-08-29T05:27:22.346Z
- Judgment: 能源安全线6充足；优先放入unlockIndex 0起始隧道，目标是实际推进挖掘路线并开放后续房间。

## Step 017 - advance

- Recorded before operation: 2026-08-29T05:27:35.963Z
- Judgment: 在保留足够能源的前提下用灰2占研究房；明确不把放置本身当成研究推进。

## Step 018 - advance

- Recorded before operation: 2026-08-29T05:27:46.918Z
- Judgment: 低值灰1放0费单格防空，不占用研究或能源房的高价值位置。

## Step 019 - advance

- Recorded before operation: 2026-08-29T05:28:08.446Z
- Judgment: 选择能源房第一格，但明确这是不完整状态；若重投后看不到第二格，就不会尝试结算该房。

## Step 020 - random

- Recorded before operation: 2026-08-29T05:28:19.515Z
- Judgment: 使用预提交white_reroll第2次观测，不作策略选择。

## Step 021 - advance

- Recorded before operation: 2026-08-29T05:28:47.340Z
- Judgment: 重投后能源房第二格未出现在公开注意视图，不能假定可用；把白6放合法0费防空，并接受本轮能源房不完整。

## Step 022 - advance

- Recorded before operation: 2026-08-29T05:29:06.848Z
- Judgment: A-upper-energy未列入resolvable，确认不完整并不碰；先结算明确合法的起始隧道。

## Step 023 - advance

- Recorded before operation: 2026-08-29T05:29:35.399Z
- Judgment: 能源6可支付研究成本2且仍保留4；选择推进研究，同时预留后续能源安全线。

## Step 024 - advance

- Recorded before operation: 2026-08-29T05:29:54.369Z
- Judgment: 预算2低于首格成本3，合同只允许advanceSteps 0；接受零收益，不提交无效正推进。

## Step 025 - advance

- Recorded before operation: 2026-08-29T05:30:04.341Z
- Judgment: 结算0费A-aa-c1；不把它当资源收益。

## Step 026 - advance

- Recorded before operation: 2026-08-29T05:30:17.740Z
- Judgment: 结算最后一个合法0费房间；不尝试未列入resolvable的不完整能源房。

## Step 027 - advance

- Recorded before operation: 2026-08-29T05:30:27.227Z
- Judgment: 合法房间已处理完，结束阶段；母舰当前0，继续把每回合下降计入期限判断。

## Step 028 - random

- Recorded before operation: 2026-08-29T05:30:43.742Z
- Judgment: 使用预提交next_round_roll第2次观测进入Round 3。

## Step 029 - advance

- Recorded before operation: 2026-08-29T05:31:04.994Z
- Judgment: 能源已从6降到4；优先重建完整能源房，先放高值灰4到第一格并等待第二格公开。

## Step 030 - advance

- Recorded before operation: 2026-08-29T05:31:28.874Z
- Judgment: 用灰3进入研究房，预期房间阶段可推进首格；当前仍保留4能源等待结算。

## Step 031 - advance

- Recorded before operation: 2026-08-29T05:31:49.822Z
- Judgment: 第二格现已公开，立即用灰2补齐能源房；避免留下上一回合那种不完整零收益状态。

## Step 032 - advance

- Recorded before operation: 2026-08-29T05:32:06.077Z
- Judgment: 能源房已经完整，使用白3进入成本1战斗机房，仍保留足够能源处理研究与补给。

## Step 033 - random

- Recorded before operation: 2026-08-29T05:32:14.307Z
- Judgment: 使用预提交white_reroll第3次观测，不作策略选择。

## Step 034 - advance

- Recorded before operation: 2026-08-29T05:32:38.714Z
- Judgment: 当前公开选择只剩C3；选0费防空而非无产出隧道，尝试缓解可见C3船压。

## Step 035 - advance

- Recorded before operation: 2026-08-29T05:32:57.028Z
- Judgment: 先结算完整能源房，把能源从4恢复到安全区，再支付研究与战斗机成本。

## Step 036 - advance

- Recorded before operation: 2026-08-29T05:33:06.758Z
- Judgment: 能源已补足；研究骰值3正好覆盖首格，接受成本2并准备选择推进1格。

## Step 037 - advance

- Recorded before operation: 2026-08-29T05:33:30.449Z
- Judgment: 合同允许0到1；选择1获得真实研究推进，并预期能源从7扣到5。

## Step 038 - advance

- Recorded before operation: 2026-08-29T05:33:44.126Z
- Judgment: 能源补给和研究已处理，支付1能源结算战斗机房以缓解当前高位飞船压力，仍保留4能源。

## Step 039 - advance

- Recorded before operation: 2026-08-29T05:34:08.185Z
- Judgment: 结算最后一个0费防空候选；当前不再进行无效或未公开选择。

## Step 040 - advance

- Recorded before operation: 2026-08-29T05:34:24.360Z
- Judgment: 本轮已恢复能源并取得研究1；结束房间阶段，同时明确母舰仍在逼近后续惩罚阈值。

## Step 041 - advance

- Recorded before operation: 2026-08-29T05:34:51.997Z
- Judgment: purple-0仅有DP-C1，按唯一合同选择；不提交无效入口。
