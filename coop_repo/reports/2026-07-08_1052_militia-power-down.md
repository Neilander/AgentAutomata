# Agent Handoff: Militia Power Down

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: tune militia stats down so militia fill jobs worse than full heroes
- Status: complete

## User Intent

The user found the shield militia suspiciously strong because it had more HP and much more armor than the knight. The intended product role is that militia can perform a job, but much worse than the corresponding full profession. For example, if a knight's guard/tank job is 100, shield militia should only reach roughly 60 and should not bring shield support, counterattack, or reliable team protection.

## Completed

- Lowered all four starting militia in `militia_progression_lab`.
- Shield militia changed from an over-armored frontliner into a weak temporary blocker:
  - `hp 410 -> 330`
  - `armor 24 -> 8`
  - output remains `8`
- Bow militia changed from meaningful ranger-like pressure into light ranged filler:
  - `hp 175 -> 160`
  - `power 24 -> 16`
  - `physicalPower 29 -> 18`
  - `armor 4 -> 3`
  - `range 44 -> 42`
- Spark apprentice changed from near-real mage power into weak spell filler:
  - `hp 135 -> 125`
  - `magicPower 42 -> 28`
  - `range 42 -> 40`
- Herb militia changed from moderate healer into weak sustain filler:
  - `hp 170 -> 155`
  - `power 9 -> 8`
  - `magicPower 24 -> 18`
  - `armor 4 -> 3`
  - `range 38 -> 36`

## Files Changed

- `projects/western_fantasy_continent/militia_progression_lab/militia-progression-core.js`: lowered militia stats and adjusted role notes.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node --check projects/western_fantasy_continent/militia_progression_lab/militia-progression-core.js`: passed.
- `node projects/western_fantasy_continent/game_data/simulate-militia-progression-lab.js 12 18`: passed.
  - `avgWins: 18 / 18`
  - `avgFinalPower: 19116`
  - `clearedGateRuns: 12 / 12`
  - verdict remained `前期闭环可试玩`
- Temporary waterline comparison against `mob-waterline-db.json`:
  - Replace the first knight in each knight-containing preset with current shield militia.
  - No preset improved after replacement.
  - The previously suspicious `cavalryBreak` case changed from `52.4% -> 55.8%` before tuning to `52.4% -> 33.2%` after tuning.
  - Near-60 examples now drop strongly:
    - `ironWall`: `54.2% -> 3.6%`
    - `frostTrapField`: `66.4% -> 13.6%`
    - `purgeAttrition`: `51.8% -> 13.0%`
    - `duelChampion`: `48.0% -> 7.8%`

## Current State

Militia now behave as weak job fillers rather than low-rarity full heroes. They still let the early lab progress under the scripted/recommended route, but replacing a full knight with shield militia is clearly worse in standard waterline tests.

## Unresolved

- The new militia values may be slightly harsh in manual play even though autoplay still clears; user playtest should judge whether they feel too useless.
- Browser visual smoke was not rerun after the stat-only change.
- The temporary waterline comparison was run from an inline Node script and not saved as a reusable validator.

## Recommended Next Step

Replay `/militia_progression_lab/` manually and check whether militia still feel like useful emergency bodies. If shield militia feels too useless, raise only HP slightly before touching armor; armor should stay far below the previous value.
