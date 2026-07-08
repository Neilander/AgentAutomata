---
name: field-effect-design
description: Design field effects and encounter-wide rules for Western Fantasy Continent. Use when proposing, reviewing, or refining dungeon field effects, global buffs, encounter modifiers, or battlefield rules, especially early-game effects meant to teach players to improve a team by changing only one or two roles.
---

# Field Effect Design

Use this project skill before balancing or implementing a field effect.

## Goal

Design field effects that create a clear player-facing experience:

```text
notice field rule -> make a small team adjustment -> fight again -> feel improvement
```

For early-game field effects, prefer rules that let the player keep the main damage plan and change one or two support/counter roles.

## God Rules

1. Focus on one or two effects.
   - A field effect should teach one main idea, sometimes two linked ideas.
   - Avoid attribute soup, broad stat bundles, and rules that secretly reward everything.

2. Minimize "A but B" design sentences.
   - Do not patch every balance worry into the rule text.
   - Awkward exception-heavy wording usually means the design is solving a tuning problem in the fantasy layer.

3. Design first, balance later.
   - First decide what the player should notice and what behavior the field should invite.
   - Do not add clumsy clauses just to fix expected numerical imbalance.
   - If a mechanism is experientially wrong, change the mechanism or description.
   - If a mechanism is experientially right but numerically wrong, keep the mechanism and tune values later.

4. Do not interfere with the primary experience to solve secondary balance.
   - The main field fantasy is the product promise.
   - Balance is a later parameter problem unless it changes what the player perceives.

5. For support-oriented field effects, reward support swaps.
   - A support-oriented field effect should mainly favor adding or replacing one or two support/counter roles.
   - The favored side should be one or two roles, not a whole output style.
   - The poor-benefit side should also be one or two roles or a concrete missing answer, not an entire damage plan.

6. Do not say an output style cannot pass.
   - Avoid designing a field effect whose lesson is "physical cannot pass", "ranged cannot pass", or "mage cannot pass".
   - The lesson should be "this team needs a closer", "this team needs control", "this team needs recovery", or another small adjustment.

7. Do not reward the mainstream while punishing an already weak option.
   - If the favored response is already the dominant team structure and the poor-benefit case is already weak, the field effect does not teach behavior.
   - Before using a poor-benefit example such as "four ranged", test or cite whether it is actually a weak baseline.
   - If it is already weak, do not use it as the main negative contrast for a support-oriented field effect.

8. Mix basic effects with visually obvious effects.
   - Basic effects teach small team adjustments with simple rules.
   - If many basic effects already exist, add visually obvious effects next.
   - A visually obvious effect should create a clear visual or combat signal the player can notice immediately, then think about how to exploit.
   - Do not treat visual obviousness as decoration. It is a gameplay signal.
   - It can be a battlefield zone, unit status, visible mark, shield, chain, countdown, transformation, charge behavior, or death/first-hit trigger.
   - Example: a poison swamp appears in the center of the battlefield. The real mechanical lesson may favor backline or kiting teams, but the player first sees the center becoming dangerous.
   - Example: units start with a visible one-use skill-damage shield. The real mechanical lesson may favor basic attacks or low-value skill probes, but the player first sees a shield that breaks.

Use this distinction:

```text
Basic effect:
  mostly understood through a short rule sentence, such as "enemy backline is dangerous until engaged".

Signal-visible effect:
  visible object, unit state, behavior, or timing signal first; strategic interpretation second.
```

9. Prefer symmetric field participation.
   - A field effect is usually better when it affects both enemies and the player, because the player can see and learn the same rule from both sides.
   - Use one-sided effects only when the encounter identity requires it.
   - If the effect is symmetric, still design the enemy composition so the player has a reason to adjust one or two roles.

10. Avoid vague targeting words.
   - Do not write "a certain unit", "some enemy", "random important target", or "the most dangerous effect".
   - Use concrete selectors: front row, back row, highest physical power, lowest HP, first unit hit, first skill cast, center zone, left/right lane.
   - If randomness is intended, state the exact random pool.

11. Remove fake flavor.
   - Visual words are allowed only when they help the player identify the rule.
   - "Golden shield" is acceptable if the shield is visibly a one-use skill-damage shield.
   - Do not add ornate descriptions that do not change recognition, targeting, timing, or player decision.
   - If a phrase cannot be translated into a readable combat signal or exact rule, delete it.

