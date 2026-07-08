# Runtime Field Effect Advantage Validation

- Generated: 2026-07-08T10:07:17.400Z
- Waterline used: 500/500
- Method: For every candidate team, run the same waterline without the field and then with the field. Also run one-role swap tests where both before and after teams use the same field effect.

## 哨塔压制 (sentry_suppression)

- Focus: 敌方后排在被近战贴住前更危险
- Expected: 刺客、冲锋骑士、能快速接触后排的队伍
- Judgment: 哨塔压制 currently favors four_ranged_damage: 53.4% -> 64.8% (+11.4% abs, +21.4% rel); nearby fireBurst: 83.8% -> 92.8%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| four_ranged_damage | 53.4% | 64.8% | +11.4% | +21.4% | 80 | 23 |
| fireBurst | 83.8% | 92.8% | +9% | +10.7% | 57 | 12 |
| cavalryBreak | 45.4% | 54% | +8.6% | +18.9% | 56 | 13 |
| frostTrapField | 64.4% | 69.2% | +4.8% | +7.5% | 53 | 29 |
| shadowExecute | 64.4% | 64.8% | +0.4% | +0.6% | 51 | 49 |
| frontline_contact | 48.6% | 47% | -1.6% | -3.3% | 42 | 50 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| fire_add_assassin | 92.8% | 72.2% | -20.6% | -22.2% | 2 | 105 | same fire front, replace one caster with a backline engager |
| ranged_add_knight | 64.8% | 77% | +12.2% | +18.8% | 97 | 36 | ranged damage core, add contact pressure |

## 重盾阵线 (heavy_shield_line)

- Focus: 前排开局获得明显护盾
- Expected: 破盾、集火、持续输出队伍
- Judgment: 重盾阵线 currently favors lightningTempo: 61.6% -> 75.4% (+13.8% abs, +22.4% rel); nearby shieldbreaker_mix: 43.8% -> 54%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| lightningTempo | 61.6% | 75.4% | +13.8% | +22.4% | 86 | 17 |
| shieldbreaker_mix | 43.8% | 54% | +10.2% | +23.3% | 77 | 26 |
| cavalryBreak | 45.4% | 41.8% | -3.6% | -7.9% | 26 | 44 |
| fireBurst | 83.8% | 76.8% | -7% | -8.3% | 20 | 55 |
| duelChampion | 43.2% | 28.6% | -14.6% | -33.8% | 17 | 90 |
| holySustain | 42.8% | 24% | -18.8% | -43.9% | 11 | 105 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| sustain_add_ranger | 17.2% | 50.4% | +33.2% | +193% | 167 | 1 | drop one healer for shield-breaking ranged pressure |
| duel_add_ranger | 25.6% | 37.2% | +11.6% | +45.3% | 83 | 25 | turn duel support into front shield pressure |

## 高压回廊 (pressure_corridor)

- Focus: 开局周期性压低全场血量
- Expected: 治疗、护盾、低血收益队伍
- Judgment: 高压回廊 currently favors holySustain: 42.8% -> 47.2% (+4.4% abs, +10.3% rel); nearby crownCarry: 75% -> 79.2%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| holySustain | 42.8% | 47.2% | +4.4% | +10.3% | 46 | 24 |
| crownCarry | 75% | 79.2% | +4.2% | +5.6% | 47 | 26 |
| fireBurst | 83.8% | 88% | +4.2% | +5% | 42 | 21 |
| scarletVanguard | 70.4% | 74% | +3.6% | +5.1% | 45 | 27 |
| bloodRage | 55% | 54.4% | -0.6% | -1.1% | 51 | 54 |
| double_priest_berserker | 59.2% | 57.8% | -1.4% | -2.4% | 51 | 58 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| rage_add_priest | 49.4% | 54.4% | +5% | +10.1% | 75 | 50 | replace burst with recovery under opening pressure |
| frontline_add_priest | 43.4% | 25% | -18.4% | -42.4% | 20 | 112 | keep frontline plan, replace burst with recovery |

## 迟滞泥地 (delay_mud)

