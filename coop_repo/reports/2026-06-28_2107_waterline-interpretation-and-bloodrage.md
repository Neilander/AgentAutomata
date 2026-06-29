# Agent Handoff: Waterline Interpretation And Bloodrage Diagnosis

- Date: 2026-06-28
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent generated 4v4 waterline interpretation
- Status: complete

## User Intent

Record the current interpretation of the generated 4v4 waterline so future agents do not treat it as absolute character strength. The user wants the waterline to become a reusable benchmark for new teams, roles, and skills, while preserving the distinction between team structure strength and individual role/component strength.

## Completed

- Clarified that the 500-team dataset is a generated 4v4 team strength waterline, not a PvE "mob clear" test in the usual sense.
- Ran all 17 standard preset teams against the 500-team waterline and split results by bucket.
- Investigated why `bloodRage` is low on the waterline even though berserker-containing role/team scores can be high.
- Confirmed that the low `bloodRage` score is a team/window issue, not simple proof that berserker is weak.
- Confirmed that `bloodRage` currently uses `undyingRoar`, while the existing first-death auto-trigger path in `combat-sim.js` only recognizes `aaRazorRoar`.
- Temporarily tested replacing `bloodRage` berserker ultimate with `aaRazorRoar` in memory only; it made results worse.
- Temporarily tested a hypothetical auto-trigger that fires the full `berserkerRoar` package; it made results much stronger and may be too high.

## Files Changed

- `coop_repo/reports/2026-06-28_2107_waterline-interpretation-and-bloodrage.md`: this handoff report.
- `coop_repo/LATEST.md`: points to this report.
- `coop_repo/REPORT_INDEX.md`: indexes this report.

No combat code, skill JSON, or generated waterline data was changed in this step.

## Validation

Commands and ad-hoc simulations were run from the repo root:

- Re-read latest coop handoff and current worktree state.
- Ran 17 fixed standard presets against 500 waterline teams: 8,500 deterministic battles.
- Ran temporary in-memory `bloodRage` variants against the waterline and selected presets.
- No file-level validation was needed because only coop markdown was added/updated.

## Current State

The waterline should be interpreted as a reusable generated 4v4 benchmark:

- A new team can be tested against the same 500 generated teams.
- The most useful result is per-bucket performance:
  - `0-2`: weak generated teams.
  - `3-7`: normal generated teams.
  - `8-12`: elite generated teams.
  - `13-14`: boss-grade generated teams.
  - `15-17`: apex/anomaly generated teams.
- The total win rate is useful, but less informative than the bucket curve.

Current fixed preset waterline results:

| Standard Team | Total | 0-2 | 3-7 | 8-12 | 13-14 | 15-17 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 余烬爆燃 `fireBurst` | 87% | 100% | 98% | 90% | 60% | 33% |
| 毒巢滚雪球 `poisonBloom` | 86% | 100% | 98% | 84% | 66% | 40% |
| 王冠核心 `crownCarry` | 79% | 100% | 92% | 72% | 53% | 30% |
| 霜控拖延 `frostControl` | 76% | 99% | 90% | 76% | 43% | 10% |
| 炼金异常 `alchemyChaos` | 74% | 100% | 93% | 66% | 37% | 13% |
| 赤血先锋 `scarletVanguard` | 68% | 98% | 79% | 62% | 37% | 10% |
| 暗影处决 `shadowExecute` | 64% | 99% | 83% | 49% | 24% | 7% |
| 霜陷猎场 `frostTrapField` | 63% | 100% | 84% | 49% | 16% | 7% |
| 急速节奏 `lightningTempo` | 57% | 98% | 71% | 39% | 20% | 10% |
| 低血狂怒 `bloodRage` | 48% | 89% | 56% | 31% | 21% | 3% |
| 决斗冠军 `duelChampion` | 46% | 93% | 62% | 25% | 3% | 3% |
| 王骑破阵 `cavalryBreak` | 46% | 98% | 57% | 24% | 6% | 7% |
| 圣盾续航 `holySustain` | 43% | 93% | 57% | 18% | 10% | 0% |
| 净化消耗 `purgeAttrition` | 42% | 92% | 60% | 15% | 3% | 0% |
| 铁壁反击 `ironWall` | 42% | 98% | 60% | 10% | 0% | 0% |
| 殉道前线 `martyrFrontline` | 39% | 98% | 48% | 14% | 3% | 0% |
| 壁垒猎标 `bulwarkMarks` | 38% | 90% | 47% | 16% | 3% | 0% |

