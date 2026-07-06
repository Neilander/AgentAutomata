# PoE Build Study: Ignite, Poison, and Bleed

Date: 2026-07-06

## Purpose

This note studies damaging ailments as the sixth Path of Exile build-engine sample.

Previous samples:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold engine.
- Righteous Fire Chieftain: self-upkeep / maximum fire resistance / regeneration engine.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate trigger breakpoint engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.
- Traps, Mines, and Totems: temporary deployed entities / setup time / entity limits / activation reliability.

Ailment builds add another important pattern: the application model matters as much as the damage tag. Ignite, Poison, and Bleed are all damaging ailments, but they ask for different hit shapes, frequency, duration, chance to apply, resistance handling, and stacking logic.

References:

- PoE Wiki, Ignite: https://www.poewiki.net/wiki/Ignite
- PoE Wiki, Poison: https://www.poewiki.net/wiki/Poison
- PoE Wiki, Bleeding: https://www.poewiki.net/wiki/Bleeding
- PoE Wiki, Ailment: https://www.poewiki.net/wiki/Ailment

## One Sentence Build Core

Ailment builds convert hits into damage-over-time states, so gear must tune the application event, ailment chance, ailment base damage, duration, stack rules, enemy mitigation, and whether the build wants one large application or many overlapping applications.

The important design lesson: two builds can both be "DOT builds" while wanting opposite stats. Ignite often rewards one large qualifying hit; Poison usually rewards many fast applications; Bleed cares about physical hit source, bleed scaling, and whether the target is moving.

## Three Sub-Engines

| Ailment | Typical Output Shape | Core Question | Main Stat Trap |
| --- | --- | --- | --- |
| Ignite | One strong burn from a hit, with the strongest ignite dealing damage | Is each application large enough and reliably applied? | Adding hit frequency without improving the best ignite |
| Poison | Many chaos DOT stacks from physical/chaos hits | Can the build apply and maintain many stacks? | Big single-hit damage without enough application rate |
| Bleed | Physical DOT from attacks, with movement-sensitive pressure | Can the build apply strong bleeds and exploit movement / rupture / aggravation style mechanics? | Generic DOT or spell scaling that does not match bleed source rules |

## Core Engine Layers

| Layer | What It Does | Why It Matters |
| --- | --- | --- |
| Qualifying hit | The hit that can inflict the ailment | No qualifying hit means no ailment |
| Chance to inflict | Determines application reliability | Low chance creates dead hits and uneven output |
| Base damage source | Determines ailment's starting value | Wrong damage type or weak base hit weakens the DOT |
| Ailment-specific multipliers | Fire DOT / chaos DOT / physical DOT / ailment damage | Correct tags beat generic player damage |
| Duration | Controls how long the ailment lasts | Can increase uptime, ramp, or wasted overkill depending on ailment |
| Application frequency | How often the build attempts to inflict | Crucial for poison, less directly useful for ignite |
| Stack / replacement rules | Determines whether new applications add, replace, or only strongest applies | This is the hidden build engine |
| Enemy mitigation | Resistance, ailment avoidance, reduced effect, recovery pressure | Real damage depends on enemy defenses |
| Delivery safety | Range, mobility, uptime, defenses | DOT builds still need to survive while applying |

## The Non-Obvious Core: Application Model Beats Damage Label

Calling something a DOT build is not specific enough.

Ignite and Poison both deal damage over time, but they optimize differently:

- Ignite: make the best application large and reliable.
- Poison: apply many stacks quickly and keep them rolling.

Design translation:

```text
DOT build = application event + stack rule + duration + mitigation + uptime
```

If the stack rule changes, the same item can flip from excellent to mediocre.

## Slot Responsibilities

