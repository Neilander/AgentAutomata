from __future__ import annotations


def case(identifier: str, previous: str, current: str, expected: str | None, group: str) -> dict:
    kind = "unknown" if expected is None else ("negative" if expected == "no_followup" else "positive")
    return {"id": identifier, "kind": kind, "previous": previous, "current": current,
            "expected": expected, "group": group}


def final_holdout_cases() -> list[dict]:
    """Frozen-after-authoring cases. Never imported by calibration."""
    rows = [
        # Causal continuation: paraphrase, actor transfer and spatial wording.
        ("p-det-1", "巡逻球悬在一枚工作正常的爆雷上层。", "巡逻球垂直落下并压到爆雷，爆雷外壳暂时完整。", "detonated", "causal_transfer"),
        ("p-det-2", "一辆搬运车沿轨道驶向启用中的炸药包。", "搬运车撞上炸药包并停住，炸药包还没有显出火光。", "detonated", "causal_transfer"),
        ("p-det-3", "落石在完好震爆器的斜上方。", "落石滚入震爆器所在位置，两者发生直接碰撞。", "detonated", "position_transfer"),
        ("p-quiet-1", "探测器正靠近一枚已经断开电源的爆弹。", "探测器碰到断电爆弹，电源仍然断开。", "stays_quiet", "context_override"),
        ("p-quiet-2", "矿车朝被水泡坏的地雷滑去。", "矿车压过坏掉的地雷，失效状态没有改变。", "stays_quiet", "context_override"),
        ("p-bounce-1", "金属块在回弹平台上一层。", "金属块掉到平台中央并把平台压低。", "bounced_away", "causal_transfer"),
        ("p-bounce-2", "棋子就在跳跃机关相邻格。", "棋子走进机关格，机关开始向下压缩。", "bounced_away", "position_transfer"),
        ("p-switch-1", "货箱靠近没亮的重量按钮，远端舱门关闭。", "货箱移上按钮并压住它，按钮暂时未亮。", "switch_activated", "causal_transfer"),
        ("p-switch-2", "石像站在压力机关旁，出口封着。", "石像压到机关上，机关被按下但尚未发光。", "switch_activated", "causal_transfer"),
        ("p-melt-1", "灼热蒸汽还没到达冰障。", "蒸汽覆盖冰障表面，冰障刚开始受热。", "melted", "causal_transfer"),
        ("p-melt-2", "燃烧弹位于结冰水面上方。", "燃烧弹落上冰面并持续释放热量。", "melted", "actor_transfer"),
        ("p-break-1", "重锤朝布满旧裂缝的隔墙移动。", "重锤砸中隔墙，裂缝从落点继续扩张。", "barrier_broken", "causal_transfer"),
        ("p-break-2", "高速石弹飞向腐朽木栅。", "石弹撞中木栅，接触处迸出更多裂口。", "barrier_broken", "actor_transfer"),
        ("p-hard-1", "玻璃战锤挥向完好的合金柱。", "玻璃战锤命中合金柱，柱体丝毫未弯。", "tool_broken", "context_override"),
        ("p-hard-2", "脆陶长矛刺向厚重石门。", "长矛尖撞上石门，石门仍旧完整。", "tool_broken", "actor_transfer"),
        ("p-money-1", "角色有一万七千金币，破产界线为六千。", "角色缴纳一万二千后剩五千，刚刚跌到界线以下。", "bankrupt", "numeric"),
        ("p-money-2", "店主拥有一万三千，最低余额要求七千。", "店主付出七千后剩六千，低于最低要求。", "bankrupt", "numeric"),
        ("p-money-3", "旅队资金九千，规则要求至少保留五千。", "旅队支付五千后仅余四千，越过了最低线。", "bankrupt", "numeric"),
        ("p-card-1", "一张战术牌还在手里，命运牌堆盖着。", "战术牌刚被打到桌面，命运牌尚未翻面。", "event_revealed", "procedural"),
        ("p-card-2", "天气牌没有使用，场上没有公开事件。", "玩家使用天气牌，事件堆仍保持遮盖。", "event_revealed", "procedural"),
        ("p-nonce-1", "群青晶核离白色茸块一小段距离，铜环静止。", "群青晶核贴到白茸块，茸块仍白，铜环仍静止。", "fluff_black", "nonce_known_rule"),
        ("p-nonce-2", "蓝紫多面体尚未触及浅色软团，圆框不动。", "多面体现在接触软团，软团颜色暂未改变。", "fluff_black", "nonce_known_rule"),
        ("p-shield-1", "弹片飞向罩住驾驶员的力场。", "弹片打在力场表面，驾驶员生命没有下降。", "shield_absorbed", "causal_transfer"),
        ("p-shield-2", "光束正接近保护机器人的屏障。", "光束与屏障正面相撞，机器人仍未受伤。", "shield_absorbed", "actor_transfer"),
        ("p-poison-1", "守卫还没吸入紫色毒雾，生命稳定。", "守卫刚吸入毒雾，但眼下仍站立。", "health_reduced", "causal_transfer"),
        ("p-poison-2", "野兽尚未吞下腐蚀药，身体正常。", "野兽吞下药剂，暂时还可以行动。", "health_reduced", "actor_transfer"),
        # Identical current snapshot; only the incoming arrow differs.
        ("p-arrow-up-1", "蒸汽计读数3，低于警戒线10。", "蒸汽计读数变为13，现在高于警戒线10。", "threshold_alarm", "arrow_only"),
        ("p-arrow-down-1", "蒸汽计读数18，已经高于警戒线10。", "蒸汽计读数变为13，现在高于警戒线10。", "no_followup", "arrow_only"),
        ("p-arrow-up-2", "魔力槽数值6，低于触发界线12。", "魔力槽数值变为15，现在高于触发界线12。", "threshold_alarm", "arrow_only"),
        ("p-arrow-down-2", "魔力槽数值20，已经高于触发界线12。", "魔力槽数值变为15，现在高于触发界线12。", "no_followup", "arrow_only"),
        # Known ordinary trajectories: similar scene, but no causal continuation.
        ("n-pass-1", "滑翔船在炸药上层飞行。", "滑翔船从炸药侧边掠过，没有占据炸药位置。", "no_followup", "near_negative"),
        ("n-pass-2", "岩球朝坡下的爆弹滚动。", "岩球转进岔道并停在爆弹旁，没有碰撞。", "no_followup", "near_negative"),
        ("n-approach-1", "小车距离地雷六格。", "小车前进三格后仍与地雷相隔三格。", "no_followup", "near_negative"),
        ("n-approach-2", "方块离弹力垫两格。", "方块来到弹力垫旁边，没有进入垫子范围。", "no_followup", "near_negative"),
        ("n-observe-1", "侦察员尚未发现远方装置。", "侦察员看见远处有爆炸物，但任何物体都没移动。", "no_followup", "observation"),
        ("n-observe-2", "角色不知道桌上有药瓶。", "角色发现一瓶毒药，只是看着并未触碰。", "no_followup", "observation"),
        ("n-hypo-1", "玩家正在学习炸弹规则。", "玩家设想飞行物撞炸弹可能爆炸，现实中没有碰撞。", "no_followup", "modality"),
        ("n-hypo-2", "玩家谈论手里的一张牌。", "玩家想象如果打牌也许会翻事件，但并没有出牌。", "no_followup", "modality"),
        ("n-money-1", "商队有一万八千，破产线六千。", "商队支付四千后还剩一万四千，仍很安全。", "no_followup", "numeric_negative"),
        ("n-money-2", "租客有九千，最低线六千。", "租客支付两千后剩七千，没有越线。", "no_followup", "numeric_negative"),
        ("n-card-1", "牌还在牌堆最上面。", "玩家把牌抽进手中，并没有使用。", "no_followup", "procedural_negative"),
        ("n-card-2", "行动牌正拿在手中。", "玩家看完牌面后继续握着，没有打到桌上。", "no_followup", "procedural_negative"),
        ("n-heat", "火苗距离冰门很远。", "火苗移到冰门附近，却没有接触或加热。", "no_followup", "near_negative"),
        ("n-wall", "斧头离旧木门还有距离。", "斧头被拿到门边，但没有挥动。", "no_followup", "near_negative"),
        ("n-switch", "雕像距离踏板两格。", "雕像来到踏板旁，没有站上去。", "no_followup", "near_negative"),
        ("n-shield", "飞弹在防护罩远处。", "飞弹接近防护罩，但还没有撞到。", "no_followup", "near_negative"),
        ("n-nonce", "蓝晶远离白茸球。", "蓝晶来到茸球旁边，二者仍未接触。", "no_followup", "nonce_negative"),
        ("n-poison", "猎人没有看到毒雾。", "猎人发现前方有毒雾，但没有走进去。", "no_followup", "observation"),
        # No matching trajectory was ever observed. Correct behavior is doubt,
        # not inventing a continuation from surface resemblance.
        ("u-1", "紫色立方体位于银色羽毛上方。", "立方体碰到羽毛，二者暂时都没有变化。", None, "unknown_rule"),
        ("u-2", "木偶靠近一面会唱歌的镜子。", "木偶触碰镜面，镜子仍保持安静。", None, "unknown_rule"),
        ("u-3", "红色水滴悬在空心三角上方。", "水滴落入三角中央，形状暂时不变。", None, "unknown_rule"),
        ("u-4", "一枚铜币放在蓝色门旁。", "铜币被塞进门上的窄槽，门依旧关闭。", None, "unknown_rule"),
        ("u-5", "发光叶片尚未触及黑色石盘。", "叶片覆盖石盘表面，石盘没有立即反应。", None, "unknown_rule"),
        ("u-6", "纸鹤位于会呼吸的箱子外。", "纸鹤进入箱内，箱盖保持开启。", None, "unknown_rule"),
        ("u-7", "白色齿轮离绿色水晶两格。", "齿轮移动到水晶旁并轻轻接触。", None, "unknown_rule"),
        ("u-8", "角色手中有一枚陌生符号牌。", "角色把符号牌放进月光下，牌面没有改变。", None, "unknown_rule"),
        ("u-9", "金属鸟停在一根透明细线上。", "金属鸟剪断细线，周围暂时安静。", None, "unknown_rule"),
        ("u-10", "圆形影子尚未越过白色边界。", "影子滑过边界并停在另一侧。", None, "unknown_rule"),
    ]
    return [case(*row) for row in rows]

