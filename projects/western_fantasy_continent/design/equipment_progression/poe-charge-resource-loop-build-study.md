# PoE Build Study: Charges, Rage, and Berserk

Date: 2026-07-06

## Purpose

This note studies charge and resource-loop builds as the seventh Path of Exile build-engine sample.

Previous samples:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold engine.
- Righteous Fire Chieftain: self-upkeep / maximum fire resistance / regeneration engine.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate trigger breakpoint engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.
- Traps, Mines, and Totems: temporary deployed entities / setup time / entity limits / activation reliability.
- Ignite, Poison, and Bleed: ailment application / stack rules / duration / enemy mitigation.

Charge and resource-loop builds add a new pattern: temporary internal resources. The build's power depends on generating, maintaining, scaling, spending, and sometimes converting a resource rather than only equipping permanent stats.

References:

- PoE Wiki, Charge: https://www.poewiki.net/wiki/Charge
- PoE Wiki, Power charge: https://www.poewiki.net/wiki/Power_charge
- PoE Wiki, Frenzy charge: https://www.poewiki.net/wiki/Frenzy_charge
- PoE Wiki, Endurance charge: https://www.poewiki.net/wiki/Endurance_charge
- PoE Wiki, Rage: https://www.poewiki.net/wiki/Rage
- PoE Wiki, Berserk: https://www.poewiki.net/wiki/Berserk

## One Sentence Build Core

Charge and resource-loop builds turn temporary counters such as Power Charges, Frenzy Charges, Endurance Charges, or Rage into sustained stats or burst windows, so gear must solve generation, maximum capacity, uptime, decay, spending, and conversion.

The important design lesson: a resource build is not strong because it has a big bonus on paper. It is strong when the loop that creates and maintains the resource survives real combat.

## Resource Sub-Engines

| Resource | Typical Identity | Core Question | Main Stat Trap |
| --- | --- | --- | --- |
| Power Charges | Critical strike and charge-stacking spell/crit scaling | Can the build keep charges at or near maximum during real fights? | Adding max charges without generation |
| Frenzy Charges | Speed and more-damage style attack/cast cadence | Can charges stay up while mapping and bossing? | Building around mapping charge uptime that fails on bosses |
| Endurance Charges | Physical mitigation / elemental resistance / defensive scaling | Can charges be kept during dangerous windows? | Counting defensive charges that drop before impact |
| Rage | Attack resource that grants offensive pressure and can fuel Berserk | Can rage be generated, held, and spent at the right time? | Spending rage too early or failing to sustain it |
| Berserk | Burst conversion of Rage into a temporary power window | Is the burst timed to a real damage/survival window? | Treating burst uptime as permanent DPS |

## Core Engine Layers

| Layer | What It Does | Why It Matters |
| --- | --- | --- |
| Generation source | Creates charges or rage | No generation means the build only works in screenshots |
| Maximum capacity | Raises the resource ceiling | Only useful if generation and uptime can fill it |
| Duration / decay control | Keeps the resource from expiring | Separates mapping feel from boss reliability |
| Spend / conversion outlet | Turns resource into burst or alternate value | Defines whether resource is stored, spent, or transformed |
| Scaling per resource | Adds value per charge/rage | Makes each extra unit stronger |
| Uptime profile | How often the resource is actually active | Real DPS/defense depends on uptime, not maximum |
| Content context | Mapping, bosses, phase downtime, single-target uptime | Resource loops often behave differently by content |
| Defensive dependency | Whether survival assumes resource uptime | Dropped charges can cause sudden deaths |

## The Non-Obvious Core: Maximum Is Not Uptime

Many resource builds show impressive power at maximum charges or full Rage. That is not the same as having that power in real combat.

Design translation:

```text
resource value = maximum capacity * value per unit * actual uptime * timing quality
```

For build reading, the expert question is not "how many charges can it have?" It is:

```text
How quickly does it reach max, how long does it stay there, and what happens during downtime?
```

## Slot Responsibilities