- Focus: 近战接敌变慢，控制更容易创造窗口
- Expected: 冰控、陷阱、远程持续输出队伍
- Judgment: 迟滞泥地 currently favors four_ranged_damage: 53.4% -> 74% (+20.6% abs, +38.6% rel); nearby frostTrapField: 64.4% -> 77.4%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| four_ranged_damage | 53.4% | 74% | +20.6% | +38.6% | 104 | 1 |
| frostTrapField | 64.4% | 77.4% | +13% | +20.2% | 83 | 18 |
| control_backline | 32% | 38.2% | +6.2% | +19.4% | 54 | 23 |
| bulwarkMarks | 39.2% | 42% | +2.8% | +7.1% | 42 | 28 |
| frostControl | 77.8% | 80.2% | +2.4% | +3.1% | 40 | 28 |
| crownCarry | 75% | 74% | -1% | -1.3% | 26 | 31 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| melee_add_mage | 39.4% | 62.8% | +23.4% | +59.4% | 149 | 32 | keep one front, replace one melee with control |
| marks_add_mage | 74.6% | 70% | -4.6% | -6.2% | 32 | 55 | replace one mark slot with control |

## 战鼓回声 (war_drum_echo)

- Focus: 连续普攻叠节奏
- Expected: 游侠、狂战、吟游加速普攻队伍
- Judgment: 战鼓回声 currently favors basic_attack_core: 54.4% -> 70.4% (+16% abs, +29.4% rel); nearby lightningTempo: 61.6% -> 73%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| basic_attack_core | 54.4% | 70.4% | +16% | +29.4% | 88 | 8 |
| lightningTempo | 61.6% | 73% | +11.4% | +18.5% | 75 | 18 |
| bulwarkMarks | 39.2% | 48.6% | +9.4% | +24% | 81 | 34 |
| crownCarry | 75% | 80.4% | +5.4% | +7.2% | 56 | 29 |
| fireBurst | 83.8% | 83.4% | -0.4% | -0.5% | 26 | 28 |
| bloodRage | 55% | 54.6% | -0.4% | -0.7% | 46 | 48 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| marks_add_bard | 64% | 82.6% | +18.6% | +29.1% | 116 | 23 | replace passive recovery with attack rhythm |
| rage_add_bard | 53.8% | 54.6% | +0.8% | +1.5% | 51 | 47 | add attack rhythm to low-HP melee core |

## 血月升起 (blood_moon_rise)

- Focus: 15 秒时低血单位获得短暂爆发窗口
- Expected: 低血狂战、能保低血核心的队伍
- Judgment: 血月升起 currently favors crownCarry: 75% -> 88.8% (+13.8% abs, +18.4% rel); nearby low_hp_core: 79.2% -> 79.8%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| crownCarry | 75% | 88.8% | +13.8% | +18.4% | 78 | 9 |
| low_hp_core | 79.2% | 79.8% | +0.6% | +0.8% | 26 | 23 |
| bloodRage | 55% | 54.6% | -0.4% | -0.7% | 13 | 15 |
| holySustain | 42.8% | 41% | -1.8% | -4.2% | 22 | 31 |
| scarletVanguard | 70.4% | 66% | -4.4% | -6.2% | 13 | 35 |
| shadowExecute | 64.4% | 56.2% | -8.2% | -12.7% | 15 | 56 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| rage_add_berserker | 29% | 79.8% | +50.8% | +175.2% | 256 | 2 | replace stable fighter with low-HP carry |
| scarlet_add_priest | 48.4% | 54.6% | +6.2% | +12.8% | 84 | 53 | protect the blood moon target |

## 王旗落地 (king_flag)

- Focus: 前排守旗，阵亡后全队反扑
- Expected: 强前排、殉道、反打队伍
- Judgment: 王旗落地 currently favors flag_guard_mix: 52.8% -> 67.6% (+14.8% abs, +28% rel); nearby ironWall: 42.6% -> 53.2%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| flag_guard_mix | 52.8% | 67.6% | +14.8% | +28% | 93 | 19 |
| ironWall | 42.6% | 53.2% | +10.6% | +24.9% | 80 | 27 |
| martyrFrontline | 37% | 45.2% | +8.2% | +22.2% | 71 | 30 |
| crownCarry | 75% | 80.4% | +5.4% | +7.2% | 47 | 20 |
| fireBurst | 83.8% | 86.6% | +2.8% | +3.3% | 39 | 25 |
| cavalryBreak | 45.4% | 46.6% | +1.2% | +2.6% | 50 | 44 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| attrition_add_knight | 42.2% | 75.6% | +33.4% | +79.2% | 177 | 10 | add a real guard to trigger flag protection |
| guard_add_knight | 47.2% | 67.6% | +20.4% | +43.2% | 130 | 28 | replace fighter with a dedicated flag guard |

