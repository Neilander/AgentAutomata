# 02 资源强调阅读：第1—9页

## 阅读口径

本文只讨论规则最强调的资源、压力、约束与它们之间的交换，不展开宏观打法，也不提出具体局面下的行动方案。这里的“资源”不限于可增减的数值条，也包括终局进度、生存余量、时间、空间、骰子带来的行动容量和结算次序留下的选择权。

规则没有给出能源、研究、防御和挖掘的固定价值权重，也没有给出不同局面下的边际价值（`05-first-game-complete.blockedInferences`、`05-first-game-complete.openQuestions`）。因此，下面不会声称存在规则明示的资源总排名。文中若说某项“更基础”或“更直接”，只是依据胜负条件、支付关系和强制约束作出的结构性推断。

## 一、规则明确内容

### 1. 研究进度：唯一明示的正向胜利进度

- 城市未被摧毁时完成研究即可获胜（`win_by_research_before_destruction`）；研究标记到达轨道顶部会立即获胜（`research_top_is_immediate_win`）。
- 研究房以房间值支付连续研究格的数字成本，能够推进一格或多格（`research_room_advances_track`）。不同研究房必须分别结算，房间值不能跨房间相加；结算顺序可能改变能推进的距离，甚至让一个房间无法推进（`different_research_rooms_separate`、`research_order_changes_usefulness`、`choose_research_room_order`）。
- 最终11点研究格只能由基地下半部的多格研究房到达（`final_research_requires_lower_multi_room`）。母舰行动又可能令研究倒退（`mothership_action_applies_row_effect`；概念 `research_back`）。

这些规则直接把研究写成“积累后结束游戏”的进度，同时为其设置连续成本、专用终局入口和倒退压力。规则明确其终局作用，但没有明确某一点研究在任何局面中的固定价值。

### 2. 两种失败余量：城市伤害与母舰距离

- 伤害标记到达伤害轨道底部即失败（`lose_by_damage_track`）。敌机撞城会造成1点伤害并返回母舰（`ship_city_hit`、`damage_ship_returns`），母舰行效果也可能直接使城市受伤（`mothership_action_applies_row_effect`）。
- 母舰下降到骷髅标记行即失败（`lose_by_mothership_skull`）。它每回合母舰阶段都下降一行并接近失败行（`mothership_descends_each_round`）；飞船停在母舰下降格也会使其立即下降（概念 `mothership_down_space`）。

因此，伤害轨道和母舰距骷髅行的剩余空间都是规则明确的生存约束。前者承受离散的伤害事件，后者承受每回合必然推进并可能额外推进的时间压力。规则没有说明伤害能否恢复、母舰能否上移，所以不能把两者进一步断言为“绝对不可恢复资源”。

### 3. 能源：可生产、有上限、会被明确支付的通用资源

- 能源由独立轨道记录（`tracked_state`；概念 `energy`）。能源房按房间值增加能源，但不能超过轨道上限（`energy_room_generates_energy`、`generate_energy`）。
- 带能源成本的房间只有在支付标示能源后才生效；不支付或无法支付时骰子仍被移除且无效果（`room_requires_energy`、`resolve_room`、`skip_room_die`）。
- 移动挖掘机到合法的挖掘骰位置要支付1能源（`excavate_cost_and_result`、`pay_to_excavate`）。

这是第1—9页中支付关系最明确的可消耗数值资源：它连接“生成能源”与“兑现房间效果/挖掘”的两端。上限又明确造成潜在溢出约束，而不足会让已经投入的骰子无法产生房间效果。

### 4. 骰子、列与房间格：每回合行动容量的载体及其绑定约束

- 第一局使用2颗白骰和3颗灰骰（`first_game_dice`）。放置骰子既会让同列全部飞船按点数下降并触发最终停留格，又会把骰子投入一个基地房间（`die_moves_same_column_ships`、`place_die_in_column`）。
- 每列最终只能有一颗骰子；通常只能放在已挖掘格；本回合最多使用一个未挖掘格（`place_die_in_column`、`place_one_excavation_die`）。
- 房间值由骰子点数及房间修正决定（概念 `room_value`）。多格房间必须填满所有格子才生效，否则全部相关骰子均无效果（`multi_room_requires_all_spaces`）。
- 放置白骰会重投全部尚未放置骰子；规则书明确提示可以把一颗白骰留到最后以减少一次重投（`white_die_rerolls_remaining`、`save_white_die_for_last`）。
- 防空房令同列飞船少下降一格，但其在房间阶段没有效果（`aa_reduces_descent`；概念 `aa_room`）。

规则因此明确强调：一颗骰子的点数不是单一收益值。它同时决定敌机下降压力、房间效果强度、可否跨越挖掘距离，并受列占用、多格完整性和白骰重投牵制。骰子是否会在下一回合以何种方式恢复，不在允许输入的明确内容中；本文只把本回合的未放骰子、合法列和房间格视为有限行动容量。

### 5. 已挖掘空间与挖掘机位置：基地能力的空间门槛

