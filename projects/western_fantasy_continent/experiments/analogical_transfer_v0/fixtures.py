from __future__ import annotations


def source(identifier, before_raw, current_raw, before_norm, current_norm, next_raw, next_template, effects):
    return {
        "id": identifier,
        "beforeRaw": before_raw,
        "currentRaw": current_raw,
        "beforeNorm": before_norm,
        "currentNorm": current_norm,
        "nextRaw": next_raw,
        "nextTemplate": next_template,
        "effects": [{"slot": slot, "change": change} for slot, change in effects],
    }


def source_trajectories() -> list[dict]:
    """Exactly one remembered example per causal family."""
    return [
        source(
            "tool_break",
            "玻璃剑正挥向完好无损的钢铁墙。",
            "玻璃剑撞上钢铁墙，墙体几乎没有变形。",
            "<actor:容易碎裂的工具>接近<target:非常坚硬的障碍>。",
            "<actor>猛烈撞击<target>，<target>几乎没有受损。",
            "玻璃剑在反作用力下断裂，钢铁墙保持完整。",
            "{actor}在反作用力下断裂，{target}保持完整。",
            [("actor", "broken"), ("target", "intact")],
        ),
        source(
            "barrier_break",
            "沉重铁球正冲向布满裂缝的薄木门。",
            "铁球撞中薄木门，门上的裂缝迅速扩张。",
            "<actor:沉重坚硬的撞击物>接近<target:脆弱且已有裂纹的障碍>。",
            "<actor>撞中<target>，<target>的裂缝迅速扩张。",
            "薄木门碎裂并失去阻挡作用，铁球继续向前。",
            "{target}碎裂并失去阻挡作用，{actor}继续向前。",
            [("target", "broken"), ("target", "passage_open")],
        ),
        source(
            "detonate",
            "侦察机位于一枚启用中的黄色炸弹上方。",
            "侦察机下降到黄色炸弹所在格并直接接触，炸弹尚完整。",
            "<actor:移动物体>位于<target:正常启用的爆炸装置>上方。",
            "<actor>移动到<target>所在位置并发生直接接触，<target>尚完整。",
            "黄色炸弹被触发并爆炸，侦察机受到爆炸冲击。",
            "{target}被触发并爆炸，{actor}受到爆炸冲击。",
            [("target", "detonated"), ("actor", "blast_hit")],
        ),
        source(
            "disabled_contact",
            "矿车驶向一枚已经拆除引信的地雷。",
            "矿车碾过失效地雷，引信仍处于拆除状态。",
            "<actor:移动物体>接近<target:明确失效的爆炸装置>。",
            "<actor>直接接触<target>，但<target>仍明确处于失效状态。",
            "失效地雷保持安静，矿车没有受到爆炸伤害。",
            "{target}保持安静，{actor}没有受到爆炸伤害。",
            [("target", "quiet"), ("actor", "safe")],
        ),
        source(
            "bounce",
            "木箱悬在弹簧板正上方。",
            "木箱落到弹簧板中央，把弹簧板向下压缩。",
            "<actor:可移动物体>位于<device:有弹性的机关>上方。",
            "<actor>落到<device>上并将其压缩，机关正在储存弹力。",
            "弹簧板迅速回弹，把木箱向上弹开。",
            "{device}迅速回弹，把{actor}弹离原位置。",
            [("actor", "bounced_away")],
        ),
        source(
            "switch",
            "石像靠近没有发光的压力踏板，远处石门关闭。",
            "石像站上压力踏板并把它压下，踏板暂时还没亮。",
            "<actor:有重量的物体>靠近<device:未启动的压力机关>，<linked:相连入口>关闭。",
            "<actor>压住<device>，机关被按下但还没有启动。",
            "压力踏板被激活并亮起，远处石门打开。",
            "{device}被激活并亮起，{linked}打开。",
            [("device", "activated"), ("linked", "opened")],
        ),
        source(
            "melt",
            "火焰喷口尚未接触坚硬冰墙。",
            "火焰覆盖冰墙表面并持续传递热量。",
            "<actor:高温热源>尚未接触<target:冻结物体>。",
            "<actor>接触并持续加热<target>。",
            "冰墙受热融化，原来的固体形状消失。",
            "{target}受热融化，原来的固体形状消失。",
            [("target", "melted")],
        ),
        source(
            "shield_absorb",
            "箭矢飞向覆盖士兵的完整能量护盾。",
            "箭矢撞上护盾外层，士兵暂时没有受伤。",
            "<actor:高速投射物>飞向保护<protected:内部目标>的<target:完整防护屏障>。",
            "<actor>撞上<target>外层，<protected>尚未受伤。",
            "护盾吸收冲击，箭矢停止，士兵生命不变。",
            "{target}吸收冲击，{actor}停止，{protected}生命不变。",
            [("actor", "stopped"), ("protected", "safe")],
        ),
        source(
            "poison_consume",
            "冒险者尚未吸入紫色毒雾，生命状态稳定。",
            "冒险者进入毒雾并吸入一部分，目前仍然站立。",
            "<actor:生命单位>尚未接触<target:有毒物质>，生命稳定。",
            "<actor>吸收了<target>，毒性尚未完全表现。",
            "毒性开始生效，冒险者的生命值明显下降。",
            "毒性开始生效，{actor}的生命值明显下降。",
            [("actor", "health_reduced")],
        ),
        source(
            "card_play",
            "探险牌还在玩家手里，事件牌堆保持盖住。",
            "玩家正式打出探险牌，事件牌堆尚未翻面。",
            "<actor:玩家>持有<target:可打出的牌>，<linked:事件牌堆>盖住。",
            "<actor>正式打出<target>，<linked>仍暂时盖住。",
            "事件牌堆顶被翻开，一个新事件公开。",
            "{linked}顶端被翻开，一个新事件公开。",
            [("linked", "revealed")],
        ),
        source(
            "threshold_up",
            "反应槽读数为7，低于触发线10。",
            "反应槽读数上升到12，现在高于触发线10。",
            "<actor:连续数值>位于<target:触发阈值>下方。",
            "<actor>向上变化并越过<target>，现在位于阈值上方。",
            "读数刚刚向上越过触发线，警报启动。",
            "{actor}刚刚向上越过{target}，{linked}启动。",
            [("linked", "activated")],
        ),
        source(
            "no_contact",
            "飞船位于爆炸物上方但相隔数格。",
            "飞船从爆炸物旁边经过，没有进入同一位置。",
            "<actor:移动物体>接近<target:可能触发的对象>。",
            "<actor>从<target>旁边经过，但没有接触或进入其位置。",
            "飞船继续移动，爆炸物没有发生变化。",
            "{actor}继续移动，{target}没有发生变化。",
            [("target", "unchanged")],
        ),
        source(
            "threshold_safe",
            "商人有15000金币，破产线为6000。",
            "商人支付2000金币后还剩13000，仍远高于破产线。",
            "<actor:连续数值>位于<target:危险阈值>上方并有充足余量。",
            "<actor>向下变化，但没有越过<target>，仍在安全一侧。",
            "结算完成，没有触发破产状态。",
            "{actor}仍在{target}的安全一侧，{linked}没有触发。",
            [("linked", "unchanged")],
        ),
        source(
            "card_draw",
            "行动牌位于盖住的牌堆顶端。",
            "玩家把行动牌抽到手里，但没有打出。",
            "<target:可使用的牌>位于牌堆中，<linked:后续事件>未触发。",
            "<actor:玩家>只把<target>抽到手里，没有正式使用，<linked>仍未触发。",
            "行动牌留在手中，事件牌保持盖住。",
            "{target}留在{actor}手中，{linked}保持未触发。",
            [("linked", "unchanged")],
        ),
        source(
            "poison_observe",
            "猎人不知道桌上放着什么。",
            "猎人发现桌上有毒药，只是观察而没有接触。",
            "<actor:生命单位>尚未注意到<target:有害物质>。",
            "<actor>观察到<target>，但没有接触、吸收或使用。",
            "猎人继续保持健康，毒药仍在原处。",
            "{actor}继续保持健康，{target}仍在原处。",
            [("actor", "safe"), ("target", "unchanged")],
        ),
    ]


