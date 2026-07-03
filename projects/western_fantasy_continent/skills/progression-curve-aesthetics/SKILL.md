---
name: progression-curve-aesthetics
description: Judge, design, and tune RPG/autobattler progression curves for preferred player-feel structures such as wave-shaped growth, early lift, short bottlenecks, chase drops, breakthrough spikes, and long-tail farming. Use when tuning equipment drops, dungeon progression, reward pacing, stat growth, gear tiers, unlock curves, or any numeric system where the user cares about the shape and emotional rhythm of progression, not only final balance.
---

# Progression Curve Aesthetics

Use this skill when a numeric progression system needs to feel good over time.

Core rule:

```text
Do not optimize only final strength.
Design the shape of the journey: lift, bottleneck, breakthrough, plateau, and next lift.
```

## Preferred Structure: Wave Growth

This project currently prefers wave-shaped progression for loot and power systems:

```text
early visible lift -> short bottleneck -> rare/chase breakthrough -> large jump -> new plateau -> next wave
```

The player should feel:

- "I got stronger immediately."
- "I am close, but not quite through."
- "One or two better drops/build choices could push me over."
- "I broke into the next tier and power jumped."
- "Now I have a new ceiling to chase."

## Macro Pacing Skeleton

Before tuning individual drops or enemy numbers, define the intended playtime skeleton.
Do not discover the curve only after simulation; first decide what the curve should roughly feel like.

For a 100-run grind loop, specify:

```text
total experience length: 100 runs
major bottleneck targets: run 20, run 50, run 90
stage mapping: D4, D7, D10
post-final-bottleneck feel: release / strong aftertaste / no new hard wall
```

Each major bottleneck is a planned pressure wall. It should not be a dead stop; it should feel like:

```text
"I am close, but I need one more useful upgrade or build improvement."
```

Between bottlenecks, design mini-waves:

```text
easy stage(s) -> satisfying lift
medium stage(s) -> friction and replacement pressure
hard stage -> bottleneck / near miss / chase
breakthrough -> next tier opens
```

Important: the stretch before each bottleneck must be proportioned by slope, not just labeled after the fact.

For each planned bottleneck anchor, divide the preceding segment into a planned curve:

```text
front-loaded lift -> gradual slowdown -> near-wall crawl -> bottleneck
```

This means the player should first climb quickly through easier stages, then slow down as upgrades become less obvious, then spend a controlled number of runs near the wall. A stage that happens to be reached around the target run is not enough.

Example for a wall planned at run 20:

```text
runs 1-8: fast lift through easy content
runs 9-14: slower improvement and partial upgrades
runs 15-20: near-miss wall pressure
run ~20: breakthrough into the next segment
```

Example for a wall planned at run 50:

```text
runs 21-32: fast lift after the previous breakthrough
runs 33-42: slower replacement and build refinement
runs 43-50: near-wall crawl
run ~50: breakthrough
```

The slope should visibly compress before the bottleneck. If the line before a bottleneck is random, flat from the start, or dominated by sudden lucky jumps, the wave is not valid even if the final crossing time is close to the anchor.

The last planned bottleneck should be followed by a reward-rich release segment rather than another hard wall. The player should leave with momentum and unfinished desire, not exhaustion.

Suggested phase ratios inside a macro segment:

| Segment part | Typical share | Player feel |
| --- | ---: | --- |
| lift / release | 35-45% | frequent upgrades, visible progress |
| friction | 25-35% | upgrades slow but still happen |
| bottleneck | 20-30% | near-miss pressure and chase-drop desire |

Adjust by phase:

- early game: more lift, shorter bottleneck
- mid game: balanced lift and bottleneck
- late game: longer chase, but avoid dead-flat boredom

When reading a curve, judge both:

- `local wave`: does this short segment have lift -> friction -> bottleneck -> breakthrough?
- `macro skeleton`: do the major breakthroughs occur near the intended run anchors?

If the curve has local waves but the anchors are wrong, it is still mispaced.
If the anchors are right but every segment is flat, it is still emotionally weak.

## How To Create The Wave

Use natural system structure, not artificial waiting.

Good levers:

- A stage drops common upgrades that improve baseline power quickly.
- The same stage has rare chase drops that can unlock the next stage early.
- The next stage makes the previous chase rarity common.
- Item level ranges rise by stage, so even ordinary drops can replace old gear.
- Unlock checks require enough real combat strength to pass, not a fixed number of runs.
- Later stages change the rarity ecology rather than simply adding bigger numbers.