- 通常只有已挖掘格允许放骰；未挖掘格要用点数不小于路径距离的骰子，而且一回合最多使用一个（`excavation_placement_requirement`、`place_one_excavation_die`）。
- 房间阶段支付1能源后，挖掘机移动到该骰位置，身后路径全部变为已挖掘（`excavate_cost_and_result`）。
- 母舰行动可能让挖掘机后退，但不会越过起点（`mothership_action_applies_row_effect`；概念 `excavator_back`）。最终研究格又要求使用基地下半部的多格研究房（`final_research_requires_lower_multi_room`）。

规则明确把基地深度变成可用房间的空间门槛：推进它要同时占用一次特殊放置、足够点数和1能源，并且可能被母舰行动部分逆转。

### 6. 敌机位置与数量：把行动转化为压力的动态状态

- 每次放骰会移动同列全部飞船；飞船只触发最终停留格，经过格不触发（`die_moves_same_column_ships`、`passed_sky_spaces_do_not_trigger`）。箭头格、母舰下降格、爆炸格分别改变位置、加快母舰或提供被战斗机击毁的条件（概念 `arrow_space`、`mothership_down_space`、`explosion_space`）。
- 战斗机房按房间值击毁爆炸格数字不大于该值的全部敌机（`fighter_room_destroys_eligible_ships`）。撞城则消耗城市的伤害余量（`ship_city_hit`）。
- 母舰下降会收回所在行的飞船，随后按顺序执行母舰下降、行行动、飞船生成（`mothership_phase_order`、`mothership_collects_row_ships`）。生成优先空列；各列都有飞船时选择距列内最高飞船最远的投放点，完全平局时玩家选择（`spawn_empty_columns_first`、`spawn_farthest_from_highest_ship`、`choose_spawn_tie`）。
- 白色飞船撞城后返回母舰，但被战斗机击毁时从版图移除；紫色飞船被击毁后等待重生（`white_ship_destruction_difference`）。母舰行动还可能增加白色飞船（`mothership_action_applies_row_effect`；概念 `spawn_white_ship`）。

敌机不是玩家持有的资源，但其列、纵向位置、颜色和是否待生成共同构成压力状态；它会占用防空/战斗机房的处理能力，并把骰子点数转译成伤害风险、母舰加速或可击毁机会。

### 7. 结算顺序与有限选择权

- 房间可以按任意顺序结算（`room_resolution_order_is_free`、`resolve_room`）。研究房因连续格成本且不能合并房间值，顺序可能改变实际结果（`research_order_changes_usefulness`）。
- 飞船生成的优先级大多强制决定投放点，但完全平局时玩家保留选择权（`spawn_farthest_from_highest_ship`、`choose_spawn_tie`）。

规则明确保留了两种非数值能力：房间阶段的排序自由，以及生成平局中的有限选择。前者有被规则示例直接证明的结果差异；后者的实际价值取决于当时天空状态，规则没有给出固定估值。

## 二、由规则组合得到的推断

以下均不是规则书直接给出的资源排名或策略结论。

### 1. 可把资源系统理解为“终局进度—生存时间—行动转化”三层

- **终局进度**是研究：它是唯一明示的主动获胜进度（`win_by_research_before_destruction`、`research_top_is_immediate_win`）。
- **生存时间**由伤害余量和母舰距离共同界定：任一失败条件先到达都会终止研究积累（`lose_by_damage_track`、`lose_by_mothership_skull`、`mothership_descends_each_round`）。
- **行动转化层**包括骰子、能源、已挖掘空间、房间与结算顺序：这些要素把有限放置转为研究、防空、战斗机、能源生产或挖掘（`die_moves_same_column_ships`、`room_requires_energy`、`excavate_cost_and_result`、`room_resolution_order_is_free`）。

这是一种结构描述，不代表研究在每个瞬间都应排第一，也不代表两种失败余量可以用统一单位精确换算。

### 2. 能源更像“兑现能力”，骰子更像“机会容量”

能源可以被生产、储存到上限并支付给多个不同用途；骰子则承担放置、移动敌机、形成房间值和满足挖掘距离等多重任务（`energy_room_generates_energy`、`room_requires_energy`、`excavate_cost_and_result`、`die_moves_same_column_ships`）。由此推断，能源不足会阻断已选择房间的兑现，而骰子/合法格不足会在更早阶段限制哪些效果有机会被建立。两者不是简单替代品：有骰无能源可能无效，有能源但没有合适骰子、列或完整多格房也无法自动转成效果（`multi_room_requires_all_spaces`）。

### 3. 挖掘是把当前资源换成未来可用空间，但终局规则使这种空间不是纯可选品

一次挖掘明确要用足点数骰、一次未挖掘格机会和1能源，换来身后路径开放（`excavation_placement_requirement`、`excavate_cost_and_result`）。最终研究又只能由基地下半部多格研究房完成（`final_research_requires_lower_multi_room`）。因此可以推断，已挖掘深度既是未来房间访问能力，也与完成胜利链条存在结构性联系；但规则没有据此给出最佳推进速度，且明确阻止这一推断（`05-first-game-complete.blockedInferences`）。

