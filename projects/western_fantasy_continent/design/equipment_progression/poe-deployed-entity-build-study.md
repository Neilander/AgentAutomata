# PoE Build Study: Traps, Mines, and Totems

Date: 2026-07-06

## Purpose

This note studies traps, mines, and totems as the fifth Path of Exile build-engine sample.

Previous samples:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold engine.
- Righteous Fire Chieftain: self-upkeep / maximum fire resistance / regeneration engine.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate trigger breakpoint engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.

Traps, mines, and totems add a related but different pattern: deployed temporary entities. The player places output into the battlefield, and the build's real strength depends on deployment speed, entity limits, trigger/detonation/activation timing, target coverage, and whether the player can survive while the deployed entity does the work.

References:

- PoE Wiki, Trap: https://www.poewiki.net/wiki/Trap
- PoE Wiki, Mine: https://www.poewiki.net/wiki/Mine
- PoE Wiki, Totem: https://www.poewiki.net/wiki/Totem
- PoE Wiki, Ballista Totem Support: https://www.poewiki.net/wiki/Ballista_Totem_Support

## One Sentence Build Core

Trap, mine, and totem builds externalize output into temporary deployed entities, so their equipment must tune not only damage but also placement speed, maximum active entities, trigger/detonation timing, entity duration, target coverage, and player safety during setup.

The important design lesson: a deployed-entity build can have excellent damage per entity and still feel bad if it deploys too slowly, has too few active entities, arms too late, dies too easily, targets poorly, or leaves the player unsafe.

## Three Sub-Engines

| Type | What The Player Does | What The Entity Does | Core Timing Question |
| --- | --- | --- | --- |
| Trap | Throws a trap to a location | Arms, waits for enemy trigger, then uses the skill | Can the trap arm and trigger on the right target? |
| Mine | Throws or places mines | Waits for player detonation or detonation chain | Can detonation rhythm match burst windows and setup time? |
| Totem | Places a totem | Repeatedly uses a linked attack/spell while alive | Can totems stay alive and firing long enough? |

## Core Engine Layers

| Layer | What It Does | Why It Matters |
| --- | --- | --- |
| Deployment action | Throws trap/mine or places totem | First gate before any damage happens |
| Deployment speed | How quickly entities enter the field | Low speed makes the build clunky or unsafe |
| Entity limit | Maximum active traps/mines/totems | Creates discrete breakpoints and burst ceilings |
| Activation condition | Enemy trigger, manual detonation, or autonomous totem casting | Determines real uptime and player control |
| Entity duration | How long the deployed entity remains valid | Affects preloading, boss phases, and wasted setup |
| Entity damage scaling | Damage tags inherited through the linked skill/entity rules | Correct tags beat generic player damage |
| Target coverage | Area, projectile behavior, targeting AI, detonation radius | Determines whether theoretical damage lands |
| Entity survivability | Especially important for totems | Dead entity means lost uptime |
| Player safety | Player must survive while deploying or waiting | The build often wins by letting the entity fight while the player moves |

## The Non-Obvious Core: Setup Time Is Part Of DPS

Deployed-entity builds often show high burst damage, but setup time is a real cost. If a mine build needs time to preload mines, or a totem build needs time to place multiple totems, the real output curve is:

```text
real damage = damage per entity * active entities * uptime - setup loss - wasted entities
```

Design translation:

- Burst builds need a ramp / preload accounting model.
- More maximum entities are only useful if the player can deploy them fast enough and content lets them act.
- A replacement that adds damage but slows deployment can lower real combat output.

For our equipment system, this is a strong argument for showing cadence and uptime instead of only damage.

## Slot Responsibilities

