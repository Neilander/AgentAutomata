# Western Fantasy Continent Project Overview

This document is the durable project overview for future agents. It describes the current product direction, accepted constraints, and hard lessons. It does not replace source code, design docs, or `coop_repo` handoff reports.

## Current Positioning

We are building a western-fantasy idle loot + auto-battle + team-building game prototype.

The core is not an open world. The current goal is to connect several already-validated systems into a playable loop:

- class-based auto combat;
- equipment farming;
- team preparation;
- town prosperity;
- recruitment;
- event pressure;
- relics / long-term collection.

The working style is small-step iteration. Add one verifiable anchor at a time.

## Established Core

### Combat System

There is already a unified combat framework:

- `game_data/combat-sim.js`
- `battle_view/battle-view.js`

Do not write a new simplified combat system. All pages should reuse the shared `combat-sim` and `battle-view`.

Classes already have tested identities after multiple tuning passes:

- berserker;
- assassin;
- mage;
- priest;
- knight;
- related branches such as shadow assassin, low-health berserker, ember burst, and poison teams.

Combat must be visible. A large part of the game fantasy is watching auto-battle unfold. Pure background text resolution is not enough.

### Equipment Farming

Existing prototypes:

- `equipment_grind_v2`
- `equipment_grind_v3`

V3 is the current experimental mainline. V2 can remain as a baseline.

Equipment direction:

- equipment level determines base stats;
- rarity determines affix count;
- affixes include major attributes, minor attributes, and archetype/build attributes;
- each item randomly focuses 1-2 affixes, with about half of affix slots concentrated into those focuses and the rest random.

Drop pacing does not need to be over-tuned so the player clears everything after only a few runs. In a real game, long farming with gradually diminishing returns is acceptable.

Recommended power has two meanings:

- first-clear reference: roughly when a player in the progression flow may be able to clear;
- stable recommendation: similar-power teams have a high win rate.

The player-facing display should currently prefer stable recommendation. User playtesting found `D2=9600` more accurate than `D2=5500`.

### Growth Curve Aesthetic

The preferred growth feel is wave-shaped:

1. initial lift;
2. bottleneck;
3. key equipment breakthrough;
4. next growth wave.

Do not keep deep-tuning loot curves just for their own sake right now. The higher-value next step is making the prototype feel like a complete game.

The project already has a progression-curve skill that preserves this wave-shaped preference.

## Town Loop

The user proposed:

```text
player active growth curve + world event pressure curve
```

`佣兵小镇 V1` exists. A later pass moved toward an App Shell so page changes do not destroy the battle view.

Correct direction:

- App Shell / single-page shell;
- global battle dock as a persistent object;
- navigation swaps content without destroying combat;
- suitable for future Electron / Steam packaging.

The multi-HTML-page approach has a structural problem: page switches destroy DOM/JS state, so combat resets.

### Town System Design

Town loop principles:

- the game has days;
- players can farm regions indefinitely;
- do not hard-limit daily region attempts;
- the same region can have light same-day drop decay, for example from 100% down toward 80% or a 70%-75% floor;
- facilities and events resolve only when the player clicks next day;
- event cards preview threats several days ahead;
- players farm gear, swap members, recruit, and adjust teams before events;
- when an event arrives, it forces combat or auto resolution and rewards facilities or prosperity.

### Prosperity And Recruitment

Prosperity is a long-term growth axis.

Recruitment rules:

- higher prosperity means stronger recruits;
- initial characters must be weak;
- initial characters should have skill level 1 and low rarity;
- skill levels do not currently grow through battle;
- high-skill characters come from higher-prosperity recruitment;
- character rarity can be derived from total skill levels;
- rough skill-level scaling: each +1 average skill level gives about +10% core combat capability.

Important correction: earlier, initial characters could randomly get high skills. That was wrong and has been fixed.

### Team Preparation

Teams are not a simple active list. They must use explicit slots:

- front 1;
- front 2;
- back 1;
- back 2.

When the player selects a character and clicks a specific slot, the character must go into that slot.

