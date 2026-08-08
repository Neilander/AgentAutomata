# Coop Report Index

Reports are append-only handoff records. Prefer the timestamped report path over relying on a mutable "latest" pointer.

## 2026-08-08

- `2026-08-08_0058_border-village-town-prosperity-ui.md`：人口与行动归入右上角当前城镇框；点击繁荣进入可拖拽人口轨迹，查看行动和单位的当前/未来收益。

- `2026-08-08_0016_border-village-prebattle-food-supply.md`：编队常显一战粮耗；开战后左滑进入军粮大锅，点击/长按投入，`x/X`与20%—100%发挥进入真实战斗和权威结算。

## 2026-08-07

- `2026-08-07_2355_border-village-downward-compatible-formations.md`：战斗人数改为上限；2/4/8人小编队可进入更大战斗，同组内最接近上限的队伍优先。

- `2026-08-07_2342_border-village-prebattle-formation-picker.md`：战前公开4/8/20单位规格，三段排序全部编队；点击查看详情，所选成员与站位进入真实战斗和权威结算。

- `2026-08-07_2315_border-village-formation-boundary-icon.md`：立绘区域完全留空，缩小职业图标居中跨在立绘与信息区域的分界线上。

## 2026-08-06

- `2026-08-06_2333_border-village-formation-compact-summary.md`：职业图标居中于上方视觉区；姓名移到战斗力上方靠左，战斗力相关字号缩小。

- `2026-08-06_2320_border-village-formation-art-slot.md`：编队人物牌新增向下展开的中段立绘位，顶部职业图标去框，底部战斗力层保持独立。

## 2026-08-05

- `2026-08-05_1820_border-village-formation-identity-cards.md`：编队单位改为横向人物牌；复用正式职业图标，右侧恢复姓名/城镇，底栏独立显示百万级战斗力。

- `2026-08-05_1706_border-village-formation-tactical-cards.md`：编队成员卡和站位槽改为战斗力/职业/城镇；删除姓名与“我/民/战”字形，并新增随真实属性变化的公开战斗力。

- `2026-08-05_1640_border-village-militia-character-page.md`：民兵进入人物翻页并显示真实技能/数值；八槽与配装动作明确锁定，装备权限仍只属于英雄和战士。

- `2026-08-05_1600_border-village-formation-position-editor.md`：出战成员新增站位编辑；2单位一前一后、20单位5×4方阵，槽位持久化并支持拖动或点击移动/交换。

- `2026-08-05_1550_border-village-formation-unit-capacity.md`：编队容量统一按单位计算；英雄、10人民兵队、10人战士队各占1单位，所有容量、超编校验与界面文案同步修正。

- `2026-08-05_1533_border-village-formation-page-v1.md`：启用军备编队页；2/4/8/20人可编辑、40/100/200人锁定，上下拖拽成员，超员/混城整队标红，并可筛选当前城池。

- `2026-08-05_1511_border-village-inline-stats-button.md`：数值按钮移到“一键全队”右侧，删除人物区右下角绝对定位，原数值覆盖层交互保持不变。

- `2026-08-05_1456_border-village-taller-skill-cards.md`：立绘区让出约5%高度，技能区删除外框；技能卡增高并恢复一行效果概述，精确公式仍按悬停或聚焦显示。

- `2026-08-05_1404_border-village-skill-card-hierarchy.md`：修正技能卡视觉层级，固定左上技能名、下一行技能类型、右上冷却，数值悬停浮层保持不变。

- `2026-08-05_1358_border-village-numeric-skill-tooltips.md`：技能卡按需显示真实数值；悬停或聚焦可查看目标数、基础值、攻击倍率、伤害类型、持续时间与被动比例，六类职业全部抽查通过。

- `2026-08-05_1337_border-village-compact-equipment-slots.md`：人物立绘区移除巨大身份汉字，保留无文字占位；八槽缩成56px小方格，完整装备属性和词条改为悬停或键盘聚焦显示。

- `2026-08-05_1218_border-village-character-page-equipment.md`：删除占高的两排角色轴；军备顶部改为“编队/人物”，人物页用前后分页切人，左人物与右背包取得完整主体高度并适配短窗口。

- `2026-08-05_1206_border-village-equipment-modal-v1.md`：独立三块军备浮窗替代底部换装主路径；两排圆形单位轴、长立绘八槽技能、悬停真实数值层，以及按所有权排序的背包装备/卸下流程全部接通。

- `2026-08-05_1143_border-village-unit-block-wrap.md`：单位方块缩至40px，删除整体大框、标题和滚动条；方块直接浮在地图左侧，垂直空间不足时自动向右换列。

- `2026-08-05_1127_border-village-map-unit-roster.md`：主地图左侧增加常驻我方单位头像列，完整显示玩家、含候补的全部主将、每支民兵与战士；状态实时同步，长列表内部滚动并隔离地图输入。

- `2026-08-05_0141_infinite-loot-ui-and-chapter2-direction.md`：记录第一章真人试玩后的UI/循环问题，确立先打磨单位、粮食、军备与刷装目标感，再用第二章验证运输、防守、因果抉择和人物关系系统的路线。

- `2026-08-05_0024_border-village-equipment-detail-vertical-scroll.md`：修正上一版滚动方向误判；右侧装备详情独立纵向滚动，可在较矮窗口查看第二排装备，不再劫持滚轮横移。

- `2026-08-05_0013_border-village-equipment-scroll.md`：底部队伍与装备栏增加横向滚动与滚轮映射，左侧单位名单独立纵向滚动；选择单位后保留位置，静态与核心回归通过。

- `2026-08-05_0004_border-village-trained-soldier-equipment.md`：每支已训练战士成为独立8部位配装单位，与英雄共用手动和一键分配；装备真实进入突袭/决战属性，旧存档空槽兼容，五类回归通过。

## 2026-08-02

- `2026-08-02_1746_border-village-global-grind-wins.md`：5/10/30/50解锁改为所有难度共享总胜场；全程刷难度1到50胜可解锁难度5，各档胜场仅作统计，核心与静态前端回归通过。

- `2026-08-02_1723_border-village-grind-thresholds-and-loot-tables.md`：刷关解锁改为5/10/30/50胜，五档使用独立精确件数与稀有度表，旧存档按新阈值重新计算；难度4缺失的10个百分点暂补入史诗，跨档重新校准且五类回归通过。

- `2026-08-02_1457_border-village-five-tier-grind-ladder.md`：边林改为1—5档手动刷关阶梯，每档3胜解锁、10胜毕业，锁定档位和原因始终可见；高档提高敌群与掉落，真实战斗校准确认旧档6—8胜时多数能稳定跨档，五类回归通过。

## 2026-08-01

- `2026-08-01_2334_border-village-wounded-guard-nerf.md`：马库斯保留统一knight技能，按负伤状态将生命/攻击/护甲降至82%/80%/82%，并移除救援时隐藏强化伊莎贝拉；盾骑民兵路线中位死亡3→4，五类回归通过。

- `2026-08-01_2326_border-village-final-casualty-analysis.md`：修正只看胜率的判断，新增最终战英雄/士兵死亡与分布统计；全清据点混装时斥候民兵平均死6.32人，盾骑战士死2.60人，整体有伤亡压力但路线生存差距明显。

- `2026-08-01_2258_border-village-final-battle-winrate.md`：以7支军队+一局最多7名英雄、八部位普通/稀有装跑最终战配对模拟；完整23敌军仍有压力，但三据点全清后全普通装也100%胜，盾骑路线明显强于斥候。本轮仅诊断未调数值。

- `2026-08-01_1820_border-village-enemy-pressure-and-retry.md`：分战斗增强边林、训练、三个据点与最终敌军；失败不扣本次行动力/粮食并保留原入口，决战失败不结束存档，连续刷怪战败后继续。初始边林100种子73胜，完整路线仍可通关。

- `2026-08-01_1549_border-village-permanent-grind-node.md`：修复边林讨伐节点在开场、最终战和结局状态整块消失；地点永久留在地图，暂不可用时标红具体原因，五类回归通过。

- `2026-08-01_0249_border-village-resource-territory-r3-playtest.md`：灰谷村重构为金币/粮食资源循环与据点领地建设；补齐收益标识、透明结算、整队配装和决战已知事实预警。R3密封新手29轮、9场真实战斗后12v16获胜，记录/知识库/公开轨迹机器审计通过，未启动服务器或浏览器。

## 2026-07-31

- `2026-07-31_0108_border-village-visible-disabled-actions.md`：已解锁但暂时不可用的修建、升级、征召、铁匠、突袭、事件、集市和编队操作继续显示为红色禁用项，并具体列出缺少的行动力/资源/等级/容量；核心拒绝绕过，未来内容仍不泄露，五类回归通过。

- `2026-07-31_0044_border-village-one-click-equipment.md`：为当前角色增加八部位“一键最高战力”，只使用无人穿戴装备且不降级/不抢队友，结果弹窗显示部位与战力增量；决战前仍可整理，手动覆盖保留。五类回归通过。

- `2026-07-31_0003_border-village-authoritative-combat-result.md`：修复共享战斗视图把`ally/hpNow`渲染单位提交给要求`left/hp`权威结果的核心，导致每战指纹不一致；现直接提交内部`sim.buildResult()`，逐帧与一次性模拟指纹一致，58场路线通过。

## 2026-07-30

- `2026-07-30_2351_border-village-map-drag-bounds.md`：修复地图虽有pointer代码却因紧世界边界而拖不动的问题；增加受限镜头余量、抓取反馈和防选择，并用共享相机断言横纵拖动均实际改变坐标。未启动服务器。

- `2026-07-30_2346_border-village-short-window-fit.md`：修复独立页面强制720px高且禁止滚动造成的底部裁切；改为`100dvh`真实视口，提供58/50px短窗口顶栏和自适应覆盖抽屉，底部按钮始终可见。静态契约通过，未启动服务器。

## 2026-07-29

- `2026-07-29_2319_border-village-workbench-route-fix.md`：查明反复修改却无视觉变化的根因是工作台仍指向旧 `five_day_guard_raid`，而新版甚至未进入服务静态目录；现已新增灰谷村首位入口与两条静态根，旧十五日入口明确标旧，验证契约通过。需重启 Start Local。

- `2026-07-29_2309_border-village-map-overlay-drawer.md`：主界面改为标题栏下全高地图，底部默认只有一个按钮；角色、八部位、分页背包和记录以覆盖地图的抽屉展开，不再挤压地图，战斗/连续讨伐自动隐藏。静态验证通过，未启动服务器或浏览器。

- `2026-07-29_2301_border-village-map-crop-fix.md`：修复地图缩短后左上内容显示不全；战况牌改为横向矮条，相机最小缩放放宽，并以1054×330真实坐标验证全图四角不裁切。底栏固定布局保持不变，未启动服务器或浏览器。

- `2026-07-29_2244_border-village-fixed-bottom-dock.md`：地图适度缩短，底栏从嵌套滚动改为固定展示；200件背包用24件分页，队伍、八部位、紧凑装备详情和最近日志均不再内部滚动。静态与四项核心回归通过，未启动服务器或浏览器。

- `2026-07-29_1607_border-village-war-program-and-static-web.md`：交付七日边陲村魔物战争核心与地图式静态前端；两轮密封 open-novice 学会人口/AP、粮食、建设、刷装和突袭，第二条合理路线经同终局真实战斗小幅调平为2/11存活险胜。共享战斗、输入封口与静态验证通过，未启动服务器或浏览器。

## 2026-07-28

