# PoE Build Study: Spectre Summoner

Date: 2026-07-06

## Purpose

This note studies Spectre Summoner as the fourth Path of Exile build-engine sample.

Previous samples:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold engine.
- Righteous Fire Chieftain: self-upkeep / maximum fire resistance / regeneration engine.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate trigger breakpoint engine.

Spectre Summoner adds a new pattern: externalized damage ownership. The player is not mainly scaling their own hit or DOT. The player is scaling summoned entities that have their own base stats, skills, AI behavior, survivability, and uptime.

References:

- PoE Wiki, Raise Spectre: https://www.poewiki.net/wiki/Raise_Spectre
- PoE Wiki, Minion: https://www.poewiki.net/wiki/Minion
- PoE Vault, Spectre Summoner Gear, Jewels and Flasks: https://www.poe-vault.com/guides/the-spectre-summoner-gear-jewels-flasks
- PoE Vault, Spectre Summoner Gear Progression: https://www.poe-vault.com/guides/ghazzy-tv-spectre-summoner-necromancer-gear-progression

## One Sentence Build Core

Spectre Summoner is a minion build where the player's gear, passives, gems, auras, and support setup amplify summoned monsters, so the real engine is minion level, minion count, minion damage scaling, minion survivability, and AI / target uptime.

The important design lesson: the build's output owner is not the player. A player item can look weak for the player but be excellent because it grants minion skill level, minion damage, minion cast speed, extra spectres, or minion survivability.

## Core Engine

| Layer | What It Does | Why It Matters |
| --- | --- | --- |
| Raise Spectre gem | Summons defeated monsters as minions | Defines the external damage owners |
| Spectre choice | Determines base skill, AI, range, damage type, and behavior | The summoned monster is part of the build, not cosmetic flavor |
| Minion gem level | Raises spectre stats and can affect spectre count thresholds | `+minion skill gems` is a core scaling line |
| Spectre count | Adds more independent damage actors | Extra spectres are often a large breakpoint |
| Minion damage / cast speed | Scales the spectres' output | Player spell/attack damage usually does not apply |
| Auras and curses | Buff minions or debuff enemies | The player often acts as a commander/support chassis |
| Minion survivability | Keeps spectres alive through hard content | Dead minions mean lost damage and lost tempo |
| Convocation / positioning | Moves or protects minions | Uptime depends on AI and positioning, not only DPS |
| Player defense | Keeps the summoner alive while minions deal damage | The player can be low-output but cannot be dead |

## The Non-Obvious Core: Damage Ownership Is Externalized

PoE minions are separate entities. They do not automatically inherit the player's generic offensive stats unless a modifier explicitly says it applies to minions or allies.

Design translation:

- A stat can be useless to the player but core to the build.
- Gear evaluation must know who owns the output.
- "My character damage" and "my team's damage" are different ledgers.

For our own system, this matters for companions, summoned units, mercenaries, pets, and temporary constructs. If a relic creates an external actor, item scoring must ask:

```text
Does this item scale the owner, the summoned actor, both, or neither?
```

## Slot Responsibilities

| Slot | Primary Job | Flexible Or Core? | Replacement Effect |
| --- | --- | --- | --- |
| Weapon / Convoking Wand | `+minion skill gems`, minion damage, minion cast speed, trigger craft | Core minion scaler | Generic spell weapon can be nearly worthless |
| Shield | `+minion skill gems`, life, resistances, defenses | Core-plus-tax slot | Losing gem levels can drop minion stats/count breakpoints |
| Helmet | Minion gem levels, life, resists, socketed minion support | High-value hybrid | Often becomes a pseudo-link or gem-level slot |
| Body armour | Main links, defenses, sometimes minion/support mechanics | Core socket/defense slot | Losing links can lower all minion output |
| Gloves | Minion damage, utility, life/resists | Hybrid support slot | Often flexible, but can carry important utility |
| Boots | Movement speed, life/resists, minion movement/survival utility | Feel/safety slot | Bad boots slow the summoner and minion repositioning |
| Amulet | Gem levels, minion modifiers, attributes, reservation | High-value scaler | Losing gem level or attributes can break setup |
| Rings | Minion damage, life/resists, attributes, curse/support | Tax/support slot | Often needed to pay player taxes while minions scale elsewhere |
| Belt | Life, resists, abyss jewels, minion utility | Tax/compression slot | High-end belt can carry multiple minion jewels |
| Flasks | Player defense, speed, utility | Player survival layer | Usually does not directly make minions stronger unless build-specific |
| Jewels | Minion damage, minion cast/attack speed, minion taunt/blind, player life | Precision tuning | Tiny lines can matter because they affect many minions |

