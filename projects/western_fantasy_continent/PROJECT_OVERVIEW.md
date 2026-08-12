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

## Executable Player Model

The current code-owned AI playtest loop has a durable entry point at `PLAYER_MODEL_RUNTIME.md` and a machine-readable manifest at `player_model_runtime.json`.

Do not replace it with an agent narrating a whole playthrough. Code owns game state, signal interpretation, cognition, emotion, and knowledge; AI is called only for one decision and the later evidence-bound attribution. Run its listed regression before using player-model results in design work.

## Highest-Level Product Rule

The original project core was agent automation. The updated strategic rule is:

```text
agent automation + extreme productization
```

When the user or an agent gets lost in a design decision, use this as the highest behavior rule:

- either the work should improve or test agent automation capability;
- or it should improve this game's product quality as a real product, not only as a game prototype.

If a proposed change does neither, question it before implementing.

## Current Product Strategy

The game should be a simple, readable loot game that becomes deep through team configuration.

The current differentiated product pain point is small but important:

```text
I got a character / equipment / relic. What can this thing do?
```

Many competing idle loot games expose choices too early: stat allocation, dense skill text, and many abstract options before the player has a reason to care. Broad users cannot be expected to carefully read skill descriptions at the start.

This project should lean into the opposite advantage:

- roles are immediately understandable;
- priest heals;
- knight tanks;
- berserker deals risky damage;
- mage casts;
- assassin dives;
- team strategy emerges from combinations, ratios, and positions.

The target is:

```text
no learning barrier, easy to start, hard to master
```

This is similar to the strength of games where the player can play first and understand depth later. The player should not need to study before acting, but richer strategy should appear as party size, enemy pressure, relic count, and equipment depth grow.

### Player Cognition Route

The current product hypothesis is that the game should expose complexity in a staged cognition route. This route can change later, but future design should avoid jumping too far ahead too early.

Current rough route:

1. roles;
2. equipment;
3. rarity;
4. basic field effects;
5. support-role counterplay;
6. equipment level;
7. affixes;
8. specialized jobs and skills;
9. richer field effects;
10. output-role and broader role counterplay;
11. relics;
12. relic rarity;
13. relic combos;
14. relic level;
15. attribute-oriented equipment setups;
16. battlefield ratio planning;
17. large-battlefield-oriented equipment setups.

The core early-game idea is that the player's main output logic should not need to change too much. The player can first keep a stable damage plan, then adjust supporting roles around the encounter.

Example hypothesis:

- if the enemy is an archer, the player may add a high-mobility role to close distance quickly;
- if the enemy is slow but high-damage, the player may add a stun/control role instead.

This keeps the player's output fantasy stable while teaching that support roles are tools for encounter answers.

Current validation question:

```text
Given 8 basic roles, basic equipment, and rarity, what kinds of basic field effects can make the player improve a team by changing only one or two roles?
```

This question should guide the next field-effect and team-counterplay tests. The desired product behavior is not "read a complicated field rule and rebuild everything"; it is "notice the field, swap one or two roles, fight again, and feel the improvement."

### Build Closure

Because the game encourages frequent team adjustment, the product must answer:

```text
What is wrong with my current team?
```

The player needs a clear loop:

1. build a team;
2. fight;
3. understand what failed or succeeded;
4. change team / equipment / relics;
5. verify again.

This makes battle diagnosis, failure explanation, and visible combat feedback core product features rather than optional polish.

### Equipment Product Direction

Equipment should stay pure and convenient.

Equipment can have detailed attributes, such as fire duration, mark crit, healing amplification, or attack speed, but the product role of equipment is still mostly attribute configuration. Avoid turning every equipment piece into a complex rules object.

The equipment loop should eventually become:

- early game: stack understandable attributes;
- later game: farm for concentrated affixes;
- later game: decide which attributes are most important for a specific team;
- advanced game: use universal affixes or helper affixes to reduce build-friction.

Fast equipment swapping is mandatory for the product direction. The exact interaction model is unresolved, but the target is clear: players should be encouraged to adjust builds without feeling punished by inventory friction.

Open problem:

```text
When different encounters require different setups, how do we reduce repeated manual re-equipping?
```

Do not solve this prematurely, but keep it visible.

### Relic Product Direction

Implicit team logic is valuable, but long-term build depth cannot rely only on hidden chess-like reasoning.

Relics are the future explicit build layer. They should make build engines visible and let the player feel that a configuration choice became powerful.

Possible long-term shapes:

- season-like relic pools;
- 10-relic battles;
- 20-relic battles;
- extreme late tests such as 50 relics plus large-scale battles.

The product promise is not "more complexity earlier." The promise is:

```text
play simply first, then discover configuration depth through visible payoffs.
```

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

The accepted profession / magic-school / equipment-set framework is recorded in [`design/combat_profession_magic_school_framework_v1.md`](design/combat_profession_magic_school_framework_v1.md). Physical skills come from professions; magic skills carry optional school tags; characters are not forced to have a school. The first implemented school set is the Nature-school six-piece set `繁生之环`, with a repeatable mock battle in the initial village.

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

### Battle Camera Model

The temporary map-lab idea of forcing allied units to stay fixed is withdrawn. The desired future model is a real battle camera / viewport system, not a unit-position hack.

Target behavior:

- during combat, the camera should normally stay stable;
- if living units touch or threaten the viewport boundary, the camera may pan or zoom out to keep the important combat area visible;
- after the units no longer touch the boundary, the camera may shrink back in smoothly;
- outside active combat, the camera may reframe so the party sits toward the left side of the screen, creating room for the next enemy wave or encounter entrance.

This means battle rendering should eventually separate world coordinates from screen coordinates. Unit AI movement should remain a combat concern; camera framing should be a presentation concern. Do not solve this by making allies stop moving, by manually accelerating only one side, or by rewriting combat rules for a single page.

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