- `2026-07-28_1652_eight-slot-guild-quests.md`：十五日版本改为八部位手动配装，继承佣兵小镇普通至神话的 1/2/4/7/12 词条规则；以可混编自有/临时角色的简单与困难协会委托替换称号试炼。城镇与事件仅给方案，程序与静态验证通过。

## 2026-07-27

- `2026-07-27_0121_fifteen-day-quests-titles-preview.md`：十五日版本加入取得线索后出现的任务条、跨任务事件关联、确定资源/受影响线路提示、七级真实称号试炼、战前敌方称号与阵容预览，以及角色入队全屏提示；程序、静态合同、输入封口和真实战斗回归通过。

## 2026-07-26

- `2026-07-26_2246_start-local-launcher-fix.md`：修复 Start Local 因 Windows `Path`/`PATH` 重复而无法创建 Node 子进程；BAT 统一委托稳健 PowerShell 启动器，增加健康检查、失败可见反馈和无浏览器诊断，完整 BAT 入口及工作台/游戏页面均验证为 200。

## 2026-07-25

- `2026-07-25_1124_fifteen-day-real-grind-loop.md`：将瞬时十连刷装改为逐轮正式战斗；四个装备区均有 LV1/LV2/LV3 独立敌阵，整页自动连战、胜利逐件掉落、稀有度排序陈列、本轮后停止与战败恢复均完成浏览器实测。

- `2026-07-25_1044_fifteen-day-map-first-ui.md`：十五日网页改为地图优先交互；接入共享 camera，地点直接打开锚定浮窗，补齐拖动/缩放/复位、同区错列、空白/Esc/跨日关闭，并完成真实浏览器、铁匠、战斗和输入封口回归。

## 2026-07-24

- `2026-07-24_2152_fifteen-day-event-choice-surplus.md`：将选择密度从首日修补扩展到十五日全程；三幕各18个事件，实际花完每日行动的完整路线每天开局仍有5～14个节点，并补齐新增事件结算、具体结果与输入封口回归。

- `2026-07-24_1803_fifteen-day-choice-cap-callback-pressure.md`：处理六项试玩反馈：独立行动力、首日四节点争三行动、跨日事件、200件背包自动分解、旧事回响，以及敌人等级覆盖修复和单体首领整队强化；程序、封口、静态网页与正式战斗回归通过。

- `2026-07-24_1711_event-result-dialog.md`：为非战斗事件与调查增加必须确认的行动结果弹窗；刷装/换装/编队不弹，战斗仍走完整战场与原战后面板，静态合同和程序回归通过。

- `2026-07-24_1701_fifteen-day-specific-event-feedback.md`：将三幕非战斗事件从泛化“处理了事件”改为逐选项即时因果反馈；修复铁匠任务要求被后续日志遮盖，玩家输入封口与程序/战斗/静态网页回归均通过。

- `2026-07-24_1628_smith-inner-browser-regression.md`：按真实点击路径复查铁匠解锁链；新/旧存档即时解锁、当前场景反馈、免费刷装、行动后持久化、未完成封口和浏览器零报错均通过，并以1000+1000件抽样确认内环掉落层级高于外环。

- `2026-07-24_1614_smith-inner-dungeon-unlock-fix.md`：修复交三把普通武器只得蓝装、门后却没有高级副本的断链；试炉完成后立即开放灰炉内环，提供第一幕第二级掉落，旧网页存档自动补开且玩家观察不提前泄露。

- `2026-07-24_1300_fifteen-day-workbench-entry.md`：删除临时独立启动器，将“无限刷装：十五日围剿”加入既有工作台 Demo 区首位，并由原工作台服务器提供游戏页面、十五日核心与共享战斗资源；测试端口全部返回 HTTP 200。

- `2026-07-24_1125_fifteen-day-playable-web.md`：将十五日三幕程序接回离线网页版，补齐15日时间轴、地点事项数、动态4/10人队伍、真实战斗结果和浏览器回归；修复结束本日重复绑定及共享战场大于4人时的出生位重叠，实测河畔战斗与20v10三十单位无卡片重叠。

- `2026-07-24_0410_fifteen-day-program-demo-two-sealed-playtests.md`：交付纯程序 15 日三幕 Demo，开局 2 事件、约 30 个事件、13 名角色、4→10 人扩编，并由两名密封玩家分别跑通政治路线和 4v6/10v10/20v10 正面路线；输入边界与程序回归通过，但独立审查仍拒绝把摘要式 trace 当作细粒度认知/情绪证据。

- `2026-07-24_0100_five-day-river-combat-visibility-fix.md`：修复河畔战斗已经运行却被旧场景层遮盖的问题；增加显式 `hidden` 层级、战场加载/错误反馈和战斗按钮标记，浏览器逐一验证四个河畔战斗入口且无外围面板重叠。

- `2026-07-24_0017_five-day-playable-web-real-combat.md`：交付五日章节静态可玩前端；挑战和最终战接入共享真实战斗，战斗时收起外围界面且没有跳过按钮。玩家输入继续封口，40组路线矩阵验证普通刷取、政治准备与极端硬刷边界。

## 2026-07-23

- `2026-07-23_1941_five-day-combat-and-input-leak-audit.md`：确认五日版错误绕过共享正式战斗运行时，挑战和战斗终局仍是标量比较；逐字段审计两轮正式试玩，发现评测目标在52/52个决策请求中泄漏并实际驱动各13次探索。现已隔离评测目标并删除三个设计师解释式结果文案；旧学习结论降级，真实战斗接入仍未完成。

- `2026-07-23_1706_five-day-formal-blind-loop-correction.md`：纠正旧四轮普通 Agent 试玩的无效学习结论；封口未来节点/锁因/结果/目标概念，接入正式决策—反馈—归因循环并完成两轮全新盲测。修复资源反馈、重复失败、NPC承诺和无效查门；第二轮同状态决斗由旧阈值128:132失败调为128:125胜，身份词条一般化仍未证明。

- `2026-07-23_1136_five-day-guard-raid-loop.md`：早期“五日护卫队来袭”状态机报告；其中机械矩阵仍可参考，但“四轮模拟玩家已学习”的结论已由 `2026-07-23_1706_five-day-formal-blind-loop-correction.md` 作废。

## 2026-07-22

- `2026-07-22_1729_equipment-identity-tags.md`：新增独立于战斗效果的装备身份词条层；记录贵族、古代锻造、赃物、流放者、宗教、具体阵营和恐怖等首批方向，并规定由世界规则按观察者和场景读取。

- `2026-07-22_1721_bg3-sultan-confirmed-principles.md`：完成《博德之门3》和《苏丹的游戏》经验取舍；新增问题空间、红队测试、分层教学、多维装备、失败即时回报和有效坏办法，明确不采用装备普遍提供世界动词。

- `2026-07-22_1632_world-causality-growth-principles.md`：记录成长质变、世界状态网络、前因式多解、时间推进、失败改局、可观察因果和复杂度收束七项原则；具体成长节点、事件字段和最终战汇总变量仍待确认。

- `2026-07-22_1113_conflict-inertia-switch-threshold.md`：将惯性与转向阈值加入权谋矛盾模型；新方案略优不足以改变立场，暂以高出当前方案50%作为待验证候选，并记录公开承诺、沉没投入、不确定性、失败、担保和保留颜面对门槛的影响。

- `2026-07-22_1100_conflict-constraint-framework.md`：将限制加入权谋矛盾的正式构成；方案先经过行动、时间、资源、信息、接触、信用、互斥、公开性、能力和承诺等限制的可行性判断，再比较需求价值。具体第一阶段限制仍待选择。

- `2026-07-22_1053_conflict-need-priority-framework.md`：在无限刷装阶段事件框架中新增权谋矛盾模型；记录多方、需求集合、优先级、满足价值、可替代性和底线阈值，并增加复仇雇佣、矿脉墓地、圣物俘虏围剿、城门粮食四组非定案推演样例。

- `2026-07-22_1026_infinite-loot-stage-event-framework.md`：整理《我的超能力是无限刷装》第一阶段事件框架；固定五天共15行动点、刷怪不耗行动点、总选项量严格大于15，以及锁钥、自我选择、引入、Challenge四类事件的职责与反退化约束。具体事件池、掉率和剧情仍待用户补充。

## 2026-07-21

- `2026-07-21_0254_three-round-sealed-emotion-validation.md`：玩家情绪生成模型完成三轮按人物来源组隔离、预测先冻结后揭晓的顺序验证；V1/V2/V3有效事件Top-3分别82%/83%/100%，顺序合计68条有效事件Top-1 56%、Top-3 87%。新增持续威胁、责任内疚和接触性厌恶；正式玩家Agent未改，固定V3大样本独立盲测与强度校准仍待完成。

- `2026-07-21_0218_event-impact-generative-emotion-v1.md`：完成隔离的“客观事件→固定影响公式→生理化学动力学→多情绪”V1；9个真实来源发现并修正7类分流错误，17个来源明确情绪全部进入约定范围；结果不是盲测，正式玩家Agent未修改。

- `2026-07-21_0034_player-emotion-contract-and-blind-corpus.md`：固定包含显式血清素的玩家情绪模型 V1 契约与防答案泄漏协议；整理 7,343 条第一人称案例，按人物隔离为 5,068 训练、1,228 调试、1,047 封存盲测，并把输入与情绪答案彻底分开。正式 V27 未修改，下一步开发隔离动力学模拟器。

## 2026-07-20

- `2026-07-20_2252_emotion-neurochemical-behavior-model.md`：将玩家情绪建模方向改为“认知评价→九个神经化学生理轴的释放/衰减→注意、学习、动作、规划、社会和疼痛行为偏置→结合认知对象解释情绪”；否定每种情绪一对一分泌物和多巴胺=快乐，整理主要物质、12类情绪组合、R/A/C/EVerify连接与12个隔离case。未修改正式运行时。

- `2026-07-20_1913_player-decision-emotion-latent-space-exploration.md`：整合玩家决策、价值需求与情绪建模探索；区分多方案规划、洞察压缩和自我选择，否定单油箱/二维互斥情绪模型，提出“高维区域由六个工程坐标加认知上下文解码”的最小实验方案，并以34个情绪家族、跨游戏案例、碰撞/消融测试约束后续开发。未修改正式运行时。

- `2026-07-20_0142_edecision-process-quality-agency-design.md`：完成EDecision统一方案：EDecision只计有效思考量，QDecision用证据贴合、行为杠杆、可验证度、区分度、修正程度减去无意义重复和无法理解；掌控感Agency独立按Goal×path×ROI保存，并以Stuckness表达“目标重要但没有路”。给出20类隔离case和影子接入顺序，正式运行时尚未修改。

- `2026-07-20_0113_player-model-integration-audit.md`：系统审计历史玩家模型与当前V27接线。最近的角色认知、信息过滤、换人预期/A/C、结构化EVerify和假设注意均在正式入口；真正未合并的是V4反馈存量/习惯化/概率放弃、V5的P×Q/deadRepetition/incomprehension/kP/Agency，以及被真实Agent决策架构替代的V1–V3代码行动策略。旧代码与测试都仍有效，问题是平行运行时没有合并。

## 2026-07-19

- `2026-07-19_2346_hypothesis-directed-attention.md`：V27把待验证结构化假设接到战斗信息接收前的限时注意；240种子完整可比较率9.58%→18.75%，无关变化0，旧12链回放2条→3条明确结算且未全量确认。复查同时纠正2328报告：request-024确有敌方施放同名技能，真实漏洞是无来源场地状态默认归我方，现已要求明确left/right来源。

- `2026-07-19_2328_two-player-chapter1-formal-everify.md`：开放新手与惯性玩家并行跑V26第一章；真实Agent共主动提出12条结构化链，1确认/1反驳/10信息不足，开放新手后续4次引用新因果知识；换人失败未泛化。发现普通感知技能链闭合率偏低和我方技能被翻译成敌方状态的明确Bug。

