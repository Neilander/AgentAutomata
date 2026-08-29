# Agent Handoff: UFS初始玩家生成器V1

- Date: 2026-08-28 22:03 Asia/Shanghai
- Agent/thread: root / simulatePlayer
- Scope: 把冻结初始知识、玩家个人学习与当前游戏checkpoint分离，并提供fresh/continue/fork/capture
- Status: complete

## User Intent

不同试玩不能把学习混在同一个匿名checkpoint里。需要初始玩家生成器，使每次实验能明确区分全新玩家、同一玩家续玩和从某一学习快照分叉的对照玩家；同时解释上一轮预测驱动反馈学习已经实现的成果。

## Completed

- 新增三层状态边界：冻结初始玩家模板只描述共同规则知识与认知资产；玩家档案只保存个人学习；当前局checkpoint只保存正式棋盘、本局脑内状态和未到截止点的预测票据。
- 冻结模板覆盖7份实际资产：规则来源、AI生成五槽轨迹、GTE manifest和三份矩阵、统一JSON程序库。生成SHA-256总指纹；当前指纹为`2190c3efea00912af4bdee7a3c7258d41ccb81951b433bb571bf93f3347e5930`。
- `fresh`创建具有相同冻结知识、空反馈轨迹、空连接强化、空注意修正和空预测账本的新玩家；不同玩家档案完全独立。
- `continue`分两层：当前局`advance/random`从带身份的checkpoint恢复；下一episode用capture后的同一玩家档案重新`player-start`。恢复必须同时匹配玩家ID、模板指纹和档案revision。
- `fork`复制父玩家某一明确revision的个人学习与预测历史，记录root/parent/generation血缘；复制后父子对象深拷贝，后续学习互不回写。
- `player-capture`只提取反馈学习状态、连接强化、注意调整、预测历史及计数器，不保存正式棋盘。仍有待验证预测票据时拒绝capture，避免丢失行动前预测。
- capture成功后写入receipt并封存该state目录，防止继续行动却无法再次安全合并同一revision；同一玩家下一局必须用更新档案在新state目录开始。
- 正式session checkpoint升级为`ufs_full_game_attention_checkpoint_v2`并携带`ufs_player_identity_v1`；旧v0/v1匿名checkpoint仍可恢复，但不能冒充带档案玩家。
- 新增玩家CLI：`template / fresh / fork / inspect`；现有完整试玩CLI增加`player-start / player-capture`，`advance/random`自动校验并继续同一玩家。
- 旧`start`保留兼容旧实验；正式学习对比应使用`player-start`，否则没有玩家身份和学习血缘审计。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-player-generator.js`: 模板指纹、玩家档案、fresh/fork、session创建/恢复、capture和摘要。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-player-cli.js`: 玩家模板、fresh、fork、inspect命令。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: checkpoint v2玩家身份、响应中的player/episode/revision审计字段。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: player-start、身份化continue、player-capture和capture封存receipt。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-player-generator.js`: 核心与真实CLI隔离/继承/分叉/revision/指纹/待预测保护测试。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 三层边界、命令用法和实验约束。

## Validation

- 玩家生成器专项：8/8通过。
- `node --test <ufs_first_action_imagination_v0下全部test-*.js>`：130/130通过。
- 真实CLI链：fresh alpha → player-start → 带预测行动 → player-capture revision 1；fresh beta仍为0学习；fork child继承alpha快照；alpha revision 1可在新目录开始下一episode；旧目录重复capture被拒绝。
- 核心隔离：只更新alpha后，原alpha对象和beta学习均保持0；fork child继续学习后，父档案revision和学习计数不变。
- 模板闸门：篡改模板指纹的玩家档案拒绝加载。
- 待预测闸门：白骰随机边界仍有pending prediction ticket时拒绝capture。
- V17预测反馈三回合重放在checkpoint v2下继续通过。
- `git diff --check`：通过；仅既有LF→CRLF提示。

## Current State

现在每个学习样本都有明确归属：`playerId + templateFingerprint + profileRevision + episodeId`。全新玩家只共享冻结规则知识，不共享任何经历；同一玩家跨局继承自己的反馈轨迹；fork实验明确记录继承点并在此后独立。

上一轮预测反馈学习因此有了正确承载位置：预测票据属于当前局，确认/纠正后的轨迹和注意调整属于玩家个人档案，正式棋盘永远不进入玩家档案。不同玩家的学习不会再因为复用匿名checkpoint而混在一起。

## Unresolved

- 当前fork复制的是个人认知快照并开始新episode，不复制当前正式棋盘；若要在同一个具体局面做A/B分叉，需要另做“同局checkpoint实验分叉”接口。
- 模板资产改变后旧玩家会被安全拒绝，目前没有玩家档案迁移工具。
- 玩家ID由调用者指定并校验格式，不是中心注册服务生成的全局UUID；同一实验目录仍应避免人为重复命名。
- 没有实现跨玩家总体统计或群体知识合并；V1有意保持玩家独立，避免重新引入学习混合。
- 旧匿名`start`仍可用于历史回归，但其结果不能作为独立玩家学习实验。

## Recommended Next Step

下一次真实策略Agent试玩应先用`ufs-player-cli.js fresh`创建明确玩家，再用`player-start`跑三回合并`player-capture`；随后用同一档案开始第二局，检查已确认/纠正轨迹是否真正改变下一局预测。另创建一个fresh对照玩家，才能判断变化来自学习而非随机seed。
