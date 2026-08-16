from __future__ import annotations

from final_holdout import case


def final_holdout_v1_cases() -> list[dict]:
    rows = [
        ("v1-det-1", "采矿球在一枚启用爆雷上方移动。", "采矿球落到爆雷所在位置并直接撞上，爆雷尚未闪光。", "detonated", "known_positive"),
        ("v1-det-2", "轨道车驶向工作正常的炸药箱。", "轨道车撞到炸药箱后停住，箱体仍完整。", "detonated", "known_positive"),
        ("v1-quiet-1", "探针正朝切断引线的爆弹运动。", "探针接触爆弹外壳，引线依旧断开。", "stays_quiet", "context_override"),
        ("v1-bounce-1", "货物悬在弹力机关上方。", "货物掉上机关并将它压缩。", "bounced_away", "known_positive"),
        ("v1-switch-1", "配重块位于暗着的踏板旁，闸门关闭。", "配重块压上踏板，踏板被按下但没有亮。", "switch_activated", "known_positive"),
        ("v1-melt-1", "热射线与冻住的门还有距离。", "热射线照在冻门表面，冰层开始受热。", "melted", "known_positive"),
        ("v1-break-1", "炮丸飞向已经有裂口的木障。", "炮丸击中木障，裂口迅速延伸。", "barrier_broken", "known_positive"),
        ("v1-hard-1", "薄玻璃刀砍向厚钢墙。", "玻璃刀命中钢墙，墙面没有损伤。", "tool_broken", "context_override"),
        ("v1-money-1", "商贩持有一万四千，最低线为五千。", "商贩支付一万后只剩四千，刚刚低于最低线。", "bankrupt", "numeric"),
        ("v1-card-1", "探索卡还在手中，事件堆没有翻开。", "探索卡被正式打出，事件堆暂时仍盖着。", "event_revealed", "procedural"),
        ("v1-nonce-1", "深蓝晶片尚未碰到白绒块，旁边石环静止。", "晶片与白绒块相接，绒块暂时仍白。", "fluff_black", "nonce_known"),
        ("v1-shield-1", "箭弹飞向保护骑手的屏障。", "箭弹撞上屏障外面，骑手仍未受伤。", "shield_absorbed", "known_positive"),
        ("v1-poison-1", "士兵没有吸入毒烟，生命正常。", "士兵刚吸入毒烟，现在还能够站立。", "health_reduced", "known_positive"),
        ("v1-up-1", "温度槽读数2，低于触发线9。", "温度槽升到14，现在高于触发线9。", "threshold_alarm", "arrow_only"),
        ("v1-down-1", "温度槽读数19，早已高于触发线9。", "温度槽降到14，现在高于触发线9。", "no_followup", "arrow_only"),
        ("v1-up-2", "计数器数值5，低于警报线11。", "计数器增到16，现在高于警报线11。", "threshold_alarm", "arrow_only"),
        ("v1-down-2", "计数器数值22，已经高于警报线11。", "计数器减到16，现在高于警报线11。", "no_followup", "arrow_only"),
        ("v1-pass-1", "运输艇在地雷上层前进。", "运输艇从地雷旁边飞过，没有进入地雷区域。", "no_followup", "known_no_wake"),
        ("v1-near-1", "滚轮离爆弹四格。", "滚轮前进两格后仍与爆弹相隔。", "no_followup", "known_no_wake"),
        ("v1-observe-1", "观察者看不见远方。", "视野打开后看到远处有炸药，但现场没有移动。", "no_followup", "known_no_wake"),
        ("v1-hypo-1", "玩家正在读开关说明。", "玩家想象压下开关也许能开门，但没有实际操作。", "no_followup", "known_no_wake"),
        ("v1-safe-money", "角色有一万六千，最低线五千。", "角色支付三千后仍有一万三千。", "no_followup", "known_no_wake"),
        ("v1-draw", "一张牌位于牌堆中。", "玩家将牌抽到手里，没有打出。", "no_followup", "known_no_wake"),
        ("v1-near-heat", "火球离冰块两米。", "火球停在冰块旁，没有接触。", "no_followup", "known_no_wake"),
        ("v1-near-switch", "石球距离按钮一步。", "石球停在按钮边缘，没有压住按钮。", "no_followup", "known_no_wake"),
        ("v1-unknown-1", "橙色圆锥靠近一片会眨眼的布。", "圆锥触到布面，二者暂时没有变化。", None, "unknown_rule"),
        ("v1-unknown-2", "银色种子位于黑色水面上。", "种子掉进黑水，水面恢复平静。", None, "unknown_rule"),
        ("v1-unknown-3", "透明方环离一只木制甲虫很近。", "方环套住甲虫，甲虫暂时不动。", None, "unknown_rule"),
        ("v1-unknown-4", "角色手里拿着一枚会发热的文字块。", "角色把文字块放到影子里，表面没有改变。", None, "unknown_rule"),
        ("v1-unknown-5", "黄色丝带悬在石制眼睛前。", "丝带遮住石眼，周围保持安静。", None, "unknown_rule"),
        ("v1-unknown-6", "一滴绿色液体在铜制鸟笼上方。", "液体滴到鸟笼顶端，没有立即反应。", None, "unknown_rule"),
        ("v1-unknown-7", "白色钟摆尚未越过红色光线。", "钟摆穿过光线并摆到另一侧。", None, "unknown_rule"),
        ("v1-unknown-8", "纸船靠近一块带孔的月亮石。", "纸船穿过石孔，外观暂时不变。", None, "unknown_rule"),
        ("v1-unknown-9", "蓝火停在一扇柔软的门前。", "蓝火接触门面，门仍然关闭。", None, "unknown_rule"),
        ("v1-unknown-10", "金属影子与一颗空心果实分开。", "影子进入果实内部，现场暂时平静。", None, "unknown_rule"),
        ("v1-unknown-11", "玻璃羽毛靠近一条刻度线。", "羽毛越过刻度线并落在另一边。", None, "unknown_rule"),
        ("v1-unknown-12", "紫色烟圈悬在一个木盒上方。", "烟圈落入木盒，盒盖依旧打开。", None, "unknown_rule"),
    ]
    return [case(*row) for row in rows]

