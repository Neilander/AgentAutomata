# Agent Handoff: Balance Showcase And Open Bugs

- Date: 2026-06-29
- Agent/thread: Codex desktop
- Scope: Balance showcase, shadow assassin review, and remaining combat bugs
- Status: partial

## User Intent

The user wanted a practical battle-view page to watch current balance progress, especially old presets, single/double blink-shadow assassin, and low-health berserker. After watching, the user identified two remaining combat issues that should be fixed next.

## Completed

- Added a new workbench page: `阶段性数值调整成果展示`.
- Route: `/balance_showcase/`.
- Added the workbench entry in `projects/western_fantasy_continent/workbench/index.html`.
- Added static route support in `projects/western_fantasy_continent/app/server/server.js`.
- Reused the shared `battle_view` renderer and unified `combat-sim`; did not make a fake static result board.
- Added curated no-attribute 4v4 scenarios:
  - Old `shadowExecute` vs `frostControl`.
  - Double-shadow vs `frostControl`.
  - Single-shadow vs `frostControl`.
  - Old `shadowExecute` vs `poisonBloom`.
  - Double-shadow vs `poisonBloom`.
  - Single-shadow vs `poisonBloom`.
  - Double-shadow vs `fireBurst`.
  - Single-shadow vs `fireBurst`.
  - `bloodRage` vs `ironWall`.
  - `bloodRage` vs `fireBurst`.
- Added per-scenario right-side notes:
  - opponent advantage,
  - watch points,
  - quick 8-seed summary,
  - first enemy death,
  - enemy death sequence.
- Browser-checked desktop and narrow mobile layout. Narrow layout has no horizontal overflow.

## Current Balance Read

Single blink/shadow assassin:

- The showcase now includes single-shadow failure cases.
- Current interpretation: single shadow can disrupt, but it does not reliably finish a key backline target before enemy combo or counter-pressure starts.
- It lacks the second assassin's damage density and follow-up, so it often trades too slowly or dies before a second window.

Double shadow assassin:

- Looks more like a real anti-combo branch than a single-character replacement.
- It can break some key-unit teams by killing one important backline unit early.
- It still has natural predators, especially teams that do not care if one unit is cut, or teams with redundant damage cores.

Fire-burst clarification:

- `fireBurst` has two mages.
- In checked seeds, one mage dies early, but the second mage continues casting.
- Mage fire/burn echo can also create damage that visually looks like the dead mage is still acting.
- The showcase now explicitly says this, but the user still noticed a visual/FX clarity problem.

## Open Bugs / Next Fixes

1. Blink/shadow assassin target lock is wrong.

- Current observed behavior: the assassin blinks to the backline, but may retarget and start hitting a frontline unit afterward.
- Expected behavior: after `shadowBurstAmbush` / blink thrust picks a target, the assassin should stay locked on that target for the intended lock window and keep attacking it.
- Likely area to inspect:
  - `projects/western_fantasy_continent/game_data/combat-sim.js`
  - `shadowStepStrike`
  - `forcedTargetId`
  - `forcedTargetTimer`
  - `chooseTarget()`
  - `basicAttack()`
- Check whether forced target is being set to a unit id that later does not match `chooseTarget`, or whether normal taunt/frontline targeting overrides it.

2. Mage/fire FX anchor is misleading after one mage dies.

- User observation: in `双暗影刺客 vs 余烬爆燃`, one mage is killed, but later fire effects appear to play from or near the dead mage's position.
- Current sim check did not show the dead mage continuing active casts, but the visual effect can still make it look that way.
- Expected behavior: live mage casts should visually originate from the live mage, not the dead mage's old position. Death echo / burn residual should be visually distinguishable from an active cast.
- Likely areas to inspect:
  - `projects/western_fantasy_continent/battle_view/battle-view.js`
  - `playUnifiedSignal()`
  - `displayUnitForRef()`
  - `syncUnifiedUnits()`
  - signal source refs for burn / `kindlingEcho` / `火种余爆`
- If residual burn is intentionally attributed to the dead mage, consider rendering it as a target-centered DOT/echo, not a source-to-target active cast.

## Files Changed In This Phase

- `projects/western_fantasy_continent/balance_showcase/index.html`
- `projects/western_fantasy_continent/balance_showcase/styles.css`
- `projects/western_fantasy_continent/balance_showcase/showcase.js`
- `projects/western_fantasy_continent/workbench/index.html`
- `projects/western_fantasy_continent/app/server/server.js`
- `coop_repo/LATEST.md`
- `coop_repo/REPORT_INDEX.md`

Related earlier tuning files are still dirty from previous work:

- `projects/western_fantasy_continent/game_data/combat-sim.js`
- `projects/western_fantasy_continent/game_data/skill-assets.js`
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowBurstAmbush.json`
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowMomentum.json`
- `projects/western_fantasy_continent/game_data/validate-skill-assets.js`

Do not revert those without checking the previous reports.

## Validation

- `node --check projects/western_fantasy_continent/balance_showcase/showcase.js`: passed.
- `node --check projects/western_fantasy_continent/app/server/server.js`: passed.
- `node projects/western_fantasy_continent/game_data/validate-skill-assets.js`: passed.
- Browser checked `/balance_showcase/`:
  - page loads,
  - 10 scenario cards visible,
  - battle preview renders 8 units,
  - playback starts and logs advance,
  - scenario switching works,
  - narrow 390px layout has no horizontal overflow.

## Recommended Next Step

Fix target locking first. The single-shadow diagnosis depends on whether the assassin actually stays on its blink target. After that, fix or clarify mage FX anchoring for fire-burst so visual review matches simulator truth.