| Slot | Primary Job | Flexible Or Core? | Replacement Effect |
| --- | --- | --- | --- |
| Weapon | Skill gem levels, spell/attack scaling, crit, elemental/chaos scaling | Core payload slot | Generic weapon damage may miss the deployed skill's tags |
| Shield / off-hand | Defense, gem levels, cast/throw speed, reservation/utility | Hybrid | Can carry either payload or survival compression |
| Body armour | Main links and defense | Core socket/defense slot | Losing links lowers every deployed entity |
| Helmet | Reservation, gem supports, trap/mine/totem utility, defenses | Support/compression slot | Often carries build taxes |
| Gloves | Throw/cast speed, conversion/exposure, life/resists | Cadence/support slot | Can change feel more than raw DPS |
| Boots | Movement, cooldown/avoidance, trap/mine/totem utility, defenses | Safety/feel slot | Bad boots punish setup builds heavily |
| Amulet | Gem levels, crit, damage multipliers, attributes, reservation | High-value scaler | Often the cleanest payload upgrade |
| Rings | Cost fixes, resists, attributes, curses, trigger support | Tax/support slot | Losing cost or resistance can break sustained setup |
| Belt | Life/resists/flasks, sometimes cooldown/utility | Tax/compression slot | Important because deployed builds still need player survival |
| Flasks | Movement, defense, crit, ailment handling | Safety and burst support | Bad flask uptime makes setup windows dangerous |
| Jewels | Damage multiplier, placement/throw speed, life, utility | Precision tuning | Small lines can affect both ramp and output |

## What Is Truly Mandatory?

| Function | Must Exist? | Can Move To Another Slot? | Notes |
| --- | --- | --- | --- |
| Deployed entity source | Yes | Trap support, mine support, totem support, native skill | Defines the build category |
| Payload scaling | Yes | Weapon, amulet, gems, passives, jewels | Must match the skill's tags |
| Deployment cadence | Yes | Throw speed, cast speed, placement speed, passives, support gems | Determines ramp and safety |
| Entity limit management | Strongly yes | Passives, supports, uniques, ascendancy | Max entities create burst/coverage thresholds |
| Activation reliability | Yes | Trigger radius, detonation tools, totem targeting, area/projectiles | The output must actually occur |
| Player defense | Yes | Rare gear, flasks, passives | Player often deploys while enemies are active |
| Cost sustain | Yes | Mana/life cost reduction, recovery, reservation planning | Setup spam can be expensive |
| Entity survival | Yes for totems, situational for traps/mines | Totem life/resist, placement, taunt, defensive layers | Totems need uptime; traps/mines need to live until activation |

## Replacement Matrix

| Change | Immediate Result | Hidden Cost | Expert Verdict |
| --- | --- | --- | --- |
| Add payload damage but lose trap/mine throw speed | Bigger hits | Slower setup and lower burst frequency | Often worse for mapping |
| Add maximum entity count without deployment speed | Higher theoretical burst | Player cannot fill the cap quickly | Good only with cadence support |
| Replace cost-fix ring with damage ring | Higher tooltip | Setup loop may stall during bossing | Dangerous |
| Drop movement speed for more damage | More payload | Player gets hit while setting up | Often bad in real content |
| Replace totem defense with pure damage | Higher per-totem output | Totems die before firing enough | Bad in hard content |
| Increase area without target discipline | Wider coverage | Single-target damage may spread or miss priority target | Content-dependent |
| Use generic player attack/spell damage | Looks useful | May not apply correctly to deployed entity or linked skill tags | Must verify ownership/tags |
| Add duration to mines/traps | More preload window | May not improve damage if activation is already reliable | Utility, not always DPS |

## Budget Progression Logic

### Campaign / Early Setup

Priority:

1. Get the deployed skill linked and functioning.
2. Make placement/throwing feel tolerable.
3. Cap player resistances and get movement speed.
4. Solve mana/cost pressure.
5. Add payload damage only after the loop feels playable.

Expert reading: clunky deployment kills the fantasy before damage numbers matter.

### Early Maps

Priority:

1. Improve main links and gem levels.
2. Add deployment speed and basic entity limit support.
3. Maintain player defenses.
4. Improve activation reliability and coverage.
5. Add correct damage multipliers.

Expert reading: early mapping upgrades should reduce wasted setup.

### Medium Budget

Priority:

1. Tune deployment cadence and entity limit together.
2. Add strong payload scaling: gem levels, crit, penetration/exposure, DOT or ailment scaling if relevant.
3. Compress cost, attributes, and resistances.
4. Improve movement and defensive uptime.
5. For totems, invest in totem survival and placement smoothness.

