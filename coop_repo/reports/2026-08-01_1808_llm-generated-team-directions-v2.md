# Agent Handoff：大语言模型生成队伍需求方向 V2

- Date: 2026-08-01
- Agent/thread: Codex `/root`
- Scope: `logs/fb2` 隔离worktree内的50队猜队实验
- Status: complete

## User Intent

验证“保护、伤害等需求方向应由大语言模型根据玩家知识产生”，而不是由人工标签、固定模板或GTE相似度代替；随后用方向与队伍知识向量点积，检查能否从50支队伍中找到更适合当前失败原因的队伍。

## Completed

- 从玩家可见知识构造8个失败场景；方向生成器看不到候选队伍向量、验证战斗、敌队内部标签和正确答案。
- 用独立且不继承当前对话上下文的Codex子任务，冻结生成8组九维需求方向。
- 否定第一版“九个维度各自0～10”的合同：模型会把多数轴都给高分，8个场景最终全部选中同一支综合强队，虽有7/8翻胜，但不能证明按需求找队。
- 第二版把方向改为100点有限注意力预算，九轴总和必须为100，最高三轴合计至少60；这表达的是“当前更需要什么”，而不是每项是否有用。
- 用L2归一化后的需求方向与冻结的队伍知识向量点积选队；同一冻结方向在第二随机种子的300场战斗上验证。
- 结果不再塌缩：8个场景选择了3支不同队伍；8/8所选队知识得分高于原失败队，8/8高于50队均值，8/8的Top-5真实胜率高于对应敌队全池胜率，Top-1有6/8把失败转成胜利。
- 正式玩家Agent、反馈模块与游戏设计均未修改。

## Files Changed

- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/build-llm-direction-requests.js`：从玩家可见知识生成盲测请求，并定义100点有限预算合同。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/evaluate-llm-directions.py`：校验方向合同、归一化点积选队并用冻结验证战斗评分。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/test-llm-directions.py`：固化盲测边界、方向稀缺性与效果门槛。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/artifacts/llm-direction-requests.json`：8个只含玩家可见信息的请求。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/artifacts/llm-direction-responses.json`：独立Codex子任务的一次冻结输出。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/artifacts/llm-direction-results.json`：点积排名和第二随机种子验证明细。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/LLM_RESULTS.md`：中文结果摘要。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/README.md`、`run-local.ps1`：说明正式链路并纳入本地回归。

## Validation

- `python test-llm-directions.py`：PASS；8场景，方向优于原队8/8、优于池平均8/8、Top-5胜率优于全池8/8、Top-1翻胜6/8、选择3支不同队。
- `node test-team-knowledge.js`：PASS；50队、600场、29支含重复角色、2支全同角色；换位队知识向量存在差异。
- 方向生成边界：`fork_turns=none`，生成者只读取请求文件，未读取候选向量与验证结果。

## Current State

链路已变为：战斗signal → 玩家可见知识 → 队伍九维知识向量；失败上下文与知识 → 大语言模型生成100点需求方向；二者点积 → 候选队排名。它已经初步证明大语言模型可以把自然语言失败原因翻译为连续搜索方向，并在不知道候选答案时提高找到有效队伍的概率。

## Unresolved

- 两个场景的Top-1仍失败：火焰爆发下求生、脱离冰霜控制；但对应Top-5胜率分别为60%对全池14%、80%对全池30%，说明方向有效，单一Top-1排序仍受队池粒度与随机性影响。
- 验证只更换了战斗随机种子，没有更换六支固定敌队，尚不能证明对未见敌队的环境迁移。
- 只有8个失败场景、一个模型、一次冻结采样；还不能估计不同模型或不同采样之间的方向稳定性。
- `team-017`在4个场景中被选中，可能既有需求匹配，也有当前九轴下综合偏强的因素；扩大队池前应先用未见敌队和方向消融区分。

## Recommended Next Step

先增加未参与知识形成的新敌队，用同一批冻结方向做零调参迁移验证；若仍明显优于队池，再用2～3次独立LLM盲生成衡量方向稳定性，之后才值得从50队扩到1000队。
