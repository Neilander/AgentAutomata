# 2026-06-30 Comparative Analysis + Assassin Resolution Report

## Context

This report records the latest resolution pass for the assassin attribute-scaling problem.

The project had reached a confusing state:

- Base combat numbers were mostly acceptable.
- Assassin felt structurally wrong because high-tenacity routes still outperformed agility/physical routes.
- Multiple tests gave mixed signals: matrix, waterline, single assassin, double assassin, old passive, new passive, and several attribute routes did not point to one simple answer.

The key lesson from this pass is that single-run diagnosis was not enough. We added a new project skill, then used that thinking to adjust assassin mechanics.

## New Skill: comparative-analysis

Path:

- `projects/western_fantasy_continent/skills/comparative-analysis/SKILL.md`

README updated:

- `projects/western_fantasy_continent/skills/README.md`

Purpose:

`comparative-analysis` is a second-order reasoning skill. It does not replace `phenomenon-math-modeling`; it coordinates multiple modeling passes.

Use it when there are several evidence groups that partly agree, contradict, cancel, or depend on scope.

Core workflow:

1. Normalize the user question into a testable comparison.
2. Build an evidence table.
3. Model each evidence group separately.
4. Put candidate conclusions into a conclusion ledger.
5. Mark relationships: reinforce, contradict, scope-split, cancel, measurement-artifact, or missing-variable.
6. Keep only the diagnosis that explains both success and failure cases.
7. Choose the next design lever from the surviving cause.

Why this mattered:

Earlier answers jumped too quickly from "agility is weak" to "buff agility." The comparative pass showed a more precise diagnosis:

- Agility was not completely dead.
- Tenacity was not simply overpowered.
- The real problem was that assassin's core loop could be earned by living longer, so tenacity could access the same loop more reliably than agility.
- Agility increased trigger frequency, but the extra triggers did not convert into enough kill quality.

## Assassin Problem Diagnosis

Target fantasy:

```text
Backline entry -> short hidden burst window -> high-frequency attacks -> mark/loop payoff -> reset or disengage
```

Previous problem:

```text
Assassin value = survival time * loop access * payoff quality
```

Tenacity improved survival time, and because the loop had no strong short-window constraint, more survival also meant more loop access.

That made tenacity a wrong-channel winner:

- It was not "assassin wants to be a tank."
- It was "extra life buys more assassin cycles."

Agility routes increased attack speed, but the extra attacks mostly produced low-value refund/mark events. Frequency improved, conversion quality did not.

## Implemented Skill/Runtime Changes

### New assassin passive

Path:

- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowBladeLoop.json`

Skill:

- `shadowBladeLoop`
- Display name: `影刃回环`

Current design:

- Only rewards attacks inside a short hidden-window condition.
- Basic attacks against marked targets refund small skill cooldowns.
- Cooldown refund scales with attack speed bonus.
- Successful loop triggers `影刃切割`, a small damage packet scaling with physical power and attack-speed bonus.
- Long hidden extension was reduced so tenacity cannot slowly grind the same reward forever.

### Combat runtime support

Path:

- `projects/western_fantasy_continent/game_data/combat-sim.js`

Added support for:

- `basicAttackCooldownRefund`
- `minHiddenRemaining`
- attack-speed-bonus based cooldown refund
- `cutFlat`
- `cutPower`
- `cutPowerPerAttackSpeedBonus`
- `cutType`
- `cutScaleWith`
- `cutLabel`

Also kept prior assassin target-focus protection work:

- Assassin should not abandon its focus target before that target dies.
- Blink/step style assassin skills now respect current focus where applicable.

### Validator support

Path:

- `projects/western_fantasy_continent/game_data/validate-skill-assets.js`

Added `basicAttackCooldownRefund` to known effect kinds.

### Generated skill index

Path:

- `projects/western_fantasy_continent/game_data/skill-assets.js`

Rebuilt from skill assets.

Validation command result:

```text
skill assets ok
```

## Evaluation Tooling

Path:

- `projects/western_fantasy_continent/game_data/evaluate-shadow-blade-loop.js`

Report outputs:

- `projects/western_fantasy_continent/design/team_pool/shadow-blade-loop-evaluation.json`
- `projects/western_fantasy_continent/design/team_pool/shadow-blade-loop-evaluation.md`

Evaluation scope:

- Single assassin team.
- Double assassin team.
- No-attribute matrix.
- No-attribute waterline.
- Attribute matrix.
- Attribute waterline.

Routes currently tested:

- no attributes
- 10 tenacity
- 3 agility / 7 might
- 7 agility / 3 might
- 7 agility
- 10 agility

Attribute routes are applied only to assassin units in the subject team, so the result focuses on assassin scaling instead of whole-team scaling.

## Latest Results

Latest summarized result:

| Route | Single Assassin Matrix / Waterline | Double Assassin Matrix / Waterline |
| --- | ---: | ---: |
| No attributes | 57% / 77% | 57% / 79% |
| 10 tenacity | 76% / 91% | 77% / 92% |
| 3 agility / 7 might | 74% / 84% | 70% / 91% |
| 7 agility / 3 might | 73% / 84% | 69% / 90% |
| 7 agility | 69% / 83% | 66% / 88% |
| 10 agility | 69% / 84% | 71% / 93% |

Important interpretation:

- The new passive itself is not an obvious breaker.
- Agility now has visible mechanical value.
- `10 agility` in double-assassin cases shows strong loop signals, so attack-speed scaling is finally real.
- `10 tenacity` remains the safest route because assassin still has a survival threshold.
- This is acceptable for now: tenacity is stable/safe, agility is faster-looping, might/agility is more burst-oriented.

## Why We Consider This Resolved Enough For Now

Before this pass:

- Agility appeared to have no clear identity.
- Tenacity dominated because it accessed the same rewards more safely.
- We did not know whether the problem was stats, skill formulas, test setup, team shell, or target switching.

After this pass:

- Comparative analysis identified the actual conflict.
- The new passive creates an explicit short-window attack-speed conversion.
- The matrix no longer says the new skill is exploding.
- Waterline remains high, but comparison showed much of that comes from team shell and waterline environment, not only the new passive.
- Single and double assassin both now expose meaningful differences between routes.

This is not "perfect balance." It is a stable enough design foothold.

## Remaining Risks

1. Tenacity is still very strong.

Do not immediately nerf tenacity globally. The issue is local to assassin survival thresholds and loop access.

2. Double assassin plus high agility may become a future watch item.

`10 agility` double assassin reached high waterline results. This may be acceptable if it has clear counters, but should be watched when new backline-counter or multi-front teams are added.

3. Some reports display mojibake in PowerShell output.

The JSON/skill files are valid, but terminal rendering may show garbled Chinese. Avoid judging content only from PowerShell display.

4. Current waterline may overrepresent teams that are vulnerable to backline entry.

Do not treat waterline score as pure class strength.

## Recommended Next Steps

1. Keep `shadowBladeLoop` as the current experimental assassin attack-speed passive.

2. Use `comparative-analysis` for future balance questions where there are multiple test outputs.

3. If assassin is tuned again, do not start by changing base attributes. Start from the loop:

```text
hidden window length
attack-speed conversion
cut damage quality
reset reliability
target focus
survival threshold
```

4. If more assassin skills are added, make sure at least one route supports:

- agility loop assassin
- might burst assassin
- tenacity safe-entry assassin

5. For future evaluation, rerun:

```text
node projects/western_fantasy_continent/game_data/evaluate-shadow-blade-loop.js
node projects/western_fantasy_continent/game_data/validate-skill-assets.js
```

## Files Most Relevant To Future Agents

- `projects/western_fantasy_continent/skills/comparative-analysis/SKILL.md`
- `projects/western_fantasy_continent/skills/phenomenon-math-modeling/SKILL.md`
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowBladeLoop.json`
- `projects/western_fantasy_continent/game_data/evaluate-shadow-blade-loop.js`
- `projects/western_fantasy_continent/design/team_pool/shadow-blade-loop-evaluation.md`
- `projects/western_fantasy_continent/game_data/combat-sim.js`

