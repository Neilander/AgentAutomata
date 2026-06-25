---
name: combat-causal-attribution
description: Diagnose extreme auto-battle outcomes as causal chains instead of flat metric labels. Use when reviewing why an archetype, team, class, or skill wins or loses too hard, especially from matchup evidence, combat signals, DOT/status stacks, burst windows, sustain, control, execute, or counter mechanics.
---

# Combat Causal Attribution

## Core Idea

Do not stop at tags like `damageLead`, `statusSetup`, or `sustainGap`.

Every extreme combat result should be explained as an event lifecycle:

```text
Occurrence -> Amplification -> Conversion -> Failed Resolution -> Outcome
```

Use this skill before proposing balance changes. The goal is to identify which part of the chain should change, not to nerf the largest number.

## Required Inputs

Use the strongest available evidence, in this order:

1. `design/balance/archetype-matchup-evidence.json`
2. `design/balance/archetype-extreme-diagnosis.json`
3. `design/archetype-matchup-report.md`
4. Direct `combat-sim.js` runs with relevant seeds
5. Skill assets in `game_data/skill_assets/skills/*.json`
6. Preset assets in `game_data/skill_assets/presets/*.json`

If the evidence lacks a needed dimension, say what signal is missing before guessing.

## Causal Chain Template

For one extreme matchup, write:

```text
Event:

Occurrence:
- Who produces the key resource or pressure?
- Which skills/passives do it?
- What are their cooldowns, opening timings, target scope, and stack/damage amounts?

Amplification:
- What makes the event grow?
- Does it get damage amp, stack retention, spread, reapply, haste, focus fire, sustain time, or target selection help?
- Is there a positive feedback loop?

Conversion:
- How does the setup become a win?
- DOT tick, burst detonation, execute, first death, carry window, control lock, counter payoff, or sustain exhaustion?
- When does the first decisive conversion happen?

Failed Resolution:
- What should the losing side use to answer it?
- Did they lack cleanse, shield, healing, anti-burst, target access, disruption, counter triggers, or time?
- Was the answer present but too late, too weak, wrong target, or bypassed?

Outcome:
- Why did this chain create an extreme result instead of a soft advantage?
- Which link is the cleanest balance lever?
```

## Decompose Recursively

Each lifecycle stage can have its own lifecycle.

Example:

```text
Poison occurred.
Why did poison occur?
- Multiple sources cast poison.
Why did those casts happen so often?
- Short cooldowns, early opening cooldowns, and whole-team application.

Poison amplified.
Why did it amplify?
- Detonation retains stacks and reapplies stacks.
Why was there time for that?
- The poison team has a tank/healer shell.

Poison was not resolved.
Why not?
- Opponent has healing and shielding, but no cleanse or stack reduction.
```

Prefer "because A enabled B, which enabled C" over a list of unrelated observations.

## Responsibility Layers

Always separate:

- **Team shell**: tanks, healers, shields, taunts, guard, positioning.
- **Resource producers**: skills that create stacks, marks, buffs, windows, or low-health states.
- **Amplifiers**: passives, damage amps, retention, reapply, haste, vulnerability, focus rules.
- **Converters**: detonation, execute, burst ultimate, counter payoff, carry window.
- **Opponent answers**: cleanse, disruption, anti-burst, target access, counterplay, sustain.

Then name which roles/skills own each layer.

## Questions To Ask

### Occurrence

- Is the resource created by one unit or several?
- Is the creation single-target, multi-target, or global?
- Does it start before the opponent's first meaningful answer?
- Does a skill do both damage and resource production?

### Amplification

- Does the team buy time through sustain while the resource grows?
- Does a passive become nearly permanent in this team context?
- Does the mechanic retain or reapply itself after payoff?
- Does another archetype's mechanic secretly support this one?

### Conversion

- What event changes the fight from setup to advantage?
- Does first death happen before the opponent's stabilizing window?
- Is payoff bursty, attritional, or both?
- Does the converter also create the next setup cycle?

### Failed Resolution

- Did the opponent have an intended answer?
- Was the answer missing, late, weak, target-misdirected, or bypassed?
- Did healing/shielding solve health but not solve the underlying resource?
- Did the losing side's core fantasy fail to trigger?

## Output Format

Keep the diagnosis concise:

```text
Matchup:
Short answer:

Chain:
1. Occurrence: ...
2. Amplification: ...
3. Conversion: ...
4. Failed Resolution: ...

Responsibility:
- Main producer:
- Main amplifier:
- Main converter:
- Protection shell:
- Missing answer:

Best balance levers:
1. ...
2. ...
3. ...

Do not change yet:
- ...
```

## Balance Lever Rules

Pick the lever that softens the extreme while preserving fantasy:

- If occurrence is too reliable, adjust cooldown, opening timing, target count, or stack amount.
- If amplification is runaway, adjust retention, reapply, stacking caps, passive uptime, or sustain time.
- If conversion is too sharp, adjust payoff timing, coefficient, execute access, or first-death timing.
- If resolution is absent, add or strengthen a narrow answer on the intended counter archetype.

Do not automatically nerf total damage. Total damage is usually an outcome, not a cause.

## Common Pitfalls

- Treating a team-level shell as a damage problem.
- Treating healing/shielding as a counter to DOT when stacks remain untouched.
- Ignoring hardcoded runtime passives because the JSON skill asset has empty effects.
- Blaming the named archetype while another role is carrying a hidden responsibility.
- Accepting an extreme matchup because its strong/weak expectation says it is allowed.
