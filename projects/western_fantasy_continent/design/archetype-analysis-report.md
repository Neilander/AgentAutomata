# Archetype Analysis Report

Generated from `game_data/skill_assets/**/*.json`.

This is an asset-level check. It verifies that each preset contains the mechanics its design says it needs; combat signal simulation is still required for numeric balance.

## Matrix

| Preset | Status | Roles | Unique Skills | Main Tags | Missing Intent Tags | Counter Tags Present |
| --- | --- | --- | ---: | --- | --- | --- |
| `alchemyChaos` 炼金异常 | passes intent | knight, alchemist, alchemist, mage | 13 | damage(7), area(5), statusPayoff(4), burn(3), shield(3), sustain(3) | - | burst |
| `bloodRage` 低血狂怒 | passes intent | berserker, warrior, priest, bard | 16 | support(5), sustain(4), damage(3), selfWindow(3), teamWindow(3), area(2) | - | - |
| `crownCarry` 王冠核心 | passes intent | knight, priest, bard, berserker | 16 | sustain(6), shield(4), support(4), team(4), selfWindow(3), teamWindow(3) | - | - |
| `fireBurst` 余烬爆燃 | passes intent | warrior, knight, mage, mage | 12 | damage(6), area(4), burn(3), shield(3), sustain(3), team(3) | - | shield |
| `frostControl` 霜控拖延 | passes intent | knight, priest, mage, alchemist | 16 | damage(6), sustain(6), shield(5), area(4), team(4), burn(2) | - | burst |
| `holySustain` 圣盾续航 | passes intent | knight, warrior, priest, priest | 13 | sustain(7), shield(6), team(5), damage(3), heal(3), support(3) | - | - |
| `ironWall` 铁壁反击 | passes intent | knight, warrior, priest, bard | 16 | support(6), sustain(6), shield(5), damage(4), team(4), teamWindow(4) | - | - |
| `lightningTempo` 急速节奏 | passes intent | warrior, ranger, bard, ranger | 12 | damage(6), support(4), area(3), teamWindow(3), power(2), singleTarget(2) | - | control |
| `poisonBloom` 毒巢滚雪球 | passes intent | knight, assassin, warlock, priest | 16 | damage(6), sustain(6), shield(5), poison(4), team(4), dot(3) | - | burst, execute |
| `shadowExecute` 暗影处决 | passes intent | knight, assassin, assassin, warlock | 12 | damage(5), poison(3), shield(3), sustain(3), team(3), dot(2) | - | shield |

## Details

### `alchemyChaos` 炼金异常

- Fantasy: 毒火混合，靠异常层数放大
- Design contract: Mix poison and burn, then cash accumulated statuses into area damage.
- Primary output: statusPayoff
- Expected tags: poison, burn, statusPayoff, area
- Watch tags: execute, burst
- Skill mix: 小技能 6, 被动 3, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `miasmaFlask` 沼雾瓶 | 小技能 | 炼金师 | poison, dot, area, status, damage |
| `volatileBottle` 爆裂瓶 | 小技能 | 炼金师 | damage, statusPayoff |
| `catalyst` 催化剂 | 被动 | 炼金师 | none |
| `chainReaction` 连锁反应 | 大招 | 炼金师 | damage, area, statusPayoff |
| `grandMixture` 终极混剂 | 大招 | 炼金师 | damage, area, statusPayoff |
| `fireball` 余烬火球 | 小技能 | 法师 | damage, singleTarget, burn, dot, status |
| `emberSpread` 烈焰扩散 | 小技能 | 法师 | damage, burn, area, statusPayoff |
| `kindlingEcho` 火种共鸣 | 被动 | 法师 | none |
| `meteorRain` 流星火雨 | 大招 | 法师 | damage, burn, area, burst |

### `bloodRage` 低血狂怒