def analogy_case(identifier, family, before_raw, current_raw, before_norm, current_norm, bindings, group):
    return {
        "id": identifier, "kind": "known", "expectedFamily": family,
        "beforeRaw": before_raw, "currentRaw": current_raw,
        "beforeNorm": before_norm, "currentNorm": current_norm,
        "bindings": bindings, "group": group,
    }


def unknown_case(identifier, before_raw, current_raw, before_norm, current_norm):
    return {
        "id": identifier, "kind": "unknown", "expectedFamily": None,
        "beforeRaw": before_raw, "currentRaw": current_raw,
        "beforeNorm": before_norm, "currentNorm": current_norm,
        "bindings": {}, "group": "unknown",
    }


def development_cases() -> list[dict]:
    a = analogy_case
    u = unknown_case
    return [
        a("d-tool", "tool_break", "陶瓷长矛刺向花岗岩门。", "陶瓷长矛尖撞上花岗岩门，门体没有损伤。", "<actor:容易破碎的陶制工具>接近<target:厚重坚硬的石质障碍>。", "<actor>撞击<target>，<target>几乎没有损伤。", {"actor": "陶瓷长矛", "target": "花岗岩门"}, "cross_object"),
        a("d-barrier", "barrier_break", "攻城锤冲向腐朽栅栏。", "攻城锤击中栅栏，旧裂口继续扩大。", "<actor:结实沉重的撞击物>接近<target:腐朽且开裂的障碍>。", "<actor>撞中<target>，<target>的裂口迅速扩大。", {"actor": "攻城锤", "target": "腐朽栅栏"}, "cross_object"),
        a("d-det", "detonate", "采矿车正靠近工作的爆雷。", "采矿车压到爆雷并直接接触，爆雷还完整。", "<actor:移动物体>接近<target:正常工作的爆炸装置>。", "<actor>进入<target>位置并直接接触，<target>尚完整。", {"actor": "采矿车", "target": "爆雷"}, "cross_object"),
        a("d-disabled", "disabled_contact", "探针朝断电爆弹移动。", "探针碰到断电爆弹，电源依然断开。", "<actor:移动物体>接近<target:明确失效的爆炸装置>。", "<actor>接触<target>，<target>依然处于失效状态。", {"actor": "探针", "target": "断电爆弹"}, "context_override"),
        a("d-bounce", "bounce", "机器人位于反弹垫上方。", "机器人落到反弹垫并把它压低。", "<actor:可移动物体>位于<device:有弹性的装置>上方。", "<actor>落到<device>并将其压缩。", {"actor": "机器人", "device": "反弹垫"}, "cross_domain"),
        a("d-switch", "switch", "货箱靠近重量按钮，舱门关闭。", "货箱压住重量按钮，按钮尚未亮起。", "<actor:有重量的物体>靠近<device:未启动的压力机关>，<linked:相连入口>关闭。", "<actor>压住<device>，机关被按下但尚未启动。", {"actor": "货箱", "device": "重量按钮", "linked": "舱门"}, "cross_domain"),
        a("d-melt", "melt", "激光尚未照到冻住的管道。", "激光持续加热管道外的冰层。", "<actor:高温能量源>尚未接触<target:冻结物体>。", "<actor>接触并持续加热<target>。", {"actor": "激光", "target": "管道冰层"}, "cross_domain"),
        a("d-shield", "shield_absorb", "陨石飞向保护空间站的力场。", "陨石撞上力场，空间站暂时完好。", "<actor:高速撞击物>飞向保护<protected:内部目标>的<target:完整防护屏障>。", "<actor>撞上<target>，<protected>尚未受损。", {"actor": "陨石", "target": "力场", "protected": "空间站"}, "cross_domain"),
        a("d-poison", "poison_consume", "机械兽还没有吸收腐蚀液，耐久正常。", "机械兽吸入腐蚀液，目前仍在运行。", "<actor:有耐久状态的单位>尚未接触<target:有害物质>。", "<actor>吸收<target>，损害尚未完全表现。", {"actor": "机械兽", "target": "腐蚀液"}, "cross_domain"),
        a("d-card", "card_play", "法术牌还在手里，命运堆盖住。", "玩家打出法术牌，命运堆暂未翻面。", "<actor:玩家>持有<target:可打出的牌>，<linked:后续牌堆>盖住。", "<actor>正式打出<target>，<linked>仍暂时盖住。", {"actor": "玩家", "target": "法术牌", "linked": "命运堆"}, "cross_object"),
        a("d-threshold", "threshold_up", "温度为6，警戒线是10。", "温度升到13，越过警戒线。", "<actor:连续数值>位于<target:触发阈值>下方。", "<actor>向上变化并越过<target>。", {"actor": "温度", "target": "警戒线", "linked": "过热警报"}, "cross_domain"),
        a("d-no-contact", "no_contact", "棋子离传送格两步。", "棋子走到传送格旁边，没有进入。", "<actor:移动物体>接近<target:可能触发的区域>。", "<actor>来到<target>旁边但没有进入或接触。", {"actor": "棋子", "target": "传送格"}, "hard_negative"),
        a("d-safe", "threshold_safe", "生命值有90，危险线为20。", "生命下降到70，仍远高于危险线。", "<actor:连续数值>位于<target:危险阈值>安全一侧并有余量。", "<actor>向危险方向变化，但没有越过<target>。", {"actor": "生命值", "target": "危险线", "linked": "濒死状态"}, "hard_negative"),
        a("d-draw", "card_draw", "天气牌位于牌库顶。", "玩家把天气牌拿到手里，没有使用。", "<target:可使用的牌>位于牌堆中，<linked:后续效果>未触发。", "<actor:玩家>只把<target>拿到手里，没有正式使用。", {"actor": "玩家", "target": "天气牌", "linked": "天气事件"}, "hard_negative"),
        a("d-observe", "poison_observe", "守卫没有看见毒雾。", "守卫发现前方毒雾，但没有走进去。", "<actor:生命单位>尚未注意<target:有害物质>。", "<actor>观察到<target>，但没有接触或吸收。", {"actor": "守卫", "target": "毒雾"}, "hard_negative"),
        a("d-role-tool", "tool_break", "玻璃锤砸向合金薄板。", "玻璃锤命中薄板，薄板没有变形。", "<actor:脆弱工具>撞向<target:坚固目标>。", "<actor>撞中<target>，<target>保持完整。", {"actor": "玻璃锤", "target": "合金薄板"}, "role_swap"),
        a("d-role-wall", "barrier_break", "钢锤砸向玻璃隔板。", "钢锤命中玻璃隔板，隔板裂纹扩散。", "<actor:坚固重物>撞向<target:脆弱目标>。", "<actor>撞中<target>，<target>裂纹扩散。", {"actor": "钢锤", "target": "玻璃隔板"}, "role_swap"),
        u("d-u1", "紫色圆锥靠近会唱歌的石头。", "圆锥触碰石头，双方暂时没有变化。", "<actor:紫色圆锥>接近<target:会唱歌的石头>。", "<actor>接触<target>，双方当前没有可见变化。"),
        u("d-u2", "纸鸟悬在透明水晶上方。", "纸鸟落到水晶表面，水晶保持安静。", "<actor:纸制鸟形物>位于<target:透明水晶>上方。", "<actor>落到<target>表面，<target>当前保持安静。"),
        u("d-u3", "一滴银水靠近红色影子。", "银水穿过影子，当前没有可见变化。", "<actor:银色液滴>接近<target:红色影子>。", "<actor>穿过<target>，当前没有可见变化。"),
        u("d-u4", "木制月亮放在空心盒外。", "月亮被塞进盒子，盒盖仍打开。", "<actor:木制月亮形物>靠近<target:空心盒>。", "<actor>进入<target>，盒盖仍然打开。"),
        u("d-u5", "蓝色羽毛位于数字环旁。", "羽毛越过数字环的刻度，环没有反应。", "<actor:蓝色羽毛>接近<target:带刻度数字环>。", "<actor>越过<target>的刻度，环当前没有反应。"),
        u("d-u6", "铜制甲虫面向发光的布。", "甲虫压住布的一角，布依旧发光。", "<actor:铜制甲虫>接近<target:发光布面>。", "<actor>压住<target>一角，布面依旧发光。"),
    ]


