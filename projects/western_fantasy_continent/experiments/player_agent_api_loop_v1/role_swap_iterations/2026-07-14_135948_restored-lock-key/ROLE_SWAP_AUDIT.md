# Role Swap Iteration Audit

- Phase: `decision`
- Completed cycles: 24
- Final team: hero_warrior, militia_barricade, hero_ranger, militia_herb
- Information boundary: PASS
- Emotion: 38 -> 51.743; min 38; largest automatic drop -1.4481

## Unlocks

- Cycle 4: hero_mage
- Cycle 20: hero_ranger

## Team Changes

- Cycle 6: `swap:2:hero_mage` - A new complete Mage hero is visible in reserve. | The active Spear Militia is described as an incomplete slow single-target unit, while the Mage is a complete clearing and burst hero. | Testing the stronger complete hero can improve the squad before Main 3.
- Cycle 21: `swap:2:hero_ranger` - The newly rescued Ranger is a complete hero described as sustaining focus and accumulating marks on one target. | Replacing the burst-oriented Mage tests a distinct output role while preserving the Warrior, frontline militia, and healer. | The Ranger must be manually selected before its promised role can be verified.

## Combat Proofs

- Cycle 8: hero_mage at r1_main_3, win, contribution {"observed":true,"damage":331.39000000000004,"heal":0,"shield":0,"skillCount":4}
- Cycle 23: hero_ranger at r1_main_6, win, contribution {"observed":true,"damage":806.4979000000001,"heal":0,"shield":0,"skillCount":9}

## Emotion Trajectory

| Cycle | Action | Outcome | Before | After decision | After events | Automatic delta |
|---:|---|---|---:|---:|---:|---:|
| 1 | `challenge:r1_main_1` | win | 38 | 38 | 38.5749 | 0.5749 |
| 2 | `equip:hero_warrior:r1_main_1_1_0` | equipped | 38.5749 | 38.5749 | 38.5735 | -0.0014 |
| 3 | `equip:militia_herb:r1_main_1_1_1` | equipped | 38.5735 | 38.5735 | 38.5721 | -0.0014 |
| 4 | `challenge:r1_main_2` | win | 38.5721 | 38.5721 | 42.086 | 3.5139 |
| 5 | `equip:militia_herb:r1_main_2_1_0` | equipped | 42.086 | 42.126 | 42.1246 | -0.0014 |
| 6 | `swap:2:hero_mage` | team_changed | 42.1246 | 42.1646 | 42.1646 | 0 |
| 7 | `equip:hero_warrior:r1_main_2_1_1` | equipped | 42.1646 | 42.1646 | 42.1632 | -0.0014 |
| 8 | `challenge:r1_main_3` | win | 42.1632 | 42.1632 | 43.0309 | 0.8677 |
| 9 | `equip:militia_barricade:r1_main_3_1_0` | equipped | 43.0309 | 43.0709 | 43.0695 | -0.0014 |
| 10 | `equip:hero_warrior:r1_main_3_1_1` | equipped | 43.0695 | 43.0695 | 43.0681 | -0.0014 |
| 11 | `challenge:r1_prison` | loss | 43.0681 | 43.0681 | 41.62 | -1.4481 |
| 12 | `challenge:r1_main_4` | win | 41.62 | 41.62 | 42.5655 | 0.9455 |
| 13 | `equip:hero_warrior:r1_main_4_1_0` | equipped | 42.5655 | 42.5655 | 42.5641 | -0.0014 |
| 14 | `equip:militia_barricade:r1_main_4_1_1` | equipped | 42.5641 | 42.5641 | 42.5627 | -0.0014 |
| 15 | `challenge:r1_prison` | loss | 42.5627 | 42.5627 | 41.251 | -1.3117 |
| 16 | `challenge:r1_main_5` | win | 41.251 | 41.251 | 42.3561 | 1.1051 |
| 17 | `challenge:r1_bandit` | win | 42.3561 | 42.3961 | 44.6715 | 2.2754 |
| 18 | `equip:hero_warrior:r1_bandit_key_1_weapon` | equipped | 44.6715 | 44.7115 | 44.7101 | -0.0014 |
| 19 | `equip:hero_warrior:r1_bandit_key_1_gloves` | equipped | 44.7101 | 44.7101 | 44.7087 | -0.0014 |
| 20 | `challenge:r1_prison` | win | 44.7087 | 44.7087 | 50.1772 | 5.4685 |
| 21 | `swap:2:hero_ranger` | team_changed | 50.1772 | 50.2172 | 50.2172 | 0 |
| 22 | `equip:hero_ranger:r1_bandit_key_1_ranger_weapon` | equipped | 50.2172 | 50.2172 | 50.2158 | -0.0014 |
| 23 | `challenge:r1_main_6` | win | 50.2158 | 50.2158 | 51.0748 | 0.859 |
| 24 | `challenge:r1_main_7` | win | 51.0748 | 51.0748 | 51.743 | 0.6682 |