- Fantasy: 低血爆发和吸血翻盘
- Design contract: Fall into danger, refuse death, then recover through empowered basic attacks.
- Primary output: basicAttack
- Expected tags: basicWindow, haste, sustain, deathPrevent
- Watch tags: execute, burst
- Skill mix: 小技能 8, 被动 4, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `bloodStrike` 血怒斩 | 小技能 | 狂战士 | selfWindow |
| `boneWhirl` 裂骨旋风 | 小技能 | 狂战士 | selfWindow |
| `rageEngine` 血怒引擎 | 被动 | 狂战士 | none |
| `undyingRoar` 不死战吼 | 大招 | 狂战士 | sustain, haste, basicWindow, deathPrevent |
| `powerStrike` 重击 | 小技能 | 战士 | selfWindow, damage, singleTarget |
| `cleave` 顺劈 | 小技能 | 战士 | damage, area |
| `lineBreaker` 破阵步 | 被动 | 战士 | none |
| `warBanner` 战旗冲锋 | 大招 | 战士 | support, teamWindow, damage, area |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `bloodCharm` 净血护符 | 小技能 | 牧师 | shield, sustain, support |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |
| `tempoSong` 急板战歌 | 小技能 | 吟游诗人 | support, teamWindow |
| `courageChord` 勇气和弦 | 小技能 | 吟游诗人 | support, power, carry |
| `encore` 返场 | 被动 | 吟游诗人 | none |
| `crescendo` 终章强音 | 大招 | 吟游诗人 | support, haste, power, teamWindow |

### `crownCarry` 王冠核心

- Fantasy: 全队资源养一个狂战/游侠核心
- Design contract: Three allies funnel protection and tempo into one visible carry.
- Primary output: basicAttack
- Expected tags: support, carry, basicWindow, haste
- Watch tags: execute
- Skill mix: 小技能 8, 被动 4, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `crownBloodCharm` 王冠护符 | 小技能 | 牧师 | unknown:shieldCarryAlly, unknown:carryTimer |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |
| `tempoSong` 急板战歌 | 小技能 | 吟游诗人 | support, teamWindow |
| `courageChord` 勇气和弦 | 小技能 | 吟游诗人 | support, power, carry |
| `encore` 返场 | 被动 | 吟游诗人 | none |
| `crescendo` 终章强音 | 大招 | 吟游诗人 | support, haste, power, teamWindow |
| `bloodStrike` 血怒斩 | 小技能 | 狂战士 | selfWindow |
| `boneWhirl` 裂骨旋风 | 小技能 | 狂战士 | selfWindow |
| `rageEngine` 血怒引擎 | 被动 | 狂战士 | none |
| `undyingRoar` 不死战吼 | 大招 | 狂战士 | sustain, haste, basicWindow, deathPrevent |

### `fireBurst` 余烬爆燃

- Fantasy: 点燃扩散，流星收尾，优开脆皮
- Design contract: Ignite the team, spread fire, then end the fight with a meteor burst.
- Primary output: burst
- Expected tags: burn, area, burst
- Watch tags: shield, heal
- Skill mix: 小技能 6, 被动 3, 大招 3
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `powerStrike` 重击 | 小技能 | 战士 | selfWindow, damage, singleTarget |
| `cleave` 顺劈 | 小技能 | 战士 | damage, area |
| `lineBreaker` 破阵步 | 被动 | 战士 | none |
| `warBanner` 战旗冲锋 | 大招 | 战士 | support, teamWindow, damage, area |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `fireball` 余烬火球 | 小技能 | 法师 | damage, singleTarget, burn, dot, status |
| `emberSpread` 烈焰扩散 | 小技能 | 法师 | damage, burn, area, statusPayoff |
| `kindlingEcho` 火种共鸣 | 被动 | 法师 | none |
| `meteorRain` 流星火雨 | 大招 | 法师 | damage, burn, area, burst |

### `frostControl` 霜控拖延