## 镜像诅咒 (mirror_curse)

- Focus: 最高攻击单位输出时会反噬自己
- Expected: 多核、治疗、护盾、非单核爆发队伍
- Judgment: 镜像诅咒 currently favors fireBurst: 83.8% -> 89.8% (+6% abs, +7.2% rel); nearby multi_core_safe: 54.4% -> 60%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fireBurst | 83.8% | 89.8% | +6% | +7.2% | 47 | 17 |
| multi_core_safe | 54.4% | 60% | +5.6% | +10.3% | 74 | 46 |
| holySustain | 42.8% | 44.6% | +1.8% | +4.2% | 60 | 51 |
| shadowExecute | 64.4% | 64.2% | -0.2% | -0.3% | 53 | 54 |
| crownCarry | 75% | 72.6% | -2.4% | -3.2% | 44 | 56 |
| alchemyChaos | 75.4% | 71.6% | -3.8% | -5% | 40 | 59 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| single_carry_add_second_core | 65% | 80.8% | +15.8% | +24.3% | 96 | 17 | add second damage core under mirror reflection |
| execute_add_mage | 62.2% | 70.2% | +8% | +12.9% | 73 | 33 | replace one assassin with a second non-reflected damage core |

## 猎场鸣哨 (hunting_whistle)

- Focus: 后排低血目标周期性被猎杀标记
- Expected: 刺客、游侠、后排收割队伍
- Judgment: 猎场鸣哨 currently favors bulwarkMarks: 39.2% -> 52.2% (+13% abs, +33.2% rel); nearby lightningTempo: 61.6% -> 72%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| bulwarkMarks | 39.2% | 52.2% | +13% | +33.2% | 72 | 7 |
| lightningTempo | 61.6% | 72% | +10.4% | +16.9% | 63 | 11 |
| hunt_backline | 44.2% | 52% | +7.8% | +17.7% | 48 | 9 |
| frostTrapField | 64.4% | 69.4% | +5% | +7.8% | 35 | 10 |
| shadowExecute | 64.4% | 65.8% | +1.4% | +2.2% | 23 | 16 |
| crownCarry | 75% | 75% | +0% | +0% | 12 | 12 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| marks_add_assassin | 70.8% | 52% | -18.8% | -26.5% | 41 | 135 | replace a caster with a diver to cash in the whistle mark |
| tempo_add_ranger | 55.4% | 72% | +16.6% | +30% | 95 | 12 | double down on marked backline pressure |

## 余火传染 (ember_contagion)

- Focus: 首个阵亡单位留下会传染的火种
- Expected: 治疗、控场、拖时间、火毒异常队伍
- Judgment: 余火传染 currently favors holySustain: 42.8% -> 53.6% (+10.8% abs, +25.2% rel); nearby frostControl: 77.8% -> 86.6%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| holySustain | 42.8% | 53.6% | +10.8% | +25.2% | 72 | 18 |
| frostControl | 77.8% | 86.6% | +8.8% | +11.3% | 62 | 18 |
| alchemyChaos | 75.4% | 82.8% | +7.4% | +9.8% | 53 | 16 |
| fireBurst | 83.8% | 90.6% | +6.8% | +8.1% | 44 | 10 |
| ember_sustain | 52% | 57.4% | +5.4% | +10.4% | 57 | 30 |
| poisonBloom | 83.6% | 87.4% | +3.8% | +4.6% | 30 | 11 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| status_add_priest | 74.8% | 52.4% | -22.4% | -29.9% | 31 | 143 | replace burst caster with sustain to hold ember tempo |
| frost_add_alchemist | 34.8% | 52% | +17.2% | +49.4% | 101 | 15 | add status pressure around ember transfer |

## Death Inheritance (death_inheritance)