def final_cases() -> list[dict]:
    family_by_prefix = {
        "tool": "tool_break", "barrier": "barrier_break", "det": "detonate",
        "disabled": "disabled_contact", "bounce": "bounce", "switch": "switch",
        "melt": "melt", "shield": "shield_absorb", "poison": "poison_consume",
        "card": "card_play", "threshold": "threshold_up", "no-contact": "no_contact",
        "safe": "threshold_safe", "draw": "card_draw", "observe": "poison_observe",
    }

    def a(identifier, *args):
        if identifier == "f-role-1":
            family = "tool_break"
        elif identifier == "f-role-2":
            family = "barrier_break"
        else:
            key = next(key for key in family_by_prefix if identifier.startswith(f"f-{key}-"))
            family = family_by_prefix[key]
        return analogy_case(identifier, family, *args)

    u = unknown_case
    return [
        a("f-tool-1", "冰晶钻头撞向钛合金舱壁。", "冰晶钻头命中舱壁，舱壁没有凹陷。", "<actor:容易碎裂的晶体工具>接近<target:极坚硬的金属障碍>。", "<actor>猛烈撞击<target>，<target>没有明显损伤。", {"actor": "冰晶钻头", "target": "钛合金舱壁"}, "cross_domain"),
        a("f-tool-2", "干枯树枝刺向厚重岩门。", "树枝尖撞到岩门，岩门仍然完整。", "<actor:脆弱易折的工具>接近<target:厚重坚硬的障碍>。", "<actor>撞击<target>，<target>保持完整。", {"actor": "干枯树枝", "target": "厚重岩门"}, "cross_object"),
        a("f-barrier-1", "装甲车冲向开裂的薄冰墙。", "装甲车撞上薄冰墙，裂缝迅速蔓延。", "<actor:沉重坚固的载具>接近<target:薄弱开裂的障碍>。", "<actor>撞击<target>，<target>的裂纹迅速扩张。", {"actor": "装甲车", "target": "薄冰墙"}, "cross_domain"),
        a("f-barrier-2", "石制冲锤砸向腐烂木板。", "冲锤击中木板，木板裂口扩大。", "<actor:坚固沉重的撞击物>接近<target:腐朽脆弱的障碍>。", "<actor>撞中<target>，<target>裂口扩大。", {"actor": "石制冲锤", "target": "腐烂木板"}, "cross_object"),
        a("f-det-1", "运输艇正在能量爆弹上层下降。", "运输艇落入爆弹所在区域并相撞，爆弹尚完整。", "<actor:移动载具>位于<target:正常启用的爆炸装置>上方。", "<actor>进入<target>区域并直接相撞，<target>暂时完整。", {"actor": "运输艇", "target": "能量爆弹"}, "cross_domain"),
        a("f-det-2", "滚石沿斜坡接近有效炸药。", "滚石滚到炸药位置并发生碰撞。", "<actor:移动物体>接近<target:有效爆炸装置>。", "<actor>移动到<target>所在位置并直接接触。", {"actor": "滚石", "target": "有效炸药"}, "cross_object"),
        a("f-disabled-1", "无人机朝拔掉引信的地雷飞去。", "无人机碰到地雷，引信依然被拆除。", "<actor:移动物体>接近<target:明确失效的爆炸装置>。", "<actor>接触<target>，<target>仍处于失效状态。", {"actor": "无人机", "target": "无引信地雷"}, "context_override"),
        a("f-disabled-2", "铁球滑向断电爆炸模块。", "铁球撞上模块，供电仍然关闭。", "<actor:移动物体>接近<target:断电失效的爆炸装置>。", "<actor>直接撞到<target>，<target>依然断电。", {"actor": "铁球", "target": "断电爆炸模块"}, "context_override"),
        a("f-bounce-1", "太空舱位于弹性着陆垫上方。", "太空舱落上着陆垫并将其压缩。", "<actor:可移动物体>位于<device:高弹性装置>上方。", "<actor>落到<device>并把装置压缩。", {"actor": "太空舱", "device": "弹性着陆垫"}, "cross_domain"),
        a("f-bounce-2", "棋子走向跳跃地板。", "棋子进入地板格并把地板压低。", "<actor:可移动物体>接近<device:弹性机关>。", "<actor>进入<device>位置并将机关压缩。", {"actor": "棋子", "device": "跳跃地板"}, "cross_object"),
        a("f-switch-1", "机器人靠近压力感应台，隔离门关闭。", "机器人站上感应台，台面被压下但未亮。", "<actor:有重量的单位>接近<device:未启动压力装置>，<linked:相连入口>关闭。", "<actor>压住<device>，装置被按下但还没有启动。", {"actor": "机器人", "device": "压力感应台", "linked": "隔离门"}, "cross_domain"),
        a("f-switch-2", "巨石位于暗着的地面机关旁，栅门关着。", "巨石滚上机关并压住它，机关尚未发光。", "<actor:沉重物体>靠近<device:未启动压力机关>，<linked:相连入口>关闭。", "<actor>压住<device>，机关暂时没有亮起。", {"actor": "巨石", "device": "地面机关", "linked": "栅门"}, "cross_object"),
        a("f-melt-1", "高温蒸汽尚未触及积雪堵塞。", "蒸汽覆盖积雪并持续传热。", "<actor:高温热源>尚未接触<target:冻结物体>。", "<actor>接触并持续加热<target>。", {"actor": "高温蒸汽", "target": "积雪堵塞"}, "cross_object"),
        a("f-melt-2", "等离子束对准冻住的阀门。", "等离子束持续照射阀门冰层。", "<actor:强烈热源>接近<target:冻结物体>。", "<actor>持续接触并加热<target>。", {"actor": "等离子束", "target": "阀门冰层"}, "cross_domain"),
        a("f-shield-1", "激光束射向罩住飞船的偏转场。", "激光束命中偏转场，飞船没有受损。", "<actor:高速能量投射物>飞向保护<protected:内部目标>的<target:防护屏障>。", "<actor>撞上<target>，<protected>仍未受损。", {"actor": "激光束", "target": "偏转场", "protected": "飞船"}, "cross_domain"),
        a("f-shield-2", "飞石冲向保护法师的魔法屏障。", "飞石撞中屏障，法师仍然安全。", "<actor:高速投射物>飞向保护<protected:内部目标>的<target:完整屏障>。", "<actor>撞上<target>，<protected>尚未受伤。", {"actor": "飞石", "target": "魔法屏障", "protected": "法师"}, "cross_object"),
        a("f-poison-1", "守卫没有喝下腐败药剂，生命正常。", "守卫吞下药剂，目前还站着。", "<actor:生命单位>尚未接触<target:有毒物质>。", "<actor>吸收<target>，毒性暂未完全表现。", {"actor": "守卫", "target": "腐败药剂"}, "cross_object"),
        a("f-poison-2", "无人机尚未吸入腐蚀气体，耐久稳定。", "无人机吸入气体，暂时仍在飞行。", "<actor:有耐久状态的单位>尚未接触<target:有害物质>。", "<actor>吸收<target>，损害暂未完全表现。", {"actor": "无人机", "target": "腐蚀气体"}, "cross_domain"),
        a("f-card-1", "季节牌仍在手中，天气事件堆盖住。", "玩家打出季节牌，事件堆还未翻面。", "<actor:玩家>持有<target:可打出的牌>，<linked:后续牌堆>盖住。", "<actor>正式打出<target>，<linked>暂时仍盖住。", {"actor": "玩家", "target": "季节牌", "linked": "天气事件堆"}, "cross_object"),
        a("f-card-2", "程序指令卡在操作员手里，故障模块未公开。", "操作员执行指令卡，故障模块仍遮盖。", "<actor:操作者>持有<target:可执行指令>，<linked:后续信息>未公开。", "<actor>正式执行<target>，<linked>暂时未公开。", {"actor": "操作员", "target": "程序指令卡", "linked": "故障模块"}, "cross_domain"),
        a("f-threshold-1", "辐射读数4，警报界线是9。", "辐射上升到12，刚越过界线。", "<actor:连续数值>位于<target:触发阈值>下方。", "<actor>向上变化并越过<target>。", {"actor": "辐射读数", "target": "警报界线", "linked": "辐射警报"}, "cross_domain"),
        a("f-threshold-2", "怒气值8，大招线为15。", "怒气升到17，首次超过大招线。", "<actor:连续数值>位于<target:触发阈值>下方。", "<actor>向上变化并越过<target>。", {"actor": "怒气值", "target": "大招线", "linked": "大招状态"}, "cross_domain"),
        a("f-no-contact-1", "飞弹朝护盾方向移动。", "飞弹停在护盾前方，没有碰到护盾。", "<actor:移动物体>接近<target:可能触发的对象>。", "<actor>来到<target>旁边但没有接触。", {"actor": "飞弹", "target": "护盾"}, "hard_negative"),
        a("f-no-contact-2", "角色接近毒雾区域。", "角色停在毒雾边缘，没有进入或吸入。", "<actor:移动单位>接近<target:可能触发的区域>。", "<actor>来到<target>旁边但没有进入或接触。", {"actor": "角色", "target": "毒雾区域"}, "hard_negative"),
        a("f-safe-1", "能源有80，停机线为10。", "能源降到55，仍远高于停机线。", "<actor:连续数值>位于<target:危险阈值>安全一侧并有余量。", "<actor>向危险方向变化，但没有越过<target>。", {"actor": "能源", "target": "停机线", "linked": "停机状态"}, "hard_negative"),
        a("f-safe-2", "城墙生命90，崩塌线20。", "生命降到60，仍高于崩塌线。", "<actor:连续数值>位于<target:危险阈值>安全一侧。", "<actor>下降但没有越过<target>。", {"actor": "城墙生命", "target": "崩塌线", "linked": "崩塌状态"}, "hard_negative"),
        a("f-draw-1", "命运牌在牌库顶。", "玩家抽取命运牌并留在手中，没有使用。", "<target:可使用的牌>位于牌堆中，<linked:后续效果>未触发。", "<actor:玩家>只把<target>拿到手里，没有正式使用。", {"actor": "玩家", "target": "命运牌", "linked": "命运事件"}, "hard_negative"),
        a("f-draw-2", "指令芯片在储存槽中。", "操作员取出芯片，但没有执行。", "<target:可执行指令>位于储存区，<linked:后续效果>未触发。", "<actor:操作者>只取出<target>，没有正式执行。", {"actor": "操作员", "target": "指令芯片", "linked": "系统事件"}, "hard_negative"),
        a("f-observe-1", "猎手还没看见毒果。", "猎手发现毒果但没有吃或触碰。", "<actor:生命单位>尚未注意<target:有害物质>。", "<actor>观察到<target>，但没有接触或吸收。", {"actor": "猎手", "target": "毒果"}, "hard_negative"),
        a("f-observe-2", "机器人不知道前方有腐蚀池。", "机器人扫描到腐蚀池，但没有进入。", "<actor:有耐久单位>尚未注意<target:有害区域>。", "<actor>观察到<target>，但没有进入或接触。", {"actor": "机器人", "target": "腐蚀池"}, "hard_negative"),
        a("f-role-1", "水晶斧砍向钢制立柱。", "水晶斧命中立柱，立柱没有损伤。", "<actor:脆弱工具>撞向<target:坚固目标>。", "<actor>撞中<target>，<target>保持完整。", {"actor": "水晶斧", "target": "钢制立柱"}, "role_swap"),
        a("f-role-2", "钢制斧砍向水晶隔墙。", "钢制斧命中隔墙，隔墙裂纹蔓延。", "<actor:坚固重物>撞向<target:脆弱目标>。", "<actor>撞中<target>，<target>裂纹蔓延。", {"actor": "钢制斧", "target": "水晶隔墙"}, "role_swap"),
        u("f-u1", "绿色立方体悬在会呼吸的沙子上。", "立方体落进沙子，当前没有可见改变。", "<actor:绿色立方体>位于<target:会呼吸的沙子>上方。", "<actor>进入<target>，当前没有可见改变。"),
        u("f-u2", "银色纸片靠近蓝色钟摆。", "纸片碰到钟摆，钟摆暂时没动。", "<actor:银色纸片>接近<target:蓝色钟摆>。", "<actor>接触<target>，钟摆暂时没有移动。"),
        u("f-u3", "黑色光点位于透明门外。", "光点穿过透明门并停下。", "<actor:黑色光点>接近<target:透明门>。", "<actor>穿过<target>并停下。"),
        u("f-u4", "木鸟衔着一枚发热字块。", "木鸟把字块放入冷水，表面暂时不变。", "<actor:木制鸟形物>携带<target:发热文字块>。", "<actor>把<target>放入冷水，字块表面暂时不变。"),
        u("f-u5", "一条红线横在空心果实前。", "果实越过红线，周围仍然安静。", "<actor:空心果实>接近<target:红色线条>。", "<actor>越过<target>，周围当前保持安静。"),
        u("f-u6", "金属花靠近一团会计数的烟。", "金属花进入烟团，烟的数字没变。", "<actor:金属花>接近<target:显示数字的烟团>。", "<actor>进入<target>，烟团数字没有变化。"),
        u("f-u7", "玻璃鱼游向一块柔软石头。", "玻璃鱼贴住石头，双方暂时完整。", "<actor:玻璃鱼>接近<target:柔软石头>。", "<actor>接触<target>，双方当前保持完整。"),
        u("f-u8", "紫色环位于白色门槛外。", "紫色环滚过门槛并停下。", "<actor:紫色环>接近<target:白色门槛>。", "<actor>越过<target>并停下。"),
        u("f-u9", "纸制太阳靠近黑色水晶。", "太阳覆盖水晶表面，水晶仍然黑。", "<actor:纸制太阳>接近<target:黑色水晶>。", "<actor>覆盖<target>表面，水晶仍然黑。"),
        u("f-u10", "铜球位于一条发光裂缝上方。", "铜球落入裂缝，当前没有反应。", "<actor:铜球>位于<target:发光裂缝>上方。", "<actor>进入<target>，当前没有可见反应。"),
    ]