- Fantasy: 减速控场，克制近战
- Design contract: Slow the enemy front line so ranged damage gains extra time to work.
- Primary output: control
- Expected tags: control, slow, statusPayoff
- Watch tags: backline, burst
- Skill mix: 小技能 8, 被动 4, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `bloodCharm` 净血护符 | 小技能 | 牧师 | shield, sustain, support |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |
| `frostNova` 霜环 | 小技能 | 法师 | control, slow, damage, area |
| `fireball` 余烬火球 | 小技能 | 法师 | damage, singleTarget, burn, dot, status |
| `kindlingEcho` 火种共鸣 | 被动 | 法师 | none |
| `meteorRain` 流星火雨 | 大招 | 法师 | damage, burn, area, burst |
| `volatileBottle` 爆裂瓶 | 小技能 | 炼金师 | damage, statusPayoff |
| `miasmaFlask` 沼雾瓶 | 小技能 | 炼金师 | poison, dot, area, status, damage |
| `catalyst` 催化剂 | 被动 | 炼金师 | none |
| `grandMixture` 终极混剂 | 大招 | 炼金师 | damage, area, statusPayoff |

### `holySustain` 圣盾续航

- Fantasy: 治疗护盾密度高，消耗取胜
- Design contract: Absorb repeated pressure until healing and shields stabilize the whole team.
- Primary output: sustain
- Expected tags: heal, shield, sustain
- Watch tags: poison, dotPayoff
- Skill mix: 小技能 6, 被动 3, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `powerStrike` 重击 | 小技能 | 战士 | selfWindow, damage, singleTarget |
| `cleave` 顺劈 | 小技能 | 战士 | damage, area |
| `lineBreaker` 破阵步 | 被动 | 战士 | none |
| `warBanner` 战旗冲锋 | 大招 | 战士 | support, teamWindow, damage, area |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `bloodCharm` 净血护符 | 小技能 | 牧师 | shield, sustain, support |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `renewingSanctuary` 复苏圣域 | 大招 | 牧师 | heal, sustain, team, shield |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |

### `ironWall` 铁壁反击

- Fantasy: 高护盾高减伤，拖时间吃大招
- Design contract: Invite melee pressure into shields, then turn blocked damage into counterattacks.
- Primary output: counterattack
- Expected tags: shield, heal, sustain, counter
- Watch tags: poison, dotPayoff
- Skill mix: 小技能 8, 被动 4, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `retaliationStance` 壁垒反击 | 被动 | 骑士 | counter, reactive, damage |
| `retaliationBanner` 壁垒军旗 | 大招 | 骑士 | shield, sustain, team, support, teamWindow, counter, reactive |
| `powerStrike` 重击 | 小技能 | 战士 | selfWindow, damage, singleTarget |
| `cleave` 顺劈 | 小技能 | 战士 | damage, area |
| `lineBreaker` 破阵步 | 被动 | 战士 | none |
| `warBanner` 战旗冲锋 | 大招 | 战士 | support, teamWindow, damage, area |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `bloodCharm` 净血护符 | 小技能 | 牧师 | shield, sustain, support |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |
| `tempoSong` 急板战歌 | 小技能 | 吟游诗人 | support, teamWindow |
| `courageChord` 勇气和弦 | 小技能 | 吟游诗人 | support, power, carry |
| `encore` 返场 | 被动 | 吟游诗人 | none |
| `crescendo` 终章强音 | 大招 | 吟游诗人 | support, haste, power, teamWindow |

### `lightningTempo` 急速节奏

