# PoE Build Study: Cast on Critical Strike

Date: 2026-07-06

## Purpose

This note studies Cast on Critical Strike as the third Path of Exile build-engine sample.

Previous samples:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold engine.
- Righteous Fire Chieftain: self-upkeep / maximum fire resistance / regeneration engine.

Cast on Critical Strike adds a different expert pattern: a trigger breakpoint engine. It is not enough to stack damage or attack speed. The build works when accuracy, critical chance, attack rate, cooldown recovery, resource cost, and the triggered spell all line up.

References:

- PoE Wiki, Cast On Critical Strike Support: https://www.poewiki.net/wiki/Cast_On_Critical_Strike_Support
- PoE Wiki, Trigger: https://www.poewiki.net/wiki/Trigger
- PoE Wiki, Cooldown: https://www.poewiki.net/wiki/Cooldown

## One Sentence Build Core

Cast on Critical Strike is a trigger build where an attack must hit and critically strike to cast linked spells, so its real engine is the timing relationship between hit rate, critical consistency, cooldown recovery, and the chosen spell payload.

The important design lesson: CoC is a gearbox. More attack speed is good only until it outruns the trigger cooldown. More spell damage is useful only if the engine is triggering reliably.

## Core Engine

| Layer | What It Does | Why It Matters |
| --- | --- | --- |
| Attack delivery skill | Produces repeated hit attempts | Cyclone-style attacks are popular because they hit repeatedly while moving |
| Accuracy / hit chance | Determines whether attacks can crit at all | A missed attack cannot trigger CoC |
| Critical strike chance | Converts hits into trigger events | Low crit makes the build stutter |
| Attack rate | Sets how often the build attempts to trigger | Too low wastes cooldown capacity; too high can overrun the trigger window |
| CoC cooldown | Limits how often linked spells can trigger | Creates breakpoints instead of smooth scaling |
| Cooldown recovery rate | Lowers effective trigger cooldown | Enables higher useful attack-rate caps |
| Triggered spell payload | The actual damage spell | Spell scaling matters after the trigger engine is stable |
| Resource sustain | Pays costs or supports triggered casting | If costs are unsolved, the engine sputters |
| Defensive movement layer | Keeps the character alive while staying in contact | CoC often fights at close or mid range |

## The Non-Obvious Core: Attack Speed Has A Ceiling

Cast on Critical Strike has a cooldown. Because Path of Exile processes actions in server frames, cooldown recovery does not scale in a perfectly smooth line. It creates practical attack-speed / cooldown breakpoints.

Design translation:

- A stat can be wasted if it exceeds the engine's receiver capacity.
- "More speed" is not always more output.
- Correct gear may reduce attack speed or add cooldown recovery rather than add raw damage.

For our own system, this is one of the richest equipment lessons so far:

```text
Trigger engine capacity = min(event attempts, trigger cooldown capacity, resource sustain, target availability)
```

The player is optimizing a machine, not filling one bar.

## Slot Responsibilities

| Slot | Primary Job | Flexible Or Core? | Replacement Effect |
| --- | --- | --- | --- |
| Weapon | Attack crit, attack speed, base attack behavior, sometimes trigger synergy | Core engine slot | Bad weapon can break crit consistency or attack-rate alignment |
| Off-hand / shield | Defense, cooldown recovery sources, spell damage, crit support | Hybrid | Can carry either survival or trigger scaling |
| Body armour | Main link setup or defensive layer | Core socket/defense slot | Losing links or reservation support can break the whole setup |
| Helmet | Reservation, enchant/implicit utility, defenses, sometimes cooldown/ailment tech | Flexible support | Often handles build taxes rather than pure damage |
| Gloves | Accuracy, attack speed, crit, exposure, defensive utility | Engine tuning slot | Can push attack speed above a breakpoint if swapped carelessly |
| Boots | Movement speed, cooldown recovery, ailment avoidance, defenses | Breakpoint/support slot | Losing cooldown recovery may require lowering attack speed |
| Amulet | Critical multiplier, gem levels, attributes, reservation, damage | High-value scaler | Great damage slot, but also solves attribute and reservation pressure |
| Rings | Accuracy, crit, mana cost, resists, curse, attributes | Tax and engine slot | Losing accuracy or cost reduction can make the build stutter |
| Belt | Cooldown recovery, flask support, life/ES/resists | Breakpoint slot | Losing CDR can invalidate the current attack-speed setup |
| Flasks | Crit, speed, defense, ailment handling | Uptime support | Flask downtime can change crit and survival math |
| Jewels | Crit multi, attack speed, cooldown/utility, defenses | Precision tuning | Small changes can cross a breakpoint |

