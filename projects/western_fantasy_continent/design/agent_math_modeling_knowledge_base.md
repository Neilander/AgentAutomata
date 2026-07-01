# Agent Mathematical Relationship Knowledge Base v1

Purpose: give agents a reusable map of common mathematical relationships before they tune game systems. The goal is not to make every model exact. The goal is to stop jumping from a surface symptom directly to a random tweak.

Use this with `phenomenon-math-modeling` and `comparative-analysis`:

1. Translate the symptom into a small formula.
2. List which terms can explain the symptom.
3. Run controlled comparisons that isolate those terms.
4. Prefer changing the term that matches the fantasy and the design goal.

## Core Relationships

### Additive

Sketch: `total = base + a + b + c`

Use when each source should have stable, readable contribution. Good for flat HP, flat attack, flat armor, and early prototype rewards.

Risk: if one additive term becomes much larger than the base, everything else becomes invisible.

Validation signal: contribution table should show several visible terms, not one term explaining nearly everything.

### Multiplicative

Sketch: `total = base * a * b * c`

Use when two conditions should create combo value, such as high attack speed plus on-hit true damage, or shield amount plus shield duration.

Risk: stacking multiple multipliers creates runaway teams and hidden balance spikes.

Validation signal: compare single-factor gain and combined gain. If combined gain is far above both parts, mark it as a combo point and budget it intentionally.

### Diminishing Returns

Sketch: `value = cap * x / (x + k)` or `value = log(1 + x) * k`

Use when a stat should keep improving but stop being the only answer. Good for damage reduction, effect resistance, cooldown reduction, dodge, and late-game defensive stacking.

Risk: if the curve bends too early, the player feels upgrades do nothing. If it bends too late, stacking becomes mandatory.

Validation signal: compare the first 10 points, middle 10 points, and late 10 points. The late gain should be smaller, but still noticeable for the intended build.

### Accelerating Returns

Sketch: `value = x^p`, where `p > 1`

Use when the fantasy is investment payoff, such as a poison build that becomes scary only after dedicated DOT investment.

Risk: early game feels dead, late game can explode.

Validation signal: the build should have a weak/normal early state, a visible breakpoint, and a capped or counterable late state.

### Threshold

Sketch: `if x >= t then unlock effect`

Use when the player should chase a clear breakpoint, such as reaching enough skill haste to fit one more cast into a fight.

Risk: one point below threshold feels worthless; one point above can dominate.

Validation signal: test just below threshold, at threshold, and just above threshold.

### Saturation And Caps

Sketch: `value = min(raw, cap)`

Use when a universal stat would otherwise disable a whole mechanic, such as effect resistance fully deleting control.

Risk: hard caps can make later upgrades feel wasted.

Validation signal: report wasted budget above cap. If many builds waste budget, move the cap communication into UI or change the curve.

### Frequency Times Quality

Sketch: `output = frequency * valuePerEvent`

Use for attack speed, skill haste, DOT ticks, on-hit effects, shield pulses, healing pulses, and crit frequency.

Risk: increasing frequency can dilute other actions. A character casting more skills may attack less often.

Validation signal: split output into basic attack, skill, DOT, healing, shield, and control shares. If a stat should help one share but that share is tiny, the stat will feel bad.

### Survival Times Contribution

Sketch: `combatValue = survivalWindow * contributionPerSecond`

Use when diagnosing why a damage role still wants HP. If the role dies before its output window, survival is effectively a damage stat.

Risk: if survival is too efficient, every role prefers tank stats.

Validation signal: compare time alive, first meaningful cast/attack timing, and total contribution. If offensive points do not increase contribution because the unit dies, fix survival floor or targeting before buffing damage.

### Opportunity Cost

Sketch: `netGain = chosenGain - bestAlternativeGain`

Use for equipment and attribute points. A stat is only attractive if it beats what the player gave up.

Risk: a stat can look good in isolation but be dead because another stat gives the same thing plus a better byproduct.

Validation signal: compare routes with the same point budget.

### Byproduct And Coupling

Sketch: `attributeA -> mainStat + byproductStat`

Use to prevent extreme characters and create build questions. A physical attribute can add attack plus a little HP; a rhythm attribute can add skill haste plus control power.

Risk: if byproduct multiplies the main stat too strongly, the attribute becomes too efficient. If the byproduct is irrelevant, it becomes fake complexity.

Validation signal: test whether the byproduct changes any matchup or role decision. If not, replace it.

### Counter Stat

Sketch: `effectiveOutput = rawOutput * (1 - resistance)`

Use when a mechanic needs a specific answer, such as effect resistance against DOT/control.

Risk: a broad counter can erase too many mechanics.

Validation signal: cap broad counters and reserve stronger counters for narrow stats or skills.

### Variance And Sampling Noise

Sketch: `observed = trueValue + noise`

Use whenever simulation results swing by seed, target selection, crits, random recruits, or random skill choice.

Risk: tuning to one lucky or unlucky sample.

Validation signal: rerun with multiple seeds and compare confidence bands or at least min/median/max.

### Simpson Split

Sketch: `overallTrend` can reverse after grouping by matchup type.

Use when a build looks good overall but only farms one common opponent type.

Risk: average win rate hides that the build is useless against the intended test.

Validation signal: split by enemy archetype, such as front-heavy, backline-heavy, sustain, burst, control, DOT, and shield.

### Feedback Loop

Sketch: `state(t+1) = state(t) + gain(state(t))`

Use for snowball mechanics: kill reset, rage stacking, mark stacking, economy compounding.

Risk: early advantage becomes impossible to reverse.

Validation signal: plot state over time. Healthy loops should have counterplay windows or decay.

## Quick Diagnosis Templates

### "A role prefers HP instead of its fantasy stat"

Model: `value = timeAlive * outputPerSecond`.

Likely causes:

- The role dies before its fantasy stat can pay off.
- Its fantasy stat does not affect enough of its output.
- HP has a byproduct or interaction that multiplies output.
- Targeting makes the role take too much early damage.

Preferred fixes:

- Add survival floor that matches fantasy.
- Make fantasy stat affect the correct output share.
- Reduce HP's offensive byproduct.
- Adjust targeting or aggro if the fantasy depends on not being focused.

### "A skill looks strong but feels invisible"

Model: `feltSignal = mechanicalImpact * visibility * timingRelevance`.

Likely causes:

- The skill has impact but no visible event.
- It fires after the fight is already decided.
- It affects a hidden stat instead of changing health bars, shields, movement, or target choice.

Preferred fixes:

- Add a clear visual signal.
- Move the effect earlier.
- Convert part of the effect into a visible burst, shield, or status.

### "A team is too dominant"

Model: `teamPower = sum(individualPower) + synergy - counterPressure`.

Likely causes:

- One unit is above baseline.
- Synergy is multiplicative and unbudgeted.
- Counter tools are missing from the environment.
- The test pool lacks the team type that should punish it.

Preferred fixes:

- Identify the dominant term first.
- Add general-purpose counter tools before making narrow hate skills.
- Re-run baseline teams and waterline teams.

## Attribute Point Rule

Attribute points are not combat stats. They must pass through a conversion function:

`points -> attributeYield(points) -> combat modifiers`

This lets us tune the growth curve later without rewriting every skill, equipment item, or test script.