- `2026-07-19_2226_formal-structured-everify-wiring.md`：正式接通战前公开角色/技能标识、Agent三步因果链、战后已接收证据、EVerify反馈和因果知识；确认、反驳、缺证据三种端到端案例及旧合同/信息过滤/血量/跨职业回归均PASS。

- `2026-07-19_1816_health-threshold-causal-evidence.md`：两章战斗把连续血量快照压缩为75%/50%/25%血条向下跨档证据，停留不重复、回血后可重入、跨多档保留；500种子感知顺序、知识隔离、无HP泄漏和狂战完整低血量链均PASS，正式两周期无回归。

- `2026-07-19_1748_causal-evidence-cross-archetype-validation.md`：用7场既有真实模拟存档验证狂战、骑士、牧师、游侠、法师和吟游的结构化因果证据；正例确认、战败与顺序倒置证伪、技能串线和内部名被拦截，三档感知缺链时保持无法判断。正式接入暂缓，先补低血量状态证据和战前公开技能指纹。

- `2026-07-19_1630_structured-causal-chain-matcher.md`：新增不依赖战后Agent自评的结构化因果链匹配器，15个案例覆盖完整链、错误击杀者、同类不同目标、漏信号、时间倒置、护盾/控制链、噪声和主因拒绝；真实fixture证明当前“我方击倒4人”聚合信号不足以确认细游侠链，需先补结构化玩家可见事件层。

- `2026-07-19_1517_everify-causal-chain-v2.md`：隔离EVerify重建为完整因果链V2；Agent先写至少3步链，程序用已接收步骤、时间和冻结档位逐边计算support。整链不平均，断链不确认，已成立前缀保留为局部知识；正式Agent合同和事件匹配器尚未接入。

- `2026-07-19_1450_everify-input-boundary-correction.md`：纠正隔离EVerify越界输入；删除自造画面/归因清晰度和连续竞争解释值，只读取现有三档玩家模型已接收事件的冻结informationTier，并拒绝0.63等自定义数值。1349报告相关描述被本报告取代。

- `2026-07-19_1349_isolated-everify-v1.md`：隔离版EVerify只读取玩家可见因果证据，不读取R；7类小案例覆盖同胜负不同归因、输但局部机制成立、画面不清、赢但原因被证伪、无验证机会，正式运行时未接入。

- `2026-07-19_1335_everify-discovery-fields-deferred.md`：novelty和closure暂缓并单独进入任务板；无专门玩家语义证据时两者及发现爽感固定为0，closure删除strength回退，EVerify主线可继续开发。

- `2026-07-19_1305_modular-feedback-and-causal-everify.md`：Process/R/A/EVerify拆为独立反馈模块；EVerify五维证据派生因果知识、支持度×强度策略爽感和发现爽感，因果认知进入下一次Agent决策；专项与正式循环回归通过，真实机制链解析和重复证伪折扣待做。

- `2026-07-19_1134_target-condition-contract-fix.md`：统一正式与压缩请求、运行时和假设验证的唯一字段targetCondition；合同形状的确认、证伪、current_action和旧字段拒绝回归通过，任务板Bug关闭。

- `2026-07-19_0119_capability-mix-equipment-rebase-fix.md`：修复三标尺配比换人后的换装重算，装备倍率改为作用于冻结混合预测；旧综合强度2/8的相同案例均得到0.68，原0.18偏差归零，三个公式级小测试通过。

- `2026-07-19_0029_capability-mix-equipment-rebase-audit.md`：用单一确定性小案例确认初始换人正确使用三标尺配比，但随后25%换装增量仍受旧综合强度影响；相同配比产生0.18预测分偏差，本轮只诊断未改算法。

- `2026-07-19_0016_capability-mix-roster-expectation.md`：正式换人改为Agent给输出/保护/增益粗配比，程序归一化、投影并冻结到A；缺失正权重证据保持未知，A/C曲线未改，专项与全套回归通过。

## 2026-07-18

- `2026-07-18_2332_independent-character-capability-rulers.md`：把角色认知拆为输出、保护、增益三套独立同步矩阵和前30%标尺；正式Agent按问题取用，不再看到综合分。专项、真实22场、正式两周期和换人A/C全套回归通过。

- `2026-07-18_2101_two-agent-interpretation-correction.md`：纠正双Agent长跑解释：随机结果误导玩家符合模拟目标；换人A/C回归正常，未知角色不建立数值预测是原合同；通用EVerify从未在本轮修改。真实问题仅保留支援/坦克贡献低估与targetCondition字段合同错误，并取代1449报告中的相反判断。

- `2026-07-18_1449_two-agent-cognition-improvement-run.md`：开放新手和惯性玩家用相同paired-alpha种子重跑完整两章；循环49→30/35、知识199/192→112/107，原始威胁泄漏均归零，角色认知真实改变行为。暴露支援/坦克强度低估、随机重试污染、A/C覆盖不足和条件字段合同错误。

- `2026-07-18_1241_formal-filtered-knowledge-agent-ablation.md`：类型1 V7正式复用旧知识合并、检索和归因入口；公开信号ID取代原始事件ID。真实Agent在完整历史坐标下引用-2.2→+3.951并重试，删除坐标后独立Agent改为换人，正式运行时与全部旧回归通过。

- `2026-07-18_1203_complete-cognition-coordinate-snapshot.md`：类型1 V7 将既有角色富集矩阵完整接入战斗知识，逐站位保存矩阵位置、当时前30%标尺、相对标尺距离和认知等级；22/22场数学关系与站位对齐通过，未新增评分，仍隔离待正式Agent接入。

- `2026-07-18_1156_formation-aware-agent-knowledge.md`：纠正上一版抹掉站位和程序裁决历史知识的问题；V6按真实站位1到4保存角色认知，同四人换位使用不同知识键，历史事实由Agent自行理解；22/22场站位对齐及全部旧回归通过，仍隔离待正式接入。

- `2026-07-18_1126_encounter-cognition-snapshot.md`：关卡胜负绑定当时四人的连续认知分、认知等级和证据数；不同队伍分键，同队顺序变化不误判，认知跨级后旧失败只作历史背景；22/22场快照完整，旧认知与换人回归通过，仍隔离待正式接入。

- `2026-07-18_1100_filtered-type1-causal-knowledge.md`：把非角色观察恢复成旧“主体-环境-行为→结构化结果”；22场形成134条观察、105个旧式合并键、19个重复证据键，持续场地/掉落/地图/角色解锁全部保留，假观察行为和单句结果为0，仍隔离待用户确认。

- `2026-07-18_1034_player-cognition-three-branch-isolation.md`：角色认知、非角色事件和换人预期三块隔离通过真实22场验证；88/88角色覆盖、left-*残留0、2219条详细事件匹配、80条可用特点证据，身份修正已接正式角色认知，非角色过滤器仍隔离待用户确认。

- `2026-07-18_0044_received-information-shadow-comparison.md`：用同一真实两章22场流程比较旧正式知识与V2；V2正确删除97.09%原始ID和diagnosis，但稳定角色身份、四角色覆盖、细粒度特点、换人表现分及地图/装备/场地事实缺失，结论暂不可接入。

- `2026-07-18_0030_received-information-router-v2.md`：否决通用知识账本，将接收信息层重做为类型1、类型2、概率和换人历史四路纯分流；四角色证据、三档感知、信息越界和全部旧认知机制回归通过，当前仍未接入正式 Agent。

## 2026-07-17

- `2026-07-17_2346_received-information-organizer-isolated.md`：独立实现“实际接收信号→可学习候选→可修正知识账本”，真实战斗三档为 `10/15/21` 条；未接收不学习、重复增强、相反证据修正和信息越界测试通过，尚未接入正式 Agent。

- `2026-07-17_2150_information-presentation-tier-v2-continuum.md`：将信息呈现升级为八档连续标尺，主界面 `0.40–1.00` 每 `0.10` 等距并保留 `0.25` 纯背景档；真实战斗三类玩家校准和完整认知回归通过。

- `2026-07-17_1932_information-presentation-tier-v1.md`：冻结四档信息呈现契约 `1.00/0.95/0.60/0.25`，统一战斗解析器、当前 V3 玩家认知和前端接口；真实 355 事件校准及全部认知回归通过。

- `2026-07-17_1844_local-run-artifact-archive.md`：将 2,308 个逐轮 request/response 和 32 个完整 session 原件统一移入本地忽略归档，活跃 session 缩小 90.2%，并让关键摘要与战斗解析测试兼容精简记录。

- `2026-07-17_1745_threshold-perception-model.md`：删除单场25/50/75硬配额，改为显眼度、幅度、目标、竞争和重复积累共同决定的信号级接收模型；多轨迹长期校准和越界审计通过。

- `2026-07-17_1612_battle-information-parser.md`：新增不接 Agent 的纯程序战斗信息解析器；三档玩家接收 25%/50%/75% 合法信号，固定样本与 355 事件真实战斗的完整性和越界审计通过。

- `2026-07-17_1505_clear-failure-zero-confirmation.md`：增加明显失败的确认感归零边界；略低同档仍衰减保留，向下跨档直接 C=0。

- `2026-07-17_1449_self-serving-geometric-confirmation.md`：基础常数保持 0.1，为确认感加入成功平方根放大、失败 1.5 次幂衰减和 2 倍上限，并通过六点曲线与实际结算测试。

- `2026-07-17_1337_confirmation-boundaries-and-inertia-confidence.md`：补测实际略低、略高和跨感知档位时的确认感，并把新关惯性明确修正为“预期强度不变，只降低有效信心”。

- `2026-07-17_1302_confirmation-equipment-inertia-repairs.md`：完成确认感 C、换装有效强度重算和新关弱惯性，并验证明确难度信号能够覆盖惯性；聚焦测试与因果闭环回归全部通过。

- `2026-07-17_1246_expectation-signal-repair-task-group.md`: adds a critical task-board repair suite for probability-aware loot expectation, equipment-adjusted effective strength, confirmation C, weak new-encounter inertia, and player-visible semantic signal filtering.

- `2026-07-17_1130_enriched-two-chapter-player-ensemble.md`: completes the richer two-chapter program variant, five-profile alpha ensemble plus open beta, exact 1% Mythic validation, full mid/terminal formation enumeration, aggregate diagnosis, and independent `reject` verdict for full cognition/progression validation.

- `2026-07-17_1125_open-novice-paired-beta-run.md`: completes the persistent open-novice paired-beta two-chapter run in 57 cycles with validation PASS, while flagging that a simulator-generated mythic drop invalidated the intended non-jackpot comparison assumption.

- `2026-07-17_1000_enriched-two-chapter-independent-review.md`: independently rejects the three paired-alpha runs as full cognition/progression validation despite profile-plausible behaviour, citing raw diagnosis leakage, incomplete cognition coverage, same-batch expectation contamination, and equipment bypass of Chapter 2 mechanics.

## 2026-07-16

- `2026-07-16_2315_roster-prediction-a-settlement.md`: makes A code-owned for selected roster predictions, freezes the chosen candidate at swap time, settles once through the persistent perception profile on the next comparable combat, passes 10/10 prior real-Agent settlements, and receives independent `ACCEPT`.

- `2026-07-16_2044_real-agent-roster-and-a-audit.md`: runs six persistent real player Agents through a two-swap controlled episode, accepts the differentiated roster behavior for five adaptive profiles, and rejects the current A wiring because all 10 selected-swap settlements use generic knowledge instead of the chosen roster prediction.

