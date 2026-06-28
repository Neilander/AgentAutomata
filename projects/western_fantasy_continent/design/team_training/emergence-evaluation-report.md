# Team Generator Emergence Evaluation

## Question

Can the current team generator produce emergent team structures, instead of only repeating existing strong presets?

## Method

The generator was extended with:

- target preset input, such as `--target=fireBurst`
- core contribution metrics
- team similarity to existing presets
- structure tags

Similarity is recorded but not penalized. This is intentional: if the search repeatedly returns a known structure, that structure is treated as an attractor in the current ecology, not as an error.

## Experiments

### Assassin into `fireBurst`

Command:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=assassin --target=fireBurst --candidates=16 --seeds=3
```

Report:

- `team-generator-report-assassin-vs-fireBurst.md`

Result:

- Best target win: 100%
- Best team source: `preset-containing-core`
- Best team similarity: `poisonBloom 100%`
- Non-preset candidates passing target threshold: `0/16`
- Repeated tags: `multi-carry`, `window-tempo`, `double-front`, `support-heavy`, `poison-engine`

Interpretation:

No meaningful emergence yet. The only successful answer is exactly an existing attractor: `poisonBloom`.

The generated assassin teams often have decent full-ecology average win rate, but they do not beat `fireBurst`. Several generated teams show higher assassin damage share, but the core usually dies and target win remains 0%. That means the generator is finding "assassin has activity" but not "assassin solves the target."

### Berserker into `poisonBloom`

Command:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=berserker --target=poisonBloom --candidates=16 --seeds=3
```

Report:

- `team-generator-report-berserker-vs-poisonBloom.md`

Result:

- Best target win: 100%
- Best team source: `preset-containing-core`
- Best team similarity: `crownCarry 100%`
- Non-preset candidates passing target threshold: `2/16`
- Repeated tags: `double-front`, `support-heavy`, `risk-frontline`, `window-tempo`, `sustain-shell`

Interpretation:

Weak but real emergence signal.

The top answer is still existing preset memory (`crownCarry`). However, two non-preset candidates beat the target. They are not near-identical to a single preset and repeatedly converge on:

- double frontline
- heavy support shell
- berserker risk frontline
- tempo windows

This suggests the search is beginning to discover a reusable structure:

```text
berserker carry + defensive shell + tempo windows
```

That is not strong enough to call full emergence yet, because the sample size is small and preset memory still dominates. It is enough to justify continuing this approach.

## Current Verdict

The system does not yet show strong emergence.

It does show:

- known attractor detection
- weak structure convergence
- target-specific failure discovery
- measurable core contribution

This is useful. It tells us when a role has no generated answer and when the ecology is dominated by an existing preset.

## What Counts As Stronger Emergence Next

A future run should be considered more emergent if:

- at least 3 non-preset candidates beat the target
- those candidates share structure tags
- nearest preset similarity is below 50%
- the requested core role contributes meaningfully
- the structure is reproducible across seeds

Suggested thresholds:

```text
targetWinRate >= 50%
nonPresetPassing >= 3
nearestPresetSimilarity <= 0.5
coreDamageShare >= 0.18 for damage cores
or coreShieldHealShare >= 0.25 for support cores
```

## Next Improvements

Do not add novelty penalty yet.

Instead:

1. Increase generated training samples.
2. Add more target-conditioned candidate generation.
3. Add explicit "core must matter" sorting mode.
4. Generate candidates around a core skill, not only core role.
5. Track repeated structures across multiple runs.

The key design principle remains:

```text
The generator proposes.
The simulator validates.
Signals explain.
Humans inspect emergent attractors.
```
