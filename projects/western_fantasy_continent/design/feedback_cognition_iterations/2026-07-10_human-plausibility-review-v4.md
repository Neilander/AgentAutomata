# Human Plausibility Review V4

- Date: 2026-07-10
- Scope: V4 first-failure correction only
- Verdict: accept

## Evidence

V4's first failure is `r1_prison` at gear score 153 after clearing `r1_main_1` through `r1_main_3`. The player-facing knowledge at that point supports a power/equipment attribution: equipment drops are known, auto-equip upgrades are known, and the prison fight visibly contains shield/backline/healer pressure. Under the lock-key guidance, a first prison failure before a proven role-change jump should usually read as "power too low", not "I need a different role."

The recovery family is aligned with that attribution. The failure restores:

- `kill:normal_enemy`: `0 -> 0.4`
- `clear:main_level`: `0.7 -> 1`
- `loot:equipment`: `0.4 -> 0.8`
- `loot:rare_equipment`: `1 -> 1`
- `equip:power_upgrade`: `0.7 -> 1`
- `decision:farm_after_failure`: `1 -> 1`

The 40 percentage point recovery is not obviously too strong or too weak in this context. It revives exhausted normal-kill feedback just enough to make a gear/power route feel relevant again, but it does not reset history or create a full combat-feedback spike. In the next main fight, many repeated skill casts still grant zero or tiny feedback, and the post-failure `kill:normal_enemy` grant is only `0.52`, so habituation remains intact.

I do not see erroneous restoration of unrelated role/skill events. No `unlock:character`, `decision:change_team`, `verify:team_change`, `proof:role_contribution`, or unrelated skill-mastery family is restored by the prison failure. That is the key correction V4 needed.

The abandonment separation is human-plausible. The failure transition records `preAbandonEmotion: 投入`, `probability: 0.021`, `roll: 0.502`, `abandoned: false`; only after the continue decision does the model restore related event freshness. This matches the reference order: abandonment is checked from feedback at the failure moment, while recovery represents renewed motivation after deciding to keep playing.

The next action, `challenge:r1_main_4`, is natural. Given a power/equipment failure attribution and no new wake condition proving prison should be retried immediately, returning to the newly available main route for more gear is more human than repeating the same failed prison fight in place.

## Residual Validation Range

This acceptance is limited to the V4 short run through the first failure plus one next action. Remaining validation should cover additional seeds/profiles, later retries after larger power gains, and whether repeated failures still keep unrelated character/team events isolated.