- `2026-07-16_1730_roster-expectation-edge-cases.md`: validates a continuous fail-swap-fail-swap-success story, mixed and stale history, trait decline, equal-score build changes, candidate-specific power, and same-report three-profile replay; independent verdict `ACCEPT` for calculation and wiring, not live Agent behavior.

- `2026-07-16_1646_roster-change-expectation.md`: scopes battle failure to the exact roster and encounter, re-estimates every legal replacement from current strength/trait cognition, passes formal/compact/chapter regressions, and receives independent `ACCEPT` with calibration guardrails.

- `2026-07-16_1550_character-strength-matrix-relative-ruler.md`: adds a simultaneous global character-strength solve, top-30-percent relative ruler, formal player-session integration, zero-difference order regression, and independent `ACCEPT_WITH_GUARDRAILS`.

- `2026-07-16_1332_entity-impression-environment-revalidation.md`: stores decomposable ally environment in strength cognition, revalidates attempted traits every battle, passes the 1,440-sequence matrix, and receives independent `ACCEPT` with guardrails.

- `2026-07-16_1107_entity-impression-systematic-credibility.md`: runs 1,440 five-battle sequences across three perception profiles, fixes subject-local primacy, passes order/identity checks, and returns `REVISE` because team-relative evidence and trait correction are not prediction-ready.

- `2026-07-16_0213_entity-impression-knowledge-experiment.md`: builds and validates biased-but-correctable subject strength/trait knowledge, including five blind Agent-analyzed battles, 118 passing comparisons, and two final independent reviewer passes.

## 2026-07-15

- `2026-07-15_2304_improvement-perception-granularity-reference.md`: records the 150%-capped improvement perception bands, with familiar-player resolution above 80%, expert resolution above 60%, and profile-safe A settlement.

- `2026-07-15_1812_continuous-combat-performance-for-expectation.md`: replaces binary action-settlement results with real normalized remaining-HP margin, preserving direct rewards and proving close-loss improvement is visible to A.

- `2026-07-15_1552_progress-experience-task.md`: adds hierarchical Progress experience as the third task in the player-emotion-simulation line, with progression R and anti-double-counting requirements.

- `2026-07-15_1535_player-emotion-simulation-task-line.md`: creates the active player-emotion-simulation task line, puts decision expectation/EVerify settlement first, and queues failure experience as its child task.

- `2026-07-15_1445_player-model-implementation-gap-audit.md`: audits the controlled Main 6 failure run against the documented player model and finds P, Q, progression/growth R, kP, Agency, and behavior coupling missing from the executable emotion loop.

- `2026-07-15_1340_controlled-two-chapter-emotion-audit-runtime.md`: adds user-constrained Agent decisions, fixes complete cognition continuity across Chapters 1/2, and passes a real-event emotion smoke test; the full run awaits the user's control route.

- `2026-07-15_1315_selectable-player-profile-ensemble-runtime.md`: implements ten durable player profiles, exact or deterministic X-of-10 selection, isolated paired cognition/Agent sessions, a file-based runner, and a passing two-profile two-cycle regression.

- `2026-07-15_1219_multi-profile-player-simulation-protocol.md`: adds a persistent multi-profile Agent protocol with fallible causal priors, six minimum player types, per-profile evidence, paired seeds, and exhaustive team enumeration as a mechanical backstop.

- `2026-07-15_1211_chapter-one-composition-validation-gap.md`: proves the retained Agent never fielded Mage and Ranger together and records a 100-seed audit where Main 8-10 are 100% clear for protected and pure-output teams alike.

- `2026-07-15_1204_first-chapter-mainline-fork-removed.md`: closes a stale accepted-core topology bug so Chapter 1 Main 1-10 is strictly linear, while preserving Prison and Camp as intentional optional lock-key branches.

- `2026-07-15_1140_accepted-chapter-one-reconnected.md`: corrects the double-chapter big map so its 13-node first chapter, enemy teams, field effects, Camp keys, Ranger proof, and recovery logic come directly from the accepted July 14 Region 1 core.

- `2026-07-15_1054_integrated-two-chapter-map-and-manual-loot.md`: moves the accepted two-chapter campaign into the original big-map simulator, adds exact post-battle reward feedback, and enforces manual equipment and roster decisions.

- `2026-07-15_1013_token-efficient-agent-and-two-chapter-playable.md`: adds explicit knowledge retrieval, persistent Agent routing, ten-slice token validation, and a separate human-playable Chapter 1/2 V4 with manual equipment and real battle settlement.

## 2026-07-14

- `2026-07-14_2315_chapter2-frozen-player-cross-key-validation.md`: completes the Frozen-player Chapter 2 cross-key design, two-round Agent playtest iteration, role/field/equipment teaching validation, and remaining risks.

- `2026-07-14_1817_player-hypothesis-loop-repaired.md`: repaired the explicit player hypothesis lifecycle, aligned contribution verification with authoritative combat settlement, and passed a fresh Ranger run with two precommitted hypotheses, two real confirmations, two EVerify events, and two independent reviews.

- `2026-07-14_1641_ranger-hypothesis-loop-audit.md`: corrected the Ranger run interpretation: three AI-submitted hypotheses were rejected, no player hypothesis or EVerify settlement occurred, and the apparent verification belonged only to hidden evaluator state.

- `2026-07-14_1542_first-region-ranger-lock-key-restored.md`: colocated the Region 1 design-purpose tree and machine contract, restored the optional Camp -> Prison -> manual Ranger -> Main 7 role-proof chain, passed a 100-seed verifier and all scoped regressions, and retained a 24-cycle knowledge-bounded player run where Ranger led Main 7 with 57.24% damage.

## 2026-07-13

- `2026-07-13_2115_prison-role-visibility-paused.md`: made the optional Prison's Ranger function player-visible without changing combat or access, passed regressions, then stopped and closed the sole Agent after two cycles; the candidate remains HOLD because the relevant choice was never reached.

- `2026-07-13_1839_role-swap-main4-single-target-partial.md`: added a player-agent-only sustained-single-target Main 4 and proved its Ranger/Mage contrast, then preserved a boundary-clean partial run showing that generic Prison reward visibility still lets known equipment bypass the intended role lesson while emotion remains healthy.

- `2026-07-13_1112_player-agent-role-wave-long-run.md`: connected Main 1's continuous 3/3/4 wave encounter to the player-agent loop, then completed and audited a fresh 30-cycle run in which the agent voluntarily swapped in the Main 2 Mage and verified its contribution; exposed unchanged-retry combat variance at Main 6 as the next causal issue.

- `2026-07-13_1040_player-agent-role-visibility-main2-mage.md`: exposed stable roster/slot/role data to the decision agent, changed fresh Midlock sessions to one Warrior plus four militia, granted an optional Mage after Main 2, and regression-verified the explicit Mage swap-to-combat evidence chain.

- `2026-07-13_1927_real-boss-cognition-loop.md`: continued the same fresh cognition session through Main 10 and two Boss attempts, preserved explicit equipment causality, and passed a 30-cycle/120-file integrity audit; the Boss was reached but not cleared.

- `2026-07-13_1757_real-main7-cognition-loop.md`: completed a fresh 20-action real loop through Main 7, persisted every decision/attribution and raw/semantic event log, added per-action knowledge/concept deltas, and passed an integrity audit without reusing old responses.

- `2026-07-13_1652_persisted-player-model-runtime-entry.md`: made the executable AI playtest runtime durable through project agent instructions, a canonical run contract, a machine-readable manifest, overview registration, and a passing entrypoint regression.

- `2026-07-13_1638_signal-concept-interpreter.md`: added concept-first signal interpretation, separated raw audit events from player-semantic events, and proved internal enemy identities do not enter emotion, agent requests, or causal knowledge.

- `2026-07-13_1553_causal-knowledge-and-manual-equipment-loop.md`: corrected canonical knowledge causality, separated loot from explicit equipment growth, added combat contribution/enemy threat/unlock facts, and passed the two-cycle regression plus independent re-review.

- `2026-07-13_1426_player-agent-api-minimal-loop.md`: implemented and live-ran a two-cycle code-owned cognition loop with AI called only for structured decisions and evidence-bound attribution.

- `2026-07-13_1324_player-model-fixed-tape-a-audit.md`: fixed real event tapes showed A changes emotion but none of 285 selected actions, supporting a narrow diagnostic-only classification with two independent PASS reviews.

- `2026-07-13_1255_player-model-midlock-emotion-rejection.md`: reconstructed the Frozen V3 Main 6 emotional arc, found result-only scoring reproduces the same routes and verdict, and recorded two independent REJECT reviews.

- `2026-07-13_1208_player-model-validation-loop-lock.md`: added a hash-guarded immutable automation requirement that restores real-event emotion-to-behavior validation as the sole objective and prohibits browser/UI drift.

- `2026-07-13_1158_candidate-single-battle-settlement.md`: removed duplicate human-candidate combat simulation, added display/core settlement parity, and preserved Frozen V3 with two scoped acceptances.

- `2026-07-13_1130_phase2-combined-playable-candidate.md`: assembled the three accepted Region 1 candidates, resolved their Boss-gate interaction, added a separate playable page, and passed 60-route plus independent review.

- `2026-07-13_0750_phase2-midlock-ab.md`: accepted a candidate-only Main 6 soft lock with visible Bandit keys, healthy bypass width, reliable retry recovery, and bounded counter-learning claims.

- `2026-07-13_0701_phase2-ranger-onboarding-ab.md`: accepted an isolated reliable Ranger rescue-to-proof chain under Frozen V3; recorded stronger milestone emotion and the remaining lossless-region pacing risk.

- `2026-07-13_0621_player-cognition-v3-freeze.md`: added bounded voluntary new-character experimentation, visible-only combat verification, multi-unlock sequencing, and froze V3 after two independent acceptances.

- `2026-07-13_0538_character-affordance-reopens-v3.md`: proved Frozen V2 cannot act on a visible new-character swap affordance, preserved the accepted equipment candidate, and reopened Phase 1 for V3.

- `2026-07-13_0516_phase2-boss-preparation-ab.md`: under Frozen V2, replaced stale post-Boss Main3 repetition with an isolated visible Main9 preparation candidate; passed paired, long-tail, and independent review.

- `2026-07-13_0446_player-cognition-v2-freeze.md`: added visible growth-based failed-goal wake-up, hidden-power rejection, useful preparation, and terminal conclusion; passed two independent reviews and froze V2.

- `2026-07-13_0408_phase2-baseline-reopens-v2.md`: ran the Frozen V1 full-region baseline, found a universal terminal-action attractor and missing growth-based Boss reconsideration, preserved V1, and reopened Phase 1 for V2.

- `2026-07-13_0356_player-cognition-phase1-pass-freeze.md`: completed renderer-grounded H, dry/interruption controls, real event-derived emotion-to-action evidence, two independent acceptances, and Frozen V1 hashes.

- `2026-07-13_0317_player-cognition-behavior-closure.md`: closed real cognition-to-action selection with multi-goal switching, validated E/hypotheses, a Prison-failure counterfactual, and two independent behavior acceptances; Phase 1 remains open.

- `2026-07-13_0251_player-cognition-real-event-slice.md`: connected transient real combat/reward events to H, strict knowledge, unified expectations, appraisal, emotion, and post-feedback learning; Phase 1 remains open until cognition changes the next action.

- `2026-07-13_0221_player-cognition-v1-event-loop.md`: expanded the cognition graph with H, reactive E/mechanical W, unified event expectations, structured knowledge, multi-goal value, emotion routing, and failure fear.

- `2026-07-13_0122_player-cognition-v0-loop-diagram.md`: froze the node-based cognition/action loop with continuous execution, interruption, result settlement, verification, attribution, and state-update ordering.