### 4. 防御压力会同时消耗“生存余量”和“产出机会”

敌机撞城直接减少伤害余量；处理敌机则需要通过列放置的防空减速，或用骰子形成战斗机房间值并满足爆炸格条件（`aa_reduces_descent`、`fighter_room_destroys_eligible_ships`、`ship_city_hit`）。由于同一批骰子也承载研究、能源和挖掘，可推断防御压力不仅威胁失败轨道，还会竞争本回合的行动容量。规则没有提供把“一点伤害风险”和“一次房间机会”互换的固定汇率。

### 5. 点数同时是产出强度与外部压力强度，因而不是单向的“越大越多”资源

较高点数通常提高房间值并能满足更远挖掘距离，但放入某列也会让该列全部飞船下降更多（`die_moves_same_column_ships`、概念 `room_value`、`excavation_placement_requirement`）。防空房仅将下降量减1（`aa_reduces_descent`）。因此可推断，骰子点数的意义是耦合的：它可能增加内部效果容量，也同步放大外部移动压力。规则明确阻止从这里推出“大骰优先放哪列”或白骰重投在何时有利（`02-round-and-placement.blockedInferences`）。

### 6. 失败不仅来自“缺少资源”，也来自已投入资源无法兑现

不支付能源时骰子被移除而房间无效果；多格房缺任一格时全部相关骰子无效果；研究房顺序不合适可能让某房间无法推进（`room_requires_energy`、`multi_room_requires_all_spaces`、`research_order_changes_usefulness`）。由此推断，规则特别强调资源的配套性和时序：点数、能源、格位和顺序必须共同满足，单看某一条轨道的存量不足以判断有效能力。

### 7. 若只按规则结构而非局面价值分层，最突出的不是一个资源，而是三类不可忽视项

这不是固定价值排名，而是基于规则角色的推断：

1. 研究、伤害、母舰距离直接连接立即胜负（`research_top_is_immediate_win`、`lose_by_damage_track`、`lose_by_mothership_skull`）。
2. 骰子/列/房间格决定行动能否建立，能源决定部分行动能否兑现（`place_die_in_column`、`multi_room_requires_all_spaces`、`room_requires_energy`）。
3. 挖掘深度决定空间可达性，并被最终研究入口赋予终局关联（`excavate_cost_and_result`、`final_research_requires_lower_multi_room`）。

在这三类内部，规则没有足够信息继续排出恒定先后顺序。

## 三、目前尚不能知道的内容

- **固定价值与优先级未知。** 规则没有给出能源、研究、防御、挖掘之间的固定权重，也没有给出不同状态下的当前边际价值（`05-first-game-complete.blockedInferences`、`05-first-game-complete.openQuestions`）。
- **最佳挖掘速度未知。** 只知道最终研究需要下半部多格研究房，不能据此推出开局或中途应以多快速度挖掘（`05-first-game-complete.blockedInferences`）。
- **能源安全存量未知。** 只知道能源能启动房间且挖掘固定消耗1能源，不知道应保存多少，也不知道某次挖掘是否值得牺牲其他房间（`03-ship-effects-and-rooms.blockedInferences`、`04-excavation-and-mothership.blockedInferences`）。
- **防御形式之间的通用优劣未知。** 不知道让飞船落到爆炸格是否必然优于单纯减缓下降，也不知道应主动让母舰收回哪些飞船（`03-ship-effects-and-rooms.blockedInferences`、`04-excavation-and-mothership.blockedInferences`）。
- **骰序与点数的通用价值未知。** 不知道大骰应优先放哪列、白骰重投何时有利或有害，也不知道多格研究房在哪些回合值得占用多颗骰子（`02-round-and-placement.blockedInferences`、`03-ship-effects-and-rooms.blockedInferences`）。
- **资源恢复机制的若干细节未知。** 允许输入没有明确说明伤害能否恢复、研究倒退与挖掘倒退的所有边界后果、骰子跨回合的恢复细节，因此不能把这些状态擅自标为永久损失或精确计算长期总量。
- **后续系统完全不在知识边界内。** 首局玩家不知道第10页后的城市能力、机器人、威胁等级细节和战役内容，不能用它们修正上述资源判断（`first_game_reading_boundary`、`05-first-game-complete.blockedInferences`）。

## 结论

第1—9页最强的资源表达不是一张“研究高于能源高于防御”的排行榜，而是一组互相锁定的约束：研究提供唯一明示胜利进度；伤害余量与母舰距离构成双重失败时钟；骰子、列和房间格提供有限行动容量；能源负责兑现付费效果；挖掘把当下的骰子、点数、能源和特殊放置机会换成未来可用空间；敌机状态则持续把同一批行动转成外部压力。房间结算顺序和生成平局选择提供有限的非数值选择权。规则足以说明这些要素为何重要以及它们怎样彼此交换，但不足以给出跨局面恒定的资源排序或最优交换率。
