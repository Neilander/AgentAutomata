from __future__ import annotations


def state(text: str, concept: str | None = None) -> dict:
    return {"text": text, **({"concept": concept} if concept else {})}


def trajectory(identifier: str, states: list[dict]) -> dict:
    return {"id": identifier, "states": states}


def memory_trajectories() -> list[dict]:
    rows: list[dict] = []

    explosive_variants = [
        ("侦察机", "黄色炸弹", "北侧天空格", "下降到炸弹所在格"),
        ("运输艇", "旧式地雷", "矿井通道上方", "滑入地雷所在区域"),
        ("滚石", "震荡炸药", "斜坡高处", "滚到炸药位置"),
        ("无人机", "能量爆弹", "平台上一层", "坠落到爆弹旁并接触"),
        ("铁球", "红色爆炸装置", "轨道前段", "沿轨道撞到装置"),
    ]
    for index, (actor, target, origin, contact) in enumerate(explosive_variants):
        rows.append(trajectory(f"detonate-{index}", [
            state(f"局部环境中，{actor}位于{target}的{origin}，{target}完整且安静。"),
            state(f"局部环境中，{actor}{contact}，双方已经接触，{target}暂时仍然完整。"),
            state(f"局部环境中，{actor}仍在接触位置，{target}已经被引爆并开始发亮。", "detonated"),
            state(f"局部环境中，爆炸从{target}向外扩散，{actor}受到冲击。", "blast_damage"),
        ]))

    quiet_variants = [
        ("滑翔器", "拆除引信的炸弹", "正上方", "落在炸弹旁并碰到外壳"),
        ("矿车", "失效地雷", "隧道入口", "碾过地雷位置"),
        ("石块", "潮湿的火药桶", "木坡顶端", "滚到火药桶边发生碰撞"),
        ("机械臂", "断电爆炸模块", "工作台左侧", "伸到模块位置并接触"),
    ]
    for index, (actor, target, origin, contact) in enumerate(quiet_variants):
        rows.append(trajectory(f"quiet-{index}", [
            state(f"局部环境中，{actor}位于{target}{origin}，{target}明确处于失效状态。"),
            state(f"局部环境中，{actor}{contact}，但{target}仍处于失效状态。"),
            state(f"局部环境中，接触已经完成，{target}保持安静，没有被引爆。", "stays_quiet"),
        ]))

    spring_variants = [
        ("小球", "弹簧板", "上方管道", "落到弹簧板中央"),
        ("木箱", "弹力垫", "高层平台", "掉到弹力垫表面"),
        ("机器人", "反弹机关", "前方一格", "移动到机关上"),
        ("棋子", "跳跃地板", "相邻方格", "走进跳跃地板"),
    ]
    for index, (actor, target, origin, contact) in enumerate(spring_variants):
        rows.append(trajectory(f"bounce-{index}", [
            state(f"局部环境中，{actor}位于{target}的{origin}，{target}没有被压下。"),
            state(f"局部环境中，{actor}{contact}，{target}被压缩。"),
            state(f"局部环境中，{target}迅速回弹，{actor}被推离接触位置。", "bounced_away"),
        ]))

    switch_variants = [
        ("金属箱", "地面开关", "石门"),
        ("探险者", "压力踏板", "仓库门"),
        ("圆球", "蓝色按钮", "闸门"),
        ("石像", "重量机关", "密室入口"),
    ]
    for index, (actor, switch, door) in enumerate(switch_variants):
        rows.append(trajectory(f"switch-{index}", [
            state(f"局部环境中，{actor}靠近未启动的{switch}，远处的{door}关闭。"),
            state(f"局部环境中，{actor}压住{switch}，{switch}尚未亮起，{door}仍关闭。"),
            state(f"局部环境中，{switch}被激活并亮起，{actor}仍压在上面，{door}仍关闭。", "switch_activated"),
            state(f"局部环境中，亮起的{switch}保持激活，远处的{door}已经打开。", "door_open"),
        ]))

    melt_variants = [
        ("火焰喷口", "冰块"), ("炽热金属", "冰墙"), ("火球", "冻住的水面"), ("热风", "积雪"),
    ]
    for index, (heat, ice) in enumerate(melt_variants):
        rows.append(trajectory(f"melt-{index}", [
            state(f"局部环境中，{heat}尚未接触{ice}，{ice}保持坚硬。"),
            state(f"局部环境中，{heat}开始覆盖{ice}表面，{ice}尚未完全改变。"),
            state(f"局部环境中，{ice}在热量作用下融化，原本形状消失。", "melted"),
            state(f"局部环境中，融化后的液体汇聚成一片水洼。", "puddle_formed"),
        ]))

    brittle_variants = [
        ("箭矢", "脆裂石墙"), ("锤头", "破损木门"), ("炮弹", "薄冰障碍"), ("冲车", "腐朽栅栏"),
    ]
    for index, (actor, wall) in enumerate(brittle_variants):
        rows.append(trajectory(f"brittle-{index}", [
            state(f"局部环境中，{actor}正在接近仍然完整的{wall}。"),
            state(f"局部环境中，{actor}撞上{wall}，接触点出现裂纹。"),
            state(f"局部环境中，{wall}沿裂纹碎裂并失去阻挡作用。", "barrier_broken"),
            state(f"局部环境中，原本被{wall}封闭的位置形成可通过的开口。", "passage_open"),
        ]))

    hard_variants = [
        ("木棍", "钢铁墙面"), ("玻璃剑", "花岗岩门"), ("脆弱长矛", "合金护板"), ("陶制锤", "坚固石柱"),
    ]
    for index, (tool, wall) in enumerate(hard_variants):
        rows.append(trajectory(f"hard-{index}", [
            state(f"局部环境中，{tool}正朝完好无损的{wall}挥去。"),
            state(f"局部环境中，{tool}撞击{wall}，墙体几乎没有变形。"),
            state(f"局部环境中，{tool}在反作用力下断裂，{wall}依然完整。", "tool_broken"),
        ]))

    money_variants = [
        ("旅客", 15000, 10000), ("商人", 12000, 8000), ("玩家", 9000, 7000), ("租客", 18000, 15000),
    ]
    for index, (person, before, cost) in enumerate(money_variants):
        after = before - cost
        rows.append(trajectory(f"money-{index}", [
            state(f"财务环境中，{person}拥有{before}金币，破产线是6000金币，费用尚未支付。"),
            state(f"财务环境中，{person}支付了{cost}金币，余额变为{after}金币并低于破产线。"),
            state(f"财务环境中，系统确认余额低于破产线，{person}进入破产状态。", "bankrupt"),
        ]))

    card_variants = [
        ("探险牌", "风暴事件", "蓝色标记"), ("命运牌", "税收事件", "红色指示物"),
        ("行动牌", "伏击事件", "危险标记"), ("季节牌", "严冬事件", "寒冷指示物"),
    ]
    for index, (card, event, marker) in enumerate(card_variants):
        rows.append(trajectory(f"card-{index}", [
            state(f"桌面环境中，{card}仍在手中，事件牌堆盖着，桌面没有{marker}。"),
            state(f"桌面环境中，{card}已经打出，事件牌堆仍盖着，桌面没有{marker}。"),
            state(f"桌面环境中，牌堆顶的{event}被翻开并公开。", "event_revealed"),
            state(f"桌面环境中，{event}保持公开，新的{marker}被放到桌面。", "marker_placed"),
        ]))

    nonce_variants = [
        ("蓝色棱体", "绒球", "圆环"), ("青色晶锥", "软团", "金属环"),
        ("靛色方晶", "毛球", "石环"), ("蓝纹多面体", "茸团", "光环装置"),
    ]
    for index, (prism, fluff, ring) in enumerate(nonce_variants):
        rows.append(trajectory(f"nonce-{index}", [
            state(f"陌生规则环境中，{prism}尚未碰到白色{fluff}，旁边的{ring}静止。"),
            state(f"陌生规则环境中，{prism}接触白色{fluff}，{fluff}暂时仍是白色，{ring}静止。"),
            state(f"陌生规则环境中，被{prism}接触的{fluff}变成黑色，{ring}仍静止。", "fluff_black"),
            state(f"陌生规则环境中，黑色{fluff}靠近{ring}，{ring}开始旋转。", "ring_rotating"),
        ]))

    shield_variants = [
        ("箭矢", "能量护盾", "士兵"), ("石块", "魔法屏障", "法师"),
        ("激光", "偏转力场", "机器人"), ("飞弹", "防护罩", "驾驶员"),
    ]
    for index, (projectile, shield, owner) in enumerate(shield_variants):
        rows.append(trajectory(f"shield-{index}", [
            state(f"战斗环境中，{projectile}正接近覆盖{owner}的完整{shield}。"),
            state(f"战斗环境中，{projectile}撞上{shield}外层，{owner}尚未受伤。"),
            state(f"战斗环境中，{shield}吸收了冲击，{projectile}停止，{owner}生命不变。", "shield_absorbed"),
        ]))

    poison_variants = [
        ("冒险者", "紫色毒液"), ("守卫", "有毒浆果"), ("怪物", "腐蚀药剂"), ("猎人", "毒雾"),
    ]
    for index, (actor, poison) in enumerate(poison_variants):
        rows.append(trajectory(f"poison-{index}", [
            state(f"生命环境中，{actor}尚未接触{poison}，身体状态稳定。"),
            state(f"生命环境中，{actor}吸收了{poison}，暂时仍然站立。"),
            state(f"生命环境中，毒性开始生效，{actor}的生命值明显下降。", "health_reduced"),
            state(f"生命环境中，{actor}因生命值耗尽而倒下。", "collapsed"),
        ]))

    # Ordinary experiences matter too.  These are not query exceptions: they
    # are hard episodic trajectories whose remembered continuation is simply
    # that no new causal chain starts.
    no_effect_rows = [
        ("pass", "飞行器在爆炸物上方。", "飞行器从爆炸物侧面经过，没有接触。", "飞行器继续飞行，爆炸物保持安静。"),
        ("pass", "滚石靠近斜坡上的炸药。", "滚石转入另一条岔路，停在炸药旁边。", "滚石停止，炸药仍未被触发。"),
        ("approach", "矿车距离地雷很远。", "矿车前进后仍与地雷相隔数格。", "矿车停下等待，地雷没有变化。"),
        ("approach", "棋子距离弹簧板三格。", "棋子移动到弹簧板旁边但没有进入。", "棋子留在旁边，弹簧板没有被压下。"),
        ("observe", "观察者尚未看见远处装置。", "视野扩大后观察者发现远处有一枚炸弹。", "没有物体移动，远处炸弹保持原样。"),
        ("observe", "角色不知道桌上摆着什么。", "角色看见桌面上有毒药但没有触碰。", "角色继续观察，身体状态没有改变。"),
        ("hypothesis", "玩家正在阅读爆炸规则。", "玩家想到如果物体撞上炸弹也许会爆炸。", "这仍只是设想，当前场景没有发生爆炸。"),
        ("hypothesis", "玩家讨论一张尚未打出的牌。", "玩家设想打牌后也许会翻开事件。", "讨论结束，现实桌面没有发生变化。"),
        ("safe-money", "商人有两万金币，破产线为六千。", "商人支付五千后还有一万五千，仍高于破产线。", "结算完成，商人保持正常状态。"),
        ("safe-money", "旅客有一万金币，最低余额为六千。", "旅客支付两千后还剩八千，没有越过最低线。", "结算完成，旅客没有破产。"),
        ("card-draw", "卡牌位于盖住的牌堆顶。", "玩家把卡牌抽到手中但没有打出。", "卡牌留在手中，事件牌没有翻开。"),
        ("card-draw", "玩家拿起一张行动牌查看。", "玩家阅读牌面后仍把牌留在手里。", "没有打牌动作，桌面事件保持不变。"),
        ("near-heat", "热源距离冰墙很远。", "热源移动到冰墙附近但没有接触。", "热量没有传递，冰墙保持坚硬。"),
        ("near-wall", "锤子和脆墙相隔一段距离。", "锤子移动到墙边但没有挥动。", "没有发生撞击，脆墙保持完整。"),
        ("near-switch", "箱子离压力板两格。", "箱子移动到压力板旁边但没有压住。", "压力板保持未启动，远处门仍关闭。"),
        ("near-shield", "箭矢正在远处飞行。", "箭矢靠近护盾但尚未接触。", "箭矢仍在飞行，护盾和内部目标都没有变化。"),
    ]
    for index, (family, before, current, following) in enumerate(no_effect_rows):
        rows.append(trajectory(f"no-effect-{family}-{index}", [
            state(before), state(current), state(following, "no_followup"),
        ]))

    # Same current state, different incoming arrow.  These force retrieval to
    # use a transition rather than merely recognizing the last snapshot.
    crossings = [
        ("反应槽", 7, 11, 10), ("警戒计", 8, 12, 10),
        ("压力表", 5, 13, 10), ("热量计", 6, 14, 10),
    ]
    for index, (meter, before, after, line) in enumerate(crossings):
        rows.append(trajectory(f"cross-up-{index}", [
            state(f"仪表环境中，{meter}读数为{before}，低于触发线{line}。"),
            state(f"仪表环境中，{meter}读数变为{after}，现在高于触发线{line}。"),
            state(f"仪表环境中，读数刚刚向上越过触发线，警报被启动。", "threshold_alarm"),
        ]))
        rows.append(trajectory(f"stay-above-{index}", [
            state(f"仪表环境中，{meter}读数为{after + 4}，已经高于触发线{line}。"),
            state(f"仪表环境中，{meter}读数变为{after}，现在高于触发线{line}。"),
            state(f"仪表环境中，读数没有向上越过触发线，没有新的警报发生。", "no_followup"),
        ]))

    return rows