## 2026-07-12

- `2026-07-12_2317_player-cognition-concept-reference.md`: added the foundational cognition-loop explanation and a hard distinction between game-event validation and direct psychological-parameter unit tests.

- `2026-07-12_1759_player-model-vertex-validity-audit.md`: built a 30-vertex causal audit with two blind player agents, full coefficient sensitivity, fixed-time growth isolation, and a complex-versus-simple ablation; found H salience/goal and Agency are currently diagnostic-only.

- `2026-07-12_1429_level-validation-and-probability-expectation-skill.md`: added exhaustive/sampled real-combat level validation, matched-pair role checks, emotion acceptance gates, and a general probability-event expectation model upstream of A.

- `2026-07-12_0118_first-region-v5-map-loop.md`: redesigned Region 1 into an optional lock-key plus fork/merge loop, connected real combat evidence to cognition-v5, iterated with two player agents, and validated multiple boss solutions.

- `2026-07-12_0006_player-cognition-v5-sandbox.md`: built and iterated an isolated player-cognition V5 sandbox through three subagent review rounds, ending with accepted base values and a minimum action loop.

## 2026-07-11

- `2026-07-11_2338_simplified-decision-verification-effort.md`: simplified E into a discrete reasoning chain plus explicit hypothesis verification, and added attribution/behavior/hypothesis state.

- `2026-07-11_2257_signal-growth-agency-effort-skill.md`: formalized perceptual H, adaptive growth baselines, decision/verification/interpretation E, progression, ROI, and Agency in the player cognition skill.

- `2026-07-11_1608_first-level-ten-hit-experiment.md`: added a reversible ten-hit first-level profile, balanced melee/ranged durability, and browser-validated 9.9 visible hits per enemy.

- `2026-07-11_1555_remove-first-level-damage-scaling.md`: removed the rejected enemy damage coefficient from first-level fitting and reconfirmed the 4-5-hit target using durability and wave pacing only.

- `2026-07-11_1528_first-level-effort-v1-player-state.md`: fitted first-level enemies to a 4-5 visible-hit contract, added causal expected-player-state observability, and browser/regression validated the result.

- `2026-07-11_0140_first-level-effort-v0.md`: froze provisional E/W/P/Q/R/k/A ranges, added a real-combat first-level analyzer, and implemented an independently reviewed playable candidate that reduces one-hit enemies from 46% to 5.7%.

## 2026-07-10

- `2026-07-10_2354_player-cognition-simulation-skill.md`: created and GPT-5.5-forward-tested a standalone player cognition skill covering learned knowledge, E/W rhythm, subjective process, negative quality, adaptive reward expectations, temporal credit assignment, and independent review.

- `2026-07-10_2052_feedback-cognition-v4.md`: completed the runnable feedback/cognition V4 model after four calibration passes, knowledge-bounded player traces, and an independent plausibility review that accepted the focused first-failure correction.

- `2026-07-10_1230_first-level-wave-combat.md`: replaced the first node's static enemy team with a real two-big-wave/three-entry weak-enemy battle, added unified-combat reinforcements, and measured a 9.0-second deterministic average.

- `2026-07-10_1945_optional-lock-key-militia-bear.md`: replaced overlapping starter roles with incomplete militia, made Prison/Camp optional repeatable one-time-reward branches, added isolated Camp-key and bear encounters, and validated explorer/skip routes with real combat and regression invariants.

- `2026-07-10_1730_map-equipment-loot-prison-retry.md`: exposed manual equipment management and per-battle loot history in separate pages, made Prison immediately retryable after failure, and browser-validated desktop/mobile behavior.

- `2026-07-10_1650_militia-equipment-lock-key-loop.md`: completed the two-agent iterative Region 1 pass, integrating militia scarcity, formal equipment, one-time Camp key, manual Ranger recruitment, deterministic human/Agent combat parity, interruption recovery, and elimination-only Boss clears.

- `2026-07-10_1225_camp-one-shot-main-farming.md`: corrected Camp to a one-time key encounter, kept repeat farming on main nodes, redirected later Prison failures to the latest main node, and recorded Region 1-3 main drop tables.

- `2026-07-10_1208_dual-agent-map-cognition-debug.md`: ran two baseline and two post-tuning knowledge-bounded player agents, added reusable cognition session/batch tools, turned Prison/Camp into a real combat-and-farming loop, corrected false UI signals, and recorded remaining observation/action parity risks.

- `2026-07-10_1056_map-real-combat-cognition-loop.md`: connected `/map_progression_lab/` node challenges to real combat resolution, added lightweight loot/auto-equip/failure memory state, documented node enemy/drop rules, and updated lock-key cognition with knowledge-bounded player-agent behavior.

## 2026-07-09

- `2026-07-09_2053_map-cognition-v2-2-review-gate.md`: integrated two subagent reviews for V2.2, keeping M6 blue-quality signal as a candidate gated behind M5/user-playtest validation.

- `2026-07-09_2047_map-cognition-v2-2-candidate.md`: created a non-implemented V2.2 candidate where M6 later teaches blue reward as a milestone quality signal, explicitly gated behind user playtest of the hardened first loop.

- `2026-07-09_2013_map-cognition-hardened-implementation.md`: implemented the hardened first-region map-lab lock-key flow, added preview-only Camp before Prison first-fail, stopped auto-challenge on Prison failure, bumped the lab save key to v3, and appended bypass-hardening notes to the lock-key cognition reference.

- `2026-07-09_1933_map-cognition-subagent-hardening.md`: integrated late subagent reviews, upgraded Camp from soft-order to preview-only until Prison first-fail, and set the next implementation pass to use the hardened first-region map-lab plan.

- `2026-07-09_1927_map-cognition-implementation-review.md`: reviewed the V1.2 + V2.1 map-lab implementation plan, found a serious mainline-bypass risk after M4, and corrected the plan so `r1_main_5` waits for Prison clear while Prison first-fail stops auto-challenge.

- `2026-07-09_1808_map-cognition-implementation-plan.md`: drafted an implementation-facing first-region map-lab plan for V1.2 + V2.1, but subagent review timed out so code changes are deferred.

- `2026-07-09_1529_map-cognition-v1-2-accepted-v2-1.md`: reviewed V1.2 and V2 with two subagents, accepted V1.2 for implementation-test, and created V2.1 as a narrow rarity-as-reward-quality slice.

- `2026-07-09_1453_map-cognition-v1-2-v2-gate.md`: reviewed V1.1/V2 with two subagents, created V1.2 Prison-first soft-order baseline, and appended a lock-key cognition timing constraint.

- `2026-07-09_1417_map-cognition-v1.md`: created the first versioned map cognition/lock-key design slice, ran two subagent reviews, and revised V1 into V1.1 so Prison/character is visible before camp equipment key consumption.

- `2026-07-09_1358_lock-key-cognition-skill.md`: added a project skill reference for lock-key cognition review, including player concepts/knowledge/behaviors, first impressions, failure attribution, wake-up conditions, and knowledge updates.

- `2026-07-09_1327_march-contact-state-fix.md`: separated `/map_progression_lab/` marching from contact behavior so march targets use fixed speed and units begin normal combat once enemies are within contact range.

- `2026-07-09_1310_big-wave-regroup-relative-formation.md`: changed `/map_progression_lab/` big-wave transitions so allies regroup around the current leftmost ally using opening formation offsets, pause 0.5s, and march right under right-side half-field observation.

- `2026-07-09_1303_map-camera-bounds-zoom.md`: widened `/map_progression_lab/` battle-simulation camera world bounds and pulled back half-field/siege observation zoom so the camera can move right without relying on a close view.

- `2026-07-09_1256_half-field-camera-center.md`: fixed half-field camera centering so it uses a closer default zoom and centers about 5/16 screen width to the side of the leftmost/rightmost ally instead of being clamped to full-field center.

- `2026-07-09_1248_nearest-target-camera-modes.md`: removed spawn-batch target locking and manual camera nudge, changed map-lab allies to nearest-enemy targeting, and added half-field versus siege battle camera modes.

- `2026-07-09_1203_first-big-wave-target-camera.md`: fixed first-big-wave behavior so next small wave spawns at two remaining enemies, allies target the earlier enemy batch first, incoming enemies become targetable only after marching in, and the camera nudges right on new wave entry.

- `2026-07-09_1158_map-wave-queue-march.md`: refined `/map_progression_lab/` wave behavior so next small waves spawn immediately at <=1 enemy, enemies enter from the right as queues/formations, and allies regroup/march by movement speed between big waves.

- `2026-07-09_1133_map-battle-desert-reference.md`: added pale desert ground, gray rock clusters, and faint sand-line references to the `/map_progression_lab/` battle simulation so camera zoom and movement are easier to read.

- `2026-07-09_1806_big-wave-small-wave-sequencing.md`: corrected `/map_progression_lab/` wave hierarchy so small waves do not regroup, big wave 1 contains two small waves, and only big-wave completion triggers animated ally regroup plus camera lerp.

- `2026-07-09_1757_wave-sequence-regroup-before-next.md`: changed `/map_progression_lab/` battle waves from fixed-time spawning to clear-wave, regroup allies/reset camera, then spawn next wave.

- `2026-07-09_1748_map-wave-regroup.md`: improved `/map_progression_lab/` battle simulation pacing with small/big waves, longer intervals, ally regroup after big-wave clear, left-side camera reset, and alive-only fit-units camera follow.

- `2026-07-09_1736_map-progression-camera.md`: applied the shared 2D camera to the actual `/map_progression_lab/` map with drag, click focus, wheel zoom, persisted camera state, and fit-units camera follow for its wave battle simulation.

- `2026-07-09_1718_militia-map-and-wave-camera.md`: connected the militia progression lab map to the shared 2D camera with click focus and wheel zoom, and added a lerped fit-units battle camera mode for militia wave fights.

- `2026-07-09_1646_battle-camera-zoom-fix.md`: corrected the battle camera zoom model from fixed `1.x` to viewport-derived pixels-per-world-unit, tightened fit padding, and made units plus slash/ring VFX scale with camera zoom.

- `2026-07-09_1623_battle-view-shared-camera-integration.md`: tried optional `shared/game_camera_2d` integration in the existing `battle_view`, including camera projection, scaled game-time VFX cleanup, post-processing mount, and `/shared/` static serving; syntax/tests passed, visual QA pending.

- `2026-07-09_1552_camera-modes-and-battle-compat.md`: inspected `battle_view` compatibility, added reusable `camera-modes.js`, wired demo mode switching, and documented integration risks/order.

- `2026-07-09_1541_game-time-slow-motion.md`: added reusable scaled `game-time.js` for whole-game slow motion, pause, temporary bullet-time, demo controls, docs, and tests.

- `2026-07-09_1523_camera-post-processing-stack.md`: added a reusable DOM/CSS post-processing stack to `shared/game_camera_2d`, with color grade, color overlays, vignette, flash, shake, demo buttons, docs, and tests.

- `2026-07-09_1304_camera-demo-fixed-game-view.md`: revised the shared 2D camera demo into a single fixed Game View style window where projected world content moves and scales inside the unmoving frame.

- `2026-07-09_1253_camera-demo-viewport-clarity.md`: reworked the shared 2D camera demo into a world overview plus fixed viewport so the moving camera window is visually explicit.

- `2026-07-09_0000_game-camera-2d.md`: added a reusable shared `game_camera_2d` module with world/screen coordinate conversion, smooth fit/follow behavior, a standalone demo, and Node validation.

## 2026-07-08

- `2026-07-08_2227_battle-camera-model-note.md`: recorded that the temporary battle-simulation camera behavior is withdrawn and documented the desired future battle viewport model in the project overview.

