# Prompt Benchmark 2026-07-06_1944

## Purpose

Test whether different evaluator prompts produce different favorite Top10 lists from the same Runs 1-7 candidate pool, then compare those prompt-shaped preferences against the user's blind Top10.

This is a taste-fit experiment. It does not modify formal skills or `game_data/skill-data.js`.

## Prompt Variants

| ID | Label | Main Bias |
| --- | --- | --- |
| A | 纯玩家幻想派 | immediate fantasy, visual imagination, "I want to build this" desire |
| B | 强化路线派 | clear attribute/equipment/team reinforcement route |
| C | 暗黑刷宝派 | long-term loot chase and affix amplification |
| D | 自动战斗可读性派 | readable combat signal, visible action/event chain |
| E | 长期流派生态派 | can grow into archetype ecosystem, counters, gear/relic branches |
| F | 高风险高爽感派 | low tolerance, high reward, strong combat payoff |
| G | 低复杂度可实现派 | fast prototype, low engine change, clear signal |
| H | 反套路新鲜感派 | new design space while still serving output fantasy |

## Strong Consensus

- `断脉弩客`, `堡垒引信骑士`, and `山息一刀` were selected by all 8 prompts.
- `辉壁炮手` and `余烬药剂师` were selected by 7 prompts.
- `黑钟疫使`, `霜弦追猎者`, and `白烛判官` were selected by 6 prompts.

## Prompt Differences

- A lifts atmospheric fantasy candidates such as `棺灯守咒者` and `玻璃大炮占星家`.
- B/C/E strongly prefer build/loot/ecosystem engines such as `辉壁炮手`, `双手交替术士`, and `鸣雷指环`.
- D/G prefer candidates that are easy to read or prototype, lifting `回钟弹术` and `百手拳师`.
- F/H are useful stress prompts: they lift sharper but riskier candidates such as `裂痕咒炮手`, `白霜影枪`, `压弹枪姬`, and `血晶裁缝`.

## Blind Page Hook

The blind Top10 page now loads:

- `/game_data/candidate_skill_packs/review_audits/2026-07-06_1915/agent_top10.json`
- `/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_top10.json`

After the user selects 10 candidates, the page compares the user selection against the previous agent consensus and all 8 prompt Top10 lists. The prompt criteria are only shown after the user asks to compare.

## Risk

This is still preference-only. It should choose which candidates deserve implementation/testing first, not prove combat quality.