| Slot | Primary Job | Flexible Or Core? | Replacement Effect |
| --- | --- | --- | --- |
| Weapon | Base hit, ailment chance, attack/cast speed, damage tags | Core application slot | Wrong base type can break ailment scaling |
| Off-hand / shield | Defense, ailment scaling, dot multiplier, utility | Hybrid | Can carry survival or multiplier compression |
| Body armour | Main links, defenses, ailment support | Core socket/defense slot | Losing links weakens every application |
| Helmet | Reservation, exposure/curse utility, defenses | Support/compression slot | Often supports enemy mitigation plan |
| Gloves | Damage conversion, chance to inflict, DOT multiplier, exposure | Application/support slot | Can change whether hits qualify or apply reliably |
| Boots | Movement, ailment avoidance, defenses | Uptime/safety slot | Bad boots reduce application uptime |
| Amulet | Gem levels, DOT multiplier, damage over time, attributes | High-value scaler | Often one of the largest damage upgrades |
| Rings | Curse, ailment chance, resists, attributes, cost fixes | Tax/support slot | Losing curse or chance can lower real ailment output |
| Belt | Life/resists/flasks, ailment duration or damage utility | Tax/compression slot | Player survival still matters |
| Flasks | Damage, defense, speed, ailment chance/support | Uptime and burst | Flask downtime can alter application rate and safety |
| Jewels | DOT multiplier, ailment damage, duration, attack/cast speed, life | Precision tuning | Small changes can affect ramp or uptime |

## What Is Truly Mandatory?

| Function | Ignite | Poison | Bleed |
| --- | --- | --- | --- |
| Qualifying hit | Fire or enabled hit source | Physical/chaos hit source | Physical attack hit source |
| Application reliability | High ignite chance or guaranteed ignite | High poison chance | High bleed chance |
| Best scaling shape | Big hit, fire DOT multiplier, exposure/res reduction | Hit frequency, poison duration, chaos DOT, stack sustain | Physical DOT, bleed multiplier, attack source, movement/aggravation tools |
| Duration role | Uptime and comfort | Ramp and stack count | Uptime and pressure window |
| Frequency role | Replaces with better ignite, refreshes uptime | Core damage scaler | Applies/refreshes, but not the same as poison stacking |
| Enemy mitigation answer | Fire exposure, fire res reduction, curses | Chaos res reduction, wither, curses | Physical DOT mitigation, maim/movement pressure, curses |
| Common trap | Many small ignites | One big hit but low poison frequency | Generic spell/DOT scaling that does not apply |

## Replacement Matrix

| Change | Immediate Result | Hidden Cost | Expert Verdict |
| --- | --- | --- | --- |
| Add cast/attack speed to ignite without raising hit size | More applications | Strongest ignite may not improve | Often weak unless uptime was the issue |
| Replace big-hit ignite weapon with faster low-hit weapon | Smoother hits | Best ignite shrinks | Usually bad for ignite bossing |
| Add poison duration but lose hit frequency | Longer stacks | Fewer stacks applied per second | Depends on current ramp and duration |
| Add attack speed to poison | More applications | Higher cost / defensive exposure | Usually good if chance and sustain are solved |
| Replace poison chance gear with raw damage | Bigger possible hits | Dead hits that do not poison | Bad until chance is capped/reliable |
| Add generic spell damage to bleed | Sheet may look better | Bleed needs physical attack/source-compatible scaling | Usually wrong |
| Drop curse/exposure for personal defense | Safer character | Real enemy DOT taken may fall sharply | Depends on content pressure |
| Add duration to ignite/bleed | Longer uptime | May not improve peak damage if reapplying constantly | Comfort or boss-phase utility |

## Budget Progression Logic

### Campaign / Early Setup

Priority:

1. Make sure the hit can inflict the chosen ailment.
2. Get application chance high enough to feel reliable.
3. Use supports that match the ailment's real damage tags.
4. Keep player resistances, life, and movement stable.
5. Add duration or frequency only when it solves a real uptime problem.

Expert reading: the first pass is not "more DOT"; it is "does the ailment actually happen?"

### Early Maps

Priority:

1. Improve base hit or application rate depending on ailment.
2. Add ailment-specific DOT multiplier.
3. Add enemy mitigation tools: exposure, curses, wither, resistance reduction.
4. Solve sustain/cost and defenses.
5. Avoid mixing incompatible ailment stats.

Expert reading: poison wants a stack engine; ignite wants a strong application engine.

### Medium Budget

Priority:

1. Compress application reliability and damage into fewer items.
2. Add strong amulet/weapon/jewel multipliers.
3. Improve uptime through mobility and defenses.
4. Tune duration versus frequency.
5. Add content-specific mitigation answers.

Expert reading: medium budget is where ailment builds stop wasting applications.

### High Budget

Priority:

1. High base application quality: large ignite hit, fast poison engine, strong bleed source.
2. Premium DOT multipliers, gem levels, curses, exposure, wither/equivalent stacks.
3. Defensive compression so the character can keep applying.
4. Specialized corruptions/implicits that preserve the application model.

Expert reading: high budget buys both stronger applications and fewer dead applications.

## Comparison Against Previous Studies

| Question | Toxic Rain | Righteous Fire | CoC | Spectre | Trap/Mine/Totem | Ailments |
| --- | --- | --- | --- | --- | --- | --- |
| Engine type | Overlap DOT | Self-upkeep DOT | Trigger breakpoint | Persistent external actors | Temporary deployed entities | Application / stack rule DOT |
| First build gate | Pod overlap | Survive self-burn | Hit + crit + cooldown | Minion ownership | Deployment loop | Qualifying application |
| Stat trap | Wrong AoE | Damage before sustain | Too much APS | Player damage not applying | Payload that slows setup | Wrong frequency/duration for stack rule |
| Hidden mandatory stat | AoE band | Max fire res / regen | Accuracy / CDR | Minion gem level | Throw/place speed | Chance to inflict and enemy mitigation |
| Bad novice replacement | High physical bow | Pure DPS removing sustain | DPS removing hit/crit/cost | Generic caster gear | Big damage ruining cadence | Generic DOT item that misses ailment rules |
| High budget buys | DOT threshold compression | Sustain plus damage | Trigger precision | Army scaling | Setup and payload compression | Application quality and mitigation compression |

## Build Design Lessons For Our Game

### 1. Status Effects Need Stack Rules

A status effect is not just a colored DOT. Its stack rule defines the build.

Useful options:

- only strongest instance deals damage;
- all instances stack;
- limited stacks;
- newest replaces oldest;
- stacks ramp into a burst;
- stacks empower a separate detonation.

Each option creates different desired gear.

### 2. Chance To Apply Can Be A Core Stat

Application chance is not a boring tax when the ailment is the build's engine. It decides whether a hit matters.

Our item UI should treat it as an engine stat:

```text
Poison chance: 80% -> about 1 in 5 qualifying hits fail to add a stack.
```

That is far more legible than hiding it in a generic score.

### 3. Frequency And Magnitude Should Fight Sometimes

Ignite-style builds want a large best application. Poison-style builds want many applications.

This creates healthy equipment tension:

- slow heavy weapon for giant burns;
- fast light weapon for many poisons;
- duration gear for ramp;
- mitigation gear for boss damage;
- chance gear for reliability.

### 4. Enemy Mitigation Is Part Of The Engine

DOT builds often look fine on paper and then fail against resistant enemies. Exposure, resistance reduction, wither-like debuffs, and curses are not optional decorations.

For our system, status builds should have explicit enemy-answer layers:

- reduce burn resistance;
- make poison bypass part of cleansing;
- make bleed count as moving damage;
- prevent status expiry during boss immunity windows.

### 5. Replacement Analysis Must Check The Application Model

For ailment builds, before accepting a replacement:

```text
Can I still inflict the ailment?
Is chance to apply still reliable?
Did the base application get larger or smaller?
Did stack count/ramp change?
Did duration help or just overkill?
Did enemy mitigation change?
Did my hit frequency match the ailment's stack rule?
```

That is the expert habit unique to this category.

## Reusable Checklist Addendum

When studying an ailment or status build, add these questions:

1. What hit or event applies the status?
2. What damage type or source qualifies?
3. What is chance to apply?
4. Does the status stack, replace, refresh, or only strongest applies?
5. Does the build want one large application or many small ones?
6. What duration is useful before it becomes waste?
7. What enemy mitigation counters the status?
8. Which item slots solve application chance versus damage multiplier?
9. Which replacement changes stack math rather than tooltip damage?
10. Does high budget buy larger applications, more applications, longer uptime, or better enemy mitigation?

## Next Study Candidate

Study a charge / resource loop build next, such as Power Charge stacking, Frenzy Charge scaling, or Rage/Berserk.

Reason: the current studies cover DOT application, deployment, external actors, trigger rhythm, self-upkeep, and overlap geometry. Charge/resource-loop builds add another loot-game skill: maintaining temporary internal resources and turning uptime into burst or scaling.