| Slot | Primary Job | Flexible Or Core? | Replacement Effect |
| --- | --- | --- | --- |
| Weapon | Hit frequency, crit, rage/charge generation, payload scaling | Core engine/payload slot | Slow or unreliable hit source may break generation |
| Shield / off-hand | Defense, max charges, generation, conversion, reservation | Hybrid | Can carry either loop stability or defense |
| Body armour | Main links, defenses, sometimes charge mechanics | Core socket/defense slot | Losing links or charge tech can collapse loop output |
| Helmet | Reservation, charge/rage utility, defenses | Support/compression slot | Often pays aura or charge tax |
| Gloves | Hit frequency, rage gain, mark/curse support, charges, defense | Engine tuning slot | Can change generation reliability |
| Boots | Movement, charge generation on kill/hit, defenses | Uptime/feel slot | Mapping uptime may depend on boots |
| Amulet | Max charges, crit multiplier, attributes, reservation, damage per charge | High-value scaler | Losing max charge or per-charge scaling can be a major loss |
| Rings | Charges, curse/mark, resists, attributes, cost fixes | Tax/support slot | Often keeps loop and taxes both alive |
| Belt | Flask uptime, life/resists, rage/charge utility | Tax/compression slot | Important for real uptime and defenses |
| Flasks | Crit, speed, defense, burst timing | Temporary loop support | Flask downtime can expose resource downtime |
| Jewels | Max charges, per-charge bonuses, rage/attack speed, life | Precision tuning | Small lines can multiply across many charges |

## What Is Truly Mandatory?

| Function | Must Exist? | Can Move To Another Slot? | Notes |
| --- | --- | --- | --- |
| Resource generation | Yes | Skill, gear, passives, marks, ascendancy, flasks | Without this, max capacity is fake |
| Resource cap or scaling | Strongly yes | Tree, gear, jewels, uniques | Defines ceiling and build identity |
| Uptime solution | Yes | Duration, generation frequency, boss generation, recovery from downtime | Mapping-only generation is not enough |
| Spend or benefit | Yes | Native charge bonuses, per-charge scaling, Berserk, conversion items | The resource must do something worth building around |
| Defensive fallback | Yes | Gear, passives, flasks, non-resource defenses | If charges drop, the character should not instantly collapse unless intentionally fragile |
| Content timing plan | Strongly yes | Burst windows, phase handling, boss start setup | Resource loops are timing-sensitive |

## Replacement Matrix

| Change | Immediate Result | Hidden Cost | Expert Verdict |
| --- | --- | --- | --- |
| Add maximum Power Charge but lose generation | Higher ceiling | Charges fill slower or not at all | Bad until generation is solved |
| Replace charge-on-hit ring with raw damage ring | More static damage | Boss charge uptime may collapse | Often bad for single target |
| Add per-charge damage but reduce charge duration | Higher peak | Lower uptime during movement/phase gaps | Content-dependent |
| Drop Endurance Charge generation for offense | More damage | Defensive floor disappears during spikes | Dangerous |
| Add Rage generation but no Berserk/timing plan | More attack pressure | Resource may be underused | Fine for sustain, incomplete for burst |
| Use Berserk more often | More frequent burst | Rage depleted before important windows | Bad if timing is wrong |
| Replace fast hit source with slow heavy hit | Bigger individual hits | Charge/rage generation slows | Depends on generation rule |
| Rely on on-kill charge generation | Great mapping | Weak boss uptime | Needs boss solution |

## Budget Progression Logic

### Campaign / Early Setup

Priority:

1. Identify the resource and why it matters.
2. Get a reliable generation source.
3. Avoid building around max stacks that cannot be maintained.
4. Keep ordinary defenses and resistances stable.
5. Add resource scaling only after uptime exists.

Expert reading: early resource builds need a loop, not just a payoff.

### Early Maps

Priority:

1. Stabilize mapping generation.
2. Add boss-compatible generation or fallback.
3. Increase maximum charges/rage only when uptime can fill the cap.
4. Add per-resource scaling.
5. Patch defenses for downtime.

Expert reading: many builds feel great while clearing and then reveal resource failure on bosses.

### Medium Budget

Priority:

1. Compress generation and cap into gear/jewels.
2. Improve uptime during phase gaps and single-target fights.
3. Add stronger spend/conversion outlets.
4. Preserve defenses outside peak resource state.
5. Tune burst timing if Berserk or similar spenders are used.