## What Is Truly Mandatory?

| Function | Must Exist? | Can Move To Another Slot? | Notes |
| --- | --- | --- | --- |
| Attack hit delivery | Yes | Main skill / weapon / attack setup | No hit means no crit trigger |
| High hit chance | Yes | Accuracy gear, passives, precision aura, weapon mods | Accuracy is a damage stat here |
| High crit consistency | Yes | Weapon, passives, power charges, flasks, gear | Low crit creates uneven output |
| Cooldown alignment | Yes | Belt, boots, awakened support, passives/items depending on build | Attack rate must match trigger capacity |
| Spell payload scaling | Yes | Gem levels, spell damage, crit multi, exposure, penetration | Only matters after trigger reliability |
| Resource sustain | Yes | Cost reduction, leech, recovery, mana mechanics | Otherwise triggers fail or stop |
| Defensive layer | Yes | Armour/evasion/ES/suppression/block/leech/etc. | CoC often spends time near danger |

## Replacement Matrix

| Change | Immediate Result | Hidden Cost | Expert Verdict |
| --- | --- | --- | --- |
| Add attack speed above current cooldown breakpoint | Character feels faster | Extra hits may occur during cooldown and not trigger spells | Can be wasted or harmful |
| Remove belt/boots cooldown recovery | Gear looks defensively stronger | Current attack speed may now exceed trigger capacity | Requires retuning APS |
| Replace accuracy ring with pure damage ring | More visible damage lines | Hit chance drops, crit attempts fall, triggers become inconsistent | Often bad |
| Replace crit flask with defensive flask | More survival uptime | Crit consistency may fall below smooth trigger threshold | Depends on crit overcap |
| Add spell damage before fixing crit/hit | Higher payload damage | Payload triggers too rarely | Wrong upgrade order |
| Swap to slower weapon with higher spell stats | Bigger individual spell scaling | Fewer trigger attempts and worse feel | Depends on cooldown alignment |
| Remove mana cost solution | Sheet DPS unchanged | Trigger loop may stall under sustained combat | Build can become unplayable |
| Add cooldown recovery without increasing attack rate | Higher theoretical cap | Unused capacity if attack rate stays low | Good only when paired with APS tuning |

## Budget Progression Logic

### Early / Prototype Stage

Priority:

1. Make the attack hit reliably.
2. Make crits happen often enough to feel like a trigger build.
3. Use a spell payload that works with available sockets and scaling.
4. Solve mana/resource costs.
5. Do not chase advanced breakpoints too early.

Expert reading: a cheap CoC build should first feel continuous. Perfect breakpoints come later.

### Low Budget Endgame

Priority:

1. Stable attack skill and main links.
2. Accuracy and crit consistency.
3. Defensive baseline.
4. Basic cooldown awareness: do not accidentally over-attack.
5. Basic spell scaling and exposure/penetration.

Expert reading: the build's first quality threshold is smoothness, not maximum theoretical DPS.

### Medium Budget

Priority:

1. Add cooldown recovery on belt/boots/supports where available.
2. Retune attack speed to match the new trigger cap.
3. Add crit multiplier and spell payload damage.
4. Compress accuracy, resists, attributes, and mana costs into fewer slots.
5. Improve defensive uptime while maintaining trigger rhythm.

Expert reading: every CDR upgrade asks for an APS review.

### High Budget

Priority:

