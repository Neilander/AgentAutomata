# 2026-06-28 Team Training / Emergence Report

## Context

Today we found a serious evaluation wording problem: some temporary "4v4" checks were actually same-role stack stress tests, such as 4 assassins vs 4 of another role. Those tests are useful for detecting stack abuse, but they should not be used as normal team-battle balance evidence.

The correct categories are now:

- `same_role_stress`: same-role stack abuse check only.
- `attribute-team-route`: random team with a focal unit; useful but noisy.
- `preset_ecology`: standard archetype preset vs preset.
- `team_training`: generated candidate teams validated by the real simulator.

## Main Work Completed

### 1. Team training prototype

Added:

- `projects/western_fantasy_continent/game_data/team-training-prototype.js`

Outputs:

- `projects/western_fantasy_continent/design/team_training/team-training-dataset.json`
- `projects/western_fantasy_continent/design/team_training/team-generator-model.json`
- `projects/western_fantasy_continent/design/team_training/team-generator-report.md`
- `projects/western_fantasy_continent/design/team_training/team-generator-report-assassin.md`
- `projects/western_fantasy_continent/design/team_training/team-generator-report-berserker.md`
- `projects/western_fantasy_continent/design/team_training/README.md`

The prototype does not train a neural network yet. It builds the data loop:

1. Generate combat samples.
2. Tokenize each character with role, base stats, skills, effect keywords, and vectors.
3. Train a lightweight retrieval/scoring model from winner/loser teams.
4. Generate candidate teams for a requested core role.
5. Validate candidates against standard presets with `combat-sim`.

Each character token includes base stats:

- `hp`
- `power`
- `armor`
- `range`
- `attackType`
- two small skills
- passive
- ultimate
- effect-derived tokens such as `keyword:mark`, `function:shield`, `risk:selfDamage`

### 2. Target enemy input

The prototype now supports target-specific recommendation:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=assassin --target=fireBurst --candidates=16 --seeds=3
```

Target mode sorts by:

1. target preset win rate
2. full-ecology average win rate
3. model score

### 3. Core contribution metrics

Candidate validation now records whether the requested core actually matters:

- core damage
- core damage share
- core alive rate
- core deaths
- blink count
- auto ultimate count

This is important because a generated team may win while the requested core role is only decorative.

### 4. Similarity and structure tags

Similarity is recorded but not penalized.

This is intentional. If the generator repeatedly returns an existing preset-like structure, that is treated as an ecology attractor rather than an error.

Added structure tags such as:

- `double-front`
- `support-heavy`
- `multi-carry`
- `backline-dive`
- `risk-frontline`
- `mark-engine`
- `poison-engine`
- `burn-engine`
- `sustain-shell`
- `window-tempo`

## Emergence Experiments

Report:

- `projects/western_fantasy_continent/design/team_training/emergence-evaluation-report.md`

### Assassin into `fireBurst`

Command:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=assassin --target=fireBurst --candidates=16 --seeds=3
```

Output:

- `team-generator-report-assassin-vs-fireBurst.md`

Result:

- Best target win: 100%
- Best team source: `preset-containing-core`
- Best team similarity: `poisonBloom 100%`
- Non-preset candidates passing target threshold: `0/16`

Interpretation:

No meaningful emergence yet. The only successful answer is exactly an existing attractor: `poisonBloom`. Generated assassin teams often show activity, but they do not solve the target.

### Berserker into `poisonBloom`

Command:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=berserker --target=poisonBloom --candidates=16 --seeds=3
```

Output:

- `team-generator-report-berserker-vs-poisonBloom.md`

Result:

- Best target win: 100%
- Best team source: `preset-containing-core`
- Best team similarity: `crownCarry 100%`
- Non-preset candidates passing target threshold: `2/16`

Interpretation:

Weak emergence signal. Non-preset candidates repeatedly converge toward:

- double frontline
- heavy support shell
- berserker risk frontline
- tempo windows

This suggests a structure:

```text
berserker carry + defensive shell + tempo windows
```

This is not strong emergence yet, because sample size is too small and preset memory still dominates.

## Current Data Scale

Current dataset is small:

- training samples: 231
- candidates per report: 12-16
- validation seeds per target: 2-3

This is enough to verify the pipeline and detect obvious attractors. It is not enough for stable balance conclusions.

Recommended next data scale:

```text
samples: 5,000-20,000
candidates: 100-500
seeds: 5-10
targets: all standard presets
```

## Important Design Decisions

### No novelty penalty for now

Do not add novelty penalty yet.

Reason: the user wants emergence. Penalizing similarity would hard-code human taste into the search and may hide real attractors.

Instead:

- record similarity
- report attractors
- let simulator validation decide
- inspect repeated structures

### Simulator remains the judge

The generator proposes. The combat simulator validates. Signals explain.

The model should not replace combat simulation.

## Related Skill / Workflow Notes

The skill design workflow was updated earlier to emphasize:

- do not casually change base combat logic
- check whether a skill scales with the intended stats
- use signal validation, not just win rate

Relevant file:

- `projects/western_fantasy_continent/skills/skill-kit-design/SKILL.md`

## Untracked / Changed Files To Notice

Important new files are currently untracked:

- `projects/western_fantasy_continent/game_data/team-training-prototype.js`
- `projects/western_fantasy_continent/design/team_training/`
- `projects/western_fantasy_continent/game_data/analyze-attribute-build-routes-v2.js`
- `projects/western_fantasy_continent/game_data/analyze-attribute-team-routes-v2.js`
- `projects/western_fantasy_continent/design/attribute-build-route-simulation-v2.md`
- `projects/western_fantasy_continent/design/attribute-team-route-simulation-v2.md`
- `projects/western_fantasy_continent/design/attribute-v2-yield-tuning-budget.md`

There are also modified tracked files from the broader recent work:

- `game_data/combat-sim.js`
- `game_data/skill-assets.js`
- `game_data/skill-data.js`
- `game_data/validate-skill-assets.js`
- `skills/skill-kit-design/SKILL.md`
- `design/task-budget-board.json`

## Recommended Next Steps

1. Run a medium data job.

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=all --role=assassin --samples=5000 --candidates=100 --seeds=5
```

2. Add target batch mode:

```text
for each role x each standard preset, generate top candidates and summarize emergence.
```

3. Add core-skill mode:

```text
input = aa2BacklineBlink
output = teams that make this skill matter
```

4. Add repeated-run stability:

```text
same target, multiple generator seeds, compare recurring structure tags
```

5. Only after the above, consider replacing the lightweight model with a neural embedding/generator.

