# Equipment Rarity / Level Thresholds vs Super Waterline

Generated at: 2026-07-02T13:41:54.656Z

## Method

- Presets: fireBurst, bloodRage, ironWall, shadowExecute, poisonBloom, holySustain
- Sample waterline: 48/120
- Candidates per unit slot: 4
- Equipment slots: 8 per unit (`weapon`, `helm`, `chest`, `gloves`, `legs`, `boots`, `ring`, `charm`), so a 4-unit team wears 32 items when fully equipped.
- Full clear: all six representative presets win every sampled super-waterline match
- Levels scanned: 250, 230, 210, 190, 170, 150, 130, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20

## Audit Correction

The earlier "level 150 mythic can clear" statement is correct under the original 48-team sampled sanity check:

- Mythic Lv.150 uses full equipment: 8 slots per unit, 32 items per 4-unit team, 12 affixes per item.
- With the sampled 48-team waterline, Mythic Lv.150 scores `48/48` on all six representative presets.
- With the stricter all-120-team waterline, Mythic Lv.150 is not a clean `120/120`; repeated same-style checks landed around `116-120/120` depending on generated affix rolls.

So the difference is not missing equipment. The difference is threshold definition: sampled clear vs strict all-120 clear.

## Threshold Summary

| Rarity | Affix lines | Sample full-clear level | Sample near-clear level | Best sampled score |
| --- | ---: | ---: | ---: | --- |
| 普通 `common` | 1 | - | - | 0.91/0.833 @ Lv.250 |
| 稀有 `rare` | 2 | - | 250 | 0.965/0.938 @ Lv.250 |
| 史诗 `epic` | 4 | 250 | 210 | 1/1 @ Lv.250 |
| 传说 `legendary` | 7 | 230 | 170 | 1/1 @ Lv.250 |
| 神话 `mythic` | 12 | 150 | 130 | 1/1 @ Lv.250 |

## Sample Matrix

### 普通

| Level | Full clear | Avg score | Min team score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | no | 0.91 | 0.833 | 暗影处决 40/48 |
| 230 | no | 0.84 | 0.771 | 剧毒滚雪球 37/48 |
| 210 | no | 0.778 | 0.667 | 圣光续航 32/48 |
| 190 | no | 0.705 | 0.563 | 剧毒滚雪球 27/48 |
| 170 | no | 0.607 | 0.5 | 铁壁反击 24/48 |
| 150 | no | 0.542 | 0.458 | 剧毒滚雪球 22/48 |
| 130 | no | 0.41 | 0.313 | 铁壁反击 15/48 |
| 110 | no | 0.274 | 0.208 | 圣光续航 10/48 |
| 100 | no | 0.243 | 0.146 | 铁壁反击 7/48 |
| 90 | no | 0.177 | 0.146 | 铁壁反击 7/48 |
| 80 | no | 0.16 | 0.125 | 圣光续航 6/48 |
| 70 | no | 0.146 | 0.125 | 铁壁反击 6/48 |
| 60 | no | 0.139 | 0.125 | 铁壁反击 6/48 |
| 50 | no | 0.129 | 0.125 | 火焰爆燃 6/48 |
| 40 | no | 0.125 | 0.125 | 火焰爆燃 6/48 |
| 30 | no | 0.125 | 0.125 | 火焰爆燃 6/48 |
| 20 | no | 0.125 | 0.125 | 火焰爆燃 6/48 |

### 稀有

