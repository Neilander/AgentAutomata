# Agent Handoff: 50队知识向量与需求方向 V1

- Date: 2026-08-01
- Agent/thread: Codex 主任务，独立 worktree `logs/fb2`
- Scope: 50支重复角色可用队伍、六固定敌队、玩家可见signal知识、需求方向点积与猜队伍
- Status: complete with limits

## User Intent

先用50支四人队小规模验证。队内允许相同角色；每支队伍必须由学到的知识形成连续向量，保护、伤害等需求形成方向向量，两者点积以后再判断和选队。最终把此前的猜角色扩展为猜队伍，但不污染正式玩家Agent和另一个Agent正在修改的玩法工作区。

## Completed

- 在认知worktree新增独立实验，使用10个标准角色的固定技能生成50支有序队伍：46支确定性随机队，外加四法师、四牧师和同角色集合换站位两组边缘样本。
- 队内允许重复角色，50队中29队存在重复，2队四人完全相同；每个单位使用`team-id:slot-n`稳定身份，换站位队伍保持不同fingerprint。
- 每支队伍分别挑战急速节奏、毒巢滚雪球、圣盾续航、余烬爆燃、霜控拖延和暗影处决六支固定队。
- 以两个不同随机种子共跑600场：第一套300场形成知识，第二套300场只做未见随机结果校验。
- 178842条第一套原始signal全部流过可见性层，其中73405条符合现有前端渲染合同；完整raw signal不落盘，只保留主体/环境/行为/结果格子、数值汇总、普通感知语言摘要和少量证据审计。
- 从玩家可见战斗表现形成九个相互独立的队伍方向：总体伤害、保护、增益、启动、爆发、持续伤害、群体伤害、控制和单点处决。
- 每个方向先在同一固定敌队内部做相对百分位，再跨六环境合并，并沿用“前30%边界为0”的相对坐标；最终队伍向量各维位于`[-1,1]`。
- 需求被拆成原子需求，例如“保护且有伤害”拆成保护方向和总体伤害方向，各自经GTE匹配方向后相加并做L2归一化；队伍向量不归一化，最终评分是普通点积，保留方向匹配和绝对能力。
- 原子需求方向12/12 Top-1正确。直接把整句复合需求做一次embedding只有5/7能在Top-3包含全部目标，已明确禁止该捷径。
- 七类需求按知识点积选出的Top-10，在第二随机种子的未见战斗向量上全部优于Bottom-10。
- 九轴跨随机种子平均Spearman为0.979；每条轴的Top-10均优于Bottom-10。
- 猜队伍内部实验中，最多8条明确方向的相对线索后50/50 Top-1；平均第4.92条首次升到Top-1，最晚第7条。该结果只证明知识向量可区分，不是新敌队泛化结果。

## Files Changed

- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/build-team-knowledge.js`：重复角色采样、600场矩阵、signal可见层、九轴知识与相对向量。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/run_vector_experiment.py`：GTE原子需求方向、点积检索、第二随机种子校验和猜队伍。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/test-team-knowledge.js`：队伍唯一性、重复角色、稳定槽位、S/E/B/R格子和向量边界回归。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/test_vector_results.py`：需求方向、点积泛化、轴稳定性和猜队伍回归。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/run-local.ps1`：完全离线复现入口。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/README.md`、`RESULTS.md`、`artifacts/`：中文边界说明、汇总和紧凑实验产物。

## Validation

- `powershell -ExecutionPolicy Bypass -File .\run-local.ps1`：PASS，约58秒。
- 600场完成；知识/验证各300场。
- JS专项：PASS；50队唯一、29队重复角色、2队全相同、换站位最大向量差0.6778、稳定槽位身份通过。
- Python专项：PASS；原子方向Top-1 100%，七类需求未见随机种子Top-10全部优于Bottom-10，九轴平均Spearman 0.9791。
- 猜队伍：50/50 Top-1/Top-3/Top-5；平均首次Top-1为4.92条线索，最晚7条。
- 正式玩家Agent、根main和另一个Agent的玩法文件均未修改。

## Current State

“队伍知识→连续向量、需求→方向、点积找队”已经在50队上跑通，并通过第二随机种子校验。关键架构结论是复合需求必须先被MindToy/Agent拆成原子需求；GTE适合把每个原子需求对齐到方向，不适合直接把整句当成最终检索向量。角色认知与队伍认知仍是平行分支，队伍失败不会直接降低四名角色的个人认知。

## Unresolved

- 50队和固定标准技能规模仍小；尚未扩到用户提出的1000队。
- 第二套验证只换了随机种子，敌队仍是原来的六种；未见敌队泛化尚未验证。
- 九个轴的signal公式是V1工程定义，虽然跨种子稳定，但保护是否要加入减伤/拦截、增益是否要拆主动施加与兑现，仍需后续审计。
- 控制队伍相对稀少，前30%边界出现大量零值并列；当前能正确区分“有明显控制”和“未表现控制”，但无法细分大量无控制队。
- 猜队伍50/50是内部知识可区分性，不能当作实战选队100%成功。

## Recommended Next Step

先抽取少量新敌队作为完全未见环境，冻结当前50队知识后按需求选Top-K并实际战斗，验证环境迁移。如果仍稳定，再扩到1000队；1000队阶段继续固定标准技能，避免同时引入技能组合导致问题无法归因。
