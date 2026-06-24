# Agent Handoff: Full Skill Asset And Archetype Goal

- Date: 2026-06-23
- Agent/thread: current Codex goal thread
- Scope: `projects/western_fantasy_continent`
- Status: partial, ready for another agent to continue

## Original Goal

The user asked for two connected outcomes:

1. Refactor skills into real asset files so gameplay code loads and executes them automatically across the project, without manually synchronizing separate implementations.
2. Use the project skill-design workflow to validate and adjust all existing archetypes.

Balance work must avoid circular tuning. Every problem, hypothesis, experiment, accepted change, and rejected change must be recorded hierarchically in Markdown and reviewed before choosing another patch.

The intended final product is not a matrix where every matchup is 50:50. Each archetype should have favorable and unfavorable opponents, usually around soft `60:40` relationships rather than widespread `90:10` or `100:0` outcomes.

## Intent Map: Exact Current Status

The intent map is used, but only as a structural design check.

### What currently uses it

`game_data/analyze-archetypes.js` contains:

- `EFFECT_TAGS`: maps runtime effect kinds such as `meteorRain`, `hitLowestEnemy`, and `teamShield` to design tags.
- `PRESET_EXPECTATIONS`: declares tags each archetype wants and counter tags it should watch.

The script loads the authoritative JSON assets, aggregates the tags provided by every skill in a preset, and generates:

`design/archetype-analysis-report.md`

All ten current presets pass this structural intent scan.

### What does not use it yet

- The live combat runtime does not read the intent map.
- Skill JSON files do not currently contain their own design-intent metadata; the mapping is centralized in the analyzer.
- The intent map does not automatically generate skills.
- The intent map does not automatically select balance changes.
- Signal acceptance criteria are not evaluated generically from the intent map.
- Matchup expectations use a second independent table, `EXPECTED`, in `game_data/simulate-archetype-matchups.js`.
- The structural intent table and matchup expectation table can therefore drift apart.

### Recommended intent-map completion

Move design metadata into source assets:

- Skill assets: `designTags`, role ownership, setup/payoff classification, weight.
- Preset assets: fantasy, desired signals, strong/weak matchups, formation difficulty, expected skill volume.

Then make both analyzers consume those fields instead of maintaining hardcoded maps. A later automated design agent can use the same metadata as its input and acceptance contract.

## Architecture Completed

### Authoritative asset source

The source of truth is:

`game_data/skill_assets/**/*.json`

It currently contains:

- 41 individual skill assets.
- 10 role assets.
- 10 four-unit preset assets.
- A berserker combat model.
- Asset metadata and a README.

### Asset loading and generation

- `game_data/skill-asset-source.js` loads the JSON source in Node.
- `game_data/build-skill-assets.js` generates the synchronous browser bundle.
- `game_data/skill-assets.js` is generated output, not the source of truth.
- `game_data/validate-skill-assets.js` compares source JSON and generated output deeply and rejects drift.

After changing JSON assets, run:

```sh
node projects/western_fantasy_continent/game_data/build-skill-assets.js
node projects/western_fantasy_continent/game_data/validate-game-data.js
```

### Shared skill behavior

- `game_data/skill-data.js` is the shared effect executor.
- Pages receive skill definitions through `createSkillLibrary`.
- New numbers and combinations belong in JSON.
- A genuinely new mechanic requires adding an effect kind to the executor and validator.
- `genre_arena` and `team_simulator` now fail clearly if the shared runtime is absent; they no longer silently activate copied fallback skills.

### Shared simulation

- `game_data/combat-sim.js` is a browser/CommonJS headless simulator.
- `game_data/simulate-archetype-matchups.js` runs 15 deterministic seeds from both sides, for 30 games per matchup.
- The arena's macro balance button uses the same simulator and the same side-normalized calculation.

### Combat signals

Signals exist for:

- Basic attacks.
- Small skills and ultimates.
- Damage and mitigation.
- Healing and shields.
- DOT/status events.
- Periodic health snapshots.

`game_data/validate-combat-signals.js` asserts that core signals exist and that melee taunt redirects assassin damage.

### Functional mechanic fixed

`tauntLine` previously said it taunted but only granted shield/reduction.

It now applies a five-second `tauntTimer`. Melee units prioritize active taunters; ranged units do not, matching the description of taunting nearby enemies.

## Design Validation Completed

The project workflow in `skills/skill-kit-design/SKILL.md` was used to audit:

- Fantasy and desired player experience.
- Skill volume and formation difficulty.
- Core and support functions.
- Class ownership.
- Small skill/passive/ultimate composition.
- Expected counters.
- Signal acceptance ideas.

Outputs:

- `design/archetype-design-audit.md`: manual audit.
- `design/archetype-analysis-report.md`: generated structural intent report.
- `design/archetype-matchup-report.md`: generated normalized result matrix.
- `design/skill-balance-change-log.md`: hierarchical decision history.

The ten structurally checked archetypes are:

- `poisonBloom`
- `fireBurst`
- `crownCarry`
- `ironWall`
- `bloodRage`
- `lightningTempo`
- `frostControl`
- `holySustain`
- `shadowExecute`
- `alchemyChaos`