- `2026-07-08_1300_map-first-region-curve-space.md`: expanded the first region's upper-right shape and spread nodes 7-10 into a larger curve so the late-route cluster has more room.

- `2026-07-08_1251_map-dashed-routes-solid-nodes.md`: unified all `/map_progression_lab/` route links as lightweight short dashed lines and changed locked nodes from transparent markers to solid dark markers.

- `2026-07-08_1246_map-boss-link-style.md`: reduced boss-to-level map link weight by changing the thick solid line into a lighter short dashed guide line and validated it in a wide browser screenshot.

- `2026-07-08_1243_map-endpoint-cluster-fix.md`: fixed the remaining first-region endpoint visual cluster by moving level 10 inward, separating the boss and next-region gate, and validating with a wide screenshot instead of only DOM rectangle checks.

- `2026-07-08_1226_map-overlap-visual-fix.md`: cleaned up `/map_progression_lab/` visual overlaps by hiding ordinary mainline labels, offsetting named-node labels, moving the first old-mines gate away from the first boss cluster, and validating zero measured label/node overlaps in browser.

- `2026-07-08_1218_map-flow-topology-redesign.md`: redesigned `/map_progression_lab/` node topology so each region route advances toward the next region boundary, making boss-to-next-gate adjacency structural instead of a one-off point move.

- `2026-07-08_1214_map-boss-to-gate-adjacency.md`: corrected the map adjacency target from level10-boss to previous-region boss -> next-region gate, moving the first next-region gate near the prior boss.

- `2026-07-08_1212_map-boss-link-tighten.md`: tightened boss node placement so bosses sit almost directly next to level 10 nodes and added stronger boss-link styling.

- `2026-07-08_1206_map-boss-adjacency-fix.md`: moved boss nodes close to their level 10 prerequisites so local progression reads as adjacency, with cross-region unlock links kept secondary.

- `2026-07-08_1155_map-drag-and-links.md`: reworked `/map_progression_lab/` with drag-to-pan, a larger spread-out canvas, and generated relationship lines for gates, mainline levels, branches, prison, bandit camps, bosses, and region unlocks.

- `2026-07-08_1129_map-progression-lab.md`: added standalone `/map_progression_lab/` with Bezier-style adjacent regions, entrance gates, linear internal levels, branch rewards, prison rescue nodes, boss nodes, and auto-win challenge flow.

- `2026-07-08_1052_militia-power-down.md`: tuned all starting militia down so they fill jobs worse than full heroes, and verified shield militia no longer improves any knight-containing preset in temporary waterline replacement checks.

- `2026-07-08_1032_militia-battlefield-only-size.md`: corrected militia sizing so only battle-scene militia are smaller while right-side roster cards stay normal size.

- `2026-07-08_1030_militia-small-icons.md`: shrunk militia roster and battle-view icons in the militia progression lab so militia visibly read as smaller than full heroes without changing combat stats.

- `2026-07-08_2039_stage2-guaranteed-epic.md`: added a one-time guaranteed purple item reward to the Stage 2 quality fight in the militia progression lab, preserving normal Stage 2 drop odds while creating a deterministic first-purple moment.

- `2026-07-08_1815_militia-progression-lab.md`: added an independent militia early-game progression lab with 2 heroes + 4 militia, staged restrained loot, quality fights, field-effect gates, rescued heroes, signal panel, and Node self-play validation.

- `2026-07-08_1725_field-effect-uplift-11-pass.md`: retuned the curated runtime field-effect pool to 11 usable effects and reran validation; most direct or same-field swap uplift evidence now sits around the target 10-30 point band.

- `2026-07-08_1655_wildfire-backline-assassin.md`: validated the user's backline blink assassin idea for wildfire rings; added candidates and a same-field swap showing 76.0% -> 91.2% with a backline assassin delivery unit.

- `2026-07-08_1635_three-inspired-runtime-fields.md`: recorded the user's seven stronger field-effect inspirations and implemented death inheritance, shield detonation, and wildfire rings as runtime field effects with 500-team validation.

- `2026-07-08_1610_runtime-field-swap-validation.md`: retuned runtime field effects and added same-field one-role swap validation, measuring whether a player can change one role and improve under the same field.

- `2026-07-08_1545_runtime-field-effects-validation.md`: implemented the approved 10 runtime field effects, added combat-sim hooks and a waterline advantage validator, and recorded which effects are ready, watchlisted, or need redesign.

- `2026-07-08_0025_field-effect-baseline-tiers.md`: added baseline team strength tiers to field-effect-design, using the 17 original preset waterline scores and four-ranged comparison to prevent bad teaching contrasts.

- `2026-07-08_0015_support-field-effect-rules-and-ranged-test.md`: updated field-effect-design with support-oriented constraints and tested four-ranged teams against standard teams and waterline; four-ranged is not universally weak.

- `2026-07-08_0000_field-effect-design-skill.md`: added the field-effect-design project skill for early-game field effects, emphasizing one or two focused effects, fewer exception-heavy clauses, and separating experience design from numerical balance.

## 2026-07-07

- `2026-07-07_2117_project-overview-cognition-route.md`: added the staged player cognition route and recorded the next validation question: after basic roles/equipment/rarity, basic field effects should enable improvement through one-to-two-role swaps.

- `2026-07-07_1414_project-overview-product-strategy.md`: updated the durable western fantasy project overview with the latest strategic rule, product differentiation, build-closure priority, equipment purity/swap-friction concerns, and relics as the future explicit build layer.

- `2026-07-07_1154_field-effect-playtest-lab-team-builder.md`: reworked `/field_effect_lab/` into a field-effect playtest table with top field selection, left/right four-slot team builders, an 8-role picker modal, and shared battle-view playback.

- `2026-07-07_1136_field-effect-mechanism-review-rule.md`: updated `game-analysis-iteration` with a field-effect mechanism check and step-7 implementation-plan information concentration rule that flag default multi-stat "attribute soup" fields and prefer one clear player-facing idea.

- `2026-07-07_1935_field-effect-20-validation.md`: expanded active field effects from 10 to 20, reran validation, and recorded uplift/breadth/status for each effect; 17 fully pass, 3 are partial, none need redesign.

- `2026-07-07_1720_field-effect-candidate-implementation.md`: promoted Crown Relay and Many-Target Hall into active field-effect assets, kept Purging Rain inactive after validation failure, added trigger-role gating, and regenerated field-effect validation.

- `2026-07-07_1604_field-effect-brainstorm-round.md`: ran a sixth design-only field-effect brainstorm focused on morale/retreat behavior, one-use battlefield devices, and long-term blessing/curse rules, producing Salvage Winch, Rout Line, and Rotating Expedition Writ as strongest next candidates.

- `2026-07-07_1549_field-effect-brainstorm-round.md`: ran a fifth design-only field-effect brainstorm focused on enemy targeting behavior, continuous dungeon route rules, and waste/efficiency diagnosis, producing Idle-Cast Calibration, Glare of Threat, and Forked Danger Road as strongest next candidates.

- `2026-07-07_1534_field-effect-brainstorm-round.md`: ran a fourth design-only field-effect brainstorm focused on boss phases, weakness/reversal diagnosis, and loot-loop reward diagnosis, producing Crownbreak Channel, Prism Reversal, and Battle Scar Index as strongest next candidates.

- `2026-07-07_1516_field-effect-brainstorm-round.md`: ran a third design-only field-effect brainstorm focused on enemy ecology, objective rules, and diagnostic reward/hazard directions, producing Last Spark Fuse, Decapitation Writ, and Guarded Captain as strongest next candidates.

- `2026-07-07_1459_field-effect-brainstorm-round.md`: ran a second design-only field-effect brainstorm focused on formation, death order, and resource-denial directions, producing Twin-Lane Bastion, Blackout Bell, Vengeance Bell, and Glass Aegis as strongest next candidates.

- `2026-07-07_1444_field-effect-brainstorm-round.md`: ran a design-only field-effect brainstorm heartbeat with three subagents, consolidated 9 raw ideas into 5 non-duplicate directions, and recorded next-round forbidden repeats.

- `2026-07-07_1438_field-effect-lab-and-validation.md`: added plug-in field-effect assets, validation matrix script, `/field_effect_lab/` workbench page, and recorded first-pass uplift/breadth results without touching official skills or base role stats.

- `2026-07-07_1105_game-analysis-priority-coupling.md`: updated `game-analysis-iteration` so current-game analysis must list problems with upstream/core/downstream type, dependencies, coupling, priority, and whether direct explanation is enough before planning changes.

## 2026-07-06

- `2026-07-06_2345_project-game-analysis-iteration-skill.md`: added `projects/western_fantasy_continent/skills/game-analysis-iteration/` as a project skill package for state-machine game analysis, feedback gates, reviewer training, and iteration planning.

- `2026-07-06_2104_top10-compare-panel-visibility.md`: moved `/character_blind_lab/top10.html` comparison results directly below the action row and scrolls them into view so `对比 agent` no longer appears unresponsive.

- `2026-07-06_2058_top10-multi-step-selection.md`: updated `/character_blind_lab/top10.html` so the user can select more than 10 candidates, disable agent comparison above 10, and repeatedly narrow the selected pool with `下一步`.

- `2026-07-06_2048_user-liked-candidates.md`: recorded the user's 39 liked blind-lab candidates as a structured positive pool before final Top10 selection.

- `2026-07-06_2040_blind-lab-mixed-runs.md`: changed `/character_blind_lab/` so the default candidate pool is a stable shuffled mix across all 7 runs instead of one run at a time, while keeping individual run selection as a dropdown option.

- `2026-07-06_2032_blind-lab-skill-details.md`: fixed `/character_blind_lab/` so the main blind lab renders passive, small skill, and ultimate descriptions for both earlier structured candidates and Run 7 `skills` arrays.

- `2026-07-06_2025_blind-top10-skill-details.md`: fixed `/character_blind_lab/top10.html` so flattened candidates hydrate passive, skill, and ultimate descriptions from original run files before rendering cards.

- `2026-07-06_2010_project-overview-doc.md`: added `projects/western_fantasy_continent/PROJECT_OVERVIEW.md` as a durable project overview covering positioning, established combat/equipment/town-loop direction, UI preferences, collaboration rules, and hard lessons.

- `2026-07-06_1944_prompt-benchmark-review.md`: ran 8 evaluator-prompt variants over the same Runs 1-7 candidate pool, recorded prompt-specific Top10 lists, and updated `/character_blind_lab/top10.html` so user blind picks can be compared against each prompt's taste profile.

- `2026-07-06_1915_candidate-review-comparison.md`: ran three evaluator-agent reviews over the 70-candidate Runs 1-7 pool, aggregated a combined Top 10, and added `/character_blind_lab/top10.html` so the user can independently choose 10 candidates and compare against agent preference.

- `2026-07-06_1752_candidate-merge-audit.md`: audited Runs 1-7 candidate packs, grouped 70 candidates into repeated mechanism/build-fantasy clusters, selected representatives/components, and added negative prompt guidance so future brainstorms avoid saturated shield-cannon, low-health return, frost-bounce, generic DOT, generic long-cast, and plain mark-hunter repeats.

- `2026-07-06_1753_poe-charge-resource-loop-build-study.md`: added the seventh Path of Exile build-study artifact, using Power/Frenzy/Endurance Charges plus Rage/Berserk to document temporary internal resources, generation, uptime, spend timing, replacement risks, and resource-economy design lessons.

- `2026-07-06_1749_poe-ailment-build-study.md`: added the sixth Path of Exile build-study artifact, using Ignite/Poison/Bleed to document ailment application engines, stack/replacement rules, duration, enemy mitigation, replacement risks, and status-effect design lessons.

