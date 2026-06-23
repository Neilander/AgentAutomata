# Low-Health Berserk Balance Skill

Use this project skill when evaluating or tuning a low-health berserker archetype, or any team fantasy where a carry should become stronger after entering danger.

## Goal

Validate that the archetype feels like low-health frenzy, not accidental survival or a normal carry with red VFX.

The expected curve is:

1. The berserker takes meaningful damage and enters a low-health band.
2. After entering low health, HP should stabilize, oscillate, or recover instead of immediately reaching zero.
3. Attack cadence should visibly increase or remain meaningfully high during the low-health window.
4. Damage attribution should show the intended source: basic attacks and basic-attack windows, not unrelated teammate cleanup.

## Required Signals

Use `game_data/combat-signals.js` signal data whenever possible.

Minimum queries:

```js
signalBus.query(["health", "snapshot"])
signalBus.query(["basic", "damage"])
signalBus.query(["skill", "cast"])
signalBus.query(["heal"])
signalBus.query(["damage"])
signalBus.summary()
```

Useful tags:

- Source: `basic`, `skill`, `ultimate`, `dot`, `passive`
- Result: `damage`, `heal`, `shield`, `status`, `health`
- Damage/status: `physical`, `poison`, `burn`, `fire`, `shadow`, `dotStack`
- Mechanic: `attack`, `area`, `splash`, `lifeSteal`, `cast`, `snapshot`

## Step 1: Define Metrics

Before changing numbers, define target metrics for the exact fantasy.

For low-health berserk, track:

- `firstLowTime`: first time berserker HP ratio is below 45%.
- `lowMin`: lowest HP ratio after entering low health.
- `recoveryAfterLow`: max HP ratio after `lowMin` minus `lowMin`.
- `berserkerAlive`: whether the berserker survives the fight.
- `apsBeforeLow`: basic-damage signal count per second before `firstLowTime`.
- `apsAfterLow`: basic-damage signal count per second after `firstLowTime`.
- `apsRatio`: `apsAfterLow / apsBeforeLow`.
- `selfHealAfterLow`: healing received by berserker after low-health entry.
- `basicWindowDamageShare`: share of berserker damage from `basic` plus window metadata.

Default acceptance targets:

- The berserker should enter low health in at least some medium/hard matchups.
- If it enters low health, it should not usually die within the next 1 second.
- `recoveryAfterLow` should usually be at least `0.08`.
- `apsRatio` should usually be at least `1.2`, unless the fight ends immediately.
- Wins where the berserker dies early should not count as successful low-health fantasy.

## Step 2: Run Matchup Data

Run the archetype against multiple preset enemies, not just one favorable matchup.

Recommended baseline:

- `bloodRage` vs `poisonBloom`
- `bloodRage` vs `fireBurst`
- `bloodRage` vs `crownCarry`
- `bloodRage` vs `ironWall`
- `bloodRage` vs `lightningTempo`
- `bloodRage` vs `frostControl`
- `bloodRage` vs `holySustain`
- `bloodRage` vs `shadowExecute`
- `bloodRage` vs `alchemyChaos`

For each run, record:

- result and fight duration
- berserker survival
- health curve
- attack cadence before and after low health
- healing and shielding received
- ultimate timing
- top damage sources by tag

## Step 3: Identify Failure Mode

Classify the problem before adjusting numbers.

Common failure modes:

- `dies_before_window`: berserker reaches zero before defensive or lifesteal mechanics activate.
- `no_low_health_entry`: sustain or shield keeps HP too high, so the fantasy never starts.
- `no_attack_speed_payoff`: low health increases damage but not attack cadence.
- `teammates_carry`: the team wins, but berserker dies or contributes little after low health.
- `window_too_late`: ultimate or support timing happens after the fight is mostly decided.
- `over_sustain`: HP stays high and stable, removing danger.
- `binary_swing`: one tweak changes the curve from instant death to never threatened.

## Step 4: Build Hypotheses

For each failure, propose one small testable reason.

Examples:

- If the berserker dies immediately after low health, test whether survival timing is too late.
- If attack cadence does not rise, test low-health attack-speed scaling.
- If healing is high but still fails, test burst protection instead of more healing.
- If sustain prevents low health, reduce passive sustain or delay support.

## Step 5: Run Argument Groups

Run focused variants. Change one factor at a time, then test small combinations.

Example variants:

- Earlier ultimate: `undyingRoar` initial cooldown `20s -> 8s or 10s`.
- Low-health haste: attack cooldown scales with missing HP.
- Lifesteal boost: increase `rageEngine` lifesteal by 25-40%.
- HP/armor boost: small survivability adjustment.
- Priest support boost: healing or shield power increase.
- Combined conservative patch: earlier ultimate + small low-health haste + small lifesteal boost.

Compare each variant to the target curve:

- Does the first low-health dip still happen?
- Does the unit avoid immediate death?
- Does HP oscillate or recover?
- Does attack cadence rise?
- Does the fight become too safe?

## Step 6: Choose Patch

Prefer layered small changes over one large number spike.

Recommended decision order:

1. Fix timing if core windows do not occur.
2. Add cadence if the fantasy lacks frenzy.
3. Add sustain only enough to create oscillation.
4. Avoid making the berserker permanently safe above low health.

For the current `bloodRage` findings, the likely first patch is:

```text
undyingRoar initial cooldown: 20s -> 8-10s
rageEngine low-health attack speed: missingHp * 0.6-0.8
rageEngine lifesteal: +25-40% from current value
```

Re-test after patch with the same matchup set.

## Output Format

When reporting, include:

```text
Fantasy:
Metric targets:
Baseline findings:
Failure mode:
Hypothesis tests:
Recommended patch:
Residual risk:
Next test:
```

Keep recommendations grounded in signal tags and health curves, not only win rate.
