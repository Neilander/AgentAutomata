# Agent Handoff：奖励化学轴饱和修正

- Date: 2026-07-21 17:47
- Agent/thread: Codex `/root`
- Scope: 隔离 worktree `logs/fb2`，分支 `codex/player-feedback-v2-trial`
- Status: complete（本轮聚焦问题完成；正式接入仍未进行）

## User Intent

判断第一章末多巴胺和内源性阿片接近饱和究竟是参数问题还是机制问题，并先做可回滚调整，不能为了降低数值同时抹掉失败后突破、Boss 胜利和稀有掉落的强反馈。

## Diagnosis

- 不是单一参数问题。原模型每次正面结果都会产生约 0.25 的多巴胺脉冲，而多巴胺恢复时间为 120 秒；章节适配器默认每轮 90 秒，连续胜利必然累积。
- 同一场胜利的战斗结果和掉落会形成两个奖励时刻；内源性阿片恢复时间为 480 秒，因此更容易在长连胜中积累。
- 将轮次间隔单独从 90 秒延长到 180 秒，普通阶段多巴胺虽从 1.00 降到 0.85、章末阿片从 0.99 降到 0.75，但四败后突破的宽慰也从 0.626 降到 0.480；而超预期掉落仍可瞬间顶格。因此单纯加快衰减会误伤需要保留的体验。
- 根本错误是把“结果本身很好”近似当作“比预期更好”。奖励预测误差研究支持预期内奖励的相位性多巴胺反应减弱；奖励消费的愉悦与多巴胺驱动的想要/学习也不应混为一轴。

## Completed

- 重写多巴胺释放配比：强权重由正向奖励预测误差承担；正面结果本身只保留较弱动机脉冲；奖励预期和奖励消费保留较小贡献。
- 在 V2 情绪适配器增加“常规胜利连续次数”和奖励习惯化系数。
- 连续顺利推进的系数按指数下降：1.0000 → 0.8025 → 0.6440 → 0.5169，最低保留 0.45，不会把常规胜利变成无感。
- Boss 和失败后突破不受常规习惯化压制。
- 真正高于预期的掉落仍通过 A/奖励预测误差重新触发强多巴胺脉冲，不被常规连胜习惯化吞掉。
- 未改变 90 秒轮次时间，也没有修改正式玩家 Agent 的行为。

## Result

- 六次完全符合预期的连续常规胜利，多巴胺水平为：0.569、0.617、0.634、0.636、0.635、0.634；不再持续爬升或饱和。
- 第六次常规胜利后的超预期奖励，多巴胺释放为 0.230，超过当次常规胜利释放的两倍，说明稀有惊喜仍然有效。
- 真实第一章章末多巴胺：0.955 → 0.706。
- 真实第一章章末内源性阿片：0.988 → 0.889。该值是刚结算 Boss 与奖励后的瞬时高位，已不再饱和，但仍需在更长章节观察恢复。
- 四败后突破宽慰：0.626 → 0.619，关键体验基本保持。
- Boss 胜利仍为愉快 0.670、满足 0.471、自豪 0.245；Boss 掉落不及预期仍保持惊讶、失望和兴奋混合。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/emotion-simulator-v1.js`：区分正向预测误差与单纯正面结果对多巴胺释放的贡献。
- `projects/western_fantasy_continent/game_data/player-feedback-emotion-adapter-v1.js`：增加常规连胜计数、奖励习惯化与最低保留值。
- `projects/western_fantasy_continent/game_data/test-player-feedback-emotion-adapter-v1.js`：增加连续常规胜利不饱和、超预期奖励重新激活两项保护测试。
- `.local_run_archive/.../emotion-v2.json`、`emotion-v2-summary.json`、`EMOTION_V2_TRACE.md`：重生成的忽略运行结果。

## Validation

- 奖励习惯化聚焦测试：PASS。
- 情绪模型契约测试：PASS。
- 情绪模拟器 19 个核心案例：PASS。
- 结构化情绪流水线 19 个案例：PASS。
- 反馈 V1/V2、EVerify 与因果知识测试：PASS。
- 正式因果闭环验证：PASS。
- 真实第一章重放：PASS，20 轮、31 个情绪时刻、Boss 通关。
- `git diff --check`：通过，仅有既有换行符提示。

## Current State

本轮问题已经从“只调参数”改为“纠正预测误差机制 + 最小习惯化参数”。调整后的第一章不再有多巴胺饱和，常规奖励会钝化，失败后突破、Boss 和超预期奖励仍能形成强反馈。所有改动仍在隔离 worktree 中，新情绪仍为影子输出，不改变 Agent 决策。

## Unresolved

- 习惯化速率 0.22 和最低值 0.45 是可解释的工程初值，不是人体实验拟合参数；需要更多游戏节奏验证后再冻结。
- 章末内源性阿片 0.889 虽未饱和，但仍偏高；需用第二章或更长的“奖励—空窗—奖励”序列判断它是合理瞬时峰值还是恢复仍偏慢。
- 当前习惯化按“连续常规胜利”近似，同类掉落、跨关卡同类奖励和奖励品类特异性尚未单独建模。
- 真实换人轨迹中的 C 仍待验证，与本轮奖励化学修正无冲突。

## Recommended Next Step

先做一条纯程序的 30 时刻长序列，覆盖连续普通奖励、无奖励空窗、换品类奖励、Boss 奖励和意外稀有奖励，验证习惯化是否按奖励品类恢复；通过后再处理真实换人 C。

## Evidence Basis

- Schultz, Dayan & Montague (1997), *A Neural Substrate of Prediction and Reward*：多巴胺神经元活动与未来奖励预测的变化/误差相关。https://doi.org/10.1126/science.275.5306.1593
- Sescousse et al. (2020), *Dopaminergic and opioidergic regulation during anticipation and consumption of social and nonsocial rewards*：区分奖励的 wanting 与 liking，以及多巴胺和阿片系统在预期/消费阶段的不同作用。https://pmc.ncbi.nlm.nih.gov/articles/PMC7553773/