- `2026-07-06_1746_poe-deployed-entity-build-study.md`: added the fifth Path of Exile build-study artifact, using traps/mines/totems to document temporary deployed-entity engines, setup time, entity limits, activation reliability, replacement risks, and turret/trap design lessons.

- `2026-07-06_1740_poe-spectre-summoner-build-study.md`: added the fourth Path of Exile build-study artifact, using Spectre Summoner to document externalized minion damage ownership, minion level/count/survival, commander tax, replacement risks, and companion-system design lessons.

- `2026-07-06_1735_poe-cast-on-critical-strike-build-study.md`: added the third Path of Exile build-study artifact, using Cast on Critical Strike to document trigger breakpoint engines, hit/crit/cooldown/attack-rate alignment, replacement risks, and UI lessons for wasted triggers.

- `2026-07-06_1732_poe-righteous-fire-build-study.md`: added the second Path of Exile build-study artifact, using Righteous Fire Chieftain to document self-upkeep, maximum fire resistance/regeneration as engine stats, replacement risks, and contrast against Toxic Rain Pathfinder.

- `2026-07-06_1729_poe-toxic-rain-build-study.md`: added the first Path of Exile build-study artifact, using Toxic Rain Pathfinder to document build core, equipment slot responsibilities, replacement effects, budget progression, and transferable loot-system design lessons.