CONCEPT_CANDIDATES = {
    "detonated": ["爆炸物已经被触发并进入引爆状态。", "原本完整的炸弹开始爆炸。"],
    "blast_damage": ["爆炸冲击扩散并伤害了附近物体。", "爆炸波命中了周围单位。"],
    "stays_quiet": ["失效装置受到接触后依然安静，没有爆炸。", "接触结束但哑弹没有任何反应。"],
    "bounced_away": ["弹力机关把接触它的物体向外弹开。", "落下的物体被弹簧重新推离。"],
    "switch_activated": ["压力机关被压下并进入激活状态。", "开关亮起并保持启动。"],
    "door_open": ["与机关相连的门已经开启。", "关闭的入口受到开关控制后打开。"],
    "melted": ["冰冻物在热量作用下融化。", "坚硬冰体变成液态。"],
    "puddle_formed": ["融化的液体聚成水洼。", "原冰体的位置留下了一片水。"],
    "barrier_broken": ["脆弱障碍受到撞击后碎裂。", "原本完整的墙体已经破坏。"],
    "passage_open": ["障碍消失后出现可通行的缺口。", "原本封闭的路线现在打开。"],
    "tool_broken": ["脆弱工具撞上硬物后自身断裂。", "攻击用物在反作用力下破碎。"],
    "bankrupt": ["余额跌破规定下限后进入破产状态。", "资金不足触发了破产结算。"],
    "event_revealed": ["牌堆顶事件已经被翻开公开。", "新的事件卡从牌堆中揭示。"],
    "marker_placed": ["事件结算后在桌面放置了一个新指示物。", "桌面上新增了事件标记。"],
    "fluff_black": ["陌生软团受到晶体接触后变成黑色。", "白色绒状物改变为黑色。"],
    "ring_rotating": ["黑色软团靠近后圆环开始旋转。", "原本静止的环形装置转动起来。"],
    "shield_absorbed": ["防护屏障吸收了来袭冲击，内部目标未受伤。", "投射物被护盾挡住。"],
    "health_reduced": ["毒性生效导致目标生命下降。", "中毒者的身体状态明显恶化。"],
    "collapsed": ["生命耗尽的单位倒下。", "中毒目标最终失去行动能力。"],
    "no_followup": ["当前变化没有触发新的后续效果，场景保持稳定。", "没有新的因果步骤发生。"],
    "threshold_alarm": ["数值刚刚向上越过规定界线，触发了警报。", "从阈值下方升到上方后警报启动。"],
}


