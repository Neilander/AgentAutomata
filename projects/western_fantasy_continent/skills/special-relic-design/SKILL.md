---
name: special-relic-design
description: Design and validate special relics, unique equipment passives, first-clear challenge rewards, build-unlocking items, or non-standard loot effects for Western Fantasy Continent. Use when creating special passive items that should strengthen a build, unlock a new playstyle, or be tested across target and non-target teams at multiple gear levels.
---

# Special Relic Design

Use this project skill before adding special relics or unique equipment passives.

Core rule:

```text
A special relic should change a build question, not just add a larger number.
It must be special enough to feel like a first-clear reward, but not so narrow that it is dead outside one scripted team.
```

## Design Mix

For a batch of special relics, target this distribution:

```text
20% general relics:
  useful across many teams, but still not mandatory.

40% medium-width relics:
  roughly 3 roles/classes/build families can use them well.

30% build-specific relics:
  clearly pushes one named build or unlocks a special playstyle.

10% bridge relics:
  link two build families that normally do not naturally connect, such as low-health plus burn.
```

Do not let every relic become build-specific. Too many narrow relics make loot feel scripted. Do not let every relic become universal either. Too many universal relics collapse choice into raw power ranking. Bridge relics are the pressure valve: they are allowed to be strange, but must create a readable hybrid question rather than random keyword soup.

## Width Classification

Before writing numbers, classify the relic:

```text
Relic name:
Width target:
  general | medium-width | build-specific | bridge
Relic grade:
  normal | advanced | component | core
Target build:
Linked builds, if bridge:
Target users:
Non-target users that can still use it:
Dead users:
Why this is not just a bigger stat:
```

Use `design-width-evaluator` when the relic depends on a keyword, affix, hidden mechanic, or mechanic that might be too narrow.

## Design Standards

A good special relic should satisfy at least one:

- **Build amplifier**: makes an existing build more readable or more complete.
- **Build unlocker**: allows a role or team to play in a way it could not before.
- **Conversion engine**: turns one resource into another, such as burn into area pressure or shield into damage.
- **Build bridge**: links two otherwise separate builds through a concrete conversion path.
- **Timing rewrite**: changes when a build spikes, survives, resets, or commits.
- **Formation rewrite**: makes front/back or target order matter in a new but readable way.
- **Counter with side use**: answers a problem while still having ordinary value elsewhere.

Reject or redesign if:

- It only says "more damage" or "more defense."
- It only beats one named enemy/team and is dead elsewhere.
- It requires vague targeting such as "most dangerous target" without a concrete formula.
- Four copies would make combat unreadable or break targeting.
- It invalidates the build it is meant to counter.
- It is secretly mandatory for every team at the same gear tier.

## Required Test Matrix

Each relic must be tested by uplift, not by raw strength alone.

Test these team groups:

```text
Target team:
  the intended build or best known user.

Near-target teams:
  3 teams that share some mechanics but are not the exact target.
  If more than 3 exist, randomly sample 3 for each test pass.

Random standard teams:
  5 logically-built standard teams.
  These are not pure random trash teams; they should be coherent teams that could plausibly be played.
```

Test these gear tiers:

```text
0 equipment:
  base characters only.

half equipment:
  medium-level epic gear or equivalent midgame gear.

full equipment:
  high-level divine/mythic gear or equivalent endgame gear.
```

For each case, compare:

```text
baseline team without relic
same team with relic
```

Measure at least:

- uplift percentage against the same baseline team;
- win-rate delta or waterline score delta as supporting evidence;
- damage / healing / shield / survival contribution shift;
- whether the intended build signal becomes more visible;
- whether non-target users gain too much value;
- whether the effect only works at one gear tier.

Repeat the sampling multiple times when judging a relic's width. A single sample can misclassify a relic because the random standard teams may accidentally include or exclude its natural users.

## Relic Grade By Uplift

Classify relic grade by target-team uplift:

```text
normal relic:
  target uplift: 10% to 20%

advanced relic:
  target uplift: above normal but below component, usually used for stronger challenge rewards or late ordinary rewards.

component relic:
  target uplift: 20% to 40%
  should feel like a meaningful build piece but not the whole engine.

core relic:
  target uplift: 40% to 60%
  should visibly define or unlock a build.
```

If a relic gives less than 10% uplift to the target team, it is probably too weak or too hidden. If it gives more than 60% uplift, treat it as a high-risk build engine and require a stronger counterplay or acquisition gate.

## Genericity Cap By Uplift Sum

Use mid-gear testing for the genericity cap unless the relic is explicitly early-only or late-only.

For each sampled team, calculate:

```text
upliftPercent = (scoreWithRelic - baselineScore) / baselineScore * 100
```

Then sum uplift across:

```text
1 target team
3 near-target teams
5 random standard teams
```

Use the total uplift sum to detect over-generic relics:

```text
normal relic:
  suggested total uplift cap: about 150

component relic:
  suggested total uplift cap: between normal and core; tune by acquisition rarity.

core relic:
  suggested total uplift cap: about 240
```

Interpretation:

- A core relic can be very strong for its target build, but the total uplift cap prevents it from also being great everywhere.
- A normal relic has a lower total cap because it should not quietly become a universal best-in-slot.
- If total uplift exceeds the cap, either narrow the trigger, lower the value, add a tradeoff, or reclassify the relic as more general and lower its target ceiling.
- If total uplift is far below the cap but target uplift is high, the relic is very narrow. That can be acceptable only for build-specific or late challenge rewards.

## Acceptance Heuristics

Use these as first-pass thresholds, then adjust by design intent:

```text
General relic:
  target uplift: moderate
  non-target uplift: small to moderate
  risk: mandatory if it beats most specific relics

Medium-width relic:
  target uplift: clear
  near-target uplift: useful but smaller
  non-target uplift: small
  risk: fake medium-width if only one class converts it

Build-specific relic:
  target uplift: strong and visible
  near-target uplift: small to moderate
  non-target uplift: low
  risk: too narrow if only one exact four-unit preset can use it

Bridge relic:
  target uplift: clear for the hybrid team
  each linked build alone: useful but not best-in-slot
  non-target uplift: low
  risk: fake bridge if it only buffs one side, or incoherent if both sides do not interact
```

If a build-specific relic gives large uplift to non-target teams, either narrow the trigger or reclassify it as medium/general. If a general relic gives the largest uplift to every test case, lower its ceiling or add a tradeoff.

## Batch Review

After designing a batch, audit the distribution:

```text
Batch size:
General count / percent:
Medium-width count / percent:
Build-specific count / percent:
Bridge count / percent:
Grade count:
  normal / advanced / component / core
Overrepresented keywords:
Underused keywords with potential:
Relics that look too universal:
Relics that look too narrow:
Relics that exceed uplift-sum cap:
```

Also check challenge reward placement:

- Early challenge rewards should teach a build direction without requiring full gear.
- Mid challenge rewards can open alternate builds or cross-class synergies.
- Late challenge rewards can be narrow and powerful, but must have clear counterplay.

## Output Template

```text
Relic:
Reward source:
Width target:
Relic grade:
Target build:
Linked builds, if bridge:
Target users:
Non-target usable cases:
Passive:
What changes in play:
Preferred gear/stat support:
Risks:
Test plan:
  target teams:
  near-target teams:
  random standard teams:
  gear tiers:
Expected result:
Expected target uplift:
Expected total uplift sum:
Acceptance condition:
```

## Relationship To Other Skills

- Use `skill-kit-design` when the relic requires new skills or changes class kit identity.
- Use `design-width-evaluator` when judging whether a mechanic is too narrow, too universal, or suitable for shared use.
- Use `phenomenon-math-modeling` when a relic performs strangely and the reason needs to be translated into variables.
- Use `comparative-analysis` after several test attempts produce conflicting conclusions.