## Balance Work Completed

### Low-health berserker

The low-health frenzy workflow was used to inspect survivability, attack cadence, and recovery.

Accepted shared changes include:

- Berserker power reduced from 66 to 60.
- `undyingRoar` first cast moved to 9.5 seconds.
- Base and missing-health lifesteal reduced.
- Low-health haste reduced.
- Shared roar lifesteal added to the berserker model.
- Fire and shadow counter ultimates received explicit opening cooldowns.

This moved `bloodRage` versus fire and shadow from extreme domination toward competitive results in the earlier matrix.

### Poison ownership

The poison preset previously assigned priest/warlock mechanics to confusing class slots. Role ownership was cleaned up while preserving poison buildup and detonation.

### Shadow/defense investigation

Experiments included:

- Earlier defensive ultimates.
- Reduced shadow-harvest damage.
- Increased priest shield values.
- Different shadow support roles.
- Global taunt, which was rejected because it increased whole-team focus-fire extremes.
- Melee-only taunt, which was retained as the mechanically correct version.

Do not repeat these experiments without first reading the change log.

## Validation Already Passing

Commands:

```sh
node projects/western_fantasy_continent/game_data/analyze-archetypes.js
node projects/western_fantasy_continent/game_data/validate-game-data.js
node projects/western_fantasy_continent/game_data/simulate-archetype-matchups.js
```

Also passed:

- JavaScript syntax checks for changed runtime files.
- `git diff --check`.
- Browser test of `/genre_arena/`.
- Starting and running a live 4v4 battle.
- Vertical page scrolling.
- Rendering all 100 matchup matrix cells.
- Browser console check with no errors.

## What Is Still Missing

### 1. Intent map is not the single design contract

This is the most important automation gap.

The structural intent map, matchup expectation map, manual audit, and signal acceptance prose are currently separate. Consolidate them into asset metadata before attempting large-scale automatic skill generation.

### 2. Live and headless combat loops are not fully unified

Skill definitions and effects are shared, and balance matrices use the shared simulator. However, animated live battles still duplicate:

- Movement.
- Target selection.
- Timer ticking.
- Status ticking.
- Damage plumbing.

Recommended architecture: one incremental combat engine with render/event hooks, consumed by both browser visuals and Node tests.

### 3. Stale fallback code still physically exists

Some page files still contain local role/skill/preset tables. They cannot silently become active now, but should eventually be deleted after broader browser regression tests exist.

### 4. Macro balance is not finished

Current expectation mismatches are listed in `design/archetype-matchup-report.md`. Important examples:

- `ironWall` loses to fire burst and shadow execute despite being intended to resist them.
- `holySustain` loses badly to fire burst and shadow execute.
- `frostControl` does not reliably counter melee-heavy teams.
- `crownCarry` overperforms into intended burst/execute counters.
- `lightningTempo` has several relationships opposite to its stated expectations.
- Many matchups remain `0:100`, well beyond the desired soft-counter range.

### 5. Several fantasies are structurally present but mechanically incomplete

- `ironWall`: has wall, lacks meaningful counterattack payoff.
- `holySustain`: has healing/shield density but cannot reliably stabilize against its intended prey.
- `frostControl`: emits slow/control mechanics, but the battle result does not prove reduced melee time-on-target.
- `lightningTempo`: named lightning, but mechanically it is ranger/bard tempo rather than lightning damage.
- `alchemyChaos`: duplicate alchemists lack differentiated skill choices.

### 6. Generic signal acceptance is missing

The low-health berserker has a clear expected health/cadence curve, but there is no general evaluator that reads each preset's desired signal pattern and scores whether it occurred.

## Recommended Continuation Order

1. Read `design/skill-balance-change-log.md` completely.
2. Move preset expectations and effect design tags into JSON asset metadata.
3. Update both analysis scripts to consume that shared metadata.
4. Add per-archetype signal acceptance metrics.
5. Implement an asset-driven counterattack payoff for knight/`ironWall`.
6. Rerun the full matrix before making another adjustment.
7. Address one mismatch branch at a time, recording hypotheses and rejected tests hierarchically.
8. Refactor live rendering onto the shared incremental engine after behavior is stable.
9. Delete local fallback skill tables.

## Worktree Warning

The worktree is uncommitted and contains the full implementation plus possible user changes. Do not reset, clean, checkout, or revert files wholesale.

Run:

```sh
git status --short
```

before editing. Work with the current files in place.

## Definition Of Done For The Original Goal

The original goal should only be marked complete when:

- JSON assets are the only skill/role/preset definitions used by gameplay.
- Live and headless combat execute through one behavioral engine.
- Design intent, matchup expectations, and signal acceptance live in shared asset metadata.
- All ten archetypes meet their intended fantasy through measured signals.
- The matchup matrix mainly expresses soft advantages/disadvantages rather than widespread extremes.
- Change-log review remains part of every tuning decision.
- Automated validation covers assets, behavior, signals, intent, and key matchup regressions.
