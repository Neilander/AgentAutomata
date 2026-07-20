# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-20_1913_player-decision-emotion-latent-space-exploration.md`](reports/2026-07-20_1913_player-decision-emotion-latent-space-exploration.md)

Last updated: 2026-07-20

当前重点：玩家决策与情绪探索已整合。EDecision/QDecision继续只描述思考量与推进质量；价值/profile决定什么重要；认知/记忆/Agency保存对象、归因、反事实与目标路径；情绪暂按“高维区域的少量工程投影”处理。下一步先做隔离`player-emotion-latent`计算器和30至50个确定性case，用`valence/arousal/interventionDrive/withdrawalDrive/control/lossGap`加认知上下文做碰撞与消融测试；不要直接修改V27行为或重复计算现有反馈。