| Level | Full clear | Avg score | Min team score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | no | 0.965 | 0.938 | 铁壁反击 45/48 |
| 230 | no | 0.927 | 0.875 | 剧毒滚雪球 42/48 |
| 210 | no | 0.889 | 0.813 | 暗影处决 39/48 |
| 190 | no | 0.816 | 0.688 | 铁壁反击 33/48 |
| 170 | no | 0.698 | 0.646 | 圣光续航 31/48 |
| 150 | no | 0.632 | 0.521 | 铁壁反击 25/48 |
| 130 | no | 0.496 | 0.354 | 圣光续航 17/48 |
| 110 | no | 0.326 | 0.25 | 铁壁反击 12/48 |
| 100 | no | 0.292 | 0.208 | 铁壁反击 10/48 |
| 90 | no | 0.257 | 0.167 | 铁壁反击 8/48 |
| 80 | no | 0.177 | 0.125 | 铁壁反击 6/48 |
| 70 | no | 0.167 | 0.146 | 铁壁反击 7/48 |
| 60 | no | 0.146 | 0.125 | 铁壁反击 6/48 |
| 50 | no | 0.136 | 0.125 | 铁壁反击 6/48 |
| 40 | no | 0.132 | 0.125 | 铁壁反击 6/48 |
| 30 | no | 0.129 | 0.125 | 火焰爆燃 6/48 |
| 20 | no | 0.125 | 0.125 | 火焰爆燃 6/48 |

### 史诗

| Level | Full clear | Avg score | Min team score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 230 | no | 0.997 | 0.979 | 暗影处决 47/48 |
| 210 | no | 0.979 | 0.958 | 铁壁反击 46/48 |
| 190 | no | 0.945 | 0.896 | 暗影处决 43/48 |
| 170 | no | 0.875 | 0.813 | 铁壁反击 39/48 |
| 150 | no | 0.809 | 0.667 | 铁壁反击 32/48 |
| 130 | no | 0.677 | 0.563 | 铁壁反击 27/48 |
| 110 | no | 0.601 | 0.5 | 火焰爆燃 24/48 |
| 100 | no | 0.479 | 0.375 | 暗影处决 18/48 |
| 90 | no | 0.354 | 0.229 | 铁壁反击 11/48 |
| 80 | no | 0.33 | 0.229 | 铁壁反击 11/48 |
| 70 | no | 0.226 | 0.146 | 铁壁反击 7/48 |
| 60 | no | 0.163 | 0.146 | 低血狂暴 7/48 |
| 50 | no | 0.163 | 0.146 | 铁壁反击 7/48 |
| 40 | no | 0.136 | 0.125 | 铁壁反击 6/48 |
| 30 | no | 0.136 | 0.125 | 铁壁反击 6/48 |
| 20 | no | 0.125 | 0.125 | 火焰爆燃 6/48 |

### 传说

| Level | Full clear | Avg score | Min team score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 230 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 210 | no | 0.997 | 0.979 | 暗影处决 47/48 |
| 190 | no | 0.99 | 0.958 | 暗影处决 46/48 |
| 170 | no | 0.986 | 0.958 | 暗影处决 46/48 |
| 150 | no | 0.948 | 0.833 | 暗影处决 40/48 |
| 130 | no | 0.878 | 0.792 | 暗影处决 38/48 |
| 110 | no | 0.74 | 0.563 | 暗影处决 27/48 |
| 100 | no | 0.695 | 0.542 | 暗影处决 26/48 |
| 90 | no | 0.639 | 0.542 | 暗影处决 26/48 |
| 80 | no | 0.591 | 0.5 | 暗影处决 24/48 |
| 70 | no | 0.41 | 0.313 | 铁壁反击 15/48 |
| 60 | no | 0.358 | 0.271 | 暗影处决 13/48 |
| 50 | no | 0.219 | 0.146 | 圣光续航 7/48 |
| 40 | no | 0.171 | 0.146 | 铁壁反击 7/48 |
| 30 | no | 0.149 | 0.125 | 铁壁反击 6/48 |
| 20 | no | 0.136 | 0.125 | 铁壁反击 6/48 |

### 神话

| Level | Full clear | Avg score | Min team score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 230 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 210 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 190 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 170 | no | 0.997 | 0.979 | 暗影处决 47/48 |
| 150 | yes | 1 | 1 | 火焰爆燃 48/48 |
| 130 | no | 0.993 | 0.979 | 低血狂暴 47/48 |
| 110 | no | 0.937 | 0.833 | 暗影处决 40/48 |
| 100 | no | 0.885 | 0.729 | 暗影处决 35/48 |
| 90 | no | 0.841 | 0.667 | 暗影处决 32/48 |
| 80 | no | 0.792 | 0.667 | 暗影处决 32/48 |
| 70 | no | 0.691 | 0.5 | 暗影处决 24/48 |
| 60 | no | 0.594 | 0.458 | 暗影处决 22/48 |
| 50 | no | 0.413 | 0.292 | 暗影处决 14/48 |
| 40 | no | 0.333 | 0.229 | 暗影处决 11/48 |
| 30 | no | 0.247 | 0.188 | 铁壁反击 9/48 |
| 20 | no | 0.17 | 0.146 | 铁壁反击 7/48 |

