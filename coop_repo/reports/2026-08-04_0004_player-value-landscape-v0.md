# Agent Handoff：玩家价值地形 V0

- Date: 2026-08-04
- Agent/thread: Codex `/root`
- Scope: `logs/fb2` 隔离worktree中的队伍价值学习与隐藏验证
- Status: complete

## User Intent

验证“强大”能否作为随经验移动的多维价值地形：队伍坐标描述队伍是什么；未知原因的胜利只让价值靠近该队伍；确认护盾等因果后才让价值靠近相应概念；护盾被驱散或全局削弱时只改变评价，不改变队伍擅长护盾的事实。

## Completed

- 冻结50队的纯能力768维坐标，坐标快照明确排除胜负结果。
- 实现 `ValueLandscape`：R生成窄的完整队伍局部锚点；EVerify生成较宽的概念锚点；环境锚点与全局锚点分开。
- 信心拆成证据覆盖度与证据共识度；同位置一胜一负时覆盖度0.930，但信心归零。
- 完成未知获胜、护盾因果确认、普通/驱散环境隔离、全局护盾贬值、无关爆发不背锅和坐标零漂移专项，9/9通过。
- 生成50队×6敌队×20隐藏种子的6000场验证；五折按队伍留出，价值地形在6/6环境获得正Top-10提升。
- 加入明确标注为违规诊断的隐藏真值oracle，确认火焰爆发失败主要来自队伍坐标缺少组合机制几何，而非两场观察噪声或价值地形公式。
- 未修改正式玩家Agent。

## Files Changed

- `projects/western_fantasy_continent/experiments/value_landscape_v0/value_landscape.py`：局部/概念价值锚点、环境作用域、核查询、覆盖与共识信心。
- `projects/western_fantasy_continent/experiments/value_landscape_v0/run_experiment.py`：受控专项、50队五折验证、线性基线与诊断oracle。
- `projects/western_fantasy_continent/experiments/value_landscape_v0/build-hidden-validation.js`：6000场隐藏种子验证生成器。
- `projects/western_fantasy_continent/experiments/value_landscape_v0/test_results.py`：边界与受控行为断言。
- `projects/western_fantasy_continent/experiments/value_landscape_v0/README.md`：中文机制与公式。
- `projects/western_fantasy_continent/experiments/value_landscape_v0/RESULTS.md`：中文结果与失败定位。
- `projects/western_fantasy_continent/experiments/semantic_team_coordinate_v0/run_experiment.py`：导出排除胜负的50队坐标快照。
- `projects/western_fantasy_continent/experiments/team_vector_guess_v1/build-team-knowledge.js`：导出隐藏验证复用的战斗构造函数。

## Validation

- `run_experiment.py` + `test_results.py`：PASS；受控检查9/9。
- 价值地形：总体Spearman 0.5105、MAE 0.3475、Top-10平均隐藏胜率提升+0.2503、6/6环境为正。
- 单一线性方向：Spearman 0.5005、MAE 0.3537、提升+0.2303、5/6环境为正。
- 火焰爆发：正常价值地形Spearman 0.0123；使用隐藏真值学习的违规诊断仍为-0.0136，确认坐标几何不足。
- 所有价值更新后坐标最大漂移为0。

## Current State

价值和身份已经分层：玩家仍可认为队伍擅长护盾，同时因驱散环境或全局削弱而认为护盾不强。未知胜利不会无依据推广到护盾；只有EVerify确认的原因才能推广。真实50队验证显示价值地形可用且略优于单方向，但证据尚不足以宣称完全稳定。

## Unresolved

- 真实50队战报没有结构化EVerify标签，因此只验证了R的局部学习，概念推广仍是受控验证。
- 火焰爆发和部分剧毒效果依赖组合机制，当前纯能力坐标没有把有效队伍聚到一起。
- 50队仍只来自六个已知敌队；没有验证全新环境。
- 核半径目前由队伍近邻距离自适应，尚未以长期玩家行为校准。

## Recommended Next Step

先给队伍认知补“角色/机制组合为何在特定环境生效”的命题，不要继续调价值地形公式。以火焰爆发为主失败集，确认补充知识后赢家在坐标中开始聚集；再把真实结构化EVerify证据送入本模块做第二轮隐藏验证。