Expert reading: the build becomes strong when setup, payload, and safety line up.

### High Budget

Priority:

1. High payload compression on weapon/amulet/body/helmet.
2. Entity count and deployment cadence tuned to content.
3. Strong defensive compression so setup windows are safe.
4. Luxury jewels, implicits, and crafted mods that preserve cadence while adding payload.

Expert reading: high budget buys fewer wasted actions and stronger burst windows.

## Comparison Against Previous Studies

| Question | Toxic Rain | Righteous Fire | CoC | Spectre | Trap/Mine/Totem |
| --- | --- | --- | --- | --- | --- |
| Engine type | Overlap DOT | Self-upkeep DOT | Trigger breakpoint | Persistent external actors | Temporary deployed entities |
| First build gate | Pod overlap and chaos scaling | Survive self-burn | Hit + crit + cooldown | Minion level/count/survival | Deployment loop works |
| Stat trap | Wrong AoE | Damage before sustain | Too much APS | Player damage not applying to minions | Payload damage that slows setup |
| Hidden mandatory stat | AoE band | Max fire res / regen | Accuracy / CDR | Minion gem level | Throw/place speed and activation reliability |
| Bad novice replacement | High physical bow | Pure DPS removing sustain | DPS removing hit/crit/cost | Generic caster gear | Big damage item that ruins cadence/safety |
| High budget buys | DOT scaling compression | Sustain plus damage compression | Trigger precision | Army scaling plus commander freedom | Burst/cadence/safety compression |

## Build Design Lessons For Our Game

### 1. Deployed Output Needs A Setup Ledger

If a character deploys turrets, traps, mines, sigils, or temporary constructs, item scoring should estimate:

- time to deploy;
- maximum active entities;
- activation reliability;
- duration before expiry;
- damage per activation;
- wasted deployments;
- player risk during setup.

Without this ledger, the game will overrate slow high-damage items and underrate smooth cadence items.

### 2. Entity Limit Is A Breakpoint Stat

`+1 deployed entity` can be a major jump, but only when the player can keep that many entities active and useful.

For our system:

```text
+1 turret slot
```

should not be scored as a flat percent. It should ask:

```text
Can the build deploy the extra turret?
Will it live?
Will it find targets?
Does the fight last long enough?
```

### 3. Placement Speed Is A Feel Stat And A Damage Stat

Throw speed, placement speed, and cast speed change both output and safety. They are not only quality-of-life.

This is a good model for our affixes:

- faster summon placement;
- faster relic arming;
- shorter construct wind-up;
- quicker trap trigger;
- reduced setup lockout.

### 4. Deployed Entities Need Targeting Rules

Spectres raised the AI question; deployed entities make it sharper. A turret or totem can have great damage but poor target selection.

Our design should expose targeting identity:

- nearest target;
- lowest HP target;
- marked target;
- line target;
- area denial;
- boss priority;
- random spread.

Gear can then modify targeting rather than only damage.

### 5. Replacement Analysis Must Include Wasted Actions

For a deployed-entity build, before accepting a replacement:

```text
Does deployment speed change?
Does entity cap change?
Does activation reliability change?
Does the entity live long enough?
Does player safety during setup change?
Does the payload still scale by the right tags?
How many deployments are wasted?
```

This "wasted action" habit is the expert pattern unique to this category.

## Reusable Checklist Addendum

When studying a trap, mine, totem, turret, or temporary construct build, add these questions:

1. What action deploys the entity?
2. How long does deployment take?
3. How many entities can be active?
4. What makes the entity activate?
5. Can activation miss, delay, target poorly, or waste itself?
6. How long does the entity last?
7. Does the entity need survivability?
8. Which stats scale deployment, and which scale payload?
9. What player risk exists during setup?
10. Does high budget buy more entities, faster setup, stronger payload, safer setup, or less waste?

## Next Study Candidate

Study an ailment build next, such as Ignite, Poison, or Bleed.

Reason: the current studies cover geometry, self-upkeep, trigger rhythm, persistent external actors, and temporary deployed entities. Ailment builds add another key loot-game problem: one big application versus many applications, ailment duration, chance to inflict, enemy resistance, and damage-over-time stacking rules.