- Focus: Dead units pass part of their stats to the nearest living ally
- Expected: martyr front line, sacrifice frontliners, protect-one-carry teams
- Judgment: Death Inheritance currently favors holySustain: 42.8% -> 51% (+8.2% abs, +19.2% rel); nearby martyrFrontline: 37% -> 42.6%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| holySustain | 42.8% | 51% | +8.2% | +19.2% | 70 | 29 |
| martyrFrontline | 37% | 42.6% | +5.6% | +15.1% | 75 | 47 |
| inherit_carry | 61.2% | 66.8% | +5.6% | +9.2% | 79 | 51 |
| crownCarry | 75% | 76.8% | +1.8% | +2.4% | 67 | 58 |
| ironWall | 42.6% | 40.2% | -2.4% | -5.6% | 45 | 57 |
| fireBurst | 83.8% | 59.2% | -24.6% | -29.4% | 7 | 130 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| add_sacrifice_front | 52.4% | 68.4% | +16% | +30.5% | 107 | 27 | keep the guard and add a frontliner whose death feeds nearby allies |
| carry_near_martyr | 27.4% | 25.2% | -2.2% | -8% | 34 | 45 | replace burst with a martyr-style support near the carry line |

## Shield Detonation (shield_detonation)

- Focus: Overshielded units explode, consume their shield, and damage nearby enemies
- Expected: knight, priest, shield stacking, defensive front-line teams
- Judgment: Shield Detonation currently favors shield_bomb: 43.6% -> 65.4% (+21.8% abs, +50% rel); nearby ironWall: 42.6% -> 54.6%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| shield_bomb | 43.6% | 65.4% | +21.8% | +50% | 136 | 27 |
| ironWall | 42.6% | 54.6% | +12% | +28.2% | 79 | 19 |
| kingFlagMix | 14.4% | 23.8% | +9.4% | +65.3% | 57 | 10 |
| holySustain | 42.8% | 52.2% | +9.4% | +22% | 101 | 54 |
| fireBurst | 83.8% | 92.4% | +8.6% | +10.3% | 53 | 10 |
| crownCarry | 75% | 76.8% | +1.8% | +2.4% | 49 | 40 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| add_second_priest | 25.6% | 42.4% | +16.8% | +65.6% | 98 | 14 | add more shield/heal generation to trigger detonations |
| add_knight_bomb | 16.2% | 35% | +18.8% | +116.1% | 99 | 5 | replace fighter with a shield anchor |

## Wildfire Rings (wildfire_rings)

- Focus: Backline units carry expanding fire rings that burn everyone inside
- Expected: fire/status teams, control teams, sustain teams, backline spacing puzzles
- Judgment: Wildfire Rings currently favors wildfire_backline_assassin: 52.4% -> 82.6% (+30.2% abs, +57.6% rel); nearby holySustain: 42.8% -> 61.6%.

| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| wildfire_backline_assassin | 52.4% | 82.6% | +30.2% | +57.6% | 162 | 11 |
| holySustain | 42.8% | 61.6% | +18.8% | +43.9% | 119 | 25 |
| alchemyChaos | 75.4% | 91.4% | +16% | +21.2% | 89 | 9 |
| wildfire_control | 36.6% | 51.8% | +15.2% | +41.5% | 128 | 52 |
| frostControl | 77.8% | 92.4% | +14.6% | +18.8% | 85 | 12 |
| wildfire_assassin_delivery | 76% | 89.4% | +13.4% | +17.6% | 74 | 7 |
| fireBurst | 83.8% | 96.4% | +12.6% | +15% | 63 | 0 |
| four_ranged_damage | 53.4% | 48.6% | -4.8% | -9% | 41 | 65 |

### One-Role Swap Tests In This Field

| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| add_control_to_fire | 96.4% | 85.4% | -11% | -11.4% | 0 | 55 | replace one fire caster with control/status to hold enemies in the rings |
| add_sustain_to_ranged | 48.6% | 26.6% | -22% | -45.3% | 20 | 130 | add sustain so the backline survives its own rings |
| add_backline_assassin_delivery | 78.2% | 89.4% | +11.2% | +14.3% | 75 | 19 | replace one backline caster with a backline assassin who carries the fire ring into enemies |

