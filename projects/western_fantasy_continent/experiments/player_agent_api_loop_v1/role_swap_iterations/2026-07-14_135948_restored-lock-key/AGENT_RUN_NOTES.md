# Restored Ranger Lock-Key Player Run

## Verdict

PASS. A knowledge-bounded player completed the intended causal chain without an automatic hero swap or an invented reward action:

```text
see Prison and Ranger reward
-> fail Prison
-> continue through Main 4-5
-> clear Camp
-> equip the visible Prison key gear
-> clear Prison
-> rescue Ranger to roster
-> manually replace Mage with Ranger
-> equip the reserved Ranger bow
-> clear Main 6
-> validate Ranger against Main 7's durable single target
```

## Key Evidence

- Cycle 11: first Prison attempt lost. Emotion `43.0681 -> 41.6200`.
- Cycle 15: ordinary Main 4 equipment did not erase the lock. Prison lost again at higher generic power. Emotion `42.5627 -> 41.2510`.
- Cycle 17: Camp first clear exposed and granted the visible anti-shield/anti-armor key package. Emotion `42.3561 -> 44.6715`.
- Cycles 18-19: the player explicitly equipped the Camp axe and gloves. Equipped power changed through player actions, not through loot receipt.
- Cycle 20: the same active team returned to Prison and won; Ranger entered the roster but did not auto-swap. Emotion `44.7087 -> 50.1772`.
- Cycle 21: the player manually replaced Mage with Ranger. Equipped power remained `419`, proving the team decision is independent from equipment growth.
- Cycle 22: the player equipped the reserved Ranger bow. Equipped power `419 -> 545`.
- Cycle 23: the Ranger team cleared Main 6 with all four units alive. This proves normal route compatibility, not yet the role lesson.
- Cycle 24: Main 7 was cleared with one survivor. Ranger dealt `628.839` damage, `57.24%` of team damage, ranked first, and delivered the kill. Warrior dealt `34.14%`.

Final emotion was `51.7430`; the minimum was the initial `38.0000`. The largest automatic drop was the first Prison failure at `-1.4481`.

## Interpretation

The design now teaches acquisition and use as separate player decisions. Camp is a key source for Prison, Prison is the source of Ranger, and Main 7 is the role proof. Main 4-5 remain traversable without either branch, so the branches create useful friction without granting mainline permission.

The second pre-Camp Prison retry is informative but slightly costly: generic power rose by about 36.6%, yet the player still failed. Keep it for now because it differentiates ordinary growth from the visible Camp key. Revisit only if repeated player runs show this extra failure consistently damages motivation.

## Integrity

- All combat, loot, equipment power, concepts, canonical knowledge, PQRA, and emotion were computed by repository code.
- Decision and attribution responses selected legal actions and cited exact visible event IDs.
- No formal class base values or production skill assets were changed.
- `session.json`, all request/response pairs, and `summary.json` are retained in this directory.
