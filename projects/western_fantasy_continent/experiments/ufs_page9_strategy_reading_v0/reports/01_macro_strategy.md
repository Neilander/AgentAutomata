# 第1—9页后的宏观策略认知

## 阅读边界与结论摘要

本报告只使用实验协议允许的五份 stages JSON。读到第9页后，我形成的整体打法不是一条固定开局路线，而是：**在母舰这一确定倒计时下，以完成研究为主轴，用能源和挖掘建立研究能力，同时把城市伤害与敌机下降控制在不会先触发失败的范围内。** 每回合的关键不是单独追求某一种房间收益，而是同时处理骰子放置造成的敌机移动、房间阶段的资源与进度、以及回合末母舰必然推进带来的局面恶化。

这里的“整体打法”属于规则组合后的玩家推断，不代表规则给出的最优策略；允许输入明确阻止推出固定价值权重、最优骰序和标准胜利路线（`blockedInferences`：阶段5“规则没有给出能源、研究、防御和挖掘的固定价值权重”“规则没有给出稳赢开局、最优骰序或标准获胜路线”）。

## 一、规则明确给出的战略骨架

以下内容是规则直接陈述，而不是我的策略判断。

1. **胜负目标形成一场竞速。** 研究标记到达顶部会立即获胜（`research_top_is_immediate_win`；亦见 `win_by_research_before_destruction`）。城市伤害标记到达轨道底部会失败（`lose_by_damage_track`），母舰下降到骷髅行也会失败（`lose_by_mothership_skull`）。因此研究完成之前，玩家必须同时避免两种失败。

2. **每回合有固定的三段节奏。** 回合依次经历骰子阶段、房间阶段和母舰阶段（事实 `round_order`）。母舰阶段又依次是母舰下降、执行所在行的母舰行动、生成飞船（事实 `mothership_phase_order`）。母舰每回合都会下降并接近失败行（`mothership_descends_each_round`），其行行动还可能造成研究倒退、挖掘机倒退、增加白色飞船或城市受伤（`mothership_action_applies_row_effect`）。

3. **骰子放置同时决定基地收益和天空威胁。** 把骰子放入某列，会让该列全部飞船按点数下降并触发最终停留格效果（`die_moves_same_column_ships`；事实 `passed_sky_spaces_do_not_trigger`）。防空房所在列会把下降量减少1（`aa_reduces_descent`）。敌机若撞城，会造成1点伤害并返回母舰等待重新生成（`ship_city_hit`；事实 `damage_ship_returns`）。

4. **房间收益受能源、完整填充和结算顺序约束。** 带能源成本的房间只有支付能源才会生效（`room_requires_energy`）；多格房必须填满才能生效（`multi_room_requires_all_spaces`）。房间可以自由选择结算顺序（事实 `room_resolution_order_is_free`），能源房增加能源（`energy_room_generates_energy`），战斗机房击毁符合条件且停在爆炸格的敌机（`fighter_room_destroys_eligible_ships`），研究房按房间值支付连续研究格成本并推进研究（`research_room_advances_track`）。多个研究房必须分别结算，数值不能合并（事实 `different_research_rooms_separate`），而结算顺序可能改变最终推进量（`research_order_changes_usefulness`）。

5. **挖掘是扩大可用基地并抵达最终研究手段的前置链条。** 通常骰子只能放到已挖掘格；每回合最多可有一颗满足距离要求的骰子放到未挖掘格（`excavation_placement_requirement`）。房间阶段支付1能源后，挖掘机才移动到该格并开放身后路径（`excavate_cost_and_result`）。最终11点研究格只能由基地下半部的多格研究房到达（`final_research_requires_lower_multi_room`）。

6. **敌机不是一次性威胁。** 母舰下降时会收回所在行飞船，之后这些飞船进入生成流程（事实 `mothership_collects_row_ships`）。生成时先处理紫色飞船并优先空列；若各列已有飞船，则使用与列内最高飞船距离最大的投放点，完全平局时玩家才选择（`spawn_empty_columns_first`、`spawn_farthest_from_highest_ship`、行为 `choose_spawn_tie`）。白色飞船撞城后会回母舰，但被战斗机击毁则移出版图；紫色飞船被击毁后仍等待重生（事实 `white_ship_destruction_difference`）。

