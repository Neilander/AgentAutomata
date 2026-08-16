from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StatePair:
    id: str
    domain: str
    state_a: str
    state_b: str
    distractors: tuple[str, str]


@dataclass(frozen=True)
class RelationFamily:
    id: str
    forward: str
    reverse: str
    pairs: tuple[StatePair, ...]


def pair(
    id: str,
    domain: str,
    state_a: str,
    state_b: str,
    distractor_1: str,
    distractor_2: str,
) -> StatePair:
    return StatePair(id, domain, state_a, state_b, (distractor_1, distractor_2))


FAMILIES: tuple[RelationFamily, ...] = (
    RelationFamily(
        "distance",
        "approach",
        "recede",
        (
            pair("ship_city", "ufs", "侦察机距离城市还有六格。", "侦察机已经逼近城市上空。", "侦察机获得了一层护盾。", "侦察机被防空炮击毁。"),
            pair("army_castle", "strategy", "敌军还在城堡远方集结。", "敌军已经推进到城门外。", "敌军开始修筑营地。", "敌军分成了两支部队。"),
            pair("rook_king", "chess", "白车远离黑王所在的区域。", "白车已经靠近黑王。", "白车受到己方棋子的保护。", "白车离开了棋盘。"),
            pair("meteor_planet", "space", "陨石仍在行星的遥远轨道。", "陨石已经接近行星大气层。", "陨石裂成了两块。", "陨石的速度降低了。"),
            pair("guard_vault", "stealth", "守卫距离金库还有很远。", "守卫已经来到金库门前。", "守卫打开了手电筒。", "守卫呼叫了增援。"),
            pair("virus_core", "tower_defense", "病毒单位位于核心区外很远的位置。", "病毒单位已经逼近核心区。", "病毒单位获得了抗性。", "病毒单位被减速了。"),
            pair("pawn_goal", "board", "棋子距离终点还有很长一段路。", "棋子已经来到终点前一格。", "棋子获得了额外行动。", "棋子被翻到了背面。"),
            pair("fire_forest", "survival", "山火离营地仍然很远。", "山火已经蔓延到营地附近。", "山火的烟雾变浓了。", "山火被雨水削弱了。"),
        ),
    ),
    RelationFamily(
        "height",
        "descend",
        "ascend",
        (
            pair("ufs_fighter", "ufs", "战机停留在天空轨道的高层。", "战机下降到了天空轨道的低层。", "战机横向移动到另一列。", "战机返回了供应区。"),
            pair("elevator", "puzzle", "电梯位于塔楼的顶层。", "电梯来到了塔楼的底层。", "电梯门被锁住了。", "电梯的灯熄灭了。"),
            pair("dragon", "fantasy", "巨龙盘旋在城堡上方的高空。", "巨龙俯冲到了贴近地面的位置。", "巨龙喷出了火焰。", "巨龙飞出了城堡范围。"),
            pair("submarine", "naval", "潜艇保持在接近海面的深度。", "潜艇下潜到了深海区域。", "潜艇打开了声呐。", "潜艇释放了诱饵。"),
            pair("platform", "platformer", "升降平台停在竖井上端。", "升降平台移动到了竖井下端。", "升降平台开始左右摆动。", "升降平台碎裂了。"),
            pair("balloon", "adventure", "气球漂浮在山谷上方。", "气球降落到了山谷底部。", "气球改变了颜色。", "气球被风吹向东方。"),
            pair("water_level", "management", "水库的水位处于高位。", "水库的水位下降到了低位。", "水库的水变得浑浊。", "水库开始向农田供水。"),
            pair("mine_cart", "factory", "矿车位于斜坡轨道顶端。", "矿车滑到了斜坡轨道底端。", "矿车装满了矿石。", "矿车切换到了支线。"),
        ),
    ),
    RelationFamily(
        "quantity",
        "gain",
        "lose",
        (
            pair("energy", "ufs", "基地只剩下一点能源。", "基地储存了六点能源。", "基地的研究等级提升了。", "基地的一间房被损坏了。"),
            pair("coins", "roguelike", "冒险者的钱袋里只有两枚金币。", "冒险者的钱袋里装着十枚金币。", "冒险者换上了一把长剑。", "冒险者获得了中毒状态。"),
            pair("ammo", "survival", "步枪弹匣里只剩一发子弹。", "步枪弹匣已经装满子弹。", "步枪安装了瞄准镜。", "步枪的枪管过热了。"),
            pair("research", "strategy", "研究进度几乎为零。", "研究进度已经积累了很多。", "研究项目更换了方向。", "研究设施被敌军占领了。"),
            pair("food", "management", "仓库里的食物所剩无几。", "仓库里囤积了大量食物。", "仓库扩建了一层。", "仓库遭到了盗窃。"),
            pair("cards", "card", "玩家手里只剩一张牌。", "玩家手里已经有七张牌。", "玩家改变了出牌顺序。", "玩家跳过了这个回合。"),
            pair("workers", "city", "工地上只有一名工人。", "工地上聚集了许多工人。", "工地更换了施工图纸。", "工地被大雨淹没了。"),
            pair("medicine", "expedition", "医疗箱里的药品接近耗尽。", "医疗箱重新装满了药品。", "医疗箱被转交给队友。", "医疗箱的锁坏掉了。"),
        ),
    ),
    RelationFamily(
        "activation",
        "activate",
        "deactivate",
        (
            pair("turret", "tower_defense", "炮塔处于关闭状态。", "炮塔已经启动并开始工作。", "炮塔被移动到了高台。", "炮塔的装甲被打破了。"),
            pair("shield", "combat", "能量护盾目前没有运作。", "能量护盾已经展开。", "能量护盾改变了覆盖对象。", "能量护盾被永久摧毁了。"),
            pair("room", "ufs", "生产房间尚未启动。", "生产房间已经被骰子激活。", "生产房间被挖掘机越过了。", "生产房间出现了裂缝。"),
            pair("trap", "stealth", "地面陷阱还没有被触发。", "地面陷阱已经进入触发状态。", "地面陷阱被搬到了门口。", "地面陷阱被敌人发现了。"),
            pair("engine", "racing", "赛车引擎处于熄火状态。", "赛车引擎已经点火运转。", "赛车引擎更换了燃料。", "赛车引擎冒出了黑烟。"),
            pair("portal", "fantasy", "传送门现在处于沉寂状态。", "传送门已经亮起并开始运作。", "传送门改变了目的地。", "传送门周围出现了守卫。"),
            pair("alarm", "heist", "警报系统目前没有运行。", "警报系统已经被启动。", "警报系统更换了密码。", "警报系统被搬离了控制室。"),
            pair("generator", "survival", "备用发电机处于停机状态。", "备用发电机已经开始供电。", "备用发电机被拖进了仓库。", "备用发电机开始漏油。"),
        ),
    ),
    RelationFamily(
        "containment",
        "enter",
        "leave",
        (
            pair("hero_room", "dungeon", "英雄站在密室外面。", "英雄已经进入密室。", "英雄点燃了火把。", "英雄失去了武器。"),
            pair("ship_harbor", "naval", "运输船仍在港口外海。", "运输船已经驶入港口。", "运输船升起了旗帜。", "运输船卸下了货物。"),
            pair("token_zone", "board", "指示物位于得分区之外。", "指示物已经进入得分区。", "指示物翻到了红色面。", "指示物与另一个棋子交换位置。"),
            pair("enemy_range", "tower_defense", "敌人还在炮塔射程之外。", "敌人已经走进炮塔射程。", "敌人获得了加速效果。", "敌人分裂成了两个单位。"),
            pair("train_station", "logistics", "列车停在车站范围之外。", "列车已经驶入车站。", "列车装载了货物。", "列车改变了运行方向。"),
            pair("virus_cell", "biology_game", "病毒颗粒位于细胞外部。", "病毒颗粒已经进入细胞内部。", "病毒颗粒发生了变异。", "病毒颗粒被染成了红色。"),
            pair("piece_castle", "chess", "国王位于王车易位区域之外。", "国王已经进入王车易位后的安全区域。", "国王受到了一次将军。", "国王旁边的兵向前移动了。"),
            pair("robot_factory", "factory", "运输机器人停在工厂门外。", "运输机器人已经进入工厂。", "运输机器人装上了新轮子。", "运输机器人失去了导航信号。"),
        ),
    ),
    RelationFamily(
        "visibility",
        "reveal",
        "hide",
        (
            pair("trap", "dungeon", "陷阱隐藏在地板下面。", "陷阱的位置已经显露出来。", "陷阱被移动到了走廊。", "陷阱失去了伤害能力。"),
            pair("card", "card", "这张牌背面朝上，内容未知。", "这张牌已经翻开，内容可见。", "这张牌被放入了弃牌堆。", "这张牌的费用降低了。"),
            pair("enemy", "stealth", "敌人藏在战争迷雾中。", "敌人的位置已经被侦察发现。", "敌人获得了更多生命值。", "敌人开始向北移动。"),
            pair("rune", "puzzle", "符文被灰尘遮住，无法辨认。", "符文被清理后完整显现。", "符文被复制到纸上。", "符文发出了声音。"),
            pair("map", "exploration", "地图上的北部区域还是空白。", "地图北部的道路已经显示出来。", "地图被折叠起来。", "地图上增加了一个任务标记。"),
            pair("weakness", "boss", "首领的弱点尚未被玩家察觉。", "首领的弱点已经暴露。", "首领进入了第二阶段。", "首领召唤了新的敌人。"),
            pair("mine", "naval", "水雷藏在浑浊的水面下。", "声呐让水雷的位置变得清晰。", "水雷开始缓慢漂移。", "水雷的爆炸范围扩大了。"),
            pair("door", "escape", "暗门与墙壁融为一体。", "暗门的轮廓已经被看见。", "暗门被一把锁固定住了。", "暗门后传来了脚步声。"),
        ),
    ),
    RelationFamily(
        "strength",
        "strengthen",
        "weaken",
        (
            pair("armor", "combat", "骑士的护甲十分薄弱。", "骑士的护甲变得非常坚固。", "骑士获得了更快的移动速度。", "骑士被迫更换了站位。"),
            pair("attack", "rpg", "法师的法术伤害很低。", "法师的法术伤害大幅增强。", "法师学会了传送。", "法师的施法距离缩短了。"),
            pair("wall", "city", "城墙已经脆弱不堪。", "城墙经过修复后十分牢固。", "城墙上增加了一扇门。", "城墙外出现了一支商队。"),
            pair("signal", "space", "基地发送的信号十分微弱。", "基地发送的信号变得强劲。", "基地改变了信号频率。", "基地停止了研究工作。"),
            pair("poison", "roguelike", "毒素的效果非常轻微。", "毒素被强化成了猛烈的剧毒。", "毒素变成了蓝色。", "毒素被装进了另一个瓶子。"),
            pair("economy", "strategy", "王国经济目前十分疲弱。", "王国经济发展得非常强盛。", "王国更换了统治者。", "王国发现了一片新大陆。"),
            pair("shield", "ufs", "城市护盾只能抵挡很少伤害。", "城市护盾现在能够抵挡大量伤害。", "城市护盾覆盖了新的区域。", "城市护盾的颜色改变了。"),
            pair("deck", "card", "这套牌的进攻能力很弱。", "这套牌的进攻能力变得很强。", "这套牌加入了更多抽牌手段。", "这套牌减少了卡牌数量。"),
        ),
    ),
    RelationFamily(
        "connection",
        "connect",
        "disconnect",
        (
            pair("bridge", "map", "河流两岸之间没有通路。", "一座桥把河流两岸连接起来。", "河水上涨淹没了岸边。", "桥边出现了收费站。"),
            pair("power", "factory", "发电机与机器之间没有线路。", "电缆已经接通发电机和机器。", "发电机增加了燃料。", "机器更换了生产配方。"),
            pair("rooms", "dungeon", "两间密室彼此隔绝。", "一条暗道连通了两间密室。", "密室里出现了怪物。", "密室的地板开始下沉。"),
            pair("network", "strategy", "两座基地无法交换信息。", "通讯网络让两座基地保持连接。", "一座基地升级了防御。", "两座基地同时遭到攻击。"),
            pair("rail", "logistics", "两段铁路之间存在缺口。", "新铺的轨道接上了两段铁路。", "铁路旁建起了仓库。", "列车提高了运行速度。"),
            pair("portal", "fantasy", "两座传送门之间没有反应。", "两座传送门已经建立连接。", "传送门周围出现了魔物。", "传送门改变了外观。"),
            pair("alliance", "diplomacy", "两个阵营之间互不合作。", "盟约让两个阵营联合起来。", "其中一个阵营更换了领袖。", "两个阵营发现了共同的敌人。"),
            pair("pipes", "management", "水泵与蓄水池并未相连。", "管道已经连通水泵和蓄水池。", "蓄水池扩大了容量。", "水泵的运行速度下降了。"),
        ),
    ),
    RelationFamily(
        "obstruction",
        "block",
        "unblock",
        (
            pair("corridor", "dungeon", "走廊目前可以自由通行。", "落石完全堵住了走廊。", "走廊里点亮了火把。", "走廊尽头出现了宝箱。"),
            pair("line", "chess", "白车与目标之间没有棋子。", "一枚棋子挡住了白车的直线路径。", "白车获得了另一枚棋子的保护。", "目标棋子移动到了别处。"),
            pair("road", "strategy", "补给道路保持畅通。", "敌军封锁了补给道路。", "补给车增加了装甲。", "道路旁发现了资源点。"),
            pair("door", "escape", "房门现在可以直接打开。", "沉重的家具堵死了房门。", "房门上出现了一串密码。", "房间里的灯被打开了。"),
            pair("signal", "space", "通讯信号能够正常传递。", "干扰场阻断了通讯信号。", "通讯内容经过了加密。", "通讯设备获得了备用电源。"),
            pair("river", "map", "船只可以沿河道继续前进。", "倒下的树木封住了河道。", "河道水流变得更快。", "船只发现了一个码头。"),
            pair("spell", "fantasy", "法术能量可以正常流向目标。", "结界切断了法术能量的路径。", "法术的颜色变成了红色。", "施法者缩短了吟唱时间。"),
            pair("conveyor", "factory", "传送带上的货物能够继续移动。", "卡住的箱子堵塞了传送带。", "传送带提高了运行速度。", "货物被贴上了标签。"),
        ),
    ),
    RelationFamily(
        "protection",
        "protect",
        "expose",
        (
            pair("archer", "combat", "弓手暴露在敌人的攻击范围内。", "盾兵挡在弓手前面提供保护。", "弓手换上了一把新弓。", "弓手开始瞄准远处目标。"),
            pair("king", "chess", "国王周围没有己方棋子防守。", "多枚己方棋子保护着国王。", "国王移动到了棋盘中央。", "国王对敌方棋子形成了将军。"),
            pair("city", "ufs", "城市直接面对飞船的攻击。", "能量屏障覆盖并保护了城市。", "城市增加了研究设施。", "城市派出了新的机器人。"),
            pair("data", "heist", "机密数据没有任何安全措施。", "加密系统保护着机密数据。", "机密数据被复制了一份。", "机密数据被移动到另一台机器。"),
            pair("camp", "survival", "营地完全暴露在风雪中。", "厚实的围墙保护了营地。", "营地储存了更多食物。", "营地里点燃了篝火。"),
            pair("transport", "strategy", "运输队独自在危险区域行进。", "护卫部队正在保护运输队。", "运输队改变了目的地。", "运输队卸下了一半货物。"),
            pair("core", "tower_defense", "基地核心没有防御单位看守。", "防御塔环绕并保护着基地核心。", "基地核心开始产生资源。", "基地核心移动到了另一个位置。"),
            pair("witness", "adventure", "证人独自站在敌人面前。", "队友组成阵线保护了证人。", "证人说出了新的线索。", "证人离开了当前房间。"),
        ),
    ),
    RelationFamily(
        "availability",
        "consume",
        "restore",
        (
            pair("nuke", "ufs", "核弹仍然完整，可以以后使用。", "核弹已经引爆，无法再次使用。", "核弹被移动到了另一格。", "核弹的伤害范围被标记出来。"),
            pair("potion", "rpg", "治疗药水还装在瓶子里。", "治疗药水已经被喝掉。", "治疗药水被交给了队友。", "治疗药水的品质得到了鉴定。"),
            pair("key", "escape", "钥匙仍在玩家手中，可以开锁。", "钥匙已经断裂，不能继续使用。", "钥匙被藏进了口袋。", "钥匙对应的门被发现了。"),
            pair("ability", "moba", "英雄的大招现在可以释放。", "英雄的大招已经使用并进入冷却。", "英雄的大招提高了伤害。", "英雄改变了攻击目标。"),
            pair("action", "board", "玩家还保留着一次特殊行动。", "特殊行动已经花费掉了。", "特殊行动被推迟到下一轮。", "特殊行动获得了额外奖励。"),
            pair("ammo", "survival", "火箭筒里还有一枚火箭弹。", "最后一枚火箭弹已经发射。", "火箭筒被交给了同伴。", "火箭筒安装了新的瞄具。"),
            pair("charge", "strategy", "防御装置仍保存着一次充能。", "防御装置已经耗尽充能。", "防御装置改变了防守方向。", "防御装置的射程扩大了。"),
            pair("reroll", "roguelike", "玩家还拥有一次重掷机会。", "重掷机会已经被使用。", "重掷结果得到了一枚高点数骰子。", "玩家把骰子放回了袋子。"),
        ),
    ),
    RelationFamily(
        "closure",
        "open",
        "close",
        (
            pair("gate", "strategy", "城门紧紧关闭。", "城门已经打开。", "城门外聚集了敌军。", "城门得到了额外加固。"),
            pair("chest", "dungeon", "宝箱的盖子处于闭合状态。", "宝箱已经被打开。", "宝箱被搬到了房间中央。", "宝箱上出现了魔法光芒。"),
            pair("route", "map", "通往北方的道路尚未开放。", "通往北方的道路已经开放。", "道路旁建立了营地。", "道路的长度被标注出来。"),
            pair("window", "stealth", "窗户严密地关着。", "窗户已经被推开。", "窗户外出现了守卫。", "窗户玻璃被擦干净了。"),
            pair("portal", "fantasy", "传送入口目前处于封闭状态。", "传送入口已经开启。", "传送入口改变了颜色。", "传送入口被移动到了大厅。"),
            pair("menu", "simulation", "高级建造菜单仍被锁定。", "高级建造菜单已经解锁开放。", "建造菜单增加了搜索功能。", "建造菜单更换了排序方式。"),
            pair("vault", "heist", "金库的大门完全闭合。", "金库大门已经敞开。", "金库内部响起了警报。", "金库门上安装了新摄像头。"),
            pair("dam", "management", "水坝的泄洪口保持关闭。", "水坝的泄洪口已经打开。", "水坝提高了蓄水上限。", "水坝附近开始下雨。"),
        ),
    ),
)


CORE_FAMILY_IDS = {
    "distance",
    "height",
    "quantity",
    "activation",
    "containment",
    "visibility",
}


def build_transitions(core_only: bool = False) -> list[dict]:
    transitions: list[dict] = []
    for family in FAMILIES:
        if core_only and family.id not in CORE_FAMILY_IDS:
            continue
        for item in family.pairs:
            transitions.append(
                {
                    "id": f"{family.forward}:{item.id}",
                    "family": family.id,
                    "relation": family.forward,
                    "inverse_relation": family.reverse,
                    "domain": item.domain,
                    "before": item.state_a,
                    "after": item.state_b,
                    "candidates": [item.state_b, item.state_a, *item.distractors],
                    "correct_index": 0,
                }
            )
            transitions.append(
                {
                    "id": f"{family.reverse}:{item.id}",
                    "family": family.id,
                    "relation": family.reverse,
                    "inverse_relation": family.forward,
                    "domain": item.domain,
                    "before": item.state_b,
                    "after": item.state_a,
                    "candidates": [item.state_a, item.state_b, *item.distractors],
                    "correct_index": 0,
                }
            )
    return transitions

