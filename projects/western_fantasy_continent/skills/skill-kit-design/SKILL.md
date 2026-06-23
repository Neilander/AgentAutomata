# Skill Kit Design Skill

Use this project skill when designing a new class kit, archetype kit, team preset, or generated skill package for Western Fantasy Continent.

This workflow must be used before implementing skills in `game_data/skill-data.js`.

## Goal

Design skills that produce a clear fantasy, a distinct combat role, and measurable combo behavior in the auto-battle system.

Do not start by writing cool isolated skills. Start by defining the player-facing experience and the output profile.

## Combat Frame

The current game is an auto-battler / idle combat prototype:

- Teams are usually 4 units.
- Each unit has 2 small skills, 1 passive, and 1 ultimate.
- Skills use cooldowns.
- Units have front/back positioning.
- Builds are evaluated by combo behavior, not isolated skill strength.
- Shared skill definitions live in `game_data/skill-data.js`.
- Combat analysis should use `game_data/combat-signals.js`.

## Step 1: Find Fantasy

Write the fantasy as an experience, not as mechanics.

Good examples:

- "A low-health berserker falls into danger, refuses to die, then attacks faster and drains back health."
- "A poison nest survives long enough for poison stacks to become an inevitability."
- "A crown carry receives resources from three allies and becomes the team's visible win condition."
- "A frost control team slows the enemy front line until ranged units dismantle the back line."

Bad examples:

- "Deals 30 damage and gains 5 haste."
- "Has a poison skill and a poison passive."
- "A strong damage class."

Output:

```text
Fantasy:
Payoff moment:
What the player should notice:
What should not happen:
```

## Step 2: Define Skill Volume

Decide how many skills the archetype needs before designing individual skills.

Use skill volume as a power and complexity budget:

- 3-5 skills: easy to form, lower ceiling, should work with fewer pieces.
- 6-8 skills: medium synergy, needs several slots but not a full lock-in.
- 9-12 skills: high ceiling, high commitment, should be harder to assemble.

Limits for a 4-unit team:

- Small skills in one archetype should not exceed 8.
- Passives plus ultimates in one archetype should not exceed 4.
- Core skill does not have to be an ultimate. It can be a passive or small skill.

Output:

```text
Skill volume:
Core skill type:
Required slots:
Optional slots:
Expected formation difficulty:
```

## Step 3: Positioning Analysis

Declare the archetype's combat position before writing skills.

Use the combat checklist from `design/combat_stats_design.md`.

Required fields:

```text
Primary output source:
  basic attack | skill direct damage | DOT | summon | counterattack | execute | burst window

Preferred buffs:
  attack speed | cooldown | final damage | DOT duration | crit | shield | healing | control | enemy debuff

Weak buffs:
  buffs that should be secondary or intentionally inefficient

Payoff condition:
  what signal data should prove when the archetype works
```

Rules:

- If the carry's primary output is basic attack, attack-speed buffs must matter.
- If the carry's primary output is DOT, attack speed should be secondary.
- If the payoff is survival, health curves must show stabilization or recovery.
- If the payoff is burst, signal data must show a distinct burst window.

## Step 4: Decompose Functions

Translate the fantasy into functions before naming skills.

Common functions:

- Setup: apply mark, poison, burn, shield, haste, vulnerability, control.
- Payoff: consume mark, extend DOT, detonate stacks, amplify basic attacks.
- Sustain: heal, shield, lifesteal, death prevention.
- Tempo: cooldown reduction, haste window, delayed ultimate, reset.
- Targeting: front-line pressure, back-line access, lowest-health execute.
- Risk: self-damage, low-health condition, delayed payoff, narrow targeting.

Each function should have a reason to exist.

Avoid overlap:

- Two skills may share a theme, but they should not create the same player-facing effect unless one is setup and the other is payoff.
- If two skills both "deal area damage", clarify why one is not redundant.

Output:

```text
Function list:
Setup:
Payoff:
Sustain:
Tempo:
Risk:
Overlap check:
```

## Step 5: Assign To Classes

Bind functions to class identity.

The same function should look different by class:

- Priest control immunity might be "holy shelter and cleanse."
- Warlock control immunity might be "pain pact that converts control into damage."
- Warrior protection might be "body-block and counterattack."
- Bard haste should feel like rhythm and timing, not raw steroid text.

Keep class distribution roughly healthy:

- Do not let one class own every important skill in an archetype unless the archetype is intentionally single-class.
- If the early design gives one class too many skills, reassign some functions to adjacent classes.
- A support skill must affect the carry's declared primary output.

Output:

```text
Class assignment table:
Class | Skill type | Function | Reason this class owns it
```

## Step 6: Write Skills

Each skill must include design metadata and runtime intent.

Required fields:

```text
key:
name:
class:
type: small | passive | ultimate
cooldown:
fantasy line:
function:
damage profile contribution:
preferred combo partners:
counterplay / weakness:
signal acceptance:
effect schema:
```

Effect schema should map toward `game_data/skill-data.js`.

Examples:

```js
{ kind: "hitTarget", flat: 24, power: 0.34, type: "physical", label: "猎标箭" }
{ kind: "poisonTarget", stacks: 4, time: 8 }
{ kind: "teamTimer", timer: "hasteTimer", duration: 5, label: "急板" }
{ kind: "berserkerRoar" }
```

If a needed effect kind does not exist, specify the new effect kind and its required API behavior.

## Step 7: Number Pass

Do a first conservative numeric pass.

Use current kit scale as reference:

- Small direct hits usually sit around `flat 14-34 + power 0.2-0.5`.
- Small DOT application usually applies 2-4 stacks for 6-8 seconds.
- Team haste windows usually last 5 seconds.
- Ultimates usually sit around 24-37 seconds cooldown.
- Defensive ultimates should be tested against burst teams and DOT teams separately.

Numbers should express role:

- Easy-form archetypes get lower ceiling.
- High-volume archetypes can have stronger payoff.
- Risky skills may have higher payoff only if the risk appears in signal data.

Output:

```text
Initial numbers:
Risk assumptions:
Expected strong matchups:
Expected weak matchups:
```

## Step 8: Signal Acceptance Tests

Define how to prove the kit works.

Use signals instead of only win rate.

Required checks:

- Damage attribution: basic vs skill vs DOT vs burst window.
- Support value: whether support tags amplify the carry's primary output.
- Health curve if sustain is part of the fantasy.
- Skill timing: whether the core skill fires before the fight is decided.
- Matchup spread: should create advantages and disadvantages, not all 55/45.

Example for basic-attack carry:

```js
signalBus.query(["basic", "damage"])
signalBus.query(["skill", "cast"])
signalBus.query(["heal"])
signalBus.query(["health", "snapshot"])
```

Acceptance output:

```text
Expected signal tags:
Minimum passing behavior:
Failure modes to watch:
```

## Step 9: Implement

When approved, update shared data first.

Implementation order:

1. Add or update skills in `game_data/skill-data.js`.
2. Add effect kinds to `createSkillLibrary(api)` if needed.
3. Ensure `genre_arena` and `team_simulator` still consume shared skills.
4. Add signal emission only in battle engine primitives, not inside every skill unless necessary.
5. Run syntax checks:

```sh
node --check projects/western_fantasy_continent/game_data/skill-data.js
node --check projects/western_fantasy_continent/game_data/combat-signals.js
node --check projects/western_fantasy_continent/genre_arena/genre-arena.js
node --check projects/western_fantasy_continent/team_simulator/team-simulator.js
```

## Step 10: Review

After implementation, run matchup tests and report:

```text
Fantasy:
Implemented skills:
Signal findings:
Strong matchups:
Weak matchups:
Problems:
Recommended next patch:
```

Do not call a kit complete if it only wins. It must win or lose in the way its fantasy claims.