7. **白骰会改变本回合后续骰子的确定性。** 放置白骰会重投所有尚未放置骰子（`white_die_rerolls_remaining`）；规则书明确提示可以把白骰留到最后以减少一次重投（行为 `save_white_die_for_last`）。这只是合法的次序提示，不是固定最优开局。

## 二、由规则组合得到的宏观打法推断

以下是我基于上述规则形成的高层策略。它们不是规则直接保证的结论。

### 1. 把“研究竞速”作为方向，把“存活底线”作为约束

研究是唯一明确的获胜入口，而母舰每回合必降，所以不能无限期只防守或积累（`research_top_is_immediate_win`、`mothership_descends_each_round`）。但城市伤害和母舰骷髅行都能先结束游戏，且骰子放置本身会推动敌机，因此也不能把所有回合收益都只换成研究（`lose_by_damage_track`、`lose_by_mothership_skull`、`die_moves_same_column_ships`）。

我的宏观理解是：研究应当持续成为回合计划的终点，但每回合先确认是否存在迫近的失败风险，再决定本回合能把多少能力用于研究、能源、挖掘或防御。所谓“防御”在这里不是长期清空天空，而是把威胁压回足以继续推进研究的范围。

推断等级：强。胜负条件和母舰固定下降直接支撑方向，但规则没有给出何时应该从推进切换到防守的数值阈值。

### 2. 把每颗骰子看作“一次基地选择加一次天空后果”

骰子落在哪一列既决定房间用途，又让同列飞船下降；大点数通常意味着更强房间值，也可能意味着更大的敌机推进（`die_moves_same_column_ships`、`room_value`、`aa_reduces_descent`）。因此宏观上不能先独立安排房间收益、再补看天空。应当在同一次判断里权衡：这颗骰子为胜利链条贡献什么，以及它给本回合和后续回合增加多少威胁。

箭头格、母舰下降格、爆炸格和撞城让“下降”并非单一线性坏事；最终停留格才触发，落到爆炸格还可能为战斗机创造清除机会（概念 `arrow_space`、`mothership_down_space`、`explosion_space`；事实 `passed_sky_spaces_do_not_trigger`；`fighter_room_destroys_eligible_ships`）。所以整体思路应是管理敌机的落点与节奏，而不是机械地让所有飞船下降最少。规则本身也明确阻止断言“让飞船落到爆炸格一定比减缓下降更好”（阶段3 `blockedInferences`）。

推断等级：强。双重作用由规则直接构成；具体列的取舍仍取决于当时骰点和敌机位置。

### 3. 把能源视为行动链条的润滑剂，而不是单纯囤积目标

能源既能让带成本房间生效，也支付挖掘费用；没有能源时，已经放入某些房间的骰子可能被移除而无效果（`room_requires_energy`、`excavate_cost_and_result`）。因此能源不足会切断研究或挖掘计划，而能源达到上限后继续生产又会浪费（`energy_room_generates_energy`）。

我的宏观做法会是围绕计划中的付费效果维持“够用”的能源，并利用房间自由结算顺序，在可能时先补能源再结算消费能源的房间（事实 `room_resolution_order_is_free`）。这并不推出固定储备量；阶段3明确说不知道当前局面应保存多少能源。

推断等级：中强。能源的依赖关系明确，但具体房间成本、当前轨道位置和骰点决定当回合需求。

### 4. 把挖掘视为通向终局能力的必要投资，但不预设固定速度

最终11点研究格只能由基地下半部多格研究房到达，而通常只有挖掘后的格子可用（`final_research_requires_lower_multi_room`、`excavation_placement_requirement`、`excavate_cost_and_result`）。因此如果只使用上层已开放房间，最终不能完成胜利；挖掘不是可永久忽略的支线。