Current role-score report still matters, but must not be read as naked role strength. For example:

- Berserker-containing standard teams can score reasonably well overall.
- The `bloodRage` preset itself is low because its current team structure often fails to protect berserker until the window.
- This means berserker may be a strong component with high team dependency, not a weak role.

## Bloodrage Diagnosis

Current `bloodRage` berserker kit:

```text
small1: bloodStrike
small2: boneWhirl
passive: rageEngine
ultimate: undyingRoar
```

Observed issue:

- Against high-pressure opponents, berserker often dies around 6-8 seconds.
- `undyingRoar` first active timing is around 8.8 seconds through the berserker model.
- Therefore `bloodRage` often dies before its intended low-health comeback button.

Important mismatch:

```text
combat-sim.js first-death auto-trigger only recognizes ultimate === "aaRazorRoar"
bloodRage currently uses ultimate === "undyingRoar"
```

Temporary test results:

| Variant | Total | 0-2 | 3-7 | 8-12 | 13-14 | 15-17 | Interpretation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Current `undyingRoar` | about 50% | 93% | 59% | 33% | 21% | 3% | Can win if it reaches the window. |
| Replace with `aaRazorRoar` | 42% | 90% | 51% | 21% | 10% | 3% | Auto-trigger happens, but the skill is too thin to save it. |
| Hypothetical auto full `berserkerRoar` | 81% | 98% | 88% | 74% | 73% | 43% | Proves the concept, but likely too strong. |

Conclusion: do not simply replace `undyingRoar` with `aaRazorRoar`. A better design is a controlled first-death auto trigger for the correct berserker comeback package, probably weaker than full manual `undyingRoar`.

Possible future design:

```text
First fatal hit:
- Trigger once.
- Set hp to 1.
- Give about 3.0-3.5 seconds of death prevention.
- Give about 3.5-4.0 seconds of blood fury / lifesteal.
- Give a shorter haste window than manual ultimate.

Manual ultimate:
- Keep the fuller 4.5-5.0 second comeback window.
```

## Interpretation Rule For Future Agents

Waterline score is team-structure strength, not naked character strength.

If a role has high scores in some teams but its theme preset is low, that usually means:

- The role/component is useful.
- The theme team may lack protection, trigger support, or timing alignment.
- The right fix is often team/kit structure, not a flat role buff.

The user specifically endorsed this reading with berserker:

- Berserker can be good when the team protects it until its window.
- `bloodRage` being low means the current team fails to protect or trigger it reliably.
- Future role/skill tests should compare both role-containing team scores and the theme preset score.

## Unresolved

- No permanent skill or combat change has been made for `bloodRage`.
- The first-death auto-trigger design needs a real implementation pass if the user approves.
- Assassin remains a future investigation target. Its waterline score is high, but it likely mixes poison, execute, and backline-pressure components.
- Ranger is currently the lowest role score on the waterline and may need separate review later.
- The waterline has not yet been exposed as a UI button or generic "score arbitrary team" script mode.

## Recommended Next Step

Add a generic scorer that takes any selected team or preset and reports total waterline win rate plus bucket win rates. Then use it whenever a new role, skill, or team shell is proposed. For `bloodRage`, test a controlled first-death auto-trigger version before touching broad berserker numbers.