Bad levers:

- "Farm this dungeon N times before challenging the next one."
- Making a newly unlocked rarity common immediately.
- Letting waterline score directly decide loot quality.
- Only tuning final win rate while ignoring the curve shape.
- Hiding all growth until one giant breakpoint.

## Drop Ecology Pattern

When a rarity first appears, it should usually be a chase drop.
After one or two stages, it can become ordinary.

Example pattern:

```text
D1: rare is visible, epic is miracle
D2: rare is common, epic is chase
D3-D4: epic becomes real progression, legendary is chase
D5-D6: epic/legendary are normal, mythic is chase
D7-D8: legendary is normal, mythic becomes common enough to build around
```

This gives the player both:

- frequent normal upgrades that prove the run was not wasted
- uncommon spikes that create breakthrough moments

## Curve Reading Workflow

### 1. Plot The Curve

Always inspect a time series before declaring pacing good.

For loot progression, use:

```text
x-axis: grind ticks / runs / dungeon clears
y-axis: waterline score, clear rate, or stage pressure score
extra lines: average, best, worst, and representative scenario curves
```

Do not summarize only the final value.

### 2. Mark Phases

Classify the visible segments:

- `initialLift`: first few runs produce obvious gains.
- `bottleneck`: score rises slowly but not zero.
- `breakthrough`: slope sharply increases after better drops or next-stage access.
- `newPlateau`: gains slow because the current stage is mostly exhausted.
- `longTail`: final chasing for rare best-in-slot or hard outliers.

### 3. Explain The Cause

For each phase, identify the system reason:

```text
initialLift: empty slots filled / low-level gear replaced / basic rarity appears
bottleneck: common upgrades exhausted, chase drops not yet found
breakthrough: new dungeon unlocked or rare drop changes build quality
newPlateau: current dungeon's common pool no longer upgrades most slots
longTail: only rare affix combinations or high rarity drops matter
```

If the cause is only an arbitrary gate, redesign the progression rule.

### 4. Tune The Shape

Use targeted levers:

| Curve problem | Better lever |
| --- | --- |
| Initial lift too weak | increase low-tier base item level, drop count, or useful common affixes |
| Player jumps tiers too fast | raise next-stage challenge pressure or lower early item level ranges |
| Plateau is dead flat | add small common upgrades or sidegrade affixes in current stage |
| Breakthrough never happens | raise chase-drop chance slightly or improve next-stage unlock relevance |
| Breakthrough is too huge | reduce next-stage item level gap or high-rarity probability |
| Everyone reaches ceiling together | widen role/build-specific affix value, stage pressure, or encounter counters |
| Only one build progresses | add alternative useful affix families or lower over-specific dependency |

## Acceptance Heuristics

A good wave curve usually has:

- at least one clear early lift
- at least one short bottleneck where slope is low but nonzero
- a later breakthrough with materially higher slope
- different teams progressing at different rates
- no need for artificial run-count gates
- a final state that does not make every team identical

Do not require every run to reach full clear. A mid-progression test can end with most teams in the middle and only high-synergy teams near the top.

## Current Project Example

The equipment grind curve that motivated this skill:

```text
T0 avg 0.051
T1 avg 0.142  -> initial slot-fill lift
T2 avg 0.175
T3 avg 0.183  -> bottleneck begins
T4 avg 0.198
T5 avg 0.249  -> second wave starts
T6 avg 0.300
T9 avg 0.493  -> breakthrough wave
T12 avg 0.627
T24 avg 0.734 -> long-tail/mid-progression state
```

Diagnosis:

- T1 improves because early drops fill empty slots and basic stats.
- T2-T4 slows because unlocks move faster than meaningful gear replacement.
- T5-T6 rises because the current dungeon starts producing enough epic/legendary replacements.
- T9-T12 jumps because some teams break into higher dungeons and access stronger rarity ecology.

The desired feel is not "finish after 24 runs"; it is "visible early growth, then a near-miss bottleneck, then a breakthrough wave."

## Output Format

When using this skill, report:

```text
Curve shape:
Phase labels:
What caused each phase:
What feels good:
What feels wrong:
Recommended tuning lever:
Validation run:
```

Prefer a plotted curve or compact table over prose-only judgment.
