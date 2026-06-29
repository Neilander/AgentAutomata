# 2026-06-29 Assassin Hidden / Shadow Burst Report

## Broader Task-Line Context

This report is not an isolated assassin note. It belongs to the current **progression build-system** task line.

The current task board exists here:

- Data: `projects/western_fantasy_continent/design/task-budget-board.json`
- Frontend: `projects/western_fantasy_continent/task_board/`
- Store/API helpers:
  - `projects/western_fantasy_continent/game_data/task-board-store.js`
  - `projects/western_fantasy_continent/game_data/update-task-board.js`
  - `/api/task-board` in `projects/western_fantasy_continent/app/server/server.js`

Important rule already recorded in the task board:

> Task lines are not infinite chains. Peripheral validation/tools must return to the current center.

Current center:

- `progression-new-skill-design` / 设计新技能

Why we are here:

1. Earlier work accepted a mostly stable base-stat anchor.
2. Then attribute/add-point exploration showed that some classes did not prefer their intended attributes.
3. Especially assassin and berserker had problems consuming their fantasy stats.
4. The agreed direction was: do not keep changing base stats first; design new skills that make the intended stats meaningful.
5. Assassin hidden / shadow burst is one focused experiment under that current new-skill-design center.

Relevant current task-board line:

| Task | Status | Meaning |
| --- | --- | --- |
| `progression-equipment-system-design` | queued | Equipment system still pending. |
| `progression-attribute-allocation-design` | queued | Attribute system design exists but still needs more validation. |
| `progression-meaningful-build-routes` | queued | Need to prove multiple add-point routes are meaningful. |
| `progression-new-skill-design` | active | Current center: design skills that create distinct build routes. |
| `progression-new-skill-balance` | queued | Balance the new skill batch after enough skills exist. |
| `progression-evaluation-standard-v2` | queued | Improve evaluation standards after skill work. |
| `progression-attribute-adjustment-loop` | queued | Only return to attribute changes when skill-side fixes are insufficient. |

## Context

Current balancing thread was blocked on assassin identity.

Observed issue:

- Assassin and berserker were not clearly eating their intended attributes.
- Assassin especially preferred generic survival in tests.
- This means the kit was not solving the real fantasy problem: assassin should survive by timing, target access, threat drop, and burst window, not by becoming tanky.

User direction:

- Keep the previous meat/poison assassin direction available.
- Try a new assassin variant: **shadow burst rogue**.
- Explore a hidden/low-aggro mechanism inspired by auto-battler assassin behavior.

## Design Reasoning

The math-modeling skill was used conceptually:

- Symptom: assassin likes HP/survival.
- First decomposition:
  - Entry reliability
  - Time alive after entry
  - Burst payoff during the entry window
  - Exit/reset safety
- Bad fix:
  - Add raw HP, shield, or defense.
- Better fix:
  - Reduce ordinary enemy targeting pressure while the assassin is in the shadow window.
  - Keep counterplay by letting the attacked target retaliate briefly.
  - Make attack speed and physical power matter during that window.

External reference checked:

- Old TFT / 金铲铲 style assassins used backline access, stealth/low targetability, and positional counterplay.
- Important takeaway: the solution is not "assassin has more HP"; it is "assassin changes the targeting problem".

## Implemented Changes

### Combat Framework

File:

- `projects/western_fantasy_continent/game_data/combat-sim.js`

Added:

- `hiddenTimer`
- `hiddenRetaliateTimer`
- Ordinary targeting now ignores enemies with active `hiddenTimer`, unless all enemies are hidden.
- Hidden attacker forces only the target they hit to retaliate for a configurable short duration.
- Added `shadowStepStrike` effect:
  - Blinks to backline lowest HP-ratio enemy.
  - Applies short target lock.
  - Can apply hidden duration.
  - Can apply mark stacks.
  - Emits movement / hidden / mark signals.

Important behavioral intent:

- The assassin can enter the enemy backline without instantly pulling the whole enemy team.
- The victim can still answer, so the mechanic is not pure invulnerability.

### New Skill Assets

Added:

- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowBurstAmbush.json`
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowMomentum.json`

New shadow burst kit pieces:

- `暗影突袭`
  - Small skill.
  - Backline blink.
  - Hits lowest HP-ratio backline enemy.
  - Applies hidden window.
  - Applies mark stacks.
  - Uses short retaliation window.

- `影势连杀`
  - Passive.
  - Basic attacks apply mark.
  - Slightly increases attack speed.
  - Intended to make attack speed useful inside the hidden burst window.