## What Is Truly Mandatory?

| Function | Must Exist? | Can Move To Another Slot? | Notes |
| --- | --- | --- | --- |
| Summoned damage actors | Yes | Spectres or another minion package | Without minions, it is not this build |
| Minion-specific scaling | Yes | Weapon, shield, helmet, amulet, jewels, passives | Player generic damage does not solve the problem |
| Gem level scaling | Strongly yes | Weapon, shield, helmet, amulet, body/supports | Often controls both stats and thresholds |
| Spectre count / uptime | Strongly yes | Gem level, gear, passives, ascendancy | More actors can be a discrete power jump |
| Minion survivability | Yes | Gem level, support gems, passives, auras, jewels | Dead spectres delete output |
| Player resist/life defense | Yes | Rare gear and tree | The summoner must survive while commanding |
| AI / positioning tools | Strongly desired | Convocation, feeding frenzy/aggression tools, movement | Bad AI turns theoretical DPS into downtime |
| Reservation/aura setup | Strongly desired | Helmet, amulet, tree, jewels | Auras scale the army rather than only the player |

## Replacement Matrix

| Change | Immediate Result | Hidden Cost | Expert Verdict |
| --- | --- | --- | --- |
| Replace `+minion skill gems` wand with high spell damage wand | Player sheet may look better | Spectres lose levels, damage, life, and possible thresholds | Usually terrible |
| Lose `+minion skill gems` shield | More personal defense maybe | Minion level/count breakpoint may drop | Dangerous unless compensated |
| Replace minion jewel with player damage jewel | Player gains damage | Minions gain nothing; total build output falls | Common novice mistake |
| Drop minion life/resistance support | More minion DPS on paper | Spectres die in hard content; uptime collapses | Bad for progression |
| Change spectre type without changing supports | New monster looks exciting | Damage tags, AI, and support compatibility may mismatch | Requires full engine review |
| Remove Convocation/positioning tool | Frees socket | Minions lag, split, die, or stop hitting priority targets | Real DPS and safety loss |
| Add aura reservation without enough mana/life reservation plan | More theoretical buffs | Core skill or defensive aura may become unavailable | Needs reservation math |
| Replace rare tax ring with unique minion ring | More minion fantasy | Resistances/attributes may break elsewhere | Good only if taxes are covered |

## Budget Progression Logic

### Campaign / Early Setup

Priority:

1. Keep minions alive.
2. Use supports that match the spectre's actual damage and behavior.
3. Cap player resistances and get enough life.
4. Add minion damage only after the minions survive long enough to deal it.
5. Learn whether the chosen spectre clears, bosses, or supports.

Expert reading: the first question is "what is my summoned unit actually doing?"

### Early Maps

Priority:

1. Raise gem levels and minion levels.
2. Improve spectre count if a threshold is reachable.
3. Add minion damage/cast speed and useful auras.
4. Keep player resistances, life, and movement online.
5. Add positioning / aggression / convocation support.

Expert reading: the build starts feeling real when minions survive and stay on target.

### Medium Budget

Priority:

1. Upgrade wand/shield/helmet/amulet into minion level and minion damage slots.
2. Add jewels that affect many minions at once.
3. Improve aura and curse packages.
4. Patch minion survivability for bosses and dangerous map mods.
5. Compress player taxes into fewer rare slots.