## Baseline Team Strength Tiers

Use these tiers when deciding whether a field effect is teaching a meaningful adjustment.

Do not use a weak or unplayable baseline as the main thing the field "punishes". That only proves the weak team is weak. A good support-oriented field effect should usually compare:

```text
same output core + wrong support/counter role
vs
same output core + better support/counter role
```

### Current Tested Reference

Against the normal 500-team waterline, the original 17 preset teams currently group roughly like this:

```text
Mainstream strong:
  fireBurst / 余烬爆燃: 426/500
    warrior + knight front line, double mage fire burst.
    Plays by spreading burn/ignite pressure and ending fights with a large spell burst.
  poisonBloom / 毒巢滚雪球: 426/500
    knight + assassin + warlock + priest.
    Plays by surviving the opening, stacking poison/status pressure, then detonating or snowballing accumulated poison value.
  frostControl / 霜控拖延: 384/500
    knight + priest + mage + alchemist.
    Plays by slowing and delaying enemy front-line contact so ranged/status damage has time to work.
  crownCarry / 王冠核心: 375/500
    knight + priest + bard + berserker.
    Plays by routing protection, healing, and tempo into one visible melee carry.
  alchemyChaos / 炼金异常: 368/500
    knight + double alchemist + mage.
    Plays by mixing burn/poison/status effects and cashing them into area damage.
  scarletVanguard / 赤血先锋: 358/500
    berserker + warrior + mage + bard.
    Plays through risky low-health front-line pressure while support and fire damage stabilize the fight.

Playable but lower or matchup-dependent:
  frostTrapField / 霜陷猎场: 330/500
    ranger + mage + knight + bard.
    Plays by combining traps, frost, and support tempo into a slow kill zone.
  shadowExecute / 暗影处决: 310/500
    knight + double assassin + warlock.
    Plays by creating a vulnerable target and repeatedly finishing the lowest-health enemy.
  lightningTempo / 急速节奏: 302/500
    warrior + double ranger + bard.
    Plays by building marks quickly and converting team haste into repeated focused shots.
  bloodRage / 低血狂怒: 272/500
    berserker + warrior + priest + bard.
    Plays by entering danger, surviving through support, and recovering through empowered basic attacks.
  four_ranged_double_ranger: 269/500
    ranger + ranger + mage + bard.
    Plays as a no-front-line ranged pressure team with mark/haste payoff; matchup-dependent, not a stable strong baseline.
  four_ranged_damage: 263/500
    ranger + mage + warlock + alchemist.
    Plays as pure ranged damage/status pressure; can beat some waterline teams but lacks reliable contact and defense.

Weak but still informative:
  cavalryBreak / 王骑破阵: 222/500
    knight + warrior + berserker + priest.
    Plays by using knight charge/disruption to open a melee attack window.
  ironWall / 铁壁反击: 219/500
    knight + warrior + priest + bard.
    Plays by inviting melee pressure into shields and converting blocked damage into counterattacks.
  purgeAttrition / 净化消耗: 219/500
    knight + priest + warlock + alchemist.
    Plays by surviving status pressure and converting a long fight through poison/carry support.
  holySustain / 圣盾续航: 213/500
    knight + warrior + double priest.
    Plays by absorbing repeated pressure until healing and shields stabilize the team.
  duelChampion / 决斗冠军: 210/500
    warrior + knight + priest + bard.
    Plays by naming one enemy and winning through repeated single-target duel pressure.
  bulwarkMarks / 壁垒猎标: 191/500
    knight + double ranger + bard.
    Plays by holding melee pressure behind a wall while rangers build and cash out marks.
  martyrFrontline / 殉道前线: 191/500
    priest + warrior + warlock + ranger.
    Plays by making priest a temporary front-line bastion while allies grind the fight out.

Do not use as negative contrast without a special reason:
  four_ranged_control: 145/500
    ranger + mage + alchemist + bard.
    Attempts no-front-line ranged control; currently too fragile/low-payoff to be a fair negative contrast.
  four_ranged_support: 80/500
    ranger + mage + priest + bard.
    Attempts no-front-line ranged support; currently below the playable floor and should not be used as the main punished example.
```

Interpretation:

- A 250-330/500 team is not automatically bad. It may be playable but biased or low-mid power.
- A 180-230/500 team is weak enough that a field effect should be careful using it as the losing example.
- Below roughly 160/500, treat it as currently unplayable or close to unplayable for baseline teaching.
- "Four ranged" is not one baseline. Four-ranged damage can be low-mid playable; four-ranged control/support can be unplayable.

When designing a support-oriented field effect, prefer testing against teams in the playable range, then show that one or two role swaps improve them. Avoid saying the field is good because it beats a team already below the playable floor.

## Design Workflow

### 1. State The Player Problem

Write what the player sees before thinking about numbers.

```text
Enemy/field signal:
Player's likely first mistake:
Desired small adjustment:
```

Good:

```text
Enemy archers hurt the backline early.
The player tries to add more frontliners.
The intended adjustment is adding one diver or fast closer.
```

### 2. Define The Field Rule

Write one clean rule. Prefer direct cause and visible result.

Good:

```text
Enemy backline units deal more damage until they are hit by melee.
```

Weak:

```text
Enemy backline units deal more damage, but melee units also gain resistance, but only if the player has fewer than two ranged units.
```

### 3. Define Who Benefits

List role changes, not full rebuilds.

```text
Keep stable:
Swap in:
Swap out:
Best beneficiaries:
Poor beneficiaries:
```

For support-oriented effects, `Best beneficiaries` and `Poor beneficiaries` should usually name one or two roles or missing counter-functions. Avoid naming a whole output archetype as invalid.

### 4. Define The Success Signal

Describe what should be visible in combat.

```text
The player should notice:
The adjusted team should:
The unadjusted team should:
```

For visually obvious effects, also state:

```text
Visible battlefield object:
Spatial behavior:
What the player should try:
```

### 5. Separate Experience From Balance

Before changing the rule, classify any problem:

```text
If unclear to the player: rewrite the signal, name, or description.
If too weak/strong: tune numbers, not the core rule.
If too universal: narrow who the rule affects or what team response it invites.
If too narrow: broaden the response path without adding exceptions.
```

## Output Format

Use this format for proposals:

```text
Name:
Core focus:
Field rule:
Player adjustment:
Benefits:
Does not benefit:
Visible success:
Balance note:
```

Keep balance notes short. They should identify the tuning axis, not overload the rule text.

## Advantage Team Validation

After implementing a field effect, identify advantage teams by comparing the same candidate teams with and without the field effect against the same waterline.

Required method:

```text
1. Build several candidate teams:
   - expected advantage teams;
   - nearby teams that almost use the answer;
   - ordinary baseline teams;
   - at least one team that should not benefit much.

2. For each team, run waterline without the field.

3. Run the same waterline with the field.

4. Record:
   - base win rate;
   - field win rate;
   - absolute uplift;
   - relative uplift;
   - score/rank movement;
   - visible reason the field helped.
```

Interpretation:

- High base and high field score means the team is strong, but not necessarily taught by the field.
- Low base to medium field score can be a good sign if the field intentionally teaches a role swap.
- A field is suspicious if every team rises similarly.
- A field is also suspicious if only an already unplayable team rises from terrible to merely bad.
- Prefer advantage teams where the field changes the outcome because of the intended visible signal.

Use this judgment sentence:

```text
This field favors [role/function] because teams with [specific swap] gained [absolute uplift] and [relative uplift], while nearby teams missing [role/function] did not.
```

Also run one-role swap validation inside the same field.

This answers a different question:

```text
If the player understands this field and changes one role, does the team improve while still fighting under the same field rule?
```

Required method:

```text
1. Choose a normal or weak-but-playable standard team.
2. Build a one-role replacement that keeps the same main plan but adds the field's intended answer.
3. Run the original team against the waterline with the field enabled.
4. Run the one-role replacement against the same waterline with the same field enabled.
5. Record before field win rate, after field win rate, absolute lift, relative lift, and flipped wins/losses.
```

Interpretation:

- This is stronger teaching evidence than only comparing field vs no-field.
- A good early field should often produce a clear one-role swap lift.
- If a field only rewards a completely different team, it may be a build puzzle rather than a small adjustment lesson.
- If the swap loses heavily, either the intended answer is wrong, the numbers are wrong, or the baseline team was not a fair starting point.