### Experimental Kit Wiring

File:

- `projects/western_fantasy_continent/game_data/analyze-attribute-build-routes-v2.js`

Experimental assassin kit currently uses:

- `small1`: `shadowBurstAmbush`
- `small2`: `throatCut`
- `passive`: `shadowMomentum`
- `ultimate`: `midnightBloom`

Previous assassin experiment assets were not deleted.

## Validation Run

Commands run:

- `node --check projects\western_fantasy_continent\game_data\combat-sim.js`
- `node --check projects\western_fantasy_continent\game_data\analyze-attribute-build-routes-v2.js`
- `node projects\western_fantasy_continent\game_data\build-skill-assets.js`
- `node projects\western_fantasy_continent\game_data\validate-skill-assets.js`
- `node projects\western_fantasy_continent\game_data\validate-combat-signals.js`
- `node projects\western_fantasy_continent\game_data\analyze-attribute-build-routes-v2.js`
- `node projects\western_fantasy_continent\game_data\analyze-attribute-team-routes-v2.js`

Generated / updated reports:

- `projects/western_fantasy_continent/design/attribute-build-route-simulation-v2.md`
- `projects/western_fantasy_continent/design/attribute-team-route-simulation-v2.md`

All validation commands passed.

## Test Results

### 1v1

Assassin still prefers pure survival:

- `10坚韧`: 50%
- `3主7副`: 40%
- `10副`: 40%
- `7主3副`: 40%
- `5主5副`: 38%

Interpretation:

- Hidden reduced some pressure, but 1v1 still rewards staying alive more than burst expression.
- This is partly expected because there are no extra enemies to avoid in 1v1.

### 2v2

Assassin result:

- `10坚韧`: 54%
- `10副`: 54%
- `3主7副`: 46%
- `5主5副`: 46%

Interpretation:

- The shadow kit started to make intended routes viable, but survival is still tied for best.
- Short hidden window is helping, but not enough to dominate the route preference.

### 4v4

Assassin result:

- `10坚韧`: 43%
- `10副`: 36%
- `全分散`: 32%
- `5主5副`: 29%
- `7主3副`: 29%
- `10主`: 21%

Interpretation:

- 4v4 still exposes the core problem.
- Assassin reaches the backline, but does not convert the window hard enough.
- Once the hidden window ends, the assassin still collapses too easily.
- Pure survival remains best, which means the fantasy is not fully solved.

## Current Conclusion

The hidden mechanism is directionally correct.

It fixed part of the problem:

- Assassin is no longer simply "walk into the enemy team and die".
- Targeting behavior now supports assassin fantasy.
- The combat framework now has a reusable low-aggro / hidden primitive.

It did not fully solve the attribute issue:

- Assassin still prefers survival in route tests.
- Attack speed and physical burst are not yet strong enough as the primary answer.
- The kit lacks a clear **exit/reset payoff** after a successful burst.

## Recommended Next Step

Do not solve this by adding HP, armor, or shields.

Next mechanic to try:

### Shadow Reset / Exit Payoff

Possible version:

- If assassin kills a target during hidden window:
  - refresh short hidden duration, or
  - blink to the next lowest backline target, or
  - reset part of `暗影突袭` cooldown.

Alternative version:

- If assassin reaches max mark stacks on a target:
  - consume marks for burst damage,
  - briefly re-enter hidden,
  - or gain a short untargetable/evade reposition.

Why:

- This makes attack speed valuable because it helps fill the window.
- This makes physical burst valuable because it secures the reset.
- This makes survival indirect, based on execution tempo, not raw tank stats.

## Handoff Notes

Good state to continue from:

- Framework primitive exists.
- New shadow burst skill assets exist.
- Validation passes.
- Reports show the mechanism is promising but incomplete.

Do not delete:

- Previous meat/poison assassin assets.
- Existing old skills.

Avoid:

- Directly buffing assassin HP.
- Making hidden full invulnerability.
- Creating overly specific targeting rules like "most dangerous enemy" unless there is a concrete measurable rule.

Suggested next test goal:

1. Add one reset/exit skill or passive for shadow burst assassin.
2. Rebuild skill assets.
3. Run skill validation.
4. Run 1v1 / 2v2 / 4v4 route tests.
5. Acceptance target:
   - 4v4 should no longer have `10坚韧` as the only effective assassin route.
   - At least one intended route such as `10副`, `3主7副`, or `5主5副` should be within 5 percentage points of the best route.
   - Survival route can remain viable, but should not be clearly dominant.