- Fantasy: 吟游加速，游侠持续点杀
- Design contract: Build marks quickly and convert team haste into repeated focused shots.
- Primary output: focusBasic
- Expected tags: mark, markPayoff, haste, focus
- Watch tags: control, execute
- Skill mix: 小技能 6, 被动 3, 大招 3
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `powerStrike` 重击 | 小技能 | 战士 | selfWindow, damage, singleTarget |
| `cleave` 顺劈 | 小技能 | 战士 | damage, area |
| `lineBreaker` 破阵步 | 被动 | 战士 | none |
| `warBanner` 战旗冲锋 | 大招 | 战士 | support, teamWindow, damage, area |
| `markShot` 猎标箭 | 小技能 | 游侠 | mark, setup, focus, damage, markPayoff |
| `pinningArrow` 钉足箭 | 小技能 | 游侠 | control, slow, damage, singleTarget |
| `duelistFocus` 决斗专注 | 被动 | 游侠 | none |
| `arrowStorm` 箭雨 | 大招 | 游侠 | damage, area, backline |
| `tempoSong` 急板战歌 | 小技能 | 吟游诗人 | support, teamWindow |
| `courageChord` 勇气和弦 | 小技能 | 吟游诗人 | support, power, carry |
| `encore` 返场 | 被动 | 吟游诗人 | none |
| `crescendo` 终章强音 | 大招 | 吟游诗人 | support, haste, power, teamWindow |

### `poisonBloom` 毒巢滚雪球

- Fantasy: 慢启动，死亡扩散，后期毒爆
- Design contract: Survive the opening, accumulate poison, then spread and detonate it.
- Primary output: dot
- Expected tags: poison, dot, dotPayoff, sustain
- Watch tags: burst, execute
- Skill mix: 小技能 8, 被动 4, 大招 4
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `toxicStabs` 毒刃连刺 | 小技能 | 刺客 | damage, singleTarget, poison, dot, status |
| `shadowCut` 影切 | 小技能 | 刺客 | damage, execute, focus |
| `executionSense` 处决嗅觉 | 被动 | 刺客 | none |
| `shadowHarvest` 暗影收割 | 大招 | 刺客 | damage, execute, focus |
| `venomBrand` 腐毒烙印 | 小技能 | 术士 | poison, dot, status, damage, singleTarget |
| `miasmaFlask` 沼雾瓶 | 小技能 | 炼金师 | poison, dot, area, status, damage |
| `hotbedPact` 温床契约 | 被动 | 术士 | none |
| `bloomDetonation` 毒巢绽放 | 大招 | 术士 | damage, poison, area, dotPayoff, burst |
| `bloodCharm` 净血护符 | 小技能 | 牧师 | shield, sustain, support |
| `heal` 急救 | 小技能 | 牧师 | heal, sustain |
| `afterglowGrace` 余光恩典 | 被动 | 牧师 | none |
| `sanctuary` 神圣庇护 | 大招 | 牧师 | heal, sustain, team, shield |

### `shadowExecute` 暗影处决

- Fantasy: 低血斩杀，优开后排脆皮
- Design contract: Create one vulnerable target and repeatedly finish the lowest-health enemy.
- Primary output: execute
- Expected tags: execute, focus, risk
- Watch tags: shield, deathPrevent
- Skill mix: 小技能 6, 被动 3, 大招 3
- Result: passes intent

| Skill | Type | Role | Tags |
| --- | --- | --- | --- |
| `tauntLine` 誓卫嘲讽 | 小技能 | 骑士 | selfWindow, shield, sustain, team |
| `guard` 守护 | 小技能 | 骑士 | shield, sustain, team |
| `fortressStance` 坚守阵线 | 被动 | 骑士 | none |
| `bannerWall` 王旗不倒 | 大招 | 骑士 | shield, sustain, team, support, teamWindow |
| `toxicStabs` 毒刃连刺 | 小技能 | 刺客 | damage, singleTarget, poison, dot, status |
| `shadowCut` 影切 | 小技能 | 刺客 | damage, execute, focus |
| `executionSense` 处决嗅觉 | 被动 | 刺客 | none |
| `shadowHarvest` 暗影收割 | 大招 | 刺客 | damage, execute, focus |
| `bloodContract` 血契供奉 | 小技能 | 术士 | risk, selfDamage, support, power, carry |
| `venomBrand` 腐毒烙印 | 小技能 | 术士 | poison, dot, status, damage, singleTarget |
| `hotbedPact` 温床契约 | 被动 | 术士 | none |
| `plagueOffering` 万毒献祭 | 大招 | 术士 | damage, poison, area, dotPayoff, burst |