def positive_case(identifier: str, previous: str, current: str, expected: str, group: str) -> dict:
    return {"id": identifier, "kind": "positive", "previous": previous, "current": current, "expected": expected, "group": group}


def negative_case(identifier: str, previous: str, current: str, group: str) -> dict:
    return {"id": identifier, "kind": "negative", "previous": previous, "current": current, "expected": "no_followup", "group": group}


def development_cases() -> list[dict]:
    return [
        positive_case("dev-detonate-1", "一架飞行器正在完整爆炸物的上层位置。", "飞行器下降后与完整爆炸物重合，但装置尚未反应。", "detonated", "paraphrase"),
        positive_case("dev-quiet-1", "小车位于拆掉引信的地雷前方。", "小车碾到失效地雷，装置依然处于断开状态。", "stays_quiet", "context"),
        positive_case("dev-bounce-1", "方块悬在弹性地面上方。", "方块落到弹性地面，使其受到压缩。", "bounced_away", "paraphrase"),
        positive_case("dev-switch-1", "雕像在没有发光的踏板旁，铁门关着。", "雕像移动到踏板上，踏板被压住但暂时没亮，铁门仍关闭。", "switch_activated", "paraphrase"),
        positive_case("dev-melt-1", "热源和坚冰尚未接触。", "热源开始贴住坚冰表面，冰仍保留原状。", "melted", "paraphrase"),
        positive_case("dev-brittle-1", "重物正在靠近有裂痕的隔板。", "重物击中隔板，新的裂纹从接触点扩散。", "barrier_broken", "paraphrase"),
        positive_case("dev-hard-1", "易碎武器正在接近坚硬墙体。", "易碎武器打中墙体，墙面没有明显变化。", "tool_broken", "context"),
        positive_case("dev-money-1", "角色有一万金币，最低安全余额为六千，尚未付款。", "角色付掉七千金币，只剩三千，低于最低安全余额。", "bankrupt", "numeric"),
        positive_case("dev-card-1", "一张行动卡还在手里，事件牌堆没有翻开。", "行动卡被放到桌面，事件牌堆仍保持背面朝上。", "event_revealed", "procedural"),
        positive_case("dev-nonce-1", "蓝晶尚未触到白色软球，旁边圆环不动。", "蓝晶现在碰到白色软球，软球暂时仍白，圆环不动。", "fluff_black", "nonce"),
        positive_case("dev-shield-1", "投射物飞向保护目标的力场。", "投射物命中力场外侧，受保护目标仍然健康。", "shield_absorbed", "context"),
        positive_case("dev-poison-1", "单位还没有吸入有毒气体，生命稳定。", "单位刚刚吸入有毒气体，但目前还站着。", "health_reduced", "context"),
        positive_case("dev-arrow-up", "控制槽读数为4，低于触发线10。", "控制槽读数变为12，现在高于触发线10。", "threshold_alarm", "arrow_discrimination"),
        negative_case("dev-arrow-down", "控制槽读数为16，已经高于触发线10。", "控制槽读数变为12，现在高于触发线10。", "arrow_discrimination"),
        negative_case("dev-neg-pass", "飞机在炸弹上方飞行。", "飞机已经从炸弹旁经过并飞到下方，两者没有接触。", "near_negative"),
        negative_case("dev-neg-approach", "飞机离炸弹很远。", "飞机逐渐靠近炸弹但仍隔着两个格子。", "near_negative"),
        negative_case("dev-neg-hypothesis", "叙述者正在讨论炸弹。", "叙述者提出如果飞机撞上炸弹也许会爆炸，这只是一个假设。", "modality"),
        negative_case("dev-neg-observe", "观察者没有看见炸弹。", "观察者发现远处放着一枚炸弹，但没有物体靠近它。", "observation"),
        negative_case("dev-neg-money-safe", "角色有一万五千金币，安全线六千。", "角色支付两千后还有一万三千，仍远高于安全线。", "numeric"),
        negative_case("dev-neg-card-held", "卡牌处于牌库中。", "玩家把卡牌拿到手中，但没有打出。", "procedural"),
    ]