1. Exact breakpoint tuning.
2. High crit consistency without relying on fragile temporary buffs.
3. Strong spell payload with gem levels, crit multi, exposure, and penetration.
4. Defensive compression so the build can stand near enemies.
5. Luxury corruptions/implicits/jewels that preserve the engine while adding damage.

Expert reading: high budget buys precision. The final build is strong because fewer stats are wasted.

## Comparison Against Previous Studies

| Question | Toxic Rain Pathfinder | Righteous Fire Chieftain | Cast on Critical Strike |
| --- | --- | --- | --- |
| Engine type | Overlap DOT | Self-upkeep DOT | Trigger breakpoint |
| First build gate | Correct pod overlap and chaos scaling | Survive own self-burn | Hit + crit + cooldown alignment |
| Stat trap | Too much / wrong AoE | Damage before sustain | Attack speed above cooldown cap |
| Hidden mandatory stat | Area band | Max fire res / regeneration | Accuracy and cooldown recovery |
| Upgrade rhythm | Add gem levels and DOT multipliers | Stabilize engine, then add fire DOT | Tune CDR and APS together |
| Novice bad item | High physical DPS bow | Pure damage item that removes sustain | Pure damage item that removes hit/crit/cost solution |

## Build Design Lessons For Our Game

### 1. Trigger Builds Need Receiver Capacity

CoC shows that trigger systems need two sides:

- event production: attacks, crits, hits, procs;
- event receiving: cooldowns, charges, resource budget, target rules.

If production exceeds receiving, the extra events are wasted.

For our equipment system, a trigger relic should expose this clearly:

```text
On critical hit, cast a lightning echo.
Echo cooldown: 0.25s.
Cooldown recovery and attack cadence determine real output.
```

### 2. Accuracy Can Be A Damage Stat

In CoC, accuracy is not a boring tax. It is the first gate before crit and trigger.

For our system, we should allow "enabler stats" to become exciting when they sit in a visible chain:

```text
hit -> crit -> trigger -> payload -> secondary chain
```

If a player sees this chain, they can understand why a ring with accuracy can beat a ring with raw damage.

### 3. Breakpoints Create Expert Play, But Need UI Help

Breakpoint systems are satisfying when legible and miserable when hidden.

If we add trigger cooldowns, the UI should eventually show:

- current event attempts per second;
- trigger capacity per second;
- wasted trigger attempts;
- next useful cooldown or speed breakpoint.

This is the difference between "deep" and "opaque".

### 4. Payload And Engine Are Different Itemization Problems

CoC separates the build into:

- engine items: hit chance, crit chance, attack speed, cooldown recovery, cost sustain;
- payload items: spell damage, gem levels, penetration, crit multiplier;
- survival items: defenses needed to stay in range.

Our build scoring should avoid merging these into one power number too early. A build with weak payload but perfect engine has a different problem than a build with huge payload but broken trigger rhythm.

### 5. Replacement Analysis Must Check Rhythm

For CoC, before accepting a replacement:

```text
Does hit chance remain high?
Does crit remain consistent?
Does attack speed still match cooldown capacity?
Are costs still paid under sustained combat?
Is the payload still scaled by the right tags?
```

This is a new expert habit beyond the previous DOT studies.

## Reusable Checklist Addendum

When studying a trigger build, add these questions:

1. What event produces the trigger?
2. What chance gates exist before the trigger?
3. What cooldown or charge gate limits receiving?
4. What is the useful event rate cap?
5. Which stat is wasted past the cap?
6. Which item slots tune the engine, and which tune the payload?
7. Does the replacement change rhythm, consistency, cost, or only damage?
8. What should the UI show so players can see wasted triggers?

## Next Study Candidate

Study a minion build next, preferably Spectres or Skeleton Mages.

Reason: the first three studies cover overlap DOT, self-upkeep DOT, and trigger breakpoints. A minion study would add externalized damage ownership: gear scales entities that are not the player, and replacement analysis must ask whether damage, defense, AI behavior, summon count, gem level, or minion uptime changed.
