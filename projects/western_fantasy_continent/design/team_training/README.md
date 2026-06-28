# Team Training Prototype

This folder contains the first runnable prototype for team generation.

## Goal

Given a core role such as `assassin` or `berserker`, generate candidate 4-unit teams, then validate them with the real combat simulator.

This is not a neural network yet. It is the data loop that a neural model can later replace:

1. Generate combat samples.
2. Store each character as a token sentence with base stats.
3. Train a lightweight scoring/retrieval model from winners and losers.
4. Generate candidate teams for a requested role.
5. Validate each candidate against current standard presets.

## Files

- `team-training-dataset.json`: versioned match data.
- `team-generator-model.json`: lightweight learned role/skill/pair scores.
- `team-generator-report-assassin.md`: latest assassin recommendation report.
- `team-generator-report-berserker.md`: latest berserker recommendation report.
- `team-generator-report.md`: latest run, overwritten by each recommend command.

## Commands

Generate data, train, and recommend for one role:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=all --role=assassin --samples=180 --candidates=12 --seeds=2
```

Recommend another role using the existing dataset/model:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=berserker --candidates=12 --seeds=2
```

Recommend into a specific target preset:

```powershell
node projects\western_fantasy_continent\game_data\team-training-prototype.js --mode=recommend --role=assassin --target=fireBurst --candidates=16 --seeds=3
```

## Data Boundary

Each character token includes:

- `role`
- base `hp`
- base `power`
- base `armor`
- base `range`
- `attackType`
- two small skills
- passive
- ultimate
- derived effect tokens such as `keyword:mark`, `function:shield`, `risk:selfDamage`

Same-role stack tests are not the main training target. The generator uses structured random teams plus current preset teams.

## Current Limitation

The model still overvalues already-strong preset memory. That is acceptable for a first loop because validation catches it, but the next version should add:

- role-structure constraints
- target-specific generation, such as "make assassin work against fireBurst"
- influence tracking when a changed skill invalidates old samples

Do not add novelty penalty yet. Similarity is recorded but not punished, because repeated convergence toward an existing preset may indicate a real ecology attractor.

## Neural Network Upgrade Path

The future neural version can keep the same dataset schema.

Suggested task:

```text
Input: core character token + optional enemy preset + target intent
Output: three teammate character tokens
```

The simulator remains the judge. The model only proposes candidates.
