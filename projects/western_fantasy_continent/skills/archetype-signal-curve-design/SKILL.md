---
name: archetype-signal-curve-design
description: Design and validate auto-battler archetype metrics from player-facing experience, time-series curves, state transitions, contribution shares, and failure boundaries. Use when creating, tuning, reviewing, or regression-testing a team archetype, class build, combat loop, or signal acceptance contract.
---

# Archetype Signal Curve Design

## God Rules

These rules override optimization goals and metric targets.

1. **Do not change the game's underlying combat rules while tuning an archetype.**
   Do not alter universal action priority, targeting, movement, timer flow, attack scheduling, damage plumbing, death handling, or shared combat-loop semantics to make one archetype pass. If a metric appears to require such a change, stop and report the architectural conflict for user approval.

2. **Do not give a shared mechanic a new meaning for one archetype.**
   Prefer archetype-owned skills, passives, models, or effect parameters. Do not globally buff, advance, or reinterpret a shared skill unless the requested change is explicitly global.

3. **Record intent before stacking another patch.**
   Add the problem, hypothesis, experiment, result, acceptance or rejection, and residual risk to `design/skill-balance-change-log.md`.

4. **Do not accept a local pass without full regression.**
   Re-run every archetype contract and the matchup matrix after shared assets or runtime behavior change.

Use `../experiment-budget-governance/SKILL.md` to decide attempt limits, pivot timing, target review, postponement, or acceptance with limitations. Acceptance targets may be revised through that evidence-based budget process; they are not God Rules.

## Core Rule

Do not accept an archetype from win rate or contribution share alone.

Define the intended experience in words, then prove it with time-series signals. Every contract must contain:

1. Experience description.
2. Expected curve shapes.
3. Computable thresholds.
4. Failure curves that invalidate an apparent pass.

## Metric Layers

Use all five layers when they apply:

- `trigger`: the core state or setup actually begins.
- `curve`: health, stacks, cadence, damage, shielding, or targeting changes over time in the intended shape.
- `conversion`: setup becomes payoff, such as poison stacks becoming detonation damage.
- `composition`: output, sustain, support, or targeting share remains within a healthy band.
- `failureBoundary`: reject degenerate ways of passing, such as never entering danger or winning through an unrelated teammate.

## Workflow

### 1. Write The Experience

Describe what the player should notice as a sequence:

```text
Start:
Transition:
Payoff:
Recovery or reset:
```

Bad: "Basic attacks deal at least 30% of damage."

Good: "The berserker loses health, enters danger, attacks faster, drains health back, then repeatedly dips and recovers."

### 2. Select Subjects

Declare which unit or group each curve belongs to:

- carry
- frontline
- whole team
- marked target
- melee enemies
- all enemies

Never average unrelated units when the fantasy belongs to one carry.

### 3. Define Phases

Prefer state-driven phases over arbitrary halves:

- before and after first low-health entry
- before, during, and after an ultimate
- setup accumulation and payoff consumption
- before and after first death
- controlled and uncontrolled windows

Use fixed time windows only when the fantasy explicitly depends on timing.

### 4. Define Expected Curves

Use curve primitives:

- `decline`: sustained negative slope.
- `recovery`: rise after a local minimum.
- `oscillation`: repeated threshold crossings or alternating local minima/maxima.
- `plateau`: low absolute slope for a sustained window.
- `acceleration`: later slope exceeds earlier slope.
- `burstPeak`: short-window value materially exceeds baseline.
- `suppression`: target cadence or movement falls during a status window.
- `concentration`: value increasingly focuses on one unit or target.
- `cycle`: setup rises, payoff consumes it, then setup begins again.

Each curve needs a subject, signal, phase/window, and measurable condition.

### 5. Add Conversion Metrics

Measure whether setup creates payoff:

- stacks before detonation versus detonation damage
- blocked damage versus counter damage
- haste uptime versus extra primary-output events
- healing after danger versus recovered HP
- mark stacks versus focus damage

Prefer ratios or correlations over raw totals where fight duration varies.

### 6. Add Composition Bands

Use ranges when too much is also unhealthy:

```text
counter damage share: 6%-18%
DOT damage share: 20%-55%
carry team damage share: 45%-70%
```

A minimum-only threshold can reward runaway or degenerate behavior.

### 7. Add Failure Curves

Explicitly reject false positives:

- never enters the required state
- enters the state and dies immediately
- output share passes because teammates contribute nothing
- high healing is mostly overheal
- control signals fire but do not alter enemy cadence
- burst archetype deals uniform damage with no peak
- setup accumulates but is never consumed
- one global buff causes unrelated archetypes to inherit the mechanic

### 8. Validate Across Matchups

Use at least:

- one intended favorable opponent
- one intended unfavorable opponent
- one neutral or mechanically diagnostic opponent

Run deterministic seeds from both sides. Report pass rate, median, and worst-case behavior where possible.

### 9. Tune One Failure Branch

Classify failure before editing:

- missing trigger
- wrong timing
- wrong curve shape
- weak conversion
- unhealthy composition
- counter relationship mismatch

Change the narrowest owning asset. Re-run every archetype after shared runtime or shared skill changes.

Before editing, check the God Rules. A tuning task may modify:

- the archetype's own skill assets
- the archetype's own preset composition
- archetype-owned model parameters
- signal instrumentation that does not alter combat behavior

A tuning task may not silently modify the shared combat loop.

## Contract Shape

Store the contract with the archetype asset:

```json
{
  "experience": {
    "start": "Health declines from a safe band.",
    "transition": "The carry enters low health.",
    "payoff": "Cadence and lifesteal rise.",
    "reset": "Health repeatedly dips and recovers."
  },
  "curves": [
    {
      "metric": "lowHealthOscillations",
      "subject": "carry",
      "shape": "oscillation",
      "op": ">=",
      "value": 2
    }
  ],
  "metrics": [
    {
      "metric": "postLowAttackRateRatio",
      "op": ">=",
      "value": 1.25
    }
  ],
  "failureBoundaries": [
    {
      "metric": "lowHealthEntryRate",
      "op": ">=",
      "value": 0.5,
      "reason": "The fantasy cannot pass without entering danger."
    }
  ]
}
```

## Regression Rule

After tuning:

1. Rebuild generated assets.
2. Run asset and combat-signal validation.
3. Run every archetype curve contract.
4. Compare previously passing checks against the prior report.
5. Run the full matchup matrix.
6. Record new regressions before accepting the patch.

An archetype is complete only when:

- the experience curve passes,
- conversion and composition pass,
- failure boundaries pass,
- intended matchups are not extremely inverted,
- previously completed archetypes remain valid.
