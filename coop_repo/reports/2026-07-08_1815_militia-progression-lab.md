# Agent Handoff: Militia Progression Lab

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: create an independent militia early-game progression demo and signal test
- Status: complete

## User Intent

The user approved the idea that early mercenary-town play should not expose too many random full heroes. The requested direction was:

- start with 2 full heroes and 4 extreme militia;
- militia should be useful but incomplete;
- early trash fights should be simple;
- stage progression should use filler fights, quality fights, and field-effect gate fights;
- prison/bandit-camp style gates should unlock new heroes;
- equipment drops should be restrained, with stage 2 introducing rare purple drops and stage 3 making them more visible.

The user asked for a standalone demo using signal-style self-play, without changing previous mercenary-town content.

## Completed

- Added a new independent page: `militia_progression_lab`.
- Added 2 starting heroes and exactly 4 starting militia:
  - `银盾骑士`: full knight hero.
  - `烬火法师`: full mage hero.
  - `盾民兵`: extreme frontliner, high durability, almost no damage, self-sustain behavior through a single small skill.
  - `弓民兵`: fragile backline low-HP pressure.
  - `火花学徒`: very fragile low-tier mage with usable magic power.
  - `草药民兵`: low-tier healer.
- Added three early stages:
  - Stage 1: `盗匪外围`, no purple drops.
  - Stage 2: `重盾营地`, introduces a 1% purple chance.
  - Stage 3: `腐化矿洞`, raises purple chance to 4%.
- Each stage has:
  - filler fight;
  - quality fight;
  - field-effect gate fight.
- Gate fights unlock heroes:
  - `哨塔监狱` unlocks `林地游侠`.
  - `重盾营地` unlocks `破盾战士`.
  - `余火矿井` unlocks `晨祷牧师`.
- Added automatic equip and a signal panel:
  - militia/tank/healer contribution;
  - equipment count and rarity count;
  - gate status;
  - recent run log.
- Added an independent Node self-play script:
  - `projects/western_fantasy_continent/game_data/simulate-militia-progression-lab.js`
- Added a small backwards-compatible `battle_view` option so callers can pass `fieldEffectId` into the shared battle replay.

## Files Changed

- `projects/western_fantasy_continent/militia_progression_lab/index.html`: new demo page.
- `projects/western_fantasy_continent/militia_progression_lab/styles.css`: new black-gold game UI for the lab.
- `projects/western_fantasy_continent/militia_progression_lab/militia-progression-core.js`: shared browser/Node progression model.
- `projects/western_fantasy_continent/militia_progression_lab/app.js`: page interaction, battle replay, signals, auto play.
- `projects/western_fantasy_continent/game_data/simulate-militia-progression-lab.js`: Node self-play script.
- `projects/western_fantasy_continent/app/server/server.js`: added static route for `/militia_progression_lab/`.
- `projects/western_fantasy_continent/workbench/index.html`: added workbench entry.
- `projects/western_fantasy_continent/battle_view/battle-view.js`: optional `fieldEffectId` passthrough for unified combat replay.
- `coop_repo/reports/2026-07-08_1815_militia-progression-lab.md`: this report.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node --check projects\western_fantasy_continent\militia_progression_lab\militia-progression-core.js`: passed.
- `node --check projects\western_fantasy_continent\militia_progression_lab\app.js`: passed.
- `node --check projects\western_fantasy_continent\game_data\simulate-militia-progression-lab.js`: passed.
- `node --check projects\western_fantasy_continent\battle_view\battle-view.js`: passed.
- `node --check projects\western_fantasy_continent\app\server\server.js`: passed.
- `node projects\western_fantasy_continent\game_data\simulate-militia-progression-lab.js 12 18`: passed.

Self-play summary after tuning:

```text
runs: 12
avgWins: 18 / 18
avgFinalPower: 18860
avgRoster: 9
avgEpics: 2
firstEpicRounds: 6-15 range in sampled runs
clearedGateRuns: 12 / 12
verdict: 前期闭环可试玩
```

Extra spot check:

- Fresh team can still clear stage 1 gate.
- Fresh team loses stage 2 gate.
- Fresh team loses stage 3 gate.
- With staged filler/quality farming, gates become clearable and unlock new heroes.

Browser smoke check:

- Opened `http://localhost:3777/militia_progression_lab/`.
- Page title and H1 render correctly.
- Reset state shows 6 starting characters.
- No horizontal overflow at 1280px viewport.
- `自动试玩 18 轮` expands the roster from 6 to 9 and updates equipment/signals/logs.

## Current State

The lab is a standalone prototype for the new early-game structure:

```text
2 heroes + 4 militia -> filler farming -> quality fight -> field gate -> rescue hero -> next stage
```

It is intentionally not wired into `town_loop` yet. This keeps the old town prototype intact while allowing the user to play and judge the new pacing.

## Unresolved

- The auto-play path is currently smooth: 18/18 wins in sampled runs. This is acceptable for a first "recommended route" demo, but real player behavior may need more failed attempts or a more explicit manual challenge route.
- The page uses localStorage. If older local state exists, click `重置实验` before judging the intended starting setup.
- The battle replay now supports field effects, but visual readability of each field effect still needs a focused pass later.
- Equipment auto-equip is intentionally simple and may over-optimize for power rather than teaching item choice.

## Recommended Next Step

Have the user play `/militia_progression_lab/` manually:

1. Reset experiment.
2. Try stage 2/3 gates early to feel the wall.
3. Run filler and quality fights.
4. Watch whether rescued heroes feel meaningfully better than militia.
5. Judge whether stage 2 and stage 3 drop pacing feels restrained but exciting.

If this pass feels right, the next implementation step is to port the structure into `佣兵小镇 V1` as the real early-game route.