Expert reading: the summoner becomes stronger by making the army both smarter and harder to kill.

### High Budget

Priority:

1. High gem-level stacking.
2. Extra spectre or minion count breakpoints.
3. Minion damage/cast speed compression on rare items.
4. Defensive and aura reservation compression.
5. Specialized spectre choice and support optimization.

Expert reading: high budget buys both minion ceiling and commander freedom.

## Comparison Against Previous Studies

| Question | Toxic Rain Pathfinder | Righteous Fire Chieftain | Cast on Critical Strike | Spectre Summoner |
| --- | --- | --- | --- | --- |
| Engine type | Overlap DOT | Self-upkeep DOT | Trigger breakpoint | Externalized minion ownership |
| First build gate | Pod overlap and chaos scaling | Survive self-burn | Hit + crit + cooldown alignment | Minion level/count/survival |
| Stat trap | Wrong AoE or high physical bow | Damage before sustain | Attack speed past cooldown cap | Player damage that does not affect minions |
| Hidden mandatory stat | AoE band | Max fire res / regeneration | Accuracy / CDR | Minion gem level / minion survivability |
| Bad novice replacement | High physical DPS bow | Pure DPS item removing sustain | Pure damage item removing hit/crit/cost | Generic spell gear replacing minion gear |
| What high budget buys | Better DOT scaling and threshold compression | Sustain compression plus DOT damage | Trigger precision and payload scaling | Army scaling, uptime, and commander tax compression |

## Build Design Lessons For Our Game

### 1. Track Output Ownership Explicitly

Summoner builds prove that "damage" is not one bucket.

Our systems should distinguish:

- player-owned output;
- pet/minion-owned output;
- ally/team output;
- aura-enabled output;
- triggered external output.

If an item says `+20% damage`, the game must know whose damage it affects.

### 2. External Actors Need Their Own Scaling Surfaces

Minions need more than a generic damage multiplier. They need:

- level or base stat scaling;
- count scaling;
- AI / aggression behavior;
- movement / target uptime;
- survivability;
- aura/cursor/commander support.

This gives summoner gear a distinct identity instead of making it a reskinned caster.

### 3. Count Breakpoints Are Different From Percent Upgrades

An extra spectre can be a discrete jump, not a smooth percent increase.

For our system, companion count should be treated carefully:

```text
+1 construct can be stronger than +20% construct damage,
but it also increases screen pressure, target selection, and balance risk.
```

### 4. Commander Tax Is Good Design

The summoner must still solve personal defenses while scaling minions. That tension is healthy:

- minion gear wants minion levels/damage;
- player gear wants life/resists/movement;
- aura gear wants reservation;
- content wants minion survival.

This creates real gear choices.

### 5. Replacement Analysis Must Ask Who Lost Power

For Spectre Summoner, before accepting a replacement:

```text
Did the player gain power?
Did the spectres lose gem level?
Did spectre count change?
Did minion survival change?
Did AI / positioning / aggression change?
Did auras or curses change?
Did player defenses still pass the content tax?
```

That "who lost power?" question is the expert habit unique to externalized builds.

## Reusable Checklist Addendum

When studying a minion or companion build, add these questions:

1. Who owns the output: player, minion, ally, trap, totem, or trigger?
2. Which player stats do not apply to the external actor?
3. Which stats explicitly scale the external actor?
4. Are there count breakpoints?
5. Does the external actor survive the content?
6. Does AI/positioning reduce real uptime?
7. Are auras/curses scaling the army or the player?
8. Which item replacement helps the commander but hurts the army?
9. Which high-budget item compresses commander taxes and minion scaling together?

## Next Study Candidate

Study a trap, mine, or totem build next.

Reason: minions externalize damage into persistent allies. Traps/mines/totems externalize damage into temporary deployed entities, adding arming time, placement, detonation, activation limit, and target uptime as separate equipment concerns.