## Full Waterline Verification

Extra targeted full-waterline checks after the sampled scan:

| Rarity | Level | Full clear | Avg score | Min score | Weakest team |
| --- | ---: | --- | ---: | ---: | --- |
| 普通 | 350 | no | 0.992 | 0.983 | 剧毒滚雪球 118/120 |
| 普通 | 300 | no | 0.942 | 0.825 | 铁壁反击 99/120 |
| 普通 | 250 | no | 0.824 | 0.742 | 剧毒滚雪球 89/120 |
| 稀有 | 350 | no | 0.999 | 0.992 | 剧毒滚雪球 119/120 |
| 稀有 | 300 | no | 0.989 | 0.983 | 铁壁反击 118/120 |
| 稀有 | 250 | no | 0.912 | 0.85 | 剧毒滚雪球 102/120 |
| 史诗 | 350 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 史诗 | 330 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 史诗 | 310 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 史诗 | 290 | no | 0.999 | 0.992 | 低血狂暴 119/120 |
| 史诗 | 270 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 史诗 | 250 | no | 0.994 | 0.983 | 暗影处决 118/120 |
| 传说 | 270 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 传说 | 250 | no | 0.999 | 0.992 | 低血狂暴 119/120 |
| 传说 | 230 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 传说 | 210 | no | 0.997 | 0.983 | 暗影处决 118/120 |
| 神话 | 230 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 神话 | 210 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 神话 | 190 | no | 0.999 | 0.992 | 暗影处决 119/120 |
| 神话 | 170 | no | 0.997 | 0.992 | 暗影处决 119/120 |
| 神话 | 150 | no | 0.987 | 0.967 | 暗影处决 116/120 |

Interpretation:

- Strict full-waterline clear is much harsher than the 48-sample scan.
- Common and rare gear do not strict-clear even at Lv.350, though they are very close at the top end.
- Epic gear strict-clears around the high 200s / low 300s, but individual generated sets can be noisy.
- Legendary strict-clears around Lv.230 in this seed.
- Mythic strict-clears around Lv.210 in full verification, even though Lv.150 cleared the 48-sample scan.
- The recurring weak point at high gear is usually one of `暗影处决`, `低血狂暴`, or `剧毒滚雪球`, depending on generated affix rolls.

### 史诗

The following per-rarity full verification blocks were emitted by the first scan batch and are kept for reproducibility. Use the targeted full-waterline table above as the main threshold read, because it covers the extra high-level probes requested after the sampled scan.

| Level | Full clear | Avg score | Min score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 270 | no | 0.99 | 0.975 | 剧毒滚雪球 117/120 |
| 250 | no | 0.989 | 0.967 | 低血狂暴 116/120 |
| 230 | no | 0.971 | 0.917 | 暗影处决 110/120 |

### 传说

| Level | Full clear | Avg score | Min score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 250 | yes | 1 | 1 | 火焰爆燃 120/120 |
| 230 | no | 0.997 | 0.992 | 暗影处决 119/120 |
| 210 | no | 0.996 | 0.992 | 低血狂暴 119/120 |

### 神话

| Level | Full clear | Avg score | Min score | Weakest team |
| ---: | --- | ---: | ---: | --- |
| 170 | no | 0.999 | 0.992 | 暗影处决 119/120 |
| 150 | no | 0.992 | 0.975 | 暗影处决 117/120 |
| 130 | no | 0.965 | 0.917 | 暗影处决 110/120 |

## Notes

- This scan bypasses progression drops and directly equips fixed-rarity, fixed-level gear.
- Each unit auto-equips the best of several generated candidates per slot using role-aware scoring.
- Sample clear means all 6 presets beat all sampled super-waterline teams.
- Full verification reruns threshold levels against the full super-waterline database.
