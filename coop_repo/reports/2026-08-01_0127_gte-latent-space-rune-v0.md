# Agent Handoff: GTE 高维符文猜测 V0

- Date: 2026-08-01
- Agent/thread: Codex 主任务，独立 worktree `logs/fb2`
- Scope: 本地 GTE 模型、连续语义轴与40角色高维猜测隔离实验
- Status: partial

## User Intent

下载最基础的 `GTE-multilingual-base`，不干扰另一个 agent 的主工作区；验证能否把角色机制放进连续 latent space，沿治疗、生存、输出等方向切分候选，并形成一维符文猜测的多维推广。

## Completed

- 将模型、缓存和 Python 推理依赖放在主仓库 `logs/shared_models/` 的 Git 忽略目录，没有修改全局 Python 环境。
- 在线首次加载后，使用 `HF_HUB_OFFLINE=1` 和 `TRANSFORMERS_OFFLINE=1` 完成断网复载；模型稳定输出 `768` 维有限向量。
- 在干净的 `codex/player-feedback-v2-trial` worktree 新增完全隔离的 `latent_space_rune_v0`，没有修改旧 Cognitive Lab 或正式玩家 Agent。
- 建立40个虚构角色与9条语义轴；角色向量只读取机制描述，真值标签仅用于回答和评估。
- 分开验证真值坐标与 GTE 坐标：真值坐标40/40命中，证明多维提问和后验更新框架本身成立。
- GTE 语义轴平均 AUC `0.846`；治疗、护盾、控制、持续输出和位移清楚，阻止死亡与禁疗较弱。
- “不治疗但能阻止死亡”Top-8反向检索精度 `75%`。
- 相同“锁血”词的两种定义只正确分开一种；GTE 多轮 Top-1 仅 `10%`，确认当前软概率不能直接连续相乘。

## Files Changed

- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/character_space.py`：40角色、九轴锚点、轴投影、主动提问、后验更新、反向检索与评估。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/gte_runtime.py`：完全离线的 GTE 768维向量适配器。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/run_experiment.py`：真实模型实验编排和结果保存。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/test_character_space.py`：多维猜测算法的纯程序回归。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/run-local.ps1`：隔离环境启动器。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/README.md`、`RESULTS.md`：实验边界、结果与V1方案。
- `projects/western_fantasy_continent/experiments/latent_space_rune_v0/artifacts/latest_results.json`：本轮完整机器可读结果。

## Validation

- `python test_character_space.py`：4项通过。
- `powershell -ExecutionPolicy Bypass -File .\run-local.ps1`：通过；纯程序测试再次4项通过，GTE完全离线加载并完成40角色实验。
- 模型最小离线检查：`OFFLINE_OK (2, 768) True`。
- 真值坐标：Top-1 `1.0`，平均目标名次 `1.0`。
- GTE坐标：Top-1 `0.1`，平均目标名次 `8.525`；结果诚实标记为尚不可接入。
- 根 `main` 的边境村未被本任务修改；所有程序文件只位于认知 worktree。

## Current State

模型已可重复离线运行，实验也成功把“方向是否存在”和“多维搜索是否可靠”拆开。结果支持 latent space 中存在多条角色机制方向，但否定了直接把简单正负锚点投影当作独立概率并连续相乘的做法。

## Unresolved

- “强制阻止死亡”AUC `0.487`、“禁止治疗”AUC `0.599`，不能承担强排除。
- 同词异义仍受预训练词语先验干扰。
- 当前一个角色只压成一个平均向量，多机制可能互相稀释。
- 轴概率未经独立校准，连续反馈会放大误差。
- 还没有加入玩家知识缺失、注意力和主动记忆检索；本轮只验证共享语义底座。

## Recommended Next Step

先开发 V1 表征层：将角色拆成机制向量集合，每条属性使用定义、结果、反事实和场景等多个原型，并把未知/低值分开；通过同词反义与随机技能名对照后，再改成带轴可靠性的版本空间更新。达到 `RESULTS.md` 的接入门槛之前不要连接正式玩家模拟。
