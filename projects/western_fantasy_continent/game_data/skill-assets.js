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
        "hp": 282,
        "power": 57,
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
        "power": 58,
        "armor": 7,
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
        "power": 30,
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
        "power": 53,
        "armor": 11,
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
      "ashZone": {
        "name": "灰烬火场",
        "type": "小技能",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 10,
        "openingCooldown": 3,
        "icon": "fire-zone",
        "desc": "法师副定位：控制火场。轻伤多个敌人并附加燃烧和短减速，让火法不只爆发，也能制造站位压力。",
        "effects": [
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 10,
            "power": 0.14,
            "type": "fire",
            "label": "灰烬"
          },
          {
            "kind": "enemyTimers",
            "count": 3,
            "timer": "slowTimer",
            "duration": 2.8
          }
        ]
      },
      "backlineHunt": {
        "name": "暗线切入",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 8.2,
        "openingCooldown": 2.4,
        "icon": "cloak-dagger",
        "desc": "攻击敌方后排血量比例最低目标并叠猎痕。它解决的是接触目标和建立猎杀链，不是单纯加爆发。",
        "design": {
          "primaryOutput": "backline access + mark setup",
          "expectedScaling": "physicalPower",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "后排核心",
          "secondaryUtility": "追残血、打法师牧师游侠",
          "targetRule": "lowest hp ratio backline enemy, fallback lowest hp ratio enemy"
        },
        "effects": [
          {
            "kind": "shadowStepStrike",
            "flat": 18,
            "power": 0.28,
            "missingTargetHpFlat": 10,
            "markStacks": 2,
            "markMax": 5,
            "guardDuration": 1.2,
            "lockDuration": 3.2,
            "attackCd": 0.08,
            "type": "physical",
            "scaleWith": "physical",
            "label": "暗线切入"
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
      "bastionSanctuary": {
        "name": "堡垒圣域",
        "type": "大招",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 34,
        "openingCooldown": 15,
        "icon": "divine-intervention",
        "desc": "牧师副流派大招：全队获得护盾、少量治疗和守势，偏防线稳定而不是纯抬血。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 45,
            "power": 0.32,
            "label": "堡垒圣域"
          },
          {
            "kind": "teamHeal",
            "flat": 22,
            "power": 0.16,
            "label": "圣域回光"
          },
          {
            "kind": "teamTimer",
            "timer": "guardTimer",
            "duration": 3.5,
            "label": "圣域守势"
          }
        ]
      },
      "battleHymn": {
        "name": "战地圣歌",
        "type": "小技能",
        "role": "吟游诗人",
        "roleKeys": [
          "bard"
        ],
        "cooldown": 10,
        "openingCooldown": 2.8,
        "icon": "lyre",
        "desc": "诗人副定位：节奏保护。给全队短急速，同时给最低血队友护盾；不是纯输出加速，而是把节奏窗口做得更安全。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 3.2,
            "label": "圣歌"
          },
          {
            "kind": "shieldLowestAlly",
            "flat": 30,
            "power": 0.2,
            "label": "和声护盾"
          }
        ]
      },
      "bloodAegis": {
        "name": "血盾冲顶",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 9.4,
        "openingCooldown": 2.4,
        "icon": "bleeding-heart",
        "desc": "狂战士副流派：风险前排。主动掉血换自盾和守势，提前进入低血节奏。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.06,
            "type": "blood"
          },
          {
            "kind": "teamShield",
            "selfOnly": true,
            "flat": 58,
            "power": 0.3,
            "label": "血盾"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 2.8,
            "label": "顶住"
          },
          {
            "kind": "timer",
            "timer": "bloodFuryTimer",
            "duration": 3.2,
            "label": "血热"
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
            "flat": 56,
            "power": 0.38,
            "label": "净血"
          },
          {
            "kind": "lowestAllyTimer",
            "timer": "dotResistTimer",
            "duration": 5
          }
        ]
      },
      "bloodCleanse": {
        "name": "净血术",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 9.2,
        "openingCooldown": 3.2,
        "icon": "healing",
        "desc": "选择己方剧毒层数最高单位，清除最多5层剧毒并治疗。若无人中毒，则治疗己方最低血量单位。",
        "design": {
          "primaryAnswer": "剧毒叠层队",
          "secondaryUtility": "DOT环境续航、普通单体治疗",
          "targetRule": "highest poison stacks ally, fallback lowest hp ratio ally"
        },
        "effects": [
          {
            "kind": "cleanseStatusAlly",
            "statusType": "poison",
            "amount": 5,
            "healPerStack": 17,
            "fallbackHeal": 26,
            "label": "净血术"
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
      "bloodHex": {
        "name": "血咒蚀刻",
        "type": "小技能",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 8.8,
        "openingCooldown": 2.2,
        "icon": "bleeding-eye",
        "desc": "术士副流派：自伤契约。牺牲血量给目标叠毒，并短暂强化队伍核心。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.08,
            "type": "blood"
          },
          {
            "kind": "poisonTarget",
            "stacks": 4,
            "time": 8
          },
          {
            "kind": "buffCarryPower",
            "amount": 8,
            "duration": 3.5,
            "label": "血咒"
          }
        ]
      },
      "bloodStrike": {
        "name": "血怒斩",
        "type": "小技能",
        "role": "狂战士",
        "cooldown": 5.2,
        "openingCooldown": 4.8,
        "icon": "bloody-sword",
        "desc": "自伤 5% 最大生命，进入 4.4 秒血怒状态；期间普攻额外造成攻击力 48% 伤害，越残伤害和攻速越高。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.05,
            "type": "blood"
          },
          {
            "kind": "timer",
            "timer": "bloodFuryTimer",
            "duration": 4.4,
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
        "openingCooldown": 6.2,
        "icon": "spinning-sword",
        "desc": "进入 5 秒旋风架势；期间普攻主目标额外造成攻击力 26% 伤害，并溅射附近 2 个敌人各攻击力 18%。用于把低血普攻转成小范围压力。",
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
      "bulwarkRiposte": {
        "name": "壁垒回击",
        "type": "小技能",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 10.5,
        "openingCooldown": 2.8,
        "icon": "shield-bash",
        "desc": "骑士副定位：反击前排。给自己护盾和短减伤，并开启一次小型近战反击窗口；用于把护盾从纯生存转成可见反打。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 48,
            "power": 0.3,
            "label": "壁垒",
            "selfOnly": true
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 3.5,
            "label": "守势"
          },
          {
            "kind": "teamRetaliation",
            "duration": 3.8,
            "requiresBlockedDamage": true,
            "meleeOnly": true,
            "flat": 4,
            "power": 0.07,
            "blockedRatio": 0.28,
            "cooldown": 0.9,
            "label": "壁垒回击"
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
      "chargerMomentum": {
        "name": "冲阵余势",
        "type": "被动",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 0,
        "icon": "cavalry",
        "desc": "骑士冲锋流入口：对被减速的敌人更有压制力，自身稍微更快更脆。区别于铁壁骑士，它强调开战节奏和扰乱阵线。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "powerAdd": 3,
            "armorAdd": -1
          },
          {
            "kind": "passiveDamageAmp",
            "targetTimer": "slowTimer",
            "amp": 0.12
          }
        ]
      },
      "chorusKeeper": {
        "name": "和声守护者",
        "type": "被动",
        "role": "吟游诗人",
        "roleKeys": [
          "bard"
        ],
        "cooldown": 0,
        "icon": "lyre",
        "desc": "诗人新流派入口：把诗人从纯加速改成防守辅助，治疗和护盾略强但不直接提高输出。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveHealAmp",
            "amp": 0.12
          },
          {
            "kind": "passiveShieldAmp",
            "amp": 0.1
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
            "flat": 20,
            "power": 0.25,
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
      "cooldownRift": {
        "name": "冷却裂隙",
        "type": "小技能",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 10.5,
        "openingCooldown": 3,
        "icon": "frostfire",
        "desc": "攻击敌方技能急速最高单位；若相同，选择法术强度最高者。造成冰霜伤害，并延长其当前最快冷却技能。",
        "design": {
          "primaryAnswer": "依赖大招或技能窗口的队伍",
          "secondaryUtility": "通用节奏干扰",
          "targetRule": "highest skillHasteMult enemy, tie highest magicPower"
        },
        "effects": [
          {
            "kind": "hitHighestSkillHasteEnemyDelay",
            "flat": 20,
            "power": 0.28,
            "type": "frost",
            "scaleWith": "magic",
            "delay": 1.2,
            "label": "冷却裂隙"
          }
        ]
      },
      "corrosiveFoam": {
        "name": "腐蚀泡沫",
        "type": "小技能",
        "role": "炼金师",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 8.7,
        "openingCooldown": 2.1,
        "icon": "foam",
        "desc": "炼金副流派：控场异常。给目标同时挂毒、燃烧和减速，制造后续反应条件。",
        "effects": [
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 7
          },
          {
            "kind": "burnTarget",
            "stacks": 2,
            "time": 7
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 3
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
            "duration": 4.8,
            "amount": 16,
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
      "crimsonCyclone": {
        "name": "赤血旋风",
        "type": "大招",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 33,
        "openingCooldown": 12,
        "icon": "whirlwind",
        "desc": "狂战士副流派大招：付血开启狂怒，并扫击多个近敌。不是无脑秒人，而是把低血窗口做成范围压力。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.08,
            "type": "blood"
          },
          {
            "kind": "berserkerRoar"
          },
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 28,
            "power": 0.42,
            "type": "physical",
            "label": "赤血旋风"
          }
        ]
      },
      "crimsonPact": {
        "name": "赤契术式",
        "type": "被动",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 0,
        "icon": "cultist",
        "desc": "术士新流派入口：生命更厚，毒伤更强；自身低血时直伤也提升，强调风险换收益。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "maxHpMult": 1.08,
            "armorAdd": 1
          },
          {
            "kind": "passiveDotAmp",
            "type": "poison",
            "amp": 0.15
          },
          {
            "kind": "passiveDamageAmp",
            "sourceHpBelow": 0.65,
            "amp": 0.08
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
      "distillationLoop": {
        "name": "蒸馏循环",
        "type": "被动",
        "role": "炼金师",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 0,
        "icon": "chemical-drop",
        "desc": "炼金新流派入口：不追求一次性爆炸，而是提高毒和燃烧的持续收益。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDotAmp",
            "type": "poison",
            "amp": 0.09
          },
          {
            "kind": "passiveDotAmp",
            "type": "burn",
            "amp": 0.09
          },
          {
            "kind": "passiveDamageAmp",
            "requiresStatus": true,
            "amp": 0.04
          }
        ]
      },
      "duelChallenge": {
        "name": "点名决斗",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 7.2,
        "openingCooldown": 1.6,
        "icon": "crossed-swords",
        "desc": "战士决斗流小技能：点名当前目标，短时间内把战斗变成一对一压制。玩家应看到战士反复追打同一个被点名目标。",
        "effects": [
          {
            "kind": "targetTimer",
            "timer": "duelTimer",
            "duration": 5.2
          },
          {
            "kind": "hitTarget",
            "flat": 24,
            "power": 0.34,
            "type": "physical",
            "label": "点名"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 1.8,
            "label": "架势"
          }
        ]
      },
      "duelistBreak": {
        "name": "决斗破势",
        "type": "大招",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 30,
        "openingCooldown": 13,
        "icon": "sword-wound",
        "desc": "战士副流派大招：对当前目标打一次高压破势，目标身上状态越多越痛，但没有全队增益。",
        "effects": [
          {
            "kind": "hitTargetWithStatus",
            "flat": 42,
            "power": 0.65,
            "perStatus": 5,
            "maxStatus": 6,
            "type": "physical",
            "label": "破势"
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 3.2
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
      "duelistOath": {
        "name": "决斗誓约",
        "type": "被动",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 0,
        "icon": "duel",
        "desc": "战士决斗流入口：对被点名决斗的目标造成更高伤害，但不提供团队光环。强在单点压制，弱在被群体、控制和换目标拖散。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "powerAdd": 3,
            "armorAdd": 1
          },
          {
            "kind": "passiveDamageAmp",
            "targetTimer": "duelTimer",
            "amp": 0.16
          }
        ]
      },
      "duskStep": {
        "name": "暗幕步",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 8.6,
        "openingCooldown": 2.6,
        "icon": "cloak-dagger",
        "desc": "攻击后排中血量比例最低的敌人；无后排时攻击全场最低血量敌人。主答后排核心，副用处决残血。",
        "design": {
          "primaryAnswer": "后排核心",
          "secondaryUtility": "处决残血、打牧师法师游侠",
          "targetRule": "lowest hp ratio backline enemy, fallback lowest hp ratio enemy"
        },
        "effects": [
          {
            "kind": "hitBacklineLowestEnemy",
            "flat": 24,
            "power": 0.34,
            "missingTargetHpFlat": 16,
            "type": "physical",
            "scaleWith": "physical",
            "label": "暗幕步"
          }
        ]
      },
      "emberConversion": {
        "name": "余烬转化",
        "type": "被动",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 0,
        "icon": "fire-shield",
        "desc": "自己造成燃烧或火焰伤害时获得护盾。主答火焰环境，副用火毒混合队自保。",
        "passive": true,
        "design": {
          "primaryAnswer": "火焰爆发队",
          "secondaryUtility": "异常流自保、火毒混合流",
          "targetRule": "self when source damage type is burn or fire"
        },
        "effects": [
          {
            "kind": "shieldSourceOnDamageType",
            "type": "burn",
            "flat": 4,
            "damageRatio": 0.22,
            "label": "余烬转化"
          },
          {
            "kind": "shieldSourceOnDamageType",
            "type": "fire",
            "flat": 4,
            "damageRatio": 0.18,
            "label": "余烬转化"
          }
        ]
      },
      "emberPrayer": {
        "name": "净焰祷言",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 8.8,
        "openingCooldown": 1.4,
        "icon": "holy-water",
        "desc": "选择己方燃烧层数最高单位，清除最多5层燃烧并治疗。若无人燃烧，则治疗己方最低血量单位。",
        "design": {
          "primaryAnswer": "燃烧爆发队",
          "secondaryUtility": "普通单体治疗",
          "targetRule": "highest burn stacks ally, fallback lowest hp ratio ally"
        },
        "effects": [
          {
            "kind": "cleanseStatusAlly",
            "statusType": "burn",
            "amount": 7,
            "healPerStack": 20,
            "fallbackHeal": 34,
            "label": "净焰祷言"
          },
          {
            "kind": "teamTimer",
            "timer": "guardTimer",
            "duration": 5,
            "label": "净焰守护"
          }
        ]
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
      "filterElixir": {
        "name": "过滤药剂",
        "type": "被动",
        "role": "炼金术士",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 0,
        "icon": "round-bottom-flask",
        "desc": "自身受到燃烧或剧毒伤害后，获得短暂DOT抗性。主答DOT队，副用抗异常环境。",
        "passive": true,
        "design": {
          "primaryAnswer": "DOT队",
          "secondaryUtility": "抗火、抗毒、抗异常副本环境",
          "targetRule": "self after taking poison/burn/fire damage"
        },
        "effects": [
          {
            "kind": "dotResistOnDotTaken",
            "duration": 4
          }
        ]
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
            "kind": "hitEnemies",
            "count": 2,
            "flat": 15,
            "power": 0.2,
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
      "forbiddenOffering": {
        "name": "禁忌献祭",
        "type": "大招",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 35,
        "openingCooldown": 14,
        "icon": "pentacle",
        "desc": "术士副流派大招：付出大量血量引爆毒层，并重新留下少量毒，适合长线毒队的兑现。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.12,
            "type": "blood"
          },
          {
            "kind": "plagueOffering",
            "flat": 30,
            "power": 0.24,
            "perPoison": 10,
            "retain": 0.42,
            "reapply": 2,
            "reapplyTime": 7
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
      "frenzyBreakRoar": {
        "name": "碎阵怒吼",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 11,
        "openingCooldown": 3.2,
        "icon": "screaming",
        "desc": "自伤进入风险窗口，获得攻速、吸血和DOT抗性。主答拖长线DOT队，副用启动低血普攻流。",
        "design": {
          "primaryAnswer": "毒队和控制拖长线",
          "secondaryUtility": "低血普攻流启动器",
          "targetRule": "self"
        },
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.1,
            "type": "self"
          },
          {
            "kind": "timer",
            "timer": "hasteTimer",
            "duration": 5
          },
          {
            "kind": "timer",
            "timer": "lifeStealTimer",
            "duration": 5
          },
          {
            "kind": "timer",
            "timer": "dotResistTimer",
            "duration": 5
          }
        ]
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
      "frostScholar": {
        "name": "霜纹学者",
        "type": "被动",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 0,
        "icon": "frozen-orb",
        "desc": "法师新流派入口：不靠火焰爆发，而是让减速目标承受更多法术压力。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "powerAdd": 2
          },
          {
            "kind": "passiveDamageAmp",
            "targetTimer": "slowTimer",
            "amp": 0.12
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
      "glacierShard": {
        "name": "冰川碎片",
        "type": "小技能",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 7.8,
        "openingCooldown": 2,
        "icon": "ice-bolt",
        "desc": "法师副流派：冰霜压速。打单体并制造较长减速，为后排争取时间。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 26,
            "power": 0.42,
            "type": "arcane",
            "label": "冰川碎片"
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 4
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
            "flat": 54,
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
      "huntRhythm": {
        "name": "猎杀节律",
        "type": "被动",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 0,
        "icon": "targeted",
        "desc": "实验刺客核心：普攻叠猎痕，猎痕既是后续割喉的资源，也给少量自保。目标是让敏捷通过普攻频率转化成处决资源。",
        "passive": true,
        "design": {
          "primaryOutput": "basic attack resource setup",
          "expectedScaling": "attackSpeed + physicalPower",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "刺客团战只能靠堆生存摸到人",
          "secondaryUtility": "标记资源、轻量自保、处决准备",
          "targetRule": "basic attack target"
        },
        "effects": [
          {
            "kind": "basicAttackMark",
            "stacks": 1,
            "max": 5
          },
          {
            "kind": "basicAttackSelfShield",
            "flat": 3,
            "perMark": 2,
            "label": "猎步"
          },
          {
            "kind": "fadeOnLowHp",
            "threshold": 0.42,
            "guardDuration": 2.1,
            "shieldFlat": 8,
            "shieldPower": 0.55,
            "scaleWith": "physical",
            "once": true,
            "label": "影遁"
          }
        ]
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
      "interceptVow": {
        "name": "截护誓言",
        "type": "小技能",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 10.2,
        "openingCooldown": 2.6,
        "icon": "checked-shield",
        "desc": "骑士副流派：主动保护核心。给最高输出队友护盾，同时自己短暂嘲讽与减伤。",
        "effects": [
          {
            "kind": "shieldCarryAlly",
            "flat": 34,
            "power": 0.28,
            "label": "截护"
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 2.4,
            "label": "誓言"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 2.4,
            "label": "守护"
          }
        ]
      },
      "killZone": {
        "name": "猎杀禁区",
        "type": "大招",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 32,
        "openingCooldown": 14,
        "icon": "arrow-cluster",
        "desc": "游侠副流派大招：大范围减速后箭雨压制，让陷阱流有清晰开场窗口。",
        "effects": [
          {
            "kind": "enemyTimers",
            "timer": "slowTimer",
            "duration": 5.2,
            "label": "禁区"
          },
          {
            "kind": "arrowStorm"
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
      "kingmarkShot": {
        "name": "猎王印记",
        "type": "小技能",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 8.2,
        "openingCooldown": 1.8,
        "icon": "targeted",
        "desc": "标记敌方物理强度+法术强度最高的单位。主答单核队，副用服务标记、处决和决斗集火。",
        "design": {
          "primaryAnswer": "单核输出队",
          "secondaryUtility": "标记流、处决流、决斗流",
          "targetRule": "highest physicalPower + magicPower enemy"
        },
        "effects": [
          {
            "kind": "markHighestPowerEnemy",
            "stacks": 4,
            "max": 8,
            "shieldBreak": 42,
            "shieldVulnerableDuration": 5,
            "label": "猎王印记"
          }
        ]
      },
      "lanceCharge": {
        "name": "枪骑冲锋",
        "type": "小技能",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 9.4,
        "openingCooldown": 0.8,
        "icon": "mounted-knight",
        "desc": "骑士冲锋流小技能：开局很早冲击前线，伤害不高，但会减速敌方前排并让自己短暂承压。",
        "effects": [
          {
            "kind": "chargeToTarget",
            "distance": 20,
            "stopRange": 7,
            "attackCd": 0.05,
            "impactCount": 2,
            "pushDistance": 1.5,
            "attackDelay": 0.35,
            "label": "冲锋"
          },
          {
            "kind": "hitEnemies",
            "count": 2,
            "flat": 20,
            "power": 0.28,
            "type": "physical",
            "label": "冲锋"
          },
          {
            "kind": "enemyTimers",
            "count": 2,
            "timer": "slowTimer",
            "duration": 2.8,
            "label": "冲乱"
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 2.2,
            "label": "亮旗"
          }
        ]
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
      "lineHold": {
        "name": "压线护步",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 8.2,
        "openingCooldown": 2.6,
        "icon": "shield-impact",
        "desc": "战士副定位：半保护前排。打一名前排目标，同时给最低血队友一层小盾；战士仍以压线为主，但能补一点保护。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 18,
            "power": 0.28,
            "type": "physical",
            "label": "压线"
          },
          {
            "kind": "shieldLowestAlly",
            "flat": 28,
            "power": 0.18,
            "label": "护步"
          }
        ]
      },
      "loneVeteran": {
        "name": "孤胆老兵",
        "type": "被动",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 0,
        "icon": "round-shield",
        "desc": "战士新流派入口：自身面板更硬，打前排略强，但不提供团队乘算资源。适合自洽单兵而不是吃满 buff 的核心。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "maxHpAdd": 18,
            "armorAdd": 2,
            "powerAdd": 2
          },
          {
            "kind": "passiveDamageAmp",
            "targetLine": "前排",
            "amp": 0.04
          }
        ]
      },
      "lullabyGuard": {
        "name": "安魂守拍",
        "type": "小技能",
        "role": "吟游诗人",
        "roleKeys": [
          "bard"
        ],
        "cooldown": 9.6,
        "openingCooldown": 2.4,
        "icon": "musical-score",
        "desc": "诗人副流派：防守节奏。减缓两个近敌，并给低血队友护盾。",
        "effects": [
          {
            "kind": "enemyTimers",
            "count": 2,
            "timer": "slowTimer",
            "duration": 2.4,
            "label": "安魂"
          },
          {
            "kind": "shieldLowestAlly",
            "flat": 24,
            "power": 0.18,
            "label": "守拍"
          }
        ]
      },
      "markDetonate": {
        "name": "猎标引爆",
        "type": "小技能",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 8.4,
        "openingCooldown": 4.4,
        "icon": "bullseye",
        "desc": "游侠副定位：标记兑现。对当前标记目标造成按层数提升的伤害，但不额外铺标；用于区分铺标技能和兑现技能。",
        "effects": [
          {
            "kind": "hitMarkedTarget",
            "flat": 18,
            "power": 0.24,
            "perMark": 7,
            "type": "physical",
            "label": "猎标引爆"
          }
        ]
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
      "martyrAegis": {
        "name": "殉道圣盾",
        "type": "被动",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 0,
        "icon": "holy-symbol",
        "desc": "牧师新流派入口：自身生命和护甲提高，给自己的治疗/护盾更强，适合站前排承担压力，但输出更低。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "maxHpMult": 1.32,
            "armorAdd": 4,
            "powerMult": 0.86,
            "rangeAdd": -16
          },
          {
            "kind": "passiveShieldAmp",
            "selfOnly": true,
            "amp": 0.2
          },
          {
            "kind": "passiveHealAmp",
            "selfOnly": true,
            "amp": 0.15
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
      "midnightBloom": {
        "name": "午夜毒绽",
        "type": "大招",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 31,
        "openingCooldown": 12,
        "icon": "deadly-strike",
        "desc": "刺客副流派大招：先给敌队撒毒，再重刺最低血目标，强调毒线收割而不是裸秒。",
        "effects": [
          {
            "kind": "poisonEnemies",
            "stacks": 2,
            "time": 8
          },
          {
            "kind": "hitLowestEnemy",
            "flat": 40,
            "power": 0.55,
            "missingTargetHpFlat": 52,
            "type": "shadow",
            "label": "午夜毒绽"
          }
        ]
      },
      "oathBulwark": {
        "name": "誓约壁垒",
        "type": "大招",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 34,
        "openingCooldown": 17,
        "icon": "shield-reflect",
        "desc": "骑士副流派大招：全队开盾，并给短反击窗口；用于把保护转成可见反打。",
        "effects": [
          {
            "kind": "teamShield",
            "flat": 46,
            "power": 0.34,
            "label": "誓约壁垒"
          },
          {
            "kind": "teamRetaliation",
            "duration": 4.5,
            "requiresBlockedDamage": true,
            "meleeOnly": true,
            "flat": 5,
            "power": 0.08,
            "blockedRatio": 0.24,
            "cooldown": 0.95,
            "label": "誓约反击"
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
      "oathbreakerSlash": {
        "name": "破势斩",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 7.8,
        "openingCooldown": 2.4,
        "icon": "broken-shield",
        "desc": "攻击当前目标。若目标有护盾，额外破盾，并短暂降低其获得护盾量。主答护盾核心，副用打任何盾墙前排。",
        "design": {
          "primaryAnswer": "护盾保护队",
          "secondaryUtility": "铁壁、牧师盾、前排盾",
          "targetRule": "current target"
        },
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 24,
            "power": 0.36,
            "type": "physical",
            "scaleWith": "physical",
            "label": "破势斩",
            "shieldBreak": 58,
            "shieldVulnerableDuration": 4
          }
        ]
      },
      "painAnchor": {
        "name": "痛楚锚定",
        "type": "被动",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 0,
        "icon": "spiked-shell",
        "desc": "狂战士新流派入口：更像带风险的前排锚点。血量越危险越有输出，但只提供有限稳定性，不能变成通用硬坦。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "maxHpMult": 1.07,
            "armorAdd": 1
          },
          {
            "kind": "passiveDamageAmp",
            "sourceHpBelow": 0.45,
            "amp": 0.05
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
      "perfectReaction": {
        "name": "完美反应",
        "type": "大招",
        "role": "炼金师",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 34,
        "openingCooldown": 14,
        "icon": "chemical-bolt",
        "desc": "炼金副流派大招：根据敌人身上的异常数量造成奥术反应伤害，并补少量毒层。",
        "effects": [
          {
            "kind": "grandMixture",
            "flat": 25,
            "power": 0.2,
            "perStatus": 10,
            "maxStatus": 9
          },
          {
            "kind": "poisonEnemies",
            "stacks": 1,
            "time": 6
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
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 1.5,
            "label": "braced",
            "tone": "shield"
          },
          {
            "kind": "hitTarget",
            "flat": 34,
            "power": 0.48,
            "type": "physical",
            "label": "重击"
          }
        ]
      },
      "purifyingWard": {
        "name": "净化结界",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 10.5,
        "openingCooldown": 3,
        "icon": "holy-symbol",
        "desc": "牧师副定位：抗异常前排。给最低血队友护盾和短 DOT 抗性，不提高输出，专门对抗毒/燃烧窗口。",
        "effects": [
          {
            "kind": "shieldLowestAlly",
            "flat": 46,
            "power": 0.34,
            "label": "净化"
          },
          {
            "kind": "lowestAllyTimer",
            "timer": "dotResistTimer",
            "duration": 6
          }
        ]
      },
      "radiantInterpose": {
        "name": "辉光拦截",
        "type": "小技能",
        "role": "牧师",
        "roleKeys": [
          "priest"
        ],
        "cooldown": 10.6,
        "openingCooldown": 2.4,
        "icon": "aura",
        "desc": "牧师副流派：圣盾前排。给自己护盾、嘲讽和守势，把治疗者变成可以短暂挡刀的肉盾。",
        "effects": [
          {
            "kind": "teamShield",
            "selfOnly": true,
            "flat": 58,
            "power": 0.28,
            "label": "辉光拦截"
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 2.8,
            "label": "拦截"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 3.2,
            "label": "圣盾"
          }
        ]
      },
      "rageChain": {
        "name": "怒血连击",
        "type": "被动",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 0,
        "icon": "rage",
        "desc": "实验狂战核心：普攻叠怒血，怒血提高后续普攻速度、普攻伤害和少量吸血。目标是让敏捷通过普攻频率自然转化成狂战价值。",
        "passive": true,
        "design": {
          "primaryOutput": "basic attack",
          "expectedScaling": "attackSpeed + physicalPower",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "狂战过度依赖大招",
          "secondaryUtility": "长线普攻和低血吸血节奏",
          "targetRule": "self basic attacks"
        },
        "effects": [
          {
            "kind": "basicAttackRage",
            "stacks": 1,
            "lowHpExtraStacks": 1,
            "max": 8,
            "attackSpeedPerStack": 0.025,
            "damagePerStack": 0.012,
            "lowHpDamagePerStack": 0.006,
            "leechPerStack": 0.006,
            "lowHpLeechBonus": 0.035,
            "lowHpThreshold": 0.45,
            "label": "怒血连击"
          }
        ]
      },
      "rageEngine": {
        "name": "血怒引擎",
        "type": "被动",
        "role": "狂战士",
        "cooldown": 0,
        "icon": "rage",
        "desc": "低血时普攻更快、更痛，并按已造成伤害吸血；高血时收益较低，越接近危险血线越像狂战。",
        "passive": true,
        "effects": []
      },
      "rageRelease": {
        "name": "怒血释放",
        "type": "大招",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 28,
        "openingCooldown": 11,
        "icon": "lion",
        "desc": "根据已有怒血层数打开短攻速、吸血和血怒窗口。大招只放大前面的普攻循环，不负责从零启动狂战。",
        "design": {
          "primaryOutput": "basic attack burst window",
          "expectedScaling": "attackSpeed + physicalPower through rage stacks",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "狂战大招依赖过高",
          "secondaryUtility": "把长线普攻资源兑现为短爆发",
          "targetRule": "self"
        },
        "effects": [
          {
            "kind": "rageRelease",
            "addStacks": 2,
            "max": 8,
            "baseDuration": 3.6,
            "durationPerStack": 0.18,
            "maxBonusDuration": 1.6,
            "label": "怒血释放",
            "tone": "damage"
          }
        ]
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
      "rendingFury": {
        "name": "裂肉狂斩",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 7.4,
        "openingCooldown": 2.8,
        "icon": "bloody-sword",
        "desc": "造成物理伤害，并打开短血怒普攻窗口。它不是大招替代品，而是把武力和普攻窗口绑在一起。",
        "design": {
          "primaryOutput": "physical direct + basic attack window",
          "expectedScaling": "physicalPower",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "狂战平时普攻价值不足",
          "secondaryUtility": "前排持续压低血线",
          "targetRule": "current target"
        },
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 18,
            "power": 0.32,
            "type": "physical",
            "scaleWith": "physical",
            "label": "裂肉狂斩"
          },
          {
            "kind": "timer",
            "timer": "bloodFuryTimer",
            "duration": 3.2,
            "label": "裂肉血怒",
            "tone": "damage"
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
            "flat": 49,
            "power": 0.34,
            "label": "复苏"
          },
          {
            "kind": "teamShield",
            "flat": 43,
            "power": 0.32,
            "label": "圣域"
          }
        ]
      },
      "resonantFinale": {
        "name": "共鸣终曲",
        "type": "大招",
        "role": "吟游诗人",
        "roleKeys": [
          "bard"
        ],
        "cooldown": 33,
        "openingCooldown": 14,
        "icon": "sonic-shout",
        "desc": "诗人副流派大招：同时提供短加速、团队小治疗和护盾，是偏稳态的终曲而非爆发终曲。",
        "effects": [
          {
            "kind": "teamTimer",
            "timer": "hasteTimer",
            "duration": 5,
            "label": "共鸣"
          },
          {
            "kind": "teamHeal",
            "flat": 30,
            "power": 0.16,
            "label": "终曲治疗"
          },
          {
            "kind": "teamShield",
            "flat": 24,
            "power": 0.18,
            "label": "终曲护盾"
          }
        ]
      },
      "retaliationBanner": {
        "name": "壁垒军旗",
        "type": "大招",
        "role": "骑士",
        "cooldown": 34,
        "openingCooldown": 3.5,
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
      "royalCavalryBreak": {
        "name": "王骑破阵",
        "type": "大招",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 33,
        "openingCooldown": 11.5,
        "icon": "horse-head",
        "desc": "骑士冲锋流大招：一次大范围破阵，压慢敌方前线并给自己守势。它不是纯防御大招，而是抢节奏的大冲锋。",
        "effects": [
          {
            "kind": "chargeToTarget",
            "distance": 16,
            "stopRange": 6,
            "attackCd": 0.05,
            "impactCount": 3,
            "pushDistance": 3.2,
            "attackDelay": 0.75,
            "shieldBreak": 90,
            "label": "破阵"
          },
          {
            "kind": "shieldBreakEnemies",
            "count": 3,
            "amount": 115,
            "label": "破阵碎盾"
          },
          {
            "kind": "hitEnemies",
            "count": 3,
            "flat": 28,
            "power": 0.36,
            "type": "physical",
            "label": "王骑破阵"
          },
          {
            "kind": "enemyTimers",
            "count": 3,
            "timer": "slowTimer",
            "duration": 4.6,
            "label": "破阵"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 3.2,
            "label": "回马"
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
            "flat": 40,
            "power": 0.28,
            "label": "庇护"
          },
          {
            "kind": "teamShield",
            "flat": 37,
            "power": 0.3,
            "label": "庇护"
          }
        ]
      },
      "scarletChallenge": {
        "name": "赤血挑衅",
        "type": "小技能",
        "role": "狂战士",
        "roleKeys": [
          "berserker"
        ],
        "cooldown": 9.2,
        "openingCooldown": 3.6,
        "icon": "bleeding-eye",
        "desc": "狂战副定位：风险前排。自伤进入危险线，短暂嘲讽和减伤，让低血流能承担一点前排任务，但风险真实存在。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.06,
            "type": "blood"
          },
          {
            "kind": "timer",
            "timer": "tauntTimer",
            "duration": 3.2,
            "label": "挑衅"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 2.6,
            "label": "硬撑"
          }
        ]
      },
      "shadowBurstAmbush": {
        "name": "暗影突袭",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 8.4,
        "openingCooldown": 1.8,
        "icon": "cloak-dagger",
        "desc": "暗影爆发贼入口：切入敌方后排血量比例最低目标，短暂进入隐藏状态。普通敌人不会优先转火他，但被他命中的目标会短暂反击。",
        "design": {
          "primaryOutput": "hidden backline burst",
          "expectedScaling": "attackSpeed + physicalPower",
          "forbiddenScaling": "magicPower + raw durability",
          "primaryAnswer": "刺客切入后被全队转火",
          "secondaryUtility": "后排扰乱、短窗口收割",
          "targetRule": "lowest hp ratio backline enemy"
        },
        "effects": [
          {
            "kind": "shadowStepStrike",
            "flat": 16,
            "power": 0.34,
            "missingTargetHpFlat": 8,
            "markStacks": 2,
            "markMax": 5,
            "hiddenDuration": 2.8,
            "retaliateDuration": 0.8,
            "guardDuration": 0.5,
            "lockDuration": 3,
            "attackCd": 0.06,
            "type": "physical",
            "scaleWith": "physical",
            "label": "暗影突袭"
          }
        ]
      },
      "shadowCut": {
        "name": "影切",
        "type": "小技能",
        "role": "刺客",
        "cooldown": 6.6,
        "icon": "sprint",
        "desc": "跳向低血目标，制造收割压力并帮助大招进入处决线。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 18,
            "power": 0.3,
            "missingTargetHpFlat": 12,
            "type": "shadow",
            "label": "影切"
          }
        ]
      },
      "shadowHarvest": {
        "name": "暗影收割",
        "type": "大招",
        "role": "刺客",
        "cooldown": 27.5,
        "openingCooldown": 5.8,
        "icon": "cloak-dagger",
        "desc": "处决低血目标。前期形成第一次收割窗口，但需要目标先被压低。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 52,
            "power": 0.48,
            "missingTargetHpFlat": 38,
            "type": "shadow",
            "label": "收割"
          }
        ]
      },
      "shadowMomentum": {
        "name": "影势连杀",
        "type": "被动",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 0,
        "icon": "targeted",
        "desc": "暗影爆发贼被动：普攻叠猎标，并略微提高攻速。它不提供通用肉度，目标是让隐藏窗口里的普攻频率变成收割资源。",
        "passive": true,
        "design": {
          "primaryOutput": "hidden window resource conversion",
          "expectedScaling": "attackSpeed + physicalPower",
          "forbiddenScaling": "magicPower + generic tankiness",
          "primaryAnswer": "刺客输出窗口太短，攻速无法兑现",
          "secondaryUtility": "猎标积累、收割准备",
          "targetRule": "basic attack target"
        },
        "effects": [
          {
            "kind": "passiveStat",
            "attackSpeedMult": 1.08
          },
          {
            "kind": "basicAttackMark",
            "stacks": 1,
            "max": 5
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
      "shieldwallRiposte": {
        "name": "盾墙反制",
        "type": "被动",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 0,
        "icon": "shield-reflect",
        "desc": "自身护盾吸收近战伤害后反击，并短暂进入嘲讽窗口。主答近战刺客，副用反制高频普攻。",
        "passive": true,
        "design": {
          "primaryAnswer": "近战刺客和高频近战",
          "secondaryUtility": "护盾前排通用反打",
          "targetRule": "melee source after blocked damage"
        },
        "effects": [
          {
            "kind": "counterOnDamageTaken",
            "requiresBlockedDamage": true,
            "meleeOnly": true,
            "flat": 10,
            "power": 0.12,
            "blockedRatio": 0.45,
            "cooldown": 1.2,
            "tauntDuration": 2.5,
            "label": "盾墙反制"
          }
        ]
      },
      "singleCombatVerdict": {
        "name": "单挑裁决",
        "type": "大招",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 31,
        "openingCooldown": 12,
        "icon": "sword-wound",
        "desc": "战士决斗流大招：重击被点名或当前目标，并重新拉长决斗窗口。它应该像一次明确的单挑斩杀尝试，而不是范围清场。",
        "effects": [
          {
            "kind": "targetTimer",
            "timer": "duelTimer",
            "duration": 6.4
          },
          {
            "kind": "hitTargetWithStatus",
            "flat": 50,
            "power": 0.72,
            "perStatus": 6,
            "maxStatus": 5,
            "type": "physical",
            "label": "单挑裁决"
          }
        ]
      },
      "snareShot": {
        "name": "缚足箭",
        "type": "小技能",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 7.6,
        "openingCooldown": 2.1,
        "icon": "arrow-scope",
        "desc": "游侠副流派：陷阱控制。给目标减速并打上标记，用控制创造猎杀窗口。",
        "effects": [
          {
            "kind": "markTarget",
            "stacks": 2,
            "max": 8
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 3.4
          },
          {
            "kind": "hitMarkedTarget",
            "flat": 12,
            "power": 0.22,
            "perMark": 4,
            "type": "physical",
            "label": "缚足箭"
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
      "stabilizingVapor": {
        "name": "稳定蒸汽",
        "type": "小技能",
        "role": "炼金师",
        "roleKeys": [
          "alchemist"
        ],
        "cooldown": 9.5,
        "openingCooldown": 3.5,
        "icon": "fizzing-flask",
        "desc": "炼金副定位：异常辅助。给目标同时加少量燃烧和剧毒，并短暂减速；它负责铺材料，不负责直接爆发。",
        "effects": [
          {
            "kind": "burnTarget",
            "stacks": 1,
            "time": 6
          },
          {
            "kind": "poisonTarget",
            "stacks": 1,
            "time": 7
          },
          {
            "kind": "targetTimer",
            "timer": "slowTimer",
            "duration": 2.4
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
            "duration": 4,
            "label": "急板",
            "tone": "heal"
          }
        ]
      },
      "throatCut": {
        "name": "割喉收束",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 6.8,
        "openingCooldown": 4.2,
        "icon": "daggers",
        "desc": "消费当前目标猎痕造成物理伤害，目标越残越痛。它把普攻叠层转换成处决，不直接制造秒杀。",
        "design": {
          "primaryOutput": "mark payoff + execute",
          "expectedScaling": "physicalPower + attackSpeed through mark stacks",
          "forbiddenScaling": "magicPower",
          "primaryAnswer": "刺客普攻资源缺少兑现",
          "secondaryUtility": "收割残血、压制后排",
          "targetRule": "current target"
        },
        "effects": [
          {
            "kind": "hitMarkedTarget",
            "flat": 16,
            "power": 0.3,
            "perMark": 8,
            "consumeMark": true,
            "type": "physical",
            "scaleWith": "physical",
            "label": "割喉收束"
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
      "toxinExecution": {
        "name": "淬毒处刑",
        "type": "被动",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 0,
        "icon": "poison-bottle",
        "desc": "刺客新流派入口：不追求开局秒人，而是对带异常的低血目标持续加压。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDotAmp",
            "type": "poison",
            "amp": 0.14
          },
          {
            "kind": "passiveDamageAmp",
            "requiresStatus": true,
            "targetHpBelow": 0.5,
            "amp": 0.07
          }
        ]
      },
      "trapSense": {
        "name": "陷阱嗅觉",
        "type": "被动",
        "role": "游侠",
        "roleKeys": [
          "ranger"
        ],
        "cooldown": 0,
        "icon": "trap-mask",
        "desc": "游侠新流派入口：对被减速目标和标记目标更强，鼓励队伍先控场再集火。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveDamageAmp",
            "targetTimer": "slowTimer",
            "amp": 0.1,
            "perMark": 0.012
          },
          {
            "kind": "passiveStat",
            "rangeAdd": 2
          }
        ]
      },
      "undyingRoar": {
        "name": "不死战吼",
        "type": "大招",
        "role": "狂战士",
        "cooldown": 24,
        "icon": "lion",
        "desc": "自身 4.8 秒内不会低于 1 点生命，并获得 5.2 秒急速、血怒、旋风和吸血窗口；这是低血翻盘键，不是长期站桩减伤。",
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
      "venomDividend": {
        "name": "毒息分红",
        "type": "小技能",
        "role": "术士",
        "roleKeys": [
          "warlock"
        ],
        "cooldown": 9.2,
        "openingCooldown": 3.8,
        "icon": "poison-bottle",
        "desc": "术士副定位：毒层转队友资源。自伤后给目标叠毒，并给最高攻击队友增伤；用风险把持续伤害和核心支援接起来。",
        "effects": [
          {
            "kind": "selfRawDamage",
            "maxHp": 0.04,
            "type": "blood"
          },
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 8
          },
          {
            "kind": "buffCarryPower",
            "duration": 4.5,
            "amount": 12,
            "label": "毒息分红"
          }
        ]
      },
      "venomStep": {
        "name": "毒步穿刺",
        "type": "小技能",
        "role": "刺客",
        "roleKeys": [
          "assassin"
        ],
        "cooldown": 7.2,
        "openingCooldown": 2,
        "icon": "stiletto",
        "desc": "刺客副流派：毒伤处决。攻击最低血敌人，并在当前目标身上补毒，让刺客可以走持续压低血线。",
        "effects": [
          {
            "kind": "hitLowestEnemy",
            "flat": 18,
            "power": 0.26,
            "missingTargetHpFlat": 26,
            "type": "shadow",
            "label": "毒步"
          },
          {
            "kind": "poisonTarget",
            "stacks": 2,
            "time": 7
          }
        ]
      },
      "veteranCut": {
        "name": "老兵稳切",
        "type": "小技能",
        "role": "战士",
        "roleKeys": [
          "warrior"
        ],
        "cooldown": 7.4,
        "openingCooldown": 2.2,
        "icon": "swordman",
        "desc": "战士副流派：孤胆决斗。稳定攻击当前前排，并短暂进入守势，让战士更像自己能站住的决斗者。",
        "effects": [
          {
            "kind": "hitTarget",
            "flat": 24,
            "power": 0.38,
            "type": "physical",
            "label": "稳切"
          },
          {
            "kind": "timer",
            "timer": "guardTimer",
            "duration": 2.2,
            "label": "稳守"
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
            "duration": 3.5
          },
          {
            "kind": "hitEnemies",
            "count": 2,
            "flat": 30,
            "power": 0.3,
            "type": "physical",
            "label": "冲锋"
          }
        ]
      },
      "wardenVow": {
        "name": "守望誓约",
        "type": "被动",
        "role": "骑士",
        "roleKeys": [
          "knight"
        ],
        "cooldown": 0,
        "icon": "shield",
        "desc": "骑士新流派入口：个人护盾收益更高，适合做单点护卫和反击墙，而不是纯群体盾。",
        "passive": true,
        "effects": [
          {
            "kind": "passiveStat",
            "maxHpMult": 1.04,
            "armorAdd": 1
          },
          {
            "kind": "passiveShieldAmp",
            "selfOnly": true,
            "amp": 0.08
          }
        ]
      },
      "whiteout": {
        "name": "白霜封场",
        "type": "大招",
        "role": "法师",
        "roleKeys": [
          "mage"
        ],
        "cooldown": 35,
        "openingCooldown": 15,
        "icon": "snowflake-2",
        "desc": "法师副流派大招：全场减速并造成中等奥术伤害，强化控制窗口而非一波爆炸。",
        "effects": [
          {
            "kind": "enemyTimers",
            "timer": "slowTimer",
            "duration": 6,
            "label": "白霜"
          },
          {
            "kind": "hitEnemies",
            "flat": 24,
            "power": 0.28,
            "type": "arcane",
            "label": "白霜封场"
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
      "bulwarkMarks": {
        "name": "壁垒猎标",
        "desc": "骑士反击承压，双游侠分工铺标与兑现，逐个击破慢速队伍。",
        "design": {
          "fantasy": "Hold melee pressure behind a riposte wall while one ranger builds marks and another cashes them out into focused shots.",
          "experience": {
            "start": "The knight absorbs early melee contact.",
            "transition": "One ranger keeps marks moving while the other waits for a cash-out window.",
            "payoff": "Mark detonation and repeated shots finish one slow target at a time.",
            "reset": "The team waits for the next shield and mark window."
          },
          "primaryOutput": "focusBasic",
          "desiredTags": [
            "shield",
            "counter",
            "mark",
            "markPayoff",
            "focus"
          ],
          "watchTags": [
            "dot",
            "area"
          ],
          "strongMatchups": [
            "ironWall",
            "holySustain"
          ],
          "weakMatchups": [
            "poisonBloom",
            "fireBurst",
            "shadowExecute"
          ],
          "validationOpponents": [
            "ironWall",
            "holySustain",
            "poisonBloom",
            "fireBurst"
          ],
          "curves": [
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.3
            },
            {
              "metric": "counterTriggers",
              "op": ">=",
              "value": 1
            }
          ],
          "signalAcceptance": [
            {
              "metric": "markApplications",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 3
            },
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.3
            }
          ],
          "failureBoundaries": [
            {
              "metric": "counterDamageShare",
              "op": "<=",
              "value": 0.22
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "bulwarkRiposte",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "ranger",
            "small1": "markShot",
            "small2": "markDetonate",
            "passive": "duelistFocus",
            "ultimate": "arrowStorm"
          },
          {
            "role": "ranger",
            "small1": "markRelay",
            "small2": "markDetonate",
            "passive": "duelistFocus",
            "ultimate": "arrowStorm"
          },
          {
            "role": "bard",
            "small1": "battleHymn",
            "small2": "syncopate",
            "passive": "encore",
            "ultimate": "crescendo"
          }
        ]
      },
      "cavalryBreak": {
        "name": "王骑破阵",
        "desc": "骑士用冲锋抢开局节奏，压慢敌方前排，再让队伍趁乱推进。",
        "design": {
          "fantasy": "A charge knight crashes into the enemy front line, slows it, and lets the team attack during the disruption window.",
          "experience": {
            "start": "The knight charges early instead of only waiting behind shields.",
            "transition": "Enemy front units are slowed and briefly pulled into pressure.",
            "payoff": "Royal Cavalry Break creates a larger disruption window.",
            "reset": "The team loses momentum when slow windows expire."
          },
          "primaryOutput": "controlTempo",
          "desiredTags": [
            "charge",
            "slow",
            "frontlinePressure",
            "tempo"
          ],
          "watchTags": [
            "shield",
            "counter"
          ],
          "strongMatchups": [
            "ironWall",
            "duelChampion"
          ],
          "weakMatchups": [
            "poisonBloom",
            "crownCarry"
          ],
          "validationOpponents": [
            "ironWall",
            "duelChampion",
            "poisonBloom"
          ],
          "curves": [
            {
              "metric": "slowApplications",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "controlWindowMeleeRateRatio",
              "op": "<=",
              "value": 0.85
            }
          ],
          "signalAcceptance": [
            {
              "metric": "slowApplications",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "areaDamageShare",
              "op": ">=",
              "value": 0.08
            }
          ],
          "failureBoundaries": [
            {
              "metric": "shieldPerSecond",
              "op": "<=",
              "value": 38
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "lanceCharge",
            "small2": "shieldBash",
            "passive": "chargerMomentum",
            "ultimate": "royalCavalryBreak"
          },
          {
            "role": "warrior",
            "small1": "sunderingAdvance",
            "small2": "lineHold",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "berserker",
            "small1": "bloodStrike",
            "small2": "boneWhirl",
            "passive": "rageEngine",
            "ultimate": "undyingRoar"
          },
          {
            "role": "priest",
            "small1": "mendingLight",
            "small2": "purifyingWard",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
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
      "duelChampion": {
        "name": "决斗冠军",
        "desc": "战士点名一个目标持续单挑，队友只负责稳住窗口，不把伤害摊成一片。",
        "design": {
          "fantasy": "A warrior names one enemy, holds the duel window, and wins through repeated single-target pressure.",
          "experience": {
            "start": "The warrior marks a current front target for a duel.",
            "transition": "Damage concentrates on that target instead of spreading.",
            "payoff": "Single Combat Verdict refreshes the duel and lands a heavy strike.",
            "reset": "The team waits for the next named target."
          },
          "primaryOutput": "singleTargetSkill",
          "desiredTags": [
            "duel",
            "focus",
            "frontlinePressure",
            "singleTarget"
          ],
          "watchTags": [
            "area",
            "teamBuff"
          ],
          "strongMatchups": [
            "ironWall",
            "holySustain"
          ],
          "weakMatchups": [
            "fireBurst",
            "poisonBloom"
          ],
          "validationOpponents": [
            "ironWall",
            "holySustain",
            "fireBurst"
          ],
          "curves": [
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.32
            },
            {
              "metric": "areaDamageShare",
              "op": "<=",
              "value": 0.28
            }
          ],
          "signalAcceptance": [
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.32
            },
            {
              "metric": "basicDamageShare",
              "op": ">=",
              "value": 0.18
            }
          ],
          "failureBoundaries": [
            {
              "metric": "areaDamageShare",
              "op": "<=",
              "value": 0.3
            }
          ]
        },
        "team": [
          {
            "role": "warrior",
            "small1": "duelChallenge",
            "small2": "veteranCut",
            "passive": "duelistOath",
            "ultimate": "singleCombatVerdict"
          },
          {
            "role": "knight",
            "small1": "guard",
            "small2": "tauntLine",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "priest",
            "small1": "mendingLight",
            "small2": "purifyingWard",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "bard",
            "small1": "battleHymn",
            "small2": "syncopate",
            "passive": "encore",
            "ultimate": "resonantFinale"
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
      "frostTrapField": {
        "name": "霜陷猎场",
        "desc": "游侠铺陷阱，法师拉长冰霜控制，队伍在减速窗口里集火目标。",
        "design": {
          "fantasy": "Ranger traps and mage frost turn the battlefield into a slow kill zone.",
          "experience": {
            "start": "Trap shots and frost skills apply slow and marks.",
            "transition": "Enemy melee cadence drops during control windows.",
            "payoff": "Marked and slowed targets are finished by focused shots.",
            "reset": "Pressure falls if the team cannot refresh slow."
          },
          "primaryOutput": "controlFocus",
          "desiredTags": [
            "slow",
            "mark",
            "focus",
            "control"
          ],
          "watchTags": [
            "burst",
            "dot"
          ],
          "strongMatchups": [
            "bloodRage",
            "ironWall"
          ],
          "weakMatchups": [
            "fireBurst",
            "poisonBloom"
          ],
          "validationOpponents": [
            "bloodRage",
            "ironWall",
            "poisonBloom"
          ],
          "curves": [
            {
              "metric": "slowApplications",
              "op": ">=",
              "value": 6
            },
            {
              "metric": "controlWindowMeleeRateRatio",
              "op": "<=",
              "value": 0.85
            }
          ],
          "signalAcceptance": [
            {
              "metric": "markApplications",
              "op": ">=",
              "value": 4
            },
            {
              "metric": "lowestTargetDamageShare",
              "op": ">=",
              "value": 0.3
            }
          ],
          "failureBoundaries": [
            {
              "metric": "areaDamageShare",
              "op": "<=",
              "value": 0.45
            }
          ]
        },
        "team": [
          {
            "role": "ranger",
            "small1": "snareShot",
            "small2": "markRelay",
            "passive": "trapSense",
            "ultimate": "killZone"
          },
          {
            "role": "mage",
            "small1": "glacierShard",
            "small2": "iceLance",
            "passive": "frostScholar",
            "ultimate": "whiteout"
          },
          {
            "role": "knight",
            "small1": "lanceCharge",
            "small2": "vowTaunt",
            "passive": "chargerMomentum",
            "ultimate": "royalCavalryBreak"
          },
          {
            "role": "bard",
            "small1": "lullabyGuard",
            "small2": "battleHymn",
            "passive": "chorusKeeper",
            "ultimate": "resonantFinale"
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
            "lightningTempo",
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
            "bloodRage"
          ],
          "weakMatchups": [
            "alchemyChaos",
            "crownCarry",
            "fireBurst",
            "holySustain",
            "ironWall",
            "poisonBloom",
            "shadowExecute"
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
      "martyrFrontline": {
        "name": "殉道前线",
        "desc": "牧师站上前排，用自己的血量和圣盾承压，让后排慢慢赢。",
        "design": {
          "fantasy": "A priest becomes a temporary frontline bastion, absorbing pressure with self-shields while allies grind the fight out.",
          "experience": {
            "start": "The priest steps into danger rather than hiding as a healer.",
            "transition": "Self-shields and guard windows blunt early pressure.",
            "payoff": "Bastion Sanctuary stabilizes the whole team.",
            "reset": "The team is vulnerable between sanctuary windows."
          },
          "primaryOutput": "frontlineSustain",
          "desiredTags": [
            "shield",
            "heal",
            "guard",
            "frontline"
          ],
          "watchTags": [
            "burst",
            "execute"
          ],
          "strongMatchups": [
            "ironWall",
            "bloodRage"
          ],
          "weakMatchups": [
            "fireBurst",
            "shadowExecute"
          ],
          "validationOpponents": [
            "bloodRage",
            "ironWall",
            "fireBurst"
          ],
          "curves": [
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 8
            },
            {
              "metric": "survivorsAt20Seconds",
              "op": ">=",
              "value": 1.5
            }
          ],
          "signalAcceptance": [
            {
              "metric": "healingPerSecond",
              "op": ">=",
              "value": 3
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 8
            }
          ],
          "failureBoundaries": [
            {
              "metric": "carryDamageShare",
              "op": "<=",
              "value": 0.72
            }
          ]
        },
        "team": [
          {
            "role": "priest",
            "small1": "radiantInterpose",
            "small2": "mendingLight",
            "passive": "martyrAegis",
            "ultimate": "bastionSanctuary"
          },
          {
            "role": "warrior",
            "small1": "lineHold",
            "small2": "guardBreak",
            "passive": "loneVeteran",
            "ultimate": "duelistBreak"
          },
          {
            "role": "warlock",
            "small1": "bloodHex",
            "small2": "venomDividend",
            "passive": "crimsonPact",
            "ultimate": "forbiddenOffering"
          },
          {
            "role": "ranger",
            "small1": "snareShot",
            "small2": "markDetonate",
            "passive": "trapSense",
            "ultimate": "killZone"
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
      "purgeAttrition": {
        "name": "净化消耗",
        "desc": "牧师抗异常，术士用自伤和毒层把长战斗转成资源。",
        "design": {
          "fantasy": "Survive status pressure, then let poison and carry support convert a long fight into inevitability.",
          "experience": {
            "start": "The team takes poison or burn pressure.",
            "transition": "Purifying shields blunt the dangerous status window.",
            "payoff": "Poison stacks and carry buffs start to decide the long fight.",
            "reset": "The team stabilizes rather than bursting."
          },
          "primaryOutput": "dot",
          "desiredTags": [
            "poison",
            "dot",
            "shield",
            "sustain",
            "carry"
          ],
          "watchTags": [
            "burst",
            "execute"
          ],
          "strongMatchups": [
            "fireBurst",
            "ironWall"
          ],
          "weakMatchups": [
            "shadowExecute",
            "crownCarry"
          ],
          "validationOpponents": [
            "fireBurst",
            "shadowExecute"
          ],
          "curves": [
            {
              "metric": "poisonStacksApplied",
              "op": ">=",
              "value": 16
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 3
            }
          ],
          "signalAcceptance": [
            {
              "metric": "poisonStacksApplied",
              "op": ">=",
              "value": 10
            },
            {
              "metric": "shieldPerSecond",
              "op": ">=",
              "value": 3
            },
            {
              "metric": "dotDamageShare",
              "op": ">=",
              "value": 0.16
            }
          ],
          "failureBoundaries": [
            {
              "metric": "selfCostPerSecond",
              "op": ">=",
              "value": 0.1
            }
          ]
        },
        "team": [
          {
            "role": "knight",
            "small1": "guard",
            "small2": "vowTaunt",
            "passive": "fortressStance",
            "ultimate": "bannerWall"
          },
          {
            "role": "priest",
            "small1": "purifyingWard",
            "small2": "heal",
            "passive": "afterglowGrace",
            "ultimate": "sanctuary"
          },
          {
            "role": "warlock",
            "small1": "venomDividend",
            "small2": "venomBrand",
            "passive": "hotbedPact",
            "ultimate": "plagueOffering"
          },
          {
            "role": "alchemist",
            "small1": "stabilizingVapor",
            "small2": "miasmaFlask",
            "passive": "catalyst",
            "ultimate": "grandMixture"
          }
        ]
      },
      "scarletVanguard": {
        "name": "赤血先锋",
        "desc": "狂战承担风险前排，战士补保护，法师用火场制造控制和范围压力。",
        "design": {
          "fantasy": "A risky berserker front line opens danger windows while the team stabilizes and burns enemies down.",
          "experience": {
            "start": "The berserker deliberately takes risk.",
            "transition": "Short guard and shields prevent immediate collapse.",
            "payoff": "Low-health basic pressure and fire zones win before the frontline burns out.",
            "reset": "The team needs new guard windows after each risk cycle."
          },
          "primaryOutput": "basic attack",
          "desiredTags": [
            "selfCost",
            "haste",
            "shield",
            "burn",
            "area"
          ],
          "watchTags": [
            "execute",
            "burst"
          ],
          "strongMatchups": [
            "ironWall"
          ],
          "weakMatchups": [
            "shadowExecute",
            "frostControl"
          ],
          "validationOpponents": [
            "ironWall",
            "shadowExecute"
          ],
          "curves": [
            {
              "metric": "lowHealthEntryRate",
              "op": ">=",
              "value": 0.5
            },
            {
              "metric": "postLowAttackRateRatio",
              "op": ">=",
              "value": 1.15
            }
          ],
          "signalAcceptance": [
            {
              "metric": "basicDamageShare",
              "op": ">=",
              "value": 0.22
            },
            {
              "metric": "selfCostPerSecond",
              "op": ">=",
              "value": 0.15
            },
            {
              "metric": "areaDamageShare",
              "op": ">=",
              "value": 0.12
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
            "small1": "scarletChallenge",
            "small2": "bloodStrike",
            "passive": "rageEngine",
            "ultimate": "undyingRoar"
          },
          {
            "role": "warrior",
            "small1": "lineHold",
            "small2": "sunderingAdvance",
            "passive": "lineBreaker",
            "ultimate": "warBanner"
          },
          {
            "role": "mage",
            "small1": "ashZone",
            "small2": "fireball",
            "passive": "kindlingEcho",
            "ultimate": "meteorRain"
          },
          {
            "role": "bard",
            "small1": "battleHymn",
            "small2": "syncopate",
            "passive": "encore",
            "ultimate": "crescendo"
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
            "holySustain",
            "ironWall",
            "lightningTempo"
          ],
          "weakMatchups": [
            "frostControl",
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
      "basicAttackCooldown": 1.34,
      "basicFlatDamage": 10,
      "basicPowerRatio": 0.22,
      "openingCooldowns": {
        "bloodStrike": 4.8,
        "boneWhirl": 6.2,
        "undyingRoar": 8.8
      },
      "cooldowns": {
        "bloodStrike": 5.2,
        "boneWhirl": 8.4,
        "undyingRoar": 24
      },
      "durations": {
        "bloodFury": 4.4,
        "whirlwind": 5,
        "roarFury": 5,
        "haste": 5,
        "immortal": 4.5
      },
      "ratios": {
        "blood": 0.48,
        "whirlwind": 0.26,
        "splash": 0.18,
        "roar": 0.35
      },
      "passive": {
        "maxDamageAmp": 0.5,
        "baseLeech": 0.055,
        "missingHpLeech": 0.14,
        "lowHpHaste": 0.75,
        "roarLeech": 0.18
      },
      "splashTargets": 2,
      "hasteMultiplier": 1.35
    }
  };
})();

if (typeof window !== "undefined") window.GAME_SKILL_ASSETS = GAME_SKILL_ASSETS;
if (typeof module !== "undefined") module.exports = GAME_SKILL_ASSETS;
