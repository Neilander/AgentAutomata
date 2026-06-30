---
name: comparative-analysis
description: Analyze a problem by comparing multiple attempts, observations, and mathematical-modeling passes before deciding what is really happening. Use when a balance, UX, system, or agent-behavior issue has several test results that partly agree, contradict, or cancel each other, especially after multiple runs such as matrix tests, waterline tests, route comparisons, signal reports, or repeated phenomenon-math-modeling diagnoses.
---

# Comparative Analysis

Use this skill when one observation is not enough. The goal is to prevent premature conclusions by turning several noisy attempts into a precise, conflict-aware diagnosis.

Core rule:

```text
Do not conclude from one run.
Compare phenomena, compare models, then synthesize what survives contradiction.
```

This skill coordinates with `phenomenon-math-modeling`. Use that skill inside each meaningful observation group, then use this skill to merge the resulting hypotheses.

## Required Inputs

Collect at least two evidence groups. Prefer more when the issue is noisy.

Examples:

- no-attribute matrix
- no-attribute waterline
- attribute matrix
- attribute waterline
- single-unit variant
- double-unit variant
- old skill versus new skill
- expected route versus red-team route
- signal report for a suspicious matchup

For each group, record:

```text
Evidence group:
Setup:
Metric result:
Observed signals:
What changed from the previous attempt:
What stayed constant:
```

If evidence is missing, say what is missing instead of pretending the comparison is complete.

## Workflow

### 1. Normalize The Question

Rewrite the user's problem as a testable comparison.

Good:

```text
Question: Why does assassin still prefer tenacity over agility routes?
```

Bad:

```text
Question: How do we buff agility?
```

Required output:

```text
Core question:
Design intent:
Observed gap:
Decision needed:
```

### 2. Build An Evidence Table

Make a compact table before explaining.

Required columns:

```text
Case | Change | Result | Key signal | Immediate interpretation | Confidence
```

Use confidence levels:

- `high`: repeated, direct, and aligned with the measured signal
- `medium`: plausible but affected by team shell, opponent pool, or sample size
- `low`: single run, weak signal, or possible measurement artifact

### 3. Model Each Evidence Group Separately

For every major evidence group, run a small math model.

Use this format:

```text
Model:
Value formula:
Variables changed:
Variables held constant:
Conclusion candidates:
- C1:
- C2:
Falsifier:
```

Do not merge conclusions yet. Let each group produce its own possible conclusions.

### 4. Create A Conclusion Ledger

Put all candidate conclusions into one ledger.

Required format:

```text
Conclusion:
Supported by:
Contradicted by:
Explains:
Fails to explain:
Confidence after comparison:
```

Important: a conclusion is stronger when it explains both success and failure cases. A conclusion is weaker when it only explains the case that inspired it.

### 5. Resolve Conflicts

Classify relationships between conclusions:

- `reinforce`: both conclusions point to the same cause
- `contradict`: both cannot be true at the same time
- `scope-split`: both are true in different environments
- `cancel`: two effects offset each other in the final metric
- `measurement-artifact`: the conflict is caused by seed policy, sample size, wrong test setup, stale data, or UI/report mismatch
- `missing-variable`: both conclusions are incomplete because an unmeasured variable controls the result

Required output:

```text
Conflict:
Type:
Resolution:
What evidence would settle it:
```

### 6. Produce The Precise Diagnosis

Only keep the claims that survive the ledger.

Use this structure:

```text
Precise diagnosis:
Primary cause:
Secondary cause:
Not the cause:
Uncertain:
```

`Not the cause` is important. It prevents the agent from repeatedly fixing the wrong thing.

### 7. Choose The Next Lever

The final action must target the surviving cause, not the loudest metric.

Required output:

```text
Recommended lever:
Why this lever follows from the comparison:
Expected improvement:
Regression risk:
Validation plan:
Stop condition:
```

## Pattern Library

### Metric Improves But Fantasy Does Not

Possible synthesis:

```text
The buff raises total win rate, but does not improve the intended channel. Treat it as a wrong-channel buff.
```

Example:

```text
Agility route wins more because the unit survives longer through evasion-like side effects, not because attack speed creates more assassin loops.
```

### Trigger Count Increases But Win Rate Does Not

Possible synthesis:

```text
Frequency improved, but conversion value is too low.
```

Check:

- Does each trigger deal meaningful damage, healing, shield, control, or resource?
- Does the target survive long enough for triggers to matter?
- Does the trigger arrive after the decisive window?

### Survival Route Beats Output Route

Possible synthesis:

```text
Extra survival is converting into the same output channel that the output route wanted to own.
```

Check:

- Does survival allow more casts?
- Does survival allow the ultimate to fire?
- Does survival increase uptime on a passive aura?
- Does survival keep the unit alive through the only meaningful payoff window?

### Matrix And Waterline Disagree

Possible synthesis:

```text
The design is stable against known archetypes but overfits or underfits the broad generated pool.
```

Check:

- Are waterline teams using stale skills or odd positions?
- Is matrix too narrow?
- Are generated teams missing the intended counters?
- Is one team shell carrying the result?

### Single And Double Core Disagree

Possible synthesis:

```text
The mechanic may be multiplicative with itself, or it may depend on shared setup saturation.
```

Check:

- Does the second copy double resource production?
- Does it compete for the same target?
- Does it overkill and waste payoff?
- Does it cover the first copy's weakness?

## Common Pitfalls

- Explaining the final win rate without explaining the intermediate signals.
- Treating a broad waterline win rate as class strength when the team shell is carrying.
- Ignoring a contradiction because it is inconvenient.
- Averaging results that belong to different scopes.
- Changing numbers before naming which conclusion survived comparison.
- Calling a route "better" when it only has a higher win rate but violates the intended fantasy.

## Short Output Template

Use this when the user asks for a concise answer:

```text
对比后我认为：

1. 现象：
2. 矛盾：
3. 能同时解释这些现象的结论：
4. 不是主因：
5. 下一步应该改：
6. 验证方式：
```