The data model must use explicit `teamSlot: 0/1/2/3`. Do not rely on `activeHeroes` ordering. Relying on order caused the bug where clicking `back 2` placed the character into `back 1`; this has been fixed with explicit `teamSlot`.

### Battle Display

The user is clear: the player should be able to watch combat while operating other parts of the game.

Correct solution:

- global battle dock / battle bar;
- ideally one persistent `battle-view` in the App Shell;
- page navigation should not destroy it.

Incorrect solution:

- region page shows combat, while other pages only show text settlement.

If persistence is not yet possible, use two layers:

- visible foreground combat;
- background simulation settlement.

The final direction should still be single-page App Shell.

## UI Direction

Do not put every system on one page.

Each page should have a clear mental model:

- town home: day, prosperity, facilities, event preview;
- region farming: region, recommended power, drops, farming controls;
- team prep: characters, four slots, character details, equipment changes;
- equipment warehouse: equipment only, without complex character operations;
- recruitment hall: three-choice recruitment, rarity, and skill levels.

Main interface should have breathing room. Do not fill everything. The middle can be reserved for future character art, scenes, or performance.

Operational UI should be clear. Do not stack cards endlessly.

This is a game, not a backend management dashboard. Combat fantasy, character fantasy, and equipment fantasy must be visible.

The project UI design skill should later absorb these lessons explicitly.

## Steam / Electron Direction

Packaging a Web App with Electron or Tauri for Steam is reasonable.

App Shell is better than multi-page HTML for this direction because:

- state can stay resident;
- combat can stay resident;
- page switching feels more like game UI;
- resource loading and saves are more controllable.

Multi-page HTML can be packaged, but interaction state fragments badly, especially for persistent combat.

## Current High-Level Task Lines

The project task board currently tracks these fronts:

- gameplay signal system: useful direction, currently postponed;
- agent math modeling capability;
- progression / build-system work;
- role and relic angular archetype design;
- mercenary town playtest loop.

The gameplay signal direction is to record gameplay signals and later parse them into higher-level signals such as fun, fatigue, boredom, pressure, and breakthrough feeling, so AI can judge play quality from structured evidence.

The role/relic angular archetype direction exists because current roles and relics can become too broad. More sharp skills, role variants, core relics, and bridge relics are needed so players perceive explicit build engines rather than only implicit chess-like team logic.

## Collaboration Rules

Every time an agent starts work in this repository:

1. Read `coop_repo/LATEST.md`.
2. Open the report linked from it.
3. Run `git status --short`.

After meaningful work:

1. create a new report under `coop_repo/reports/` using `coop_repo/REPORT_TEMPLATE.md`;
2. do not overwrite older reports;
3. update `coop_repo/LATEST.md`;
4. update `coop_repo/REPORT_INDEX.md`;
5. record validation results and unresolved risks honestly.

`coop_repo` is coordination memory, not a substitute for source code or design documents.

The worktree can contain many modified or untracked files. Do not revert another agent's unfinished changes.

## Recently Relevant Files And Reports

Recent implementation areas:

- `projects/western_fantasy_continent/town_loop/`
- `projects/western_fantasy_continent/app/server/server.js`
- `projects/western_fantasy_continent/workbench/index.html`

Important reports:

- `2026-07-03_1316_town-loop-v1.md`
- `2026-07-03_2211_town-loop-team-recruit-correction.md`
- `2026-07-03_2220_town-loop-explicit-team-slot-fix.md`
- `2026-07-03_2310_town-loop-grind-feedback-fix.md`
- `2026-07-03_2323_town-loop-global-visible-battle.md`
- `2026-07-04_0047_town-loop-region-global-dock-unification.md`

## Hard Lessons

- Do not implement another simplified combat system.
- Do not hide combat.
- Do not let recommended power be only a formula; validate it with real simulation.
- Do not let initial characters start with high skills.
- Do not fake team positions by sorting; use explicit slots.
- Do not put every system onto one page.
- Do not only write reports without making the project better.
- If the user strongly rejects a UI experience, it is usually not a small aesthetic issue. It usually means the interaction model is wrong.