def holdout_cases() -> list[dict]:
    positives = [
        ("det-a", "外星载具悬在一枚完好爆弹的第3行上方。", "外星载具向下结束移动，与第4行的爆弹占据同一区域，爆弹尚完整。", "detonated", "position"),
        ("det-b", "矿洞推车正在朝未启动的炸药前进。", "推车抵达炸药的位置并发生碰撞，炸药还未表现出变化。", "detonated", "paraphrase"),
        ("det-c", "重球与完好的爆炸机关相隔一段轨道。", "重球沿轨道运动后撞到爆炸机关，机关暂时维持完整。", "detonated", "actor_transfer"),
        ("quiet-a", "飞行物正在接近已经拔掉引线的炸弹。", "飞行物碰到了无引线炸弹，炸弹依然是失效状态。", "stays_quiet", "context"),
        ("quiet-b", "车辆前方是一枚进水的地雷。", "车辆从进水地雷上压过，地雷仍然没有能源。", "stays_quiet", "paraphrase"),
        ("quiet-c", "机械爪与断电爆炸器分处工作台两端。", "机械爪伸到断电爆炸器处并触碰外壳，电源仍断开。", "stays_quiet", "actor_transfer"),
        ("bounce-a", "圆盘位于压缩垫的正上方。", "圆盘下落并压住压缩垫，垫子正在蓄积弹力。", "bounced_away", "position"),
        ("bounce-b", "棋子离反弹地格还有一步。", "棋子进入反弹地格，地格被向下压。", "bounced_away", "paraphrase"),
        ("bounce-c", "货箱在弹性平台的高处。", "货箱掉在弹性平台表面，使平台发生压缩。", "bounced_away", "actor_transfer"),
        ("switch-a", "巨石在暗着的压力板旁边，栅门处于关闭状态。", "巨石滚到压力板上把它压下，板子尚未亮起，栅门还关着。", "switch_activated", "paraphrase"),
        ("switch-b", "角色正靠近未启动的脚踏机关，远端入口封闭。", "角色站上脚踏机关，机关处于被压状态但还未发光。", "switch_activated", "actor_transfer"),
        ("melt-a", "高温射线尚未照到冰制屏障。", "高温射线覆盖冰制屏障表面，屏障暂时保持形状。", "melted", "paraphrase"),
        ("melt-b", "燃烧物和冻结水池分开。", "燃烧物落在冻结水池上，冰面刚开始受热。", "melted", "actor_transfer"),
        ("break-a", "攻城锤正接近布满裂纹的旧门。", "攻城锤撞上旧门，裂纹向四周延伸。", "barrier_broken", "paraphrase"),
        ("break-b", "高速弹丸飞向薄弱的玻璃墙。", "弹丸击中玻璃墙，撞击点出现大量裂痕。", "barrier_broken", "actor_transfer"),
        ("hard-a", "陶瓷斧正在挥向没有损伤的钢板。", "陶瓷斧砍中钢板，钢板没有凹陷。", "tool_broken", "paraphrase"),
        ("hard-b", "易断长杆朝坚固岩壁移动。", "长杆末端撞到岩壁，岩壁保持原状。", "tool_broken", "actor_transfer"),
        ("money-a", "一名角色当前持有两万金币，破产界线为六千，账单未付。", "角色交出一万六千金币后仅余四千，余额越过破产界线。", "bankrupt", "numeric"),
        ("money-b", "商队资金是一万一千，规则要求至少保留六千。", "商队支付六千费用，只剩五千，已经低于规则要求。", "bankrupt", "numeric"),
        ("card-a", "法术卡仍在玩家手牌，事件堆保持遮盖。", "玩家把法术卡打到场上，事件堆尚未揭示。", "event_revealed", "procedural"),
        ("card-b", "季节牌还没有被使用，桌面没有公开事件。", "季节牌刚被使用，事件牌仍然背面向上。", "event_revealed", "procedural"),
        ("nonce-a", "钴色晶块与白茸团分开，附近的环形物静止。", "钴色晶块触到白茸团，茸团颜色暂时没变，环形物不动。", "fluff_black", "nonce"),
        ("nonce-b", "蓝斑晶体尚未接触浅色毛团，石圈没有旋转。", "蓝斑晶体现在贴住浅色毛团，毛团仍浅色，石圈静止。", "fluff_black", "nonce"),
        ("shield-a", "高速碎片正在飞向笼罩角色的防护场。", "碎片击中防护场外缘，内部角色没有受到伤害。", "shield_absorbed", "paraphrase"),
        ("shield-b", "能量束朝保护机器人的屏障前进。", "能量束与屏障接触，机器人生命仍保持不变。", "shield_absorbed", "actor_transfer"),
        ("poison-a", "生物尚未吞下毒药，生命状况正常。", "生物刚吞下毒药，目前还能够站立。", "health_reduced", "paraphrase"),
        ("poison-b", "猎手在毒雾范围之外，身体健康。", "猎手进入毒雾并吸入一部分，暂时没有倒下。", "health_reduced", "actor_transfer"),
    ]
    cases = [positive_case(f"hold-{identifier}", previous, current, expected, group) for identifier, previous, current, expected, group in positives]
    negatives = [
        ("pass-1", "飞船在炸弹的上方。", "飞船从炸弹侧面掠过并继续向下，没有进入炸弹位置。", "near_negative"),
        ("pass-2", "滚石在炸药所在斜坡上方。", "滚石沿另一条岔路经过，最终停在炸药旁边。", "near_negative"),
        ("approach-1", "载具离地雷五格。", "载具前进两格，距离地雷仍有三格。", "near_negative"),
        ("observe-1", "地图上没有显示炸弹。", "地图视野扩大后显示远处有炸弹，没有单位移动。", "observation"),
        ("hypo-1", "规则书正在描述飞机。", "规则书说假如飞机撞炸弹可能产生后果，现实场景没有变化。", "modality"),
        ("remember-1", "角色正在回忆昨天。", "角色想起昨天曾看到炸弹爆炸，当前房间仍然安静。", "modality"),
        ("safe-money-1", "玩家有两万金币，破产线是六千。", "玩家支付五千后还剩一万五千，仍高于破产线。", "numeric"),
        ("safe-money-2", "商人有八千金币，最低线六千。", "商人获得三千金币后拥有一万一千。", "numeric"),
        ("card-draw", "一张牌位于牌堆顶。", "玩家把牌从牌堆抽到手中，没有将它打出。", "procedural"),
        ("card-inspect", "事件牌保持盖住。", "玩家查看牌背图案但没有翻开事件牌。", "procedural"),
        ("ice-near", "热源距离冰墙很远。", "热源移动到冰墙附近但没有接触或加热。", "near_negative"),
        ("wall-near", "锤子和脆墙相隔三米。", "锤子移动到墙边但没有挥动或撞击。", "near_negative"),
        ("switch-near", "箱子距离踏板两格。", "箱子移动到踏板旁边但没有压住它。", "near_negative"),
        ("shield-far", "箭矢正在远处飞行。", "箭矢靠近护盾但尚未与护盾接触。", "near_negative"),
        ("nonce-near", "蓝色晶体远离白色绒球。", "蓝色晶体移动到绒球旁边但没有接触。", "nonce_negative"),
        ("poison-see", "角色不知道桌上有什么。", "角色发现桌上放着毒药但没有服用或接触。", "observation"),
    ]
    cases.extend(negative_case(f"hold-neg-{identifier}", previous, current, group) for identifier, previous, current, group in negatives)
    return cases