但挖掘同时占用本回合的一颗骰子、最多一次未挖掘放置机会和1能源，还可能被母舰行动倒退（`excavation_placement_requirement`、`excavate_cost_and_result`、`mothership_action_applies_row_effect`）。所以我不会把“每回合都挖”当成规则结论，而会把挖掘安排为阶段性投资：在不让眼前威胁或能源链条失控的条件下，逐步打开能支撑后续研究的基地深度，并在终局前确保能够使用下半部多格研究房。

推断等级：强（必要性）与中（节奏）。必要性由最终研究限制直接支撑；最佳挖掘速度被阶段5 `blockedInferences` 明确列为未知。

### 5. 以“可完成的房间组合”规划回合，而不是只追逐单颗高骰

多格房缺一颗骰就整体无效果，不同研究房又不能把房间值合并（`multi_room_requires_all_spaces`；事实 `different_research_rooms_separate`）。同时白骰的放置会重投剩余骰子（`white_die_rerolls_remaining`）。因此本回合若承担挖掘或多格研究等结构性目标，应先确认整个房间组合在列限制、填充要求和能源上是否有完成可能，而不是被一颗看似很强的骰子单独吸引。

规则允许自由结算房间，且研究房顺序会改变推进效果（事实 `room_resolution_order_is_free`；`research_order_changes_usefulness`）。所以放置阶段主要建立一个可兑现的组合，房间阶段再按当前能源与研究轨道成本选择兑现顺序。白骰是否留后只是降低重投的一种手段，不能在不知道局面的情况下上升为固定骰序（行为 `save_white_die_for_last`；阶段5 `blockedInferences`）。

推断等级：强。完整填充和分别结算直接要求组合思维；具体优先次序未知。

### 6. 接受敌机会循环，追求削峰与争取时间，而非默认永久清场

紫色飞船被击毁后会等待重生，撞城飞船也会返回母舰；母舰下降还会收回一行飞船再生成（事实 `white_ship_destruction_difference`、`damage_ship_returns`、`mothership_collects_row_ships`）。因此对紫色飞船的战斗机清除主要是改变威胁出现的时间与位置，并不等同于永久消除威胁。白色飞船被击毁会移出版图，长期效果可能不同，但规则并没有据此给出固定目标优先级。

宏观上我会把战斗、防空与落点管理理解为“为研究和挖掘购买回合空间”。生成规则还倾向先填空列，并在拥挤时拉开与最高飞船的距离（`spawn_empty_columns_first`、`spawn_farthest_from_highest_ship`），说明天空威胁会重新分布；平局选择只是有限的微调机会（行为 `choose_spawn_tie`），不应被当作可完全控制生成的位置。

推断等级：中强。循环机制明确，但清除一次究竟争取多少时间要看当时版面。

## 三、我会采用的回合级思考框架

这是一套检查顺序，不是具体行动枚举或最优解搜索。

1. **先看失败窗口。** 判断城市伤害、母舰位置及本回合各列敌机下降后，哪些风险会让研究计划来不及兑现（`lose_by_damage_track`、`lose_by_mothership_skull`、`mothership_descends_each_round`）。
2. **再定本回合的主推进目标。** 在研究推进、为研究补能源、向下挖掘建立终局能力、以及压低迫近威胁之间选一个主轴，其他用途只承担必要配合。主轴随局面变化，不设固定权重。
3. **把天空后果和房间组合一起检查。** 评估骰子放列产生的敌机最终落点，同时确认多格房、能源成本、每列一骰和最多一次未挖掘放置不会让计划自我冲突（`die_moves_same_column_ships`、`multi_room_requires_all_spaces`、`room_requires_energy`、行为 `place_die_in_column`、`place_one_excavation_die`）。
4. **保留对随机重投的弹性。** 白骰会重投未放骰，因此在需要保持后续骰点时可以考虑晚放；但若当前局面需要重投，也不能把“白骰永远最后”当成教条（`white_die_rerolls_remaining`、行为 `save_white_die_for_last`）。
5. **房间阶段按依赖关系兑现。** 利用自由顺序先满足能源依赖，再处理挖掘、战斗或研究；多个研究房依据当前连续格成本分别排序，避免让后结算房间失去推进能力（事实 `room_resolution_order_is_free`；`research_order_changes_usefulness`）。
6. **预想母舰阶段后的新局面。** 放置与房间收益不能只看本回合结束前，还要接受母舰必降、行行动和飞船重生会立刻改变研究、挖掘、伤害与天空分布（事实 `mothership_phase_order`；`mothership_action_applies_row_effect`）。

