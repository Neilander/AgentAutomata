const GAME_SKILL_ASSETS = (() => {
  return {
    "version": "2026-06-23-skill-assets",
    "TYPE": {
      "SMALL": "小技能",
      "PASSIVE": "被动",
      "ULT": "大招"
    },
    "roleKits": {
      "alchemist": {
        "name": "沼雾炼金师",
        "role": "炼金师",
        "fantasy": "铺场、瓶剂、异常放大",
        "hp": 285,
        "power": 46,
        "armor": 7,
        "range": 35,
        "icon": "fizzing-flask",
        "kit": {
          "small1": "miasmaFlask",
          "small2": "volatileBottle",
          "passive": "catalyst",
          "ultimate": "grandMixture"
        }
      },
      "assassin": {
        "name": "毒刃刺客",
        "role": "刺客",
        "fantasy": "贴脸叠层，低血收割",
        "hp": 292,
        "power": 66,
        "armor": 7,
        "range": 12,
        "icon": "daggers",
        "kit": {
          "small1": "toxicStabs",
          "small2": "shadowCut",
          "passive": "executionSense",
          "ultimate": "shadowHarvest"
        }
      },
      "bard": {
        "name": "晨歌诗人",
        "role": "吟游诗人",
        "fantasy": "全队节奏窗口",
        "hp": 285,
        "power": 45,
        "armor": 7,
        "range": 36,
        "icon": "guitar",
        "kit": {
          "small1": "tempoSong",
          "small2": "courageChord",
          "passive": "encore",
          "ultimate": "crescendo"
        }
      },
      "berserker": {
        "name": "赤狮狂战",
        "role": "狂战士",
        "fantasy": "技能开窗口，越砍越疯，吃急速和吸血翻盘",
        "hp": 330,
        "power": 60,
        "armor": 8,
        "range": 12,
        "icon": "axe-swing",
        "kit": {
          "small1": "bloodStrike",
          "small2": "boneWhirl",
          "passive": "rageEngine",
          "ultimate": "undyingRoar"
        }
      },
      "knight": {
        "name": "铁壁骑士",
        "role": "骑士",
        "fantasy": "站住、挡住、反打",
        "hp": 350,
        "power": 34,
        "armor": 13,
        "range": 11,
        "icon": "checked-shield",
        "kit": {
          "small1": "guard",
          "small2": "tauntLine",
          "passive": "fortressStance",
          "ultimate": "bannerWall"
        }
      },
      "mage": {
        "name": "烬火法师",
        "role": "法师",
        "fantasy": "点燃、扩散、爆燃",
        "hp": 225,
        "power": 50,
        "armor": 4,
        "range": 38,
        "icon": "fireball",
        "kit": {
          "small1": "fireball",
          "small2": "emberSpread",
          "passive": "kindlingEcho",
          "ultimate": "meteorRain"
        }
      },
      "priest": {
        "name": "银誓牧师",
        "role": "牧师",
        "fantasy": "保核心，续航和护盾",
        "hp": 285,
        "power": 44,
        "armor": 6,
        "range": 35,
        "icon": "checked-shield",
        "kit": {
          "small1": "heal",
          "small2": "bloodCharm",
          "passive": "afterglowGrace",
          "ultimate": "sanctuary"
        }
      },
      "ranger": {
        "name": "月弦游侠",
        "role": "游侠",
        "fantasy": "标记单点，越射越准",
        "hp": 285,
        "power": 58,
        "armor": 7,
        "range": 38,
        "icon": "arrow-flights",
        "kit": {
          "small1": "markShot",
          "small2": "pinningArrow",
          "passive": "duelistFocus",
          "ultimate": "arrowStorm"
        }
      },
      "warlock": {
        "name": "灰契术士",
        "role": "术士",
        "fantasy": "献祭、诅咒、毒爆",
        "hp": 320,
        "power": 61,
        "armor": 8,
        "range": 34,
        "icon": "poison-bottle",
        "kit": {
          "small1": "venomBrand",
          "small2": "bloodContract",
          "passive": "hotbedPact",
          "ultimate": "plagueOffering"
        }
      },
      "warrior": {
        "name": "前锋战士",
        "role": "战士",
        "fantasy": "稳健前排，压低敌方阵线",
        "hp": 345,
        "power": 56,
        "armor": 12,
        "range": 13,
        "icon": "hammer-drop",
        "kit": {
          "small1": "powerStrike",
          "small2": "cleave",
          "passive": "lineBreaker",
          "ultimate": "warBanner"
        }
      }
    },
    "skills": {
      "afterglowGrace": {
        "name": "余光恩典",
        "type": "被动",
        "role": "牧师",
        "cooldown": 0,
        "icon": "holy-symbol",
        "desc": "治疗溢出转护盾。",
        "passive": true,
        "effects": []
      },
      "arrowStorm": {
        "name": "箭雨",
        "type": "大招",
        "role": "游侠",
        "cooldown": 30,
        "icon": "arrow-cluster",
        "desc": "多段压低敌方后排。",
        "effects": [
          {
            "kind": "arrowStorm"
          }
        ]
      },
      "bannerWall": {
        "name": "王旗不倒",
        "type": "大招",
        "role": "骑士",
        "cooldown": 34,
        "icon": "shield-bash",
        "desc": "全队护盾与短暂减伤。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 58,
            "power": 0.38,
            "label": "王旗"
          },
          {
            "kind": "teamTimer",
            "timer": "guardTimer",
            "duration": 3
          }
        ]
      },
      "bloodCharm": {
        "name": "净血护符",
        "type": "小技能",
        "role": "牧师",
        "cooldown": 10,
        "icon": "checked-shield",
        "desc": "护盾并降低 DOT 压力。",
        "effects": [
          {
            "kind": "shieldLowestAlly",
            "flat": 58,
            "power": 0.44,
            "label": "净血"
          },
          {
            "kind": "lowestAllyTimer",
            "timer": "dotResistTimer",
            "duration": 5
          }
        ]
      },
      "bloodContract": {
        "name": "血契供奉",
        "type": "小技能",
        "role": "术士",
        "cooldown": 8,
        "icon": "bleeding-heart",
        "desc": "牺牲自己，强化最高攻击友军。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.05,
            "type": "blood"
          },
          {
            "kind": "buffCarryPower",
            "duration": 6,
            "amount": 16,
            "label": "血契"
          }
        ]
      },
      "bloodStrike": {
        "name": "血怒斩",
        "type": "小技能",
        "role": "狂战士",
        "cooldown": 5.2,
        "openingCooldown": 5.8,
        "icon": "bloody-sword",
        "desc": "进入 4 秒血怒状态；期间每次普攻额外造成攻击力45% 伤害，生命越低额外伤害越高。",
        "effects": [
          {
            "kind": "timer",
            "timer": "bloodFuryTimer",
            "duration": 4,
            "label": "血怒普攻",
            "tone": "heal"
          }
        ]
      },
      "bloomDetonation": {
        "name": "毒巢绽放",
        "type": "大招",
        "role": "术士",
        "cooldown": 26,
        "openingCooldown": 12,
        "icon": "death-skull",
        "desc": "引爆所有中毒敌人，并留下新的毒种开始下一轮积累。",
        "effects": [
          {
            "kind": "plagueOffering",
            "flat": 24,
            "power": 0.28,
            "perPoison": 12,
            "retain": 0.35,
            "reapply": 5,
            "reapplyTime": 7
          }
        ]
      },
      "boneWhirl": {
        "name": "裂骨旋风",
        "type": "小技能",
        "role": "狂战士",
        "cooldown": 8.4,
        "openingCooldown": 6.6,
        "icon": "spinning-sword",
        "desc": "进入 5 秒旋风架势；期间普攻主目标额外 +攻击力30%，并溅射附近 2 个敌人各攻击力18%。",
        "effects": [
          {
            "kind": "timer",
            "timer": "whirlwindTimer",
            "duration": 5,
            "label": "旋风架势",
            "tone": "shield"
          }
        ]
      },
      "catalyst": {
        "name": "催化剂",
        "type": "被动",
        "role": "炼金师",
        "cooldown": 0,
        "icon": "chemical-drop",
        "desc": "异常状态伤害小幅提高。",
        "passive": true,
        "effects": []
      },
      "chainReaction": {
        "name": "连锁反应",
        "type": "大招",
        "role": "炼金师",
        "cooldown": 30,
        "openingCooldown": 11,
        "icon": "bubbling-flask",
        "desc": "较早结算敌方毒与火的重叠层数，让异常流形成积累与引爆周期。",
        "effects": [
          {
            "kind": "grandMixture",
            "flat": 18,
            "power": 0.16,
            "maxStatus": 8,
            "perStatus": 9
          }
        ]
      },
      "cleave": {
        "name": "顺劈",
        "type": "小技能",
        "role": "战士",
        "cooldown": 7,
        "icon": "sword-slice",
        "desc": "打前排附近两人。",
        "effects": [
          {
            "kind": "hitEnemies",
            "count": 2,
            "flat": 24,
            "power": 0.32,
            "type": "physical",
            "label": "顺劈"
          }
        ]
      },
      "combustSigil": {
        "name": "燃爆符印",
        "type": "小技能",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 8.5,
        "openingCooldown": 3.4,
        "icon": "burning-embers",
        "desc": "法师专属。对燃烧敌人兑现伤害并补 1 层燃烧。燃烧应偏爆发和扩散，不和剧毒完全同质。",
        "effects": [
          {
            "kind": "burningEnemies",
            "count": 3,
            "flat": 10,
            "power": 0.18,
            "perBurn": 5,
            "addBurn": 1,
            "burnTime": 5,
            "type": "fire",
            "label": "燃爆"
          }
        ]
      },
      "courageChord": {
        "name": "勇气和弦",
        "type": "小技能",
        "role": "吟游诗人",
        "cooldown": 7,
        "icon": "guitar",
        "desc": "给攻击最高友军增伤。",
        "effects": [
          {
            "kind": "buffCarryPower",
            "duration": 6,
            "amount": 22,
            "label": "勇气"
          }
        ]
      },
      "crescendo": {
        "name": "终章强音",
        "type": "大招",
        "role": "吟游诗人",
        "cooldown": 30,
        "icon": "sonic-shout",
        "desc": "全队急速并触发返场。",
        "effects": [
          {
            "kind": "crescendo"
          }
        ]
      },
      "crownBloodCharm": {
        "name": "王冠护符",
        "type": "小技能",
        "role": "牧师",
        "cooldown": 8.5,
        "openingCooldown": 2.5,
        "icon": "checked-shield",
        "desc": "专门保护队伍核心：给主要输出位护盾，并短暂降低直接伤害和异常压力。",
        "effects": [
          {
            "kind": "shieldCarryAlly",
            "flat": 84,
            "power": 0.52,
            "label": "王冠护符"
          },
          {
            "kind": "carryTimer",
            "timer": "guardTimer",
            "duration": 6
          },
          {
            "kind": "carryTimer",
            "timer": "dotResistTimer",
            "duration": 6
          }
        ]
      },
      "curseLeak": {
        "name": "咒血渗漏",
        "type": "小技能",
        "role": "术士",
        "roleKeys": [
          "warlock",
          "alchemist"
        ],
        "cooldown": 8.5,
        "openingCooldown": 3.4,
        "icon": "virus",
        "desc": "牺牲自身 5%最大生命，为目标附加 3 层剧毒 7 秒。术士用风险换持续伤害，炼金师用它补异常底料。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.05,
            "type": "blood"
          },
          {
            "kind": "poisonTarget",
            "stacks": 3,
            "time": 7
          }
        ]
      },
      "deathNeedle": {
        "name": "死线针刺",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 7,
        "openingCooldown": 3.1,
        "icon": "daggers",
        "desc": "刺客专属。攻击最低血敌人，造成 26+36%攻击暗影伤害，并按目标已损生命额外提高伤害。处决关键词只强化收尾，不负责铺异常。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 26,
            "power": 0.36,
            "missingTargetHpFlat": 38,
            "type": "shadow",
            "label": "死线"
          }
        ]
      },
      "duelistFocus": {
        "name": "决斗专注",
        "type": "被动",
        "role": "游侠",
        "cooldown": 0,
        "icon": "bullseye",
        "desc": "同一目标标记越高越强。",
        "passive": true,
        "effects": []
      },
      "emberSpread": {
        "name": "烈焰扩散",
        "type": "小技能",
        "role": "法师",
        "cooldown": 9,
        "icon": "fire-zone",
        "desc": "燃烧目标向附近扩散。",
        "effects": [
          {
            "kind": "burningEnemies",
            "count": 3,
            "flat": 6,
            "perBurn": 4,
            "addBurn": 1,
            "burnTime": 5,
            "type": "fire",
            "label": "扩散"
          }
        ]
      },
      "encore": {
        "name": "返场",
        "type": "被动",
        "role": "吟游诗人",
        "cooldown": 0,
        "icon": "double-quaver",
        "desc": "友军释放大招后缩短小技能冷却。",
        "passive": true,
        "effects": []
      },
      "enemyCullWeak": {
        "name": "斩弱",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 5.7,
        "openingCooldown": 2.4,
        "icon": "deadly-strike",
        "desc": "锁定最低血量目标，检验护盾、嘲讽与抬血。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 58,
            "power": 0.72,
            "missingTargetHpFlat": 92,
            "type": "shadow",
            "label": "斩弱"
          }
        ]
      },
      "enemyDormantPassive": {
        "name": "沉默本能",
        "type": "被动",
        "role": "敌人",
        "cooldown": 0,
        "icon": "sleepy",
        "desc": "关卡敌人的空被动槽。",
        "effects": []
      },
      "enemyEmberPulse": {
        "name": "余烬脉冲",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 5.8,
        "openingCooldown": 1.8,
        "icon": "fire-wave",
        "desc": "稳定全队火焰压力，检验爆发速度与群体续航。",
        "effects": [
          {
            "kind": "hitEnemies",
            "flat": 34,
            "power": 0.42,
            "type": "fire",
            "label": "余烬"
          }
        ]
      },
      "enemyFrostClamp": {
        "name": "寒霜钳制",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 7.5,
        "openingCooldown": 3,
        "icon": "frozen-orb",
        "desc": "短窗口群体减速，检验加速和高爆发窗口。",
        "effects": [
          {
            "kind": "enemyTimers",
            "count": 4,
            "timer": "slowTimer",
            "duration": 5.2
          }
        ]
      },
      "enemyHeavySmash": {
        "name": "裂骨重击",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 5.8,
        "openingCooldown": 2.2,
        "icon": "cracked-bone",
        "desc": "高单体物理伤害，检验前排承压与治疗。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 62,
            "power": 0.62,
            "type": "physical",
            "label": "裂骨"
          }
        ]
      },
      "enemyNoUltimate": {
        "name": "无大招",
        "type": "大招",
        "role": "敌人",
        "cooldown": 999,
        "openingCooldown": 999,
        "icon": "empty-hourglass",
        "desc": "关卡敌人的空大招槽。",
        "effects": []
      },
      "enemyNoop": {
        "name": "空档",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 999,
        "openingCooldown": 999,
        "icon": "hourglass",
        "desc": "关卡敌人的空小技能槽。",
        "effects": []
      },
      "enemyStoneGuard": {
        "name": "石肤",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 6.5,
        "openingCooldown": 0.8,
        "icon": "stone-block",
        "desc": "高额自盾，检验破盾、DOT 与持续输出。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 165,
            "power": 0.66,
            "label": "石肤",
            "selfOnly": true
          }
        ]
      },
      "enemySweepingClaw": {
        "name": "横扫爪击",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 8.2,
        "openingCooldown": 4.5,
        "icon": "claw-slashes",
        "desc": "低频多目标物理伤害，检验队伍整体血线。",
        "effects": [
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 28,
            "power": 0.42,
            "type": "physical",
            "label": "横扫"
          }
        ]
      },
      "enemyVenomCloud": {
        "name": "毒雾喷吐",
        "type": "小技能",
        "role": "敌人",
        "cooldown": 5.4,
        "openingCooldown": 1.6,
        "icon": "poison-gas",
        "desc": "给全体持续叠毒，检验净化、爆发与长期抗压。",
        "effects": [
          {
            "kind": "poisonEnemies",
            "stacks": 7,
            "time": 9
          }
        ]
      },
      "executionSense": {
        "name": "处决嗅觉",
        "type": "被动",
        "role": "刺客",
        "cooldown": 0,
        "icon": "death-note",
        "desc": "攻击低血或异常目标增伤。",
        "passive": true,
        "effects": []
      },
      "finisherInstinct": {
        "name": "终结本能",
        "type": "被动",
        "role": "通用",
        "roleKeys": [
          "assassin",
          "warrior",
          "ranger"
        ],
        "cooldown": 0,
        "icon": "death-note",
        "desc": "攻击生命低于 40%的敌人时，伤害提高 10%。它和标记叠层不同，核心是收尾而不是越打越高。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDamageAmp",
            "targetHpBelow": 0.4,
            "amp": 0.1
          }
        ]
      },
      "fireball": {
        "name": "余烬火球",
        "type": "小技能",
        "role": "法师",
        "cooldown": 6,
        "icon": "fireball",
        "desc": "单体火焰并点燃。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 19,
            "power": 0.25,
            "type": "fire",
            "label": "火球"
          },
          {
            "kind": "burnTarget",
            "stacks": 2,
            "time": 6
          }
        ]
      },
      "flareMark": {
        "name": "灼痕箭",
        "type": "小技能",
        "role": "游侠",
        "roleKeys": [
          "ranger",
          "mage"
        ],
        "cooldown": 6.5,
        "openingCooldown": 2.2,
        "icon": "targeted",
        "desc": "给目标 1 层标记，并附加 2 层燃烧 6 秒。它让游侠从纯单点标记分支，转向标记加元素联动。",
        "effects": [
          {
            "kind": "markTarget",
            "stacks": 1,
            "max": 6
          },
          {
            "kind": "burnTarget",
            "stacks": 2,
            "time": 6
          }
        ]
      },
      "fortressStance": {
        "name": "坚守阵线",
        "type": "被动",
        "role": "骑士",
        "cooldown": 0,
        "icon": "shield",
        "desc": "护盾效果提高，低血更硬。",
        "passive": true,
        "effects": []
      },
      "frontlineDrill": {
        "name": "前线操典",
        "type": "被动",
        "role": "通用",
        "roleKeys": [
          "knight",
          "warrior",
          "berserker"
        ],
        "cooldown": 0,
        "icon": "swordman",
        "desc": "攻击前排目标时伤害提高 7%。这是前排推进流的通用被动，适合战士和狂战士，不适合后排点杀。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDamageAmp",
            "targetLine": "前排",
            "amp": 0.07
          }
        ]
      },
      "frostNova": {
        "name": "霜环",
        "type": "小技能",
        "role": "法师",
        "cooldown": 10,
        "icon": "ice-bolt",
        "desc": "群体减速，克制近战。",
        "effects": [
          {
            "kind": "enemyTimers",
            "count": 3,
            "timer": "slowTimer",
            "duration": 7
          },
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 22,
            "power": 0.25,
            "type": "ice",
            "label": "霜环"
          }
        ]
      },
      "garrote": {
        "name": "绞喉",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin",
          "ranger"
        ],
        "cooldown": 6.2,
        "openingCooldown": 2.8,
        "icon": "daggers",
        "desc": "造成 18+38%攻击的暗影伤害，并附加 2 层剧毒 6 秒。刺客拿它做收割前置，游侠拿它补异常标签。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 18,
            "power": 0.38,
            "type": "shadow",
            "label": "绞喉"
          },
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 6
          }
        ]
      },
      "graceTransfer": {
        "name": "恩典转护",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 9.5,
        "openingCooldown": 3.2,
        "icon": "holy-symbol",
        "desc": "牧师专属。治疗最低血友军 24+30%攻击，并给最高攻击友军 36+28%攻击护盾。它把治疗和核心位支援分开表达。",
        "effects": [
          {
            "kind": "healLowestAlly",
            "flat": 24,
            "power": 0.3,
            "label": "恩典"
          },
          {
            "kind": "shieldCarryAlly",
            "flat": 36,
            "power": 0.28,
            "label": "转护"
          }
        ]
      },
      "grandMixture": {
        "name": "终极混剂",
        "type": "大招",
        "role": "炼金师",
        "cooldown": 35,
        "icon": "bubbling-flask",
        "desc": "根据敌方异常层数造成混合爆发。",
        "effects": [
          {
            "kind": "grandMixture"
          }
        ]
      },
      "guard": {
        "name": "守护",
        "type": "小技能",
        "role": "骑士",
        "cooldown": 8,
        "icon": "checked-shield",
        "desc": "给自己护盾，拖慢爆发队。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 48,
            "power": 0.34,
            "label": "守护",
            "selfOnly": true
          }
        ]
      },
      "guardBreak": {
        "name": "破甲重砍",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior",
          "berserker"
        ],
        "cooldown": 6.8,
        "openingCooldown": 3.2,
        "icon": "sword-clash",
        "desc": "对单体造成 24+46%攻击的物理伤害；目标身上每种异常额外提高 5 点伤害，适合接燃烧、剧毒、标记。",
        "effects": [
          {
            "kind": "hitTargetWithStatus",
            "flat": 24,
            "power": 0.46,
            "perStatus": 5,
            "maxStatus": 5,
            "type": "physical",
            "label": "破甲重砍"
          }
        ]
      },
      "heal": {
        "name": "急救",
        "type": "小技能",
        "role": "牧师",
        "cooldown": 7,
        "icon": "checked-shield",
        "desc": "治疗最低血友军。",
        "effects": [
          {
            "kind": "healLowestAlly",
            "flat": 48,
            "power": 0.42,
            "label": "急救"
          }
        ]
      },
      "hotbedPact": {
        "name": "温床契约",
        "type": "被动",
        "role": "术士",
        "cooldown": 0,
        "icon": "virus",
        "desc": "中毒敌人死亡时余毒扩散。",
        "passive": true,
        "effects": []
      },
      "iceLance": {
        "name": "冰枪",
        "type": "小技能",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 7.2,
        "openingCooldown": 3,
        "icon": "ice-spear",
        "desc": "造成 26+42%攻击的奥术伤害，并减速目标 2.5 秒。比冰环更偏单点，不负责大范围控场。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 26,
            "power": 0.42,
            "type": "arcane",
            "label": "冰枪"
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 2.5
          }
        ]
      },
      "kindlingEcho": {
        "name": "火种共鸣",
        "type": "被动",
        "role": "法师",
        "cooldown": 0,
        "icon": "burning-embers",
        "desc": "燃烧目标死亡时溅射火焰。",
        "passive": true,
        "effects": []
      },
      "lastWound": {
        "name": "残伤怒砍",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 8.2,
        "openingCooldown": 5.5,
        "icon": "bloody-sword",
        "desc": "狂战士专属。自伤 3%最大生命，进入 4 秒血怒普攻窗口，并造成一次 16+28%攻击物理伤害。低血资源要服务普攻图谱。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.03,
            "type": "blood"
          },
          {
            "kind": "timer",
            "timer": "bloodFuryTimer",
            "duration": 4,
            "label": "残伤血怒",
            "tone": "heal"
          },
          {
            "kind": "hitTarget",
            "flat": 16,
            "power": 0.28,
            "type": "physical",
            "label": "残伤怒砍"
          }
        ]
      },
      "lineBreaker": {
        "name": "破阵步",
        "type": "被动",
        "role": "战士",
        "cooldown": 0,
        "icon": "swordman",
        "desc": "攻击前排时小幅增伤。",
        "passive": true,
        "effects": []
      },
      "markRelay": {
        "name": "猎标接力",
        "type": "小技能",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 6.8,
        "openingCooldown": 2.5,
        "icon": "targeted",
        "desc": "游侠专属。给当前目标 2 层标记，并造成 14+20%攻击物理伤害。它补的是标记资源生产，不直接完成引爆。",
        "effects": [
          {
            "kind": "markTarget",
            "stacks": 2,
            "max": 8
          },
          {
            "kind": "hitMarkedTarget",
            "flat": 14,
            "power": 0.2,
            "perMark": 3,
            "type": "physical",
            "label": "猎标接力"
          }
        ]
      },
      "markShot": {
        "name": "猎标箭",
        "type": "小技能",
        "role": "游侠",
        "cooldown": 5,
        "icon": "targeted",
        "desc": "标记并单点增伤。",
        "effects": [
          {
            "kind": "markTarget",
            "stacks": 1,
            "max": 6
          },
          {
            "kind": "hitMarkedTarget",
            "flat": 24,
            "power": 0.34,
            "perMark": 5,
            "type": "physical",
            "label": "猎标箭"
          }
        ]
      },
      "mendingLight": {
        "name": "复苏微光",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 8,
        "openingCooldown": 2.6,
        "icon": "holy-symbol",
        "desc": "治疗最低血友军 28+38%攻击，并给其 18+20%攻击的护盾。它是牧师的小额连续续航，不替代大招庇护。",
        "effects": [
          {
            "kind": "healLowestAlly",
            "flat": 28,
            "power": 0.38,
            "label": "复苏"
          },
          {
            "kind": "shieldLowestAlly",
            "flat": 18,
            "power": 0.2,
            "label": "微光盾"
          }
        ]
      },
      "meteorRain": {
        "name": "流星火雨",
        "type": "大招",
        "role": "法师",
        "cooldown": 37,
        "openingCooldown": 11.5,
        "icon": "meteor-impact",
        "desc": "群体火焰，对燃烧目标爆燃。",
        "effects": [
          {
            "kind": "meteorRain"
          }
        ]
      },
      "miasmaFlask": {
        "name": "沼雾瓶",
        "type": "小技能",
        "role": "炼金师",
        "cooldown": 10,
        "icon": "fizzing-flask",
        "desc": "敌方全体少量铺毒。",
        "effects": [
          {
            "kind": "poisonEnemies",
            "stacks": 2,
            "time": 7
          },
          {
            "kind": "hitEnemies",
            "count": null,
            "flat": 5,
            "power": 0.08,
            "type": "poison",
            "label": "沼雾"
          }
        ]
      },
      "oathRally": {
        "name": "誓约集结",
        "type": "大招",
        "role": "通用",
        "roleKeys": [
          "knight",
          "warrior",
          "bard",
          "priest"
        ],
        "cooldown": 32,
        "openingCooldown": 20,
        "icon": "banner",
        "desc": "全队获得 6 秒急速，并获得 26+22%攻击的护盾。它是稳队伍节奏的通用大招，输出低但能救节奏。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 6,
            "label": "誓约急速",
            "tone": "heal"
          },
          {
            "kind": "teamShield",
            "flat": 26,
            "power": 0.22,
            "label": "誓约盾"
          }
        ]
      },
      "painDividend": {
        "name": "痛苦分红",
        "type": "小技能",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 11,
        "openingCooldown": 4,
        "icon": "bleeding-heart",
        "desc": "术士专属。自伤 4%最大生命，为最高攻击友军提供 5 秒攻击增益。它是风险支援，不再顺手铺毒，避免一张技能同时完成支援和异常启动。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.04,
            "type": "blood"
          },
          {
            "kind": "buffCarryPower",
            "amount": 8,
            "duration": 5,
            "label": "痛苦分红"
          }
        ]
      },
      "pinningArrow": {
        "name": "钉足箭",
        "type": "小技能",
        "role": "游侠",
        "cooldown": 8,
        "icon": "arrowed",
        "desc": "减速并压制前排。",
        "effects": [
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 4
          },
          {
            "kind": "hitTarget",
            "flat": 28,
            "power": 0.3,
            "type": "physical",
            "label": "钉足箭"
          }
        ]
      },
      "plagueOffering": {
        "name": "万毒献祭",
        "type": "大招",
        "role": "术士",
        "cooldown": 30,
        "icon": "death-skull",
        "desc": "引爆所有中毒敌人，保留部分毒层。",
        "effects": [
          {
            "kind": "plagueOffering"
          }
        ]
      },
      "powerStrike": {
        "name": "重击",
        "type": "小技能",
        "role": "战士",
        "cooldown": 5,
        "icon": "hammer-drop",
        "desc": "稳定单体物理伤害。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 34,
            "power": 0.48,
            "type": "physical",
            "label": "重击"
          }
        ]
      },
      "rageEngine": {
        "name": "血怒引擎",
        "type": "被动",
        "role": "狂战士",
        "cooldown": 0,
        "icon": "rage",
        "desc": "低血时强化血怒普攻，并让普攻按已造成伤害吸血；越残吸血越高。",
        "passive": true,
        "effects": []
      },
      "reagentMark": {
        "name": "试剂标记",
        "type": "小技能",
        "role": "炼金师",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 8,
        "openingCooldown": 3.3,
        "icon": "chemical-drop",
        "desc": "炼金师专属。给目标 1 层标记、1 层燃烧和 1 层剧毒。它是异常队的配料工具，不是终结技。",
        "effects": [
          {
            "kind": "markTarget",
            "stacks": 1,
            "max": 8
          },
          {
            "kind": "burnTarget",
            "stacks": 1,
            "time": 6
          },
          {
            "kind": "poisonTarget",
            "stacks": 1,
            "time": 6
          }
        ]
      },
      "redFeast": {
        "name": "赤宴",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 7.8,
        "openingCooldown": 6,
        "icon": "bloody-sword",
        "desc": "进入 4 秒吸血窗口，并对当前目标造成 12+24%攻击的物理伤害。它不是爆发技，而是给低血狂暴提供一次续航节拍。",
        "effects": [
          {
            "kind": "timer",
            "timer": "lifeStealTimer",
            "duration": 4,
            "label": "赤宴吸血",
            "tone": "heal"
          },
          {
            "kind": "hitTarget",
            "flat": 12,
            "power": 0.24,
            "type": "physical",
            "label": "赤宴"
          }
        ]
      },
      "renewingSanctuary": {
        "name": "复苏圣域",
        "type": "大招",
        "role": "牧师",
        "cooldown": 30,
        "openingCooldown": 10,
        "icon": "aura",
        "desc": "在团队第一次危机时提前治疗并施加护盾，形成可见的生命恢复平台。",
        "effects": [
          {
            "kind": "teamHeal",
            "flat": 44,
            "power": 0.34,
            "label": "复苏"
          },
          {
            "kind": "teamShield",
            "flat": 38,
            "power": 0.32,
            "label": "圣域"
          }
        ]
      },
      "retaliationBanner": {
        "name": "壁垒军旗",
        "type": "大招",
        "role": "骑士",
        "cooldown": 34,
        "openingCooldown": 7.5,
        "icon": "shield-bash",
        "desc": "在前排开始崩溃前展开壁垒，为全队提供护盾与短暂减伤，延长反击窗口。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 52,
            "power": 0.34,
            "label": "壁垒军旗"
          },
          {
            "kind": "teamTimer",
            "timer": "guardTimer",
            "duration": 3
          },
          {
            "kind": "teamRetaliation",
            "duration": 5,
            "requiresBlockedDamage": true,
            "meleeOnly": true,
            "flat": 5,
            "power": 0.08,
            "blockedRatio": 0.35,
            "cooldown": 0.8,
            "label": "军旗反击"
          }
        ]
      },
      "retaliationStance": {
        "name": "壁垒反击",
        "type": "被动",
        "role": "骑士",
        "cooldown": 0,
        "icon": "shield-reflect",
        "desc": "护盾吸收近战伤害后，立即以吸收量的一部分反击攻击者。",
        "passive": true,
        "effects": [
          {
            "kind": "counterOnDamageTaken",
            "requiresBlockedDamage": true,
            "meleeOnly": true,
            "flat": 9,
            "power": 0.14,
            "blockedRatio": 0.55,
            "cooldown": 0.65,
            "label": "壁垒反击"
          }
        ]
      },
      "rhythmGuard": {
        "name": "守拍",
        "type": "小技能",
        "role": "吟游诗人",
        "roleKeys": [
          "bard",
          "knight",
          "priest"
        ],
        "cooldown": 9,
        "openingCooldown": 4,
        "icon": "double-quaver",
        "desc": "全队获得 3 秒急速，同时最低血友军获得 24+26%攻击护盾。它把节奏支援和保人压在同一个短窗口里。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 3,
            "label": "守拍急速",
            "tone": "heal"
          },
          {
            "kind": "shieldLowestAlly",
            "flat": 24,
            "power": 0.26,
            "label": "守拍盾"
          }
        ]
      },
      "ruinComet": {
        "name": "破灭彗星",
        "type": "大招",
        "role": "通用",
        "roleKeys": [
          "mage",
          "warlock",
          "alchemist"
        ],
        "cooldown": 34,
        "openingCooldown": 21,
        "icon": "meteor",
        "desc": "轰击全体敌人，造成 20+20%攻击的奥术伤害；敌人每种异常额外提高 7 点伤害。异常队伍的通用兑现大招。",
        "effects": [
          {
            "kind": "hitEnemies",
            "count": 4,
            "flat": 20,
            "power": 0.2,
            "type": "arcane",
            "label": "破灭彗星"
          }
        ]
      },
      "sanctuary": {
        "name": "神圣庇护",
        "type": "大招",
        "role": "牧师",
        "cooldown": 32,
        "icon": "aura",
        "desc": "全队治疗和护盾。",
        "effects": [
          {
            "kind": "teamHeal",
            "flat": 36,
            "power": 0.28,
            "label": "庇护"
          },
          {
            "kind": "teamShield",
            "flat": 32,
            "power": 0.3,
            "label": "庇护"
          }
        ]
      },
      "shadowCut": {
        "name": "影切",
        "type": "小技能",
        "role": "刺客",
        "cooldown": 6,
        "icon": "sprint",
        "desc": "跳向低血目标。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 24,
            "power": 0.38,
            "missingTargetHpFlat": 34,
            "type": "shadow",
            "label": "影切"
          }
        ]
      },
      "shadowHarvest": {
        "name": "暗影收割",
        "type": "大招",
        "role": "刺客",
        "cooldown": 24,
        "openingCooldown": 2,
        "icon": "cloak-dagger",
        "desc": "处决低血目标，击杀刷新。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 74,
            "power": 0.66,
            "missingTargetHpFlat": 95,
            "type": "shadow",
            "label": "收割"
          }
        ]
      },
      "shieldBash": {
        "name": "盾击",
        "type": "小技能",
        "role": "骑士",
        "roleKeys": [
          "knight",
          "warrior"
        ],
        "cooldown": 7.5,
        "openingCooldown": 2.5,
        "icon": "shield-bash",
        "desc": "撞击当前目标造成 18+34%攻击的物理伤害，并让目标减速 3 秒。骑士用来打断节奏，战士也可作为控场小技。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 18,
            "power": 0.34,
            "type": "physical",
            "label": "盾击"
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 3
          }
        ]
      },
      "sparkCatalyst": {
        "name": "火花催化",
        "type": "小技能",
        "role": "炼金师",
        "roleKeys": [
          "alchemist",
          "mage"
        ],
        "cooldown": 8.2,
        "openingCooldown": 3.5,
        "icon": "chemical-drop",
        "desc": "对目标同时附加 2 层燃烧和 2 层剧毒 6 秒。它本身伤害不高，重点是给炼金/法师开反应条件，术士不再单人包办混合异常。",
        "effects": [
          {
            "kind": "burnTarget",
            "stacks": 2,
            "time": 6
          },
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 6
          }
        ]
      },
      "statusHunter": {
        "name": "异常猎手",
        "type": "被动",
        "role": "通用",
        "roleKeys": [
          "assassin",
          "ranger",
          "mage",
          "warlock",
          "alchemist"
        ],
        "cooldown": 0,
        "icon": "targeted",
        "desc": "攻击带有燃烧、剧毒或标记的目标时，伤害提高 4%。这是异常联动的通用被动，不负责单独制造异常。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDamageAmp",
            "requiresStatus": true,
            "amp": 0.04
          }
        ]
      },
      "sunderingAdvance": {
        "name": "裂阵推进",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 7.5,
        "openingCooldown": 3,
        "icon": "sword-clash",
        "desc": "战士专属。攻击最近 2 个敌人，造成 18+34%攻击的物理伤害；用于强化前排压制而不是后排点杀。",
        "effects": [
          {
            "kind": "hitEnemies",
            "count": 2,
            "flat": 18,
            "power": 0.34,
            "type": "physical",
            "label": "裂阵"
          }
        ]
      },
      "syncopate": {
        "name": "切分拍",
        "type": "小技能",
        "role": "吟游诗人",
        "roleKeys": [
          "bard"
        ],
        "cooldown": 8.5,
        "openingCooldown": 3.8,
        "icon": "double-quaver",
        "desc": "吟游诗人专属。全队获得 3 秒急速，并给最高攻击友军 5 秒小额攻击增益。吟游的支援要服务队伍节奏。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 3,
            "label": "切分拍",
            "tone": "heal"
          },
          {
            "kind": "buffCarryPower",
            "amount": 10,
            "duration": 5,
            "label": "重拍"
          }
        ]
      },
      "tauntLine": {
        "name": "誓卫嘲讽",
        "type": "小技能",
        "role": "骑士",
        "cooldown": 10,
        "icon": "shield-reflect",
        "desc": "嘲讽附近敌人并减伤。",
        "effects": [
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 5
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 5
          },
          {
            "kind": "teamShield",
            "flat": 55,
            "power": 0.35,
            "label": "誓卫",
            "selfOnly": true
          }
        ]
      },
      "tempoSong": {
        "name": "急板战歌",
        "type": "小技能",
        "role": "吟游诗人",
        "cooldown": 9,
        "icon": "musical-notes",
        "desc": "全队加速一小段窗口。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 5,
            "label": "急板",
            "tone": "heal"
          }
        ]
      },
      "toxicStabs": {
        "name": "毒刃连刺",
        "type": "小技能",
        "role": "刺客",
        "cooldown": 4,
        "icon": "daggers",
        "desc": "快速刺击并叠低额毒。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 14,
            "power": 0.24,
            "type": "physical",
            "label": "毒刃"
          },
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 6
          }
        ]
      },
      "undyingRoar": {
        "name": "不死战吼",
        "type": "大招",
        "role": "狂战士",
        "cooldown": 24,
        "icon": "lion",
        "desc": "自身 6 秒内不会低于 1 点生命，并同时获得急速、血怒、旋风架势和攻击力35% 普攻附伤。",
        "effects": [
          {
            "kind": "berserkerRoar"
          }
        ]
      },
      "venomBrand": {
        "name": "腐毒烙印",
        "type": "小技能",
        "role": "术士",
        "cooldown": 6,
        "icon": "poison-bottle",
        "desc": "单体上毒，已有毒则延长。",
        "effects": [
          {
            "kind": "poisonTarget",
            "stacks": 4,
            "time": 8
          },
          {
            "kind": "hitTarget",
            "flat": 14,
            "power": 0.2,
            "type": "poison",
            "label": "腐毒"
          }
        ]
      },
      "volatileBottle": {
        "name": "爆裂瓶",
        "type": "小技能",
        "role": "炼金师",
        "cooldown": 8,
        "icon": "round-bottom-flask",
        "desc": "对异常目标额外伤害。",
        "effects": [
          {
            "kind": "hitTargetWithStatus",
            "flat": 18,
            "power": 0.2,
            "perStatus": 6,
            "maxStatus": 8,
            "type": "fire",
            "label": "爆裂瓶"
          }
        ]
      },
      "vowTaunt": {
        "name": "誓言挑衅",
        "type": "小技能",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 11,
        "openingCooldown": 2.2,
        "icon": "shield-reflect",
        "desc": "骑士专属。获得 4 秒守护和 4 秒嘲讽，并获得 42+32%攻击的护盾。嘲讽是行为改写关键词，应保持骑士辨识度。",
        "effects": [
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 4,
            "label": "誓言守护",
            "tone": "shield"
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 4,
            "label": "挑衅",
            "tone": "shield"
          },
          {
            "kind": "teamShield",
            "selfOnly": true,
            "flat": 42,
            "power": 0.32,
            "label": "誓言盾"
          }
        ]
      },
      "warBanner": {
        "name": "战旗冲锋",
        "type": "大招",
        "role": "战士",
        "cooldown": 28,
        "icon": "war-axe",
        "desc": "全队前排输出窗口。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "bonusPowerTimer",
            "duration": 5
          },
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 32,
            "power": 0.34,
            "type": "physical",
            "label": "冲锋"
          }
        ]
      }
    },
    "presets": {
      "alchemyChaos": {
        "name": "炼金异常",
        "desc": "毒火混合，靠异常层数放大",
        "design": {
          "fantasy": "Mix poison and burn, then cash accumulated statuses into area damage.",
          "experience": {
            "start": "Poison and burn begin accumulating together.",
            "transition": "Both statuses overlap on several targets.",
            "payoff": "Alchemy skills convert the overlap into area damage.",
            "reset": "Statuses rebuild after the payoff."
          },
          "primaryOutput": "statusPayoff",
          "desiredTags": [
            "poison",
            "burn",
            "statusPayoff",
            "area"
          ],
          "watchTags": [
            "execute",
            "burst"
          ],
          "strongMatchups": [
            "ironWall",
            "lightningTempo"
          ],
          "weakMatchups": [
            "bloodRage",
            "fireBurst",
            "poisonBloom"
          ],
          "validationOpponents": [
            "ironWall",
            "shadowExecute"
          ],
          "curves": [
            {
              "metric": "dualStatusOverlapRatio",
              "op": ">=",
              "value": 0.25
            },
            {
              "metric": "payoffCycles",
              "op": ">=",
              "value": 1
            }
          ],
          "signalAcceptance": [
            {
              "metric": "statusStacksApplied",
              "op": ">=",
              "value": 20
            },
            {
              "metric": "statusPayoffDamageShare",
              "op": ">=",
              "value": 0.12
            }
          ],
          "failureBoundaries": [
            {
              "metric": "poisonStacksApplied",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "burnStacksApplied",
              "op": ">=",
              "value": 4
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "alchemist",
            "small1": "miasmaFlask",
            "small2": "volatileBottle",
            "passive": "catalyst",
            "ultimate": "chainReaction"
          },
          {
            "role": "alchemist",
            "small1": "miasmaFlask",
            "small2": "volatileBottle",
            "passive": "catalyst",
            "ultimate": "grandMixture"
          },
          {
            "role": "mage",
            "small1": "fireball",
            "small2": "emberSpread",
            "passive": "kindlingEcho",
            "ultimate": "meteorRain"
          }
        ]
      },
      "bloodRage": {
        "name": "低血狂怒",
        "desc": "低血爆发和吸血翻盘",
        "design": {
          "fantasy": "Fall into danger, refuse death, then recover through empowered basic attacks.",
          "experience": {
            "start": "The berserker loses health from a safe band.",
            "transition": "The berserker enters the low-health danger band.",
            "payoff": "Attack cadence, empowered basics, and lifesteal rise.",
            "reset": "Health repeatedly dips and recovers instead of immediately dying."
          },
          "primaryOutput": "basicAttack",
          "desiredTags": [
            "basicWindow",
            "haste",
            "sustain",
            "deathPrevent"
          ],
          "watchTags": [
            "execute",
            "burst"
          ],
          "strongMatchups": [
            "alchemyChaos",
            "holySustain"
          ],
          "weakMatchups": [
            "crownCarry",
            "fireBurst",
            "lightningTempo",
            "poisonBloom",
            "shadowExecute"
          ],
          "validationOpponents": [
            "ironWall",
            "frostControl"
          ],
          "curves": [
            {
              "metric": "highHealthDecline",
              "op": ">=",
              "value": 0.3
            },
            {
              "metric": "lowHealthSurvivalSeconds",
              "op": ">=",
              "value": 3
            },
            {
              "metric": "lowHealthOscillations",
              "op": ">=",
              "value": 1
            },
            {
              "metric": "postLowAttackRateRatio",
              "op": ">=",
              "value": 1.2
            },
            {
              "metric": "recoveryAfterLow",
              "op": ">=",
              "value": 0.08
            }
          ],
          "signalAcceptance": [
            {
              "metric": "basicDamageShare",
              "op": ">=",
              "value": 0.45
            },
            {
              "metric": "empoweredBasicDamageShare",
              "op": ">=",
              "value": 0.3
            },
            {
              "metric": "healingPerSecond",
              "op": ">=",
              "value": 1
            }
          ],
          "failureBoundaries": [
            {
              "metric": "lowHealthEntryRate",
              "op": ">=",
              "value": 0.5
            }
          ]
        },
        "team": [
          {
            "role": "berserker",
            "small1": "bloodStrike",
            "small2": "boneWhirl",
            "passive": "rageEngine",
            "ultimate": "undyingRoar"
          },
          {
            "role": "warrior",
            "small1": "powerStrike",
            "small2": "cleave",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "bloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "bard",
            "small1": "tempoSong",
            "small2": "courageChord",
            "passive": "encore",
            "ultimate": "crescendo"
          }
        ]
      },
      "crownCarry": {
        "name": "王冠核心",
        "desc": "全队资源养一个狂战/游侠核心",
        "design": {
          "fantasy": "Three allies funnel protection and tempo into one visible carry.",
          "experience": {
            "start": "Supports begin feeding one designated carry.",
            "transition": "Buff and haste windows concentrate on that carry.",
            "payoff": "The carry becomes the visible majority damage source.",
            "reset": "Team output falls outside the carry window."
          },
          "primaryOutput": "basicAttack",
          "desiredTags": [
            "support",
            "carry",
            "basicWindow",
            "haste"
          ],
          "watchTags": [
            "execute"
          ],
          "strongMatchups": [
            "bloodRage",
            "frostControl",
            "holySustain",
            "ironWall",
            "lightningTempo"
          ],
          "weakMatchups": [
            "fireBurst",
            "poisonBloom"
          ],
          "validationOpponents": [
            "poisonBloom",
            "shadowExecute"
          ],
          "curves": [
            {
              "metric": "carryBuffShare",
              "op": ">=",
              "value": 0.45
            }
          ],
          "signalAcceptance": [
            {
              "metric": "basicDamageShare",
              "op": ">=",
              "value": 0.28
            },
            {
              "metric": "hasteWindowBasicDamageShare",
              "op": ">=",
              "value": 0.1
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 3
            }
          ],
          "failureBoundaries": [
            {
              "metric": "carrySurvives10Seconds",
              "op": ">=",
              "value": 0.75
            },
            {
              "metric": "carryDamageShare",
              "op": ">=",
              "value": 0.45
            },
            {
              "metric": "carryDamageShare",
              "op": "<=",
              "value": 0.75
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "crownBloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "bard",
            "small1": "tempoSong",
            "small2": "courageChord",
            "passive": "encore",
            "ultimate": "crescendo"
          },
          {
            "role": "berserker",
            "small1": "bloodStrike",
            "small2": "boneWhirl",
            "passive": "rageEngine",
            "ultimate": "undyingRoar"
          }
        ]
      },
      "fireBurst": {
        "name": "余烬爆燃",
        "desc": "点燃扩散，流星收尾，优开脆皮",
        "design": {
          "fantasy": "Ignite the team, spread fire, then end the fight with a meteor burst.",
          "experience": {
            "start": "Burn is applied across several enemies.",
            "transition": "Fire spreads and prepares the meteor window.",
            "payoff": "A short, visible damage peak lands.",
            "reset": "Damage falls after the burst while cooldowns recover."
          },
          "primaryOutput": "burst",
          "desiredTags": [
            "burn",
            "area",
            "burst"
          ],
          "watchTags": [
            "shield",
            "heal"
          ],
          "strongMatchups": [
            "alchemyChaos",
            "bloodRage",
            "crownCarry",
            "frostControl",
            "holySustain",
            "ironWall",
            "lightningTempo",
            "poisonBloom"
          ],
          "weakMatchups": [
            "shadowExecute"
          ],
          "validationOpponents": [
            "alchemyChaos",
            "ironWall"
          ],
          "curves": [
            {
              "metric": "peak2sDamageShare",
              "op": ">=",
              "value": 0.2
            },
            {
              "metric": "postPeakDamageRateRatio",
              "op": "<=",
              "value": 0.75
            },
            {
              "metric": "burnCoverageBeforeUltimate",
              "op": ">=",
              "value": 0.5
            }
          ],
          "signalAcceptance": [
            {
              "metric": "burnStacksApplied",
              "op": ">=",
              "value": 12
            },
            {
              "metric": "ultimateDamageShare",
              "op": ">=",
              "value": 0.12
            },
            {
              "metric": "areaDamageShare",
              "op": ">=",
              "value": 0.2
            }
          ],
          "failureBoundaries": [
            {
              "metric": "payoffStartsAfterSetup",
              "op": ">=",
              "value": 1
            }
          ]
        },
        "team": [
          {
            "role": "warrior",
            "small1": "powerStrike",
            "small2": "cleave",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "mage",
            "small1": "fireball",
            "small2": "emberSpread",
            "passive": "kindlingEcho",
            "ultimate": "meteorRain"
          },
          {
            "role": "mage",
            "small1": "fireball",
            "small2": "emberSpread",
            "passive": "kindlingEcho",
            "ultimate": "meteorRain"
          }
        ]
      },
      "frostControl": {
        "name": "霜控拖延",
        "desc": "减速控场，克制近战",
        "design": {
          "fantasy": "Slow the enemy front line so ranged damage gains extra time to work.",
          "experience": {
            "start": "Enemy melee units approach normally.",
            "transition": "Slow windows suppress their movement and attacks.",
            "payoff": "The backline gains extra uncontested output time.",
            "reset": "Pressure rises again when control expires."
          },
          "primaryOutput": "control",
          "desiredTags": [
            "control",
            "slow",
            "statusPayoff"
          ],
          "watchTags": [
            "backline",
            "burst"
          ],
          "strongMatchups": [
            "holySustain",
            "ironWall"
          ],
          "weakMatchups": [
            "crownCarry",
            "fireBurst",
            "poisonBloom",
            "shadowExecute"
          ],
          "validationOpponents": [
            "bloodRage",
            "fireBurst"
          ],
          "curves": [
            {
              "metric": "controlWindowMeleeRateRatio",
              "op": "<=",
              "value": 0.8
            }
          ],
          "signalAcceptance": [
            {
              "metric": "slowApplications",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "enemyMeleeBasicPerSecond",
              "op": "<=",
              "value": 1.8
            },
            {
              "metric": "statusPayoffDamageShare",
              "op": ">=",
              "value": 0.05
            }
          ],
          "failureBoundaries": [
            {
              "metric": "slowApplications",
              "op": ">=",
              "value": 1
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "bloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "mage",
            "small1": "frostNova",
            "small2": "fireball",
            "passive": "kindlingEcho",
            "ultimate": "meteorRain"
          },
          {
            "role": "alchemist",
            "small1": "volatileBottle",
            "small2": "miasmaFlask",
            "passive": "catalyst",
            "ultimate": "grandMixture"
          }
        ]
      },
      "holySustain": {
        "name": "圣盾续航",
        "desc": "治疗护盾密度高，消耗取胜",
        "design": {
          "fantasy": "Absorb repeated pressure until healing and shields stabilize the whole team.",
          "experience": {
            "start": "The team takes visible early pressure.",
            "transition": "A health crisis activates repeated healing and shields.",
            "payoff": "Average team health stabilizes or recovers.",
            "reset": "The team survives into a longer attrition phase."
          },
          "primaryOutput": "sustain",
          "desiredTags": [
            "heal",
            "shield",
            "sustain"
          ],
          "watchTags": [
            "poison",
            "dotPayoff"
          ],
          "strongMatchups": [
            "lightningTempo"
          ],
          "weakMatchups": [
            "bloodRage",
            "crownCarry",
            "fireBurst",
            "frostControl",
            "poisonBloom",
            "shadowExecute"
          ],
          "validationOpponents": [
            "fireBurst",
            "poisonBloom"
          ],
          "curves": [
            {
              "metric": "teamRecoveryAfterCrisis",
              "op": ">=",
              "value": 0.1
            }
          ],
          "signalAcceptance": [
            {
              "metric": "healingPerSecond",
              "op": ">=",
              "value": 5
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "effectiveHealingRatio",
              "op": ">=",
              "value": 0.6
            },
            {
              "metric": "survivorsAt20Seconds",
              "op": ">=",
              "value": 2
            }
          ],
          "failureBoundaries": [
            {
              "metric": "teamRecoveryAfterCrisis",
              "op": "<=",
              "value": 0.55
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "warrior",
            "small1": "powerStrike",
            "small2": "cleave",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "bloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "renewingSanctuary"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "bloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          }
        ]
      },
      "ironWall": {
        "name": "铁壁反击",
        "desc": "高护盾高减伤，拖时间吃大招",
        "design": {
          "fantasy": "Invite melee pressure into shields, then turn blocked damage into counterattacks.",
          "experience": {
            "start": "The frontline absorbs pressure behind shields.",
            "transition": "Blocked melee hits trigger retaliation.",
            "payoff": "The banner slows team health loss and opens a team counter window.",
            "reset": "The team returns to ordinary defense after the retaliation window."
          },
          "primaryOutput": "counterattack",
          "desiredTags": [
            "shield",
            "heal",
            "sustain",
            "counter"
          ],
          "watchTags": [
            "poison",
            "dotPayoff"
          ],
          "strongMatchups": [
            "lightningTempo"
          ],
          "weakMatchups": [
            "alchemyChaos",
            "crownCarry",
            "fireBurst",
            "frostControl",
            "poisonBloom",
            "shadowExecute"
          ],
          "validationOpponents": [
            "shadowExecute",
            "poisonBloom"
          ],
          "curves": [
            {
              "metric": "blockedCounterLinkRate",
              "op": ">=",
              "value": 0.95
            },
            {
              "metric": "postUltimateHpLossRatio",
              "op": "<=",
              "value": 0.8
            }
          ],
          "signalAcceptance": [
            {
              "metric": "counterTriggers",
              "op": ">=",
              "value": 1
            },
            {
              "metric": "counterDamageShare",
              "op": ">=",
              "value": 0.06
            },
            {
              "metric": "counterDamageShare",
              "op": "<=",
              "value": 0.18
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 3
            },
            {
              "metric": "ultimateCastsBefore15",
              "op": ">=",
              "value": 1
            }
          ],
          "failureBoundaries": [
            {
              "metric": "ultimateBeforeFirstDeath",
              "op": ">=",
              "value": 0.75
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "retaliationStance",
            "ultimate": "retaliationBanner"
          },
          {
            "role": "warrior",
            "small1": "powerStrike",
            "small2": "cleave",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "priest",
            "small1": "heal",
            "small2": "bloodCharm",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "bard",
            "small1": "tempoSong",
            "small2": "courageChord",
            "passive": "encore",
            "ultimate": "crescendo"
          }
        ]
      },
      "lightningTempo": {
        "name": "急速节奏",
        "desc": "吟游加速，游侠持续点杀",
        "design": {
          "fantasy": "Build marks quickly and convert team haste into repeated focused shots.",
          "experience": {
            "start": "Rangers establish a marked target.",
            "transition": "Marks and haste concentrate repeated attacks.",
            "payoff": "The focused target falls faster during the tempo window.",
            "reset": "Attack pressure falls between haste windows."
          },
          "primaryOutput": "focusBasic",
          "desiredTags": [
            "mark",
            "markPayoff",
            "haste",
            "focus"
          ],
          "watchTags": [
            "control",
            "execute"
          ],
          "strongMatchups": [
            "bloodRage",
            "shadowExecute"
          ],
          "weakMatchups": [
            "alchemyChaos",
            "crownCarry",
            "fireBurst",
            "holySustain",
            "ironWall",
            "poisonBloom"
          ],
          "validationOpponents": [
            "ironWall",
            "frostControl"
          ],
          "curves": [
            {
              "metric": "topTwoBuffShare",
              "op": ">=",
              "value": 0.55
            }
          ],
          "signalAcceptance": [
            {
              "metric": "markApplications",
              "op": ">=",
              "value": 6
            },
            {
              "metric": "hasteWindowBasicDamageShare",
              "op": ">=",
              "value": 0.12
            },
            {
              "metric": "basicDamageShare",
              "op": ">=",
              "value": 0.2
            }
          ],
          "failureBoundaries": [
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.35
            }
          ]
        },
        "team": [
          {
            "role": "warrior",
            "small1": "powerStrike",
            "small2": "cleave",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "ranger",
            "small1": "markShot",
            "small2": "pinningArrow",
            "passive": "duelistFocus",
            "ultimate": "arrowStorm"
          },
          {
            "role": "bard",
            "small1": "tempoSong",
            "small2": "courageChord",
            "passive": "encore",
            "ultimate": "crescendo"
          },
          {
            "role": "ranger",
            "small1": "markShot",
            "small2": "pinningArrow",
            "passive": "duelistFocus",
            "ultimate": "arrowStorm"
          }
        ]
      },
      "poisonBloom": {
        "name": "毒巢滚雪球",
        "desc": "慢启动，死亡扩散，后期毒爆",
        "design": {
          "fantasy": "Survive the opening, accumulate poison, then spread and detonate it.",
          "experience": {
            "start": "Poison begins slowly while the team survives.",
            "transition": "Stacks accelerate and spread between enemies.",
            "payoff": "A poison payoff converts accumulated stacks into damage.",
            "reset": "Stacks fall and begin accumulating again."
          },
          "primaryOutput": "dot",
          "desiredTags": [
            "poison",
            "dot",
            "dotPayoff",
            "sustain"
          ],
          "watchTags": [
            "burst",
            "execute"
          ],
          "strongMatchups": [
            "alchemyChaos",
            "bloodRage",
            "crownCarry",
            "frostControl",
            "holySustain",
            "ironWall",
            "lightningTempo",
            "shadowExecute"
          ],
          "weakMatchups": [
            "fireBurst"
          ],
          "validationOpponents": [
            "ironWall",
            "fireBurst"
          ],
          "curves": [
            {
              "metric": "poisonApplicationAcceleration",
              "op": ">=",
              "value": 1.15
            },
            {
              "metric": "poisonSpreadEvents",
              "op": ">=",
              "value": 0.5
            },
            {
              "metric": "payoffCycles",
              "op": ">=",
              "value": 1
            }
          ],
          "signalAcceptance": [
            {
              "metric": "poisonStacksApplied",
              "op": ">=",
              "value": 12
            },
            {
              "metric": "dotDamageShare",
              "op": ">=",
              "value": 0.2
            },
            {
              "metric": "dotDamageShare",
              "op": "<=",
              "value": 0.55
            },
            {
              "metric": "statusPayoffDamageShare",
              "op": ">=",
              "value": 0.08
            }
          ],
          "failureBoundaries": [
            {
              "metric": "payoffStartsAfterSetup",
              "op": ">=",
              "value": 1
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "assassin",
            "small1": "toxicStabs",
            "small2": "shadowCut",
            "passive": "executionSense",
            "ultimate": "shadowHarvest"
          },
          {
            "role": "warlock",
            "small1": "venomBrand",
            "small2": "miasmaFlask",
            "passive": "hotbedPact",
            "ultimate": "bloomDetonation"
          },
          {
            "role": "priest",
            "small1": "bloodCharm",
            "small2": "heal",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          }
        ]
      },
      "shadowExecute": {
        "name": "暗影处决",
        "desc": "低血斩杀，优开后排脆皮",
        "design": {
          "fantasy": "Create one vulnerable target and repeatedly finish the lowest-health enemy.",
          "experience": {
            "start": "Damage begins to concentrate on a vulnerable enemy.",
            "transition": "The target enters the execute band.",
            "payoff": "Execute damage rapidly finishes that target.",
            "reset": "Focus moves to the next lowest-health enemy."
          },
          "primaryOutput": "execute",
          "desiredTags": [
            "execute",
            "focus",
            "risk"
          ],
          "watchTags": [
            "shield",
            "deathPrevent"
          ],
          "strongMatchups": [
            "bloodRage",
            "fireBurst",
            "frostControl",
            "holySustain",
            "ironWall"
          ],
          "weakMatchups": [
            "lightningTempo",
            "poisonBloom"
          ],
          "validationOpponents": [
            "crownCarry",
            "ironWall"
          ],
          "curves": [
            {
              "metric": "peak2sDamageShare",
              "op": ">=",
              "value": 0.16
            }
          ],
          "signalAcceptance": [
            {
              "metric": "executeDamageShare",
              "op": ">=",
              "value": 0.1
            },
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.25
            },
            {
              "metric": "selfCostPerSecond",
              "op": ">=",
              "value": 0.2
            }
          ],
          "failureBoundaries": [
            {
              "metric": "areaDamageShare",
              "op": "<=",
              "value": 0.5
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "tauntLine",
            "small2": "guard",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "assassin",
            "small1": "toxicStabs",
            "small2": "shadowCut",
            "passive": "executionSense",
            "ultimate": "shadowHarvest"
          },
          {
            "role": "assassin",
            "small1": "toxicStabs",
            "small2": "shadowCut",
            "passive": "executionSense",
            "ultimate": "shadowHarvest"
          },
          {
            "role": "warlock",
            "small1": "bloodContract",
            "small2": "venomBrand",
            "passive": "hotbedPact",
            "ultimate": "plagueOffering"
          }
        ]
      }
    },
    "berserkerModel": {
      "basicAttackCooldown": 1.35,
      "basicFlatDamage": 10,
      "basicPowerRatio": 0.22,
      "openingCooldowns": {
        "bloodStrike": 5.8,
        "boneWhirl": 6.6,
        "undyingRoar": 9.5
      },
      "cooldowns": {
        "bloodStrike": 5.2,
        "boneWhirl": 8.4,
        "undyingRoar": 24
      },
      "durations": {
        "bloodFury": 4,
        "whirlwind": 5,
        "roarFury": 6,
        "haste": 6,
        "immortal": 6
      },
      "ratios": {
        "blood": 0.45,
        "whirlwind": 0.3,
        "splash": 0.18,
        "roar": 0.35
      },
      "passive": {
        "maxDamageAmp": 0.45,
        "baseLeech": 0.07,
        "missingHpLeech": 0.11,
        "lowHpHaste": 0.62,
        "roarLeech": 0.16
      },
      "splashTargets": 2,
      "hasteMultiplier": 1.4
    }
  };
})();

if (typeof window !== "undefined") window.GAME_SKILL_ASSETS = GAME_SKILL_ASSETS;
if (typeof module !== "undefined") module.exports = GAME_SKILL_ASSETS;
