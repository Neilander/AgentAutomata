# Agent Handoff: Prompt Benchmark Review

- Date: 2026-07-06
- Agent/thread: Codex automation prompt benchmark pass
- Scope: Compare multiple evaluator prompts against the same Runs 1-7 candidate pool and wire the blind Top10 page to measure user taste overlap.
- Status: complete

## User Intent

Do not keep using one identical evaluator prompt. Try several prompt styles, let each choose a Top10, then compare those prompt-shaped choices against the user's blind Top10 to learn which prompt best matches the user's taste.

## Completed

- Followed repo coordination rules: read `coop_repo/LATEST.md`, opened the latest linked report, checked worktree state, and avoided unrelated dirty files.
- Collected 8 evaluator prompt variants:
  - pure player fantasy;
  - reinforcement route clarity;
  - dark-loot / ARPG build chase;
  - auto-battle readability;
  - long-term archetype ecosystem;
  - high-risk / high-payoff spectacle;
  - low-complexity implementation;
  - freshness / anti-routine design.
- Recorded each prompt's Top10 and rejected examples in a new prompt benchmark directory.
- Updated the blind Top10 page so comparison now includes:
  - old agent combined Top10;
  - all 8 prompt Top10 lists;
  - best-matching prompt by overlap after the user selects candidates.
- Kept this as a preference experiment only. No formal skill assets or `game_data/skill-data.js` were changed.
- Closed the evaluator subagents after collecting results.

## Files Changed

- `projects/western_fantasy_continent/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_top10.json`: structured 8-prompt benchmark data.
- `projects/western_fantasy_continent/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_benchmark.md`: human-readable summary and interpretation.
- `projects/western_fantasy_continent/character_blind_lab/top10.html`: updated blind page copy to explain prompt comparison after selection.
- `projects/western_fantasy_continent/character_blind_lab/top10.css`: added prompt comparison result styling.
- `projects/western_fantasy_continent/character_blind_lab/top10.js`: loads prompt benchmark data and ranks prompt overlap after user selection.
- `coop_repo/LATEST.md`: updated latest report pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1944_prompt-benchmark-review.md`: this handoff report.

## Validation

- `node -c projects\western_fantasy_continent\character_blind_lab\top10.js`: passed.
- Parsed `prompt_top10.json`, `agent_top10.json`, and `all_candidates.json` with Node: passed.
- Confirmed prompt count is 8, candidate pool count is 70, and both old combined Top10 and new prompt consensus Top10 have 10 entries.
- No server, localhost, browser, or access test was run.

## Current State

Blind Top10 page:

- `/character_blind_lab/top10.html`

Prompt benchmark data:

- `/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_top10.json`

Strong cross-prompt consensus:

1. `断脉弩客`
2. `堡垒引信骑士`
3. `山息一刀`
4. `辉壁炮手`
5. `余烬药剂师`
6. `黑钟疫使`
7. `霜弦追猎者`
8. `白烛判官`
9. `双手交替术士`
10. `百手拳师`

Useful prompt differences:

- `纯玩家幻想派` lifts atmosphere-heavy picks like `棺灯守咒者` and `玻璃大炮占星家`.
- `强化路线派` / `暗黑刷宝派` / `长期流派生态派` prefer build engines like `辉壁炮手`, `双手交替术士`, and `鸣雷指环`.
- `自动战斗可读性派` / `低复杂度可实现派` prefer readable/prototypable candidates like `回钟弹术` and `百手拳师`.
- `高风险高爽感派` / `反套路新鲜感派` surface sharper risky candidates like `裂痕咒炮手`, `白霜影枪`, `压弹枪姬`, and `血晶裁缝`.

## Unresolved

- The page was not browser-tested because the current automation instructions say not to start servers or run browser access tests unless explicitly asked.
- This is still a taste-overlap experiment, not combat runtime validation.
- Existing worktree remains dirty with prior pipeline, PoE study, server/workbench, and candidate-pack changes from earlier/other agents.

## Recommended Next Step

Have the user pick 10 candidates in `/character_blind_lab/top10.html`, open the comparison panel, and note which prompt has the highest overlap. Use that prompt style as the next brainstorm/evaluator default, while keeping one or two adversarial prompts for novelty checks.