- `2026-07-06_1651_character-brainstorm-pipeline-run7.md`: ran the seventh character brainstorm/screen/blind-review pipeline with four focused subagent directions, collected 32 raw ideas, screened 10 blind candidates, added candidate pack `2026-07-06_1651`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1619_character-brainstorm-pipeline-run6.md`: ran the sixth character brainstorm/screen/blind-review pipeline with 10 small-grain subagent directions batched by concurrency limit, collected 80 rough ideas with no subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1619`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1551_character-brainstorm-pipeline-run5.md`: ran the fifth character brainstorm/screen/blind-review pipeline as a second-pass hybrid round, recorded 32 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1551`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1519_character-brainstorm-pipeline-run4.md`: ran the fourth character brainstorm/screen/blind-review pipeline with an action-pose-first prompt, recorded 42 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1519`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1506_character-brainstorm-pipeline-run3.md`: ran the third character brainstorm/screen/blind-review pipeline with an equipment/relic-first prompt, recorded 40 fallback ideas after subagent timeout, screened 10 blind candidates, added candidate pack `2026-07-06_1506`, and updated the blind-lab manifest without touching official skill assets.

- `2026-07-06_1438_character-brainstorm-pipeline-run2.md`: ran the second character brainstorm/screen/blind-review pipeline from the automation heartbeat, recorded 48 raw ideas, screened 10 blind candidates, added candidate pack `2026-07-06_1438`, and moved blind-lab run selection to `runs.json` without touching official skill assets.

- `2026-07-06_1419_character-brainstorm-pipeline-run1.md`: manually ran the first character brainstorm/screen/blind-review pipeline, recorded 42 ideas, screened 10 blind candidates, created isolated candidate pack `2026-07-06_1419`, added an inspiration pool, and exposed `/character_blind_lab/`.

## 2026-07-04

- `2026-07-04_1948_task-line-summary-update.md`: added task-board lines for `玩法信号系统` and `佣兵小镇玩法验证`, with signal work postponed and mercenary town validation active.

- `2026-07-04_1940_role-relic-angular-task-line.md`: added active task-board line `角色与藏品的棱角化、流派化` for sharper role skills, role variants, core/bridge relics, and visible build engines beyond broad trigger components.

- `2026-07-04_1930_relic-choice-and-output-modeling.md`: added AI-facing relic choice-resonance and keyword-budget checks to `special-relic-design`, plus a rough combat output formula and low-health feedback modeling notes to `phenomenon-math-modeling`.

- `2026-07-04_1920_special-relic-concept-language-correction.md`: corrected `special-relic-design` so relic concepts start as clean one-sentence game actions, with probability, ratios, caps, cooldowns, and once-per-battle limits deferred to later validation.

- `2026-07-04_1915_special-relic-readability-rules.md`: added `special-relic-design` readability rules for per-character relic target scope and simpler one-effect tuning, discouraging unclear single-ally cross-target effects and default "A but B" clauses.

- `2026-07-04_1902_special-relic-skill-width-uplift-revision.md`: revised `special-relic-design` with 20/40/30/10 width mix, bridge relics, normal/advanced/component/core grades, target uplift bands, and uplift-sum genericity caps.

- `2026-07-04_1515_special-relic-design-skill.md`: added the `special-relic-design` project skill for first-clear special relics/unique passives, including 20/40/40 width mix and target/non-target testing across 0, half, and full gear.

- `2026-07-04_1507_town-loop-app-shell-navigation.md`: converted only `town_loop V1` internal navigation toward app-shell page swaps so the global floating battle dock can persist while town pages change; shared skill/stat/combat data was not touched.

- `2026-07-04_0047_town-loop-region-global-dock-unification.md`: unified `佣兵小镇 V1` active grind display so the region page also uses the floating battle dock, avoids double battle-view load, and fixes stale `isFighting` when stopping/restarting grind.

## 2026-07-03

- `2026-07-03_2323_town-loop-global-visible-battle.md`: added visible combat to all `佣兵小镇 V1` pages while grinding, using the region page's large battle panel and a compact global battle dock on management pages.

- `2026-07-03_2310_town-loop-grind-feedback-fix.md`: fixed `佣兵小镇 V1` grind feedback so starting grind immediately launches visible combat on the region page, cross-page background ticks update top status, and warehouse/recruit pages load the shared combat simulator.

- `2026-07-03_2220_town-loop-explicit-team-slot-fix.md`: fixed `佣兵小镇 V1` team prep so clicking a position writes an explicit `teamSlot`; selecting a hero and clicking `后排 2` now places that hero in `后排 2` rather than compacting by order.

- `2026-07-03_2211_town-loop-team-recruit-correction.md`: corrected `佣兵小镇 V1` so initial heroes start at skill level 1, recruitment remains prosperity-gated, team prep uses four explicit slots, and skill levels scale combat power by 10% per average level above 1.

- `2026-07-03_1316_town-loop-v1.md`: added `佣兵小镇 V1`, a five-screen town shell with day/prosperity/event cards, region grinding, team prep, warehouse, recruitment, and shared battle/equipment integration.

- `2026-07-03_1848_equipment-grind-overall-report.md`: consolidated equipment-grind generation, drops, recommended-power validation, growth-curve pacing, UX support, implementation files, and risks into one overview report.

- `2026-07-03_1836_grand-battle-20v20-demo.md`: added a standalone `20v20 神装方阵` demo using current skill data, build layers, combat sim, and battle view with custom formation coordinates.

- `2026-07-03_1814_equipment-v3-auto-equip.md`: added `刷装备V3` equipment-page auto-equip controls for the selected hero and active team, using role-aware item scoring over usable base stats and affixes.

- `2026-07-03_1757_equipment-affix-focused-random-correction.md`: removed `刷装备V3` dungeon-themed affixes and replaced them with per-item focused random affix allocation, then regenerated concentration/drop ecology measurements.

- `2026-07-03_1739_equipment-grind-v3-drop-ecology-retune.md`: retuned `刷装备V3` rarity/drop tables to delay high rarity, added dungeon-themed affix generation, and measured mythic output/theme concentration.

- `2026-07-03_1700_equipment-grind-v3-recommendation-correction.md`: corrected misleading `刷装备V3` recommendations after D8 38k failed in play; active displayed values now use 70% similar-power combat buckets, with D8 set to 85800 and D10 flagged unresolved.

- `2026-07-03_1613_equipment-grind-v3-dust-and-session-loot.md`: added `刷装备V3` warehouse one-click dusting by rarity and a battle-page session loot strip for kept equipment during manual/continuous grind.

- `2026-07-03_1529_equipment-affix-display-merge.md`: merged duplicate same-type affixes in `刷装备V3` item detail and loot display without changing item data, scoring, or combat.

- `2026-07-03_1342_equipment-grind-v3-flow-recommended-power.md`: changed `刷装备V3` recommendation basis to fresh-run first-clear p70, added a flow calibration script/report, and updated D1-D10 displayed recommended power.

- `2026-07-03_1248_equipment-grind-v3-recommended-power.md`: recalculated `刷装备V3` dungeon recommended power with similar-power team tests, updated V3 power fields, and recorded D10 as an unresolved terminal-wall risk.

- `2026-07-03_1221_equipment-grind-v3-encoding-fix.md`: fixed `刷装备V3` mojibake/page corruption, rebuilt V3 from clean V2, separated the save key, restored D10 only in V3, and browser-validated main/team/equipment/loot pages.
- `2026-07-03_1202_equipment-grind-v3-split.md`: split the D10 output-pacing experiment into playable `刷装备V3`, restored V2 as the 9-dungeon baseline, added V3 routing/workbench entry, and verified the local page.
- `2026-07-03_1150_equipment-output-pacing-d10.md`: moved task board focus to equipment output pacing, added D10 `终焉黑冠` as a late final bottleneck, and regenerated the 8-seed 100-run clear-stage curve.
- `2026-07-03_1055_progression-curve-macro-skeleton.md`: added macro pacing skeleton rules to `progression-curve-aesthetics` and diagnosed the current `刷装备V2` curve against planned 100-run bottleneck anchors.
- `2026-07-03_1042_equipment-v2-clear-curve-fix.md`: corrected the `刷装备V2` 8-run clear-stage curve so D9-cleared runs remain at D9 through run 100, added JSON source data, and regenerated the PNG/SVG previews.

## 2026-07-02

- `2026-07-02_2525_equipment-v2-loop-optimization-goal.md`: completed the `刷装备V2` loop optimization goal, strengthened thirst multiplier, evaluated 12 candidates, and applied the `wave-supply` drop cadence.
- `2026-07-02_2505_thirst-feedback-long-run.md`: added thirst-opportunity mechanics to the `刷装备V2` feedback simulation and ran 80-round on/off comparisons across three seeds.
- `2026-07-02_2450_equipment-feedback-rule-correction.md`: corrected `刷装备V2` feedback simulation rules after user alignment: first clear +10, rarity unlock feedback, flat power feedback, and fatigue-style boredom.
- `2026-07-02_2435_equipment-grind-v2-feedback-curve.md`: added and ran an automated `刷装备V2` grind-loop feedback simulation, tracking combat time tiers, first clears, new drop-layer unlocks, power feedback, and boredom across three seeds.
- `2026-07-02_2415_equipment-grind-v2-calibrated-stage-budget.md`: added a real combat calibration script for `刷装备V2`, confirmed the prior D2 `5200` wall was over-tuned, and reduced D2-D9 enemy budgets with fixed-gear validation.
- `2026-07-02_2359_equipment-grind-v2-stage-budget.md`: raised live `刷装备V2` dungeon enemy display power and build-layer budgets so early equipment gains should hit staged walls instead of sweeping the ladder.
- `2026-07-02_2338_equipment-grind-v2-dungeon-scroll.md`: fixed `刷装备V2` lower-left dungeon list overlap by making the 9-stage list internally scrollable and browser-checking that cards no longer overlap.
- `2026-07-02_2328_equipment-grind-v2-workbench.md`: copied the existing equipment grind simulator into `刷装备V2`, wired the 9-dungeon three-wave loot table into the live page, added the workbench/server route, and browser-smoke-tested rendering plus combat start.
- `2026-07-02_2255_equipment-three-wave-budget.md`: retuned equipment dungeon/drop pacing through a 3-attempt budget to produce a three-wave progression curve, then regenerated the report and SVG curve.
- `2026-07-02_2232_progression-curve-aesthetics-skill.md`: added the `progression-curve-aesthetics` project skill to preserve the preferred wave-shaped progression structure for loot/stat/reward tuning.
- `2026-07-02_2220_equipment-grind-rarity-progression-test.md`: removed artificial dungeon wait gating, retuned rarity tables by dungeon tier, and reran the 24-tick grind curve; average end score is now 0.734 rather than near-full-clear.
- `2026-07-02_2208_equipment-grind-dungeon-progression-curve.md`: fixed the equipment grind simulation so loot comes from staged dungeons with level/rarity ranges while the waterline is only used to score each grind tick.
- `2026-07-02_2155_equipment-threshold-audit-correction.md`: audited the Mythic Lv.150 threshold result, confirming full 8-slot equipment and separating 48-sample clear from strict all-120 perfect clear.
- `2026-07-02_2145_equipment-rarity-level-waterline-thresholds.md`: added a fixed rarity/level equipment threshold scanner and measured what gear bands can clear the current super-waterline bucket.
- `2026-07-02_1938_equipment-v2-followup-and-drop-bug.md`: clarified that low super-waterline grind scores are caused by drop tier being tied to benchmark score, not weak 150 mythic gear; removed legacy percentage-style base stat production and confirmed forced 150 mythic teams beat the super bucket.
- `2026-07-02_1928_equipment-generation-v2.md`: changed equipment generation so level drives base stats, rarity drives affix point count, direct small stats covered by major attributes are blocked from affix pools, and the super-waterline equipment simulation uses the same formula.
- `2026-07-02_1910_global-mechanic-curves.md`: added a global mechanic curve asset so equipment affix points convert into real effects through shared diminishing curves; integrated it into build layers, equipment UI scoring, and super-waterline grind simulation scoring.
- `2026-07-02_1549_super-waterline-equipment-grind.md`: added a stronger generated mob waterline with attribute/equipment boosts, then ran 8 current-equipment grind simulations against it; equipment improves scores but the curve is compressed and jump rhythm is weak.
- `2026-07-02_0030_archetype-affix-width-pass.md`: re-reviewed archetype affixes with the design-width rule, broadened `fireAmp`, `stealthDuration`, `lowHpDamage`, and `auraPower`, and added direct build-layer side effects for `shadowAmp` and `arcaneAmp`.
- `2026-07-02_0015_design-width-evaluator-skill.md`: added the `design-width-evaluator` project skill for judging application width of affixes, keywords, mechanics, item stats, enemy mechanics, UI controls, and reward types using current users, future users, and extreme saturation tests.
- `2026-07-02_0000_weapon-and-archetype-affix-audit.md`: confirmed the equipment grind simulator still has a single weapon slot rather than left/right hands, and audited all 12 archetype affixes by slot coverage, role coverage, direct build-layer hook, and corrected user rule that normal affixes need at least two real user roles.

## 2026-07-01

- `2026-07-01_1513_equipment-affix-build-pool-pass.md`: rebuilt equipment grind affix generation around major attributes, small stats, and archetype affixes across 8 slots; added role-aware scoring and first late-dungeon budget correction.
- `2026-07-01_1218_shadow-assassin-engine-check.md`: verified shared combat-sim shadow assassin blink/lock/reset behavior, patched battle_view fallback shadow APIs, and added a clear generated `暗影刺客` branch to the equipment grind roster.
- `2026-07-01_1148_auto-grind-continues-after-loss.md`: changed continuous grind so losing a fight gives no loot but rerolls the next enemy group and continues instead of stopping.
- `2026-07-01_1143_equipment-auto-grind-and-dust.md`: added continuous dungeon grinding, 500-item warehouse capacity, auto-dismantle by rarity threshold, and full-warehouse stop popup.
- `2026-07-01_1132_game-ui-flow-contract-skill.md`: added the `game-ui-flow-contract` project skill and applied it to the equipment grind simulator as a page/click/formation redesign contract.
- `2026-07-01_1122_equipment-ui-team-interaction-fix.md`: corrected equipment/team page interactions: hero click only selects, details open from team-page button, and active combat order uses front/back formation controls.
- `2026-07-01_1110_equipment-dungeon-enemy-build-layer.md`: replaced the rejected dungeon enemy scaling direction with build-layer enemy construction using enemy attribute points and enemy gear budgets; no hard power gate and no direct stat multiplier.
- `2026-07-01_1044_equipment-ui-build-layer-unification.md`: unified the equipment grind simulator's hero combat spec calculation with shared `build-layers.js`, so UI equipment bonuses use the same additive layer as analysis scripts.
- `2026-07-01_2044_equipment-character-modal.md`: added a reusable character + equipment display modal to the equipment grind simulator, with center portrait, side equipment slots, four skill cards, and a seven-stat detail toggle.

## 2026-06-30

- `2026-06-30_2116_attribute-equipment-layer-direction.md`: records the agreed next architecture direction: keep character base stats unchanged, use 0 starting attribute points, and implement a shared additive attribute/equipment modifier layer instead of continuing proxy tuning.
- `2026-06-30_1338_equipment-auto-iteration-goal-complete.md`: completed the first-version equipment auto-iteration toolchain at 5/5 attempts, with static reports, combat proxy validation, and next-step recommendation for real equipment modifiers.
- `2026-06-30_1315_equipment-static-loop-attempts-2-3.md`: records attempts 2-3 of equipment auto-iteration: bridge affixes, required-group fantasy scoring, and v5 static best-so-far.
- `2026-06-30_1258_equipment-static-loop-attempt1.md`: implemented attempt 1/5 of the equipment auto-iteration loop with a global affix registry, static loot/equip evaluator, five rule variants, and first metric results.
- `2026-06-30_1239_equipment-auto-iteration-pipeline.md`: created the equipment auto-iteration pipeline and task-board entry, with four evaluation functions and a five-loop equipment-only adjustment budget.
- `2026-06-30_1224_equipment-affix-full-pool.md`: expanded equipment design from only major attributes into full first-level, second-level, and third-level affix pools distributed by slot.
- `2026-06-30_1206_equipment-affix-attribute-correction.md`: corrected equipment affix design to use the accepted v2 attributes: 武力、坚韧、敏捷、奥术、节律、韧性.
- `2026-06-30_1131_equipment-loot-design.md`: added the v1 equipment loot experience draft: slots, left/right/two-hand weapons, rarity-to-affix count, steep affix levels, and slot-restricted affix pools.
- `2026-06-30_1111_task-board-next-phase.md`: updated the task board after attribute tuning acceptance; closed/parked attribute-shadow tuning tasks and made `playable-team-composition-v1` the active next phase.
- `2026-06-30_1053_shadow-loop-and-fire-fx-check.md`: checked latest assassin target-focus work, verified fire mage active-cast signals in the showcase case, patched duplicate-name FX fallback and residual fire visuals.

## 2026-06-29

- `2026-06-29_2219_balance-showcase-and-open-bugs.md`: summarizes the balance showcase work and records the next two combat bugs: shadow blink target lock and mage/fire FX anchoring.
- `2026-06-29_2105_balance-showcase-single-shadow-and-fire-note.md`: added single-shadow failure scenarios to the showcase and clarified the double-shadow vs fire-burst two-mage/fire-echo behavior.
- `2026-06-29_2055_balance-showcase-page.md`: added a workbench page for watching curated no-attribute 4v4 balance showcase battles using the shared battle view.
- `2026-06-29_1245_shadow-assassin-double-branch-review.md`: reinterprets clean no-attribute results from a double-shadow anti-combo lens; single-shadow is weak, two-shadow is plausible but should be treated as its own branch.
- `2026-06-29_1238_shadow-assassin-clean-baseline.md`: reran shadow assassin baseline with no attribute routes using fixed-preset matrix and 500-team waterline; one-shadow is weak, two-shadow is spiky and still below old waterline.
- `2026-06-29_1205_shadow-assassin-report-correction.md`: corrects the previous shadow assassin tuning handoff; the reported 4v4 table was actually 2v2, and the real 4v4 remains tenacity-led.
- `2026-06-29_1155_shadow-assassin-survival-tuning.md`: completed a 3-attempt survivability tuning budget for the hidden/shadow assassin, adding hidden extension and one low-HP fade while recording waterline risk.
- `2026-06-29_1116_shadow-assassin-validation.md`: validates the new hidden/shadow assassin branch, including baseline strength, route performance, waterline results, and next reset/exit-payoff recommendation.
- `2026-06-29_1116_latest-pull-assassin-shadow-bridge.md`: bridges the top-level coop entry point to the project-local 2026-06-29 assassin hidden/shadow burst report from the latest pull.

## 2026-06-28

- `2026-06-28_2107_waterline-interpretation-and-bloodrage.md`: records how to interpret the generated 4v4 waterline, fixed-preset bucket results, and the `bloodRage`/berserker auto-trigger diagnosis.
- `2026-06-28_1449_mob-waterline-and-role-score.md`: built a 500-team generated mob waterline across five strength buckets and scored ten professions' fixed-preset-derived standard teams against it.
- `2026-06-28_0000_team-pool-evolver.md`: added a practical team-pool iteration document/script, initialized 140 logic-built teams, and validated random exploration with a dry-run.

## 2026-06-25

- `2026-06-25_2206_playable-team-composition-next.md`: summarizes the shared battle-view extraction, current assassin/matrix diagnosis, and sets next phase priority to playable character composition first, player signal system second.
- `2026-06-25_1259_encounter-lab-combat-replay.md`: corrected encounter lab from a static result board into signal-driven combat playback with feed, HP progression, and floaters.
- `2026-06-25_1242_encounter-lab-ui-redesign.md`: redesigned the encounter/level lab UI using the project `game-ui-designer` skill and browser-checked desktop/mobile usability.
- `2026-06-25_1217_signal-system-paused.md`: records the current life-recognition / signal-system state and marks it paused by user request.
- `2026-06-25_1113_life-recognition-scale-tuning.md`: retuned the life simulator recognition scale and recorded the current usable mood model with default pleasure decay 6.
- `2026-06-25_2015_signal-ui-and-life-recognition-handoff.md`: records today's shift from UI implementation failures into signal-based UI planning, attention analysis, player signal modeling, and the first life recognition simulator.

## 2026-06-24

- `2026-06-24_2104_encounter-lab-ui-and-coop-index.md`: added the Encounter Lab workbench UI and changed coop navigation toward a timestamped report index.
- `2026-06-24_1713_deterministic-ecology-encounters.md`: added deterministic ecology diagnostics and the first five encounter level data/simulation reports.
- `2026-06-24_1100_asset-intent-signal-contract-and-iron-wall.md`: previous skill/signal/balance handoff.
- `2026-06-24_2151_unpushed-local-changes-handoff.md`: broad local dirty worktree handoff from another/earlier pass; keep for context, but it is not the current UI handoff.

## 2026-06-23

- `2026-06-23_2220_goal-complete-handoff.md`
- `2026-06-23_2209_skill-assets-and-archetype-validation.md`
# 2026-07-19 17:45 — 解析器因果辅助证据通道

- Report: [`reports/2026-07-19_1745_causal-evidence-parser-channel.md`](reports/2026-07-19_1745_causal-evidence-parser-channel.md)
- Summary: 原始战斗事件本来就有玩家可见的击杀者、目标、动作和时间；本次在解析器中增加与知识摘要并行、独立经过三档感知且绝不进入知识库的`causalEvidence`通道。真实fixture中普通感知成功确认游侠伤害→击杀同一目标→胜利三步链。