## 四、可能出现的宽泛阶段感（推断，不是固定路线）

- **较早阶段：建立可持续推进条件。** 一边开始研究，一边避免能源匮乏，并在安全窗口向下挖掘。依据是研究为胜利目标、付费房间与挖掘都依赖能源、最终研究依赖下半部多格房（`research_room_advances_track`、`room_requires_energy`、`excavate_cost_and_result`、`final_research_requires_lower_multi_room`）。
- **中段：在研究、基地展开和威胁控制之间动态切换。** 母舰下降会缩短剩余时间且可能倒退已有进度，敌机也会循环生成，所以不能假定一次建设或一次清场能永久解决问题（`mothership_descends_each_round`、`mothership_action_applies_row_effect`、事实 `damage_ship_returns`）。
- **接近终局：围绕下半部多格研究房组织完整回合。** 最终研究格要求这种房间，而多格房必须填满，进入终局前要同时具备基地深度、可完成的骰子组合、能源和足够的生存余量（`final_research_requires_lower_multi_room`、`multi_room_requires_all_spaces`、`room_requires_energy`）。

这种“阶段感”只说明能力链条的先后依赖，不说明第几回合挖掘、应存多少能源或某轮必须研究多少。

## 五、读完第9页仍不能知道的内容

1. **不存在可由规则文本推出的固定资源权重。** 无法知道能源、研究、防御、挖掘在所有局面中的统一兑换率，也无法给出“总要保留多少能源”的数值（阶段3与阶段5 `blockedInferences`）。
2. **不知道最佳挖掘速度。** 只知道最终必须能使用下半部多格研究房，不知道应多早到达、是否应连续挖掘、某次挖掘是否值得牺牲其他房间（阶段4与阶段5 `blockedInferences`）。
3. **不知道固定最优骰序或开局。** 白骰晚放只是规则提示的选项；大骰应放哪列、白骰重投何时有利、怎样形成稳赢开局都没有答案（阶段2与阶段5 `blockedInferences`）。
4. **不知道防空、爆炸格战斗和主动承受下降之间的普遍优先级。** 飞船只触发终点且可能被引向不同效果，但规则没有证明某种处理方式始终更好（阶段3 `blockedInferences`）。
5. **不知道主动让母舰收回哪些飞船是否有稳定收益。** 只知道母舰会收回所在行飞船并重新生成，不知道应主动塑造哪一种回收局面（阶段4 `blockedInferences`）。
6. **不知道各局面的边际价值。** 当前骰点、敌机位置、轨道状态会改变各选择价值，而允许输入把这一点保留为开放问题（阶段5 `openQuestions`：“不同开局骰子和敌机位置下，各资源的当前边际价值是多少？”）。
7. **不知道第10页后的内容。** 城市能力、机器人、威胁等级细节和战役规则不属于首局知识，不能用于修正上述策略（事实 `first_game_reading_boundary`；阶段5 `blockedInferences`）。

## 最终宏观判断

仅凭第1—9页，我会把游戏理解为一场受固定母舰时钟驱动的研究竞速：骰子既是基地行动能力，也是推动敌机的风险源；能源维持房间和挖掘链条；挖掘逐步打开抵达最终研究格所必需的下半部多格研究房；防空、战斗和生成选择则为这条胜利链争取时间。合理的整体打法应持续朝研究终点收束，却按每回合的即时失败风险动态调整能源、挖掘和防御，不把任何一种资源、骰序或开局路线当成脱离局面的固定最优答案。