Expert reading: the build becomes real when resource uptime survives the content type it is meant to beat.

### High Budget

Priority:

1. High maximum resource capacity.
2. Multiple reliable generation paths.
3. Per-resource scaling on premium slots.
4. Burst windows aligned with boss phases.
5. Defensive compression that does not rely entirely on peak resource uptime.

Expert reading: high budget buys both peak and recovery speed.

## Comparison Against Previous Studies

| Question | Toxic Rain | RF | CoC | Spectre | Trap/Mine/Totem | Ailment | Resource Loop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Engine type | Overlap DOT | Self-upkeep | Trigger breakpoint | External actors | Deployed entities | Application rules | Temporary internal resource |
| First build gate | Pod overlap | Sustain self-burn | Hit/crit/CDR | Minion ownership | Deployment loop | Qualifying application | Generation and uptime |
| Stat trap | Wrong AoE | Damage before sustain | Too much APS | Player stats not applying | Payload slowing setup | Wrong stack rule | Max resource without uptime |
| Hidden mandatory stat | AoE band | Max fire res/regen | Accuracy/CDR | Minion gem level | Placement speed | Chance/mitigation | Generation/duration |
| Bad novice replacement | High physical bow | Pure DPS removing sustain | DPS removing hit/crit/cost | Generic caster gear | Big damage ruining cadence | Generic DOT mismatch | Peak damage item removing uptime |
| High budget buys | Threshold compression | Sustain plus damage | Trigger precision | Army scaling | Setup/payload compression | Application and mitigation | Peak, uptime, and recovery compression |

## Build Design Lessons For Our Game

### 1. Separate Resource Ceiling From Resource Uptime

An item that gives `+1 maximum charge` should not be scored as pure power. It needs a question beside it:

```text
Can this build actually fill and keep the extra charge?
```

Our equipment scoring should model capacity and uptime separately.

### 2. Generation Source Quality Matters

Resource generation can be:

- on kill;
- on hit;
- on crit;
- on being hit;
- per second;
- on skill use;
- when spending another resource;
- at combat start.

Each source has different content reliability. On-kill is excellent for mapping but often weak for bosses.

### 3. Spend Timing Is Its Own Skill

Berserk-style resources teach that spending can be wrong even when the button is available. The player needs a reason to hold or spend.

For our game:

```text
Build resource: Fury.
Spend: consume Fury for 4 seconds of doubled attack cadence.
Question: do you spend on wave clear, elite spawn, or boss stagger?
```

This creates planning, not only passive stats.

### 4. Defensive Resource Builds Need Downtime Rules

If a build's defense relies on charges, downtime is lethal. That can be fun if visible and intentional, but frustrating if hidden.

Our UI should show:

- current resource;
- maximum resource;
- generation source;
- time to full;
- expected uptime;
- what defensive/offensive effects are lost at zero.

### 5. Replacement Analysis Must Check The Economy

For resource-loop builds, before accepting a replacement:

```text
Did maximum resource change?
Did generation change?
Did duration/decay change?
Did spend timing change?
Did per-resource value change?
Does the build still work on bosses?
What happens during downtime?
```

This is the expert habit unique to this category.

## Reusable Checklist Addendum

When studying a charge, rage, energy, combo-point, or other temporary-resource build, add these questions:

1. What resource is generated?
2. What creates it?
3. What is the maximum capacity?
4. How fast does it fill?
5. How fast does it decay or expire?
6. What does each unit do?
7. Is the resource spent, converted, or only held?
8. Is generation reliable on bosses, or only while clearing?
9. What breaks when the resource drops to zero?
10. Does high budget buy more cap, faster generation, longer duration, stronger spend, or safer downtime?

## Next Study Candidate

Study a low-life, energy-shield, or reservation-stacking build next.

Reason: the current studies now cover resources, ailments, deployment, external actors, triggers, self-upkeep, and overlap geometry. Low-life/reservation builds add another loot-game pattern: intentionally reserving or converting the life/energy shield economy to unlock large auras, pain-state bonuses, or defensive layers.
