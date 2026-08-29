# Agent Handoff: UFS反馈学习V0

- Date: 2026-08-28 16:39 Asia/Shanghai
- Agent/thread: root
- Scope: 实现原反馈清单7项，并增加系统错误隔离闸门；不做候选价值、宏观规划或远期归因
- Status: complete

## User Intent

在整局认知流水线已经跑通以后，先实现反馈模块的前置学习能力。研究房零收益等经历必须保存为新的`q当前 → q实际后续`轨迹，使玩家以后能预想到真实后果；不能另造候选价值分。规划相关的第10、11项以后再做。

## Completed

- 新增`UfsFeedbackLearner`，保存、恢复、精确召回并修改反馈学习状态。
- 正常正确后果不存在时创建五槽轨迹；重复出现时更新`observations`、`support`、`lastSeenAt`、来源和可信度，不复制记录。
- 高激活预测错误时保留旧轨迹原样，要求提供区分性上下文后新增更具体轨迹；新轨迹记录纠正的候选和不匹配五槽。
- 同一当前Q支持多个随机后续，并维护结果次数、近期权重、数值中心、常见范围、历史范围和近期偏移。
- 陌生规则支持`q当前 → 查规则`未解决出口；查到规则后新增具体轨迹但保留通用查询出口。
- 连续出现的轨迹对维护连续次数、粘连强度、自动化程度、注意成本和查规则成本。
- 注意反馈可生成受动作/阶段/目标范围约束的增加、降低或关系扩展；现有161+项Node完整注意场可以消费这些调整，未命中的周边状态仍保持非零背景激活。
- 教程、查规则、单次经历、多次经历和玩家猜测使用不同初始可信来源，并随重复验证更新。
- 增加反馈有效性闸门：只有玩家可见、已提交/知识查询且系统完整性通过的证据可学习；非法、隐藏、未审计或系统错误反馈进入隔离记录，不修改认知。
- 新轨迹明确标为`pending_matrix_compile`；提供待编译导出和`markMatrixCompiled`生命周期，避免把尚未编译的在线经历冒充真实GTE语义矩阵记录。
- 增加研究房“预算2、下一需求4、支付1能源但研究不前进”的区分性轨迹测试；召回依赖真实后果，不使用候选价值标量。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-feedback-learning.js`: 反馈状态、有效性闸门、轨迹/随机/查询/粘连/注意/来源学习接口。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-attention-provider.js`: 消费情境化反馈注意修正，保留完整场背景注意。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-ufs-feedback-learning.js`: 9个反馈场景回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 记录反馈层能力、矩阵编译边界和未接自动长局反馈的边界。

## Validation

- `node --test`运行`ufs_first_action_imagination_v0`目录全部`test-*.js`：103/103通过。
- 新反馈专项：9/9通过。
- 验证包括旧轨迹不受纠错削弱、具体轨迹情境胜出、随机多后续、查询出口保留、粘连加强、注意只改对应范围、来源可信度和四类无效反馈隔离。
- `git diff --check`：通过；只有仓库既有行尾转换警告。
- 当前分支：`simulatePlayer`；`53367a4`为HEAD祖先。

## Current State

原7项反馈需求和第8项有效性闸门已经形成可执行、可保存的独立反馈层。它学习的是后果轨迹，不是“这个选项值几分”。现有完整注意场已经能读取反馈产生的情境修正，而且没有移除周边背景注意。

在线新轨迹在反馈层内可以按同一五槽和上下文立即精确召回；只有完成真实GTE编译并登记矩阵版本后，才可声称支持模糊语义召回。

## Unresolved

- 完整长局尚未在每次玩家可见实际结果后自动调用反馈层。正式接线必须先定义“本次脑内预测”与“本次实际可见后果”的可靠配对，不能读取隐藏引擎真值。
- 新轨迹的GTE批量编译命令尚未自动触发；当前只提供待编译记录和编译完成登记接口。
- 反馈层只更新后果、注意和相邻轨迹连接；没有实现候选价值标量、母舰期限规划或跨多回合远期归因，符合本轮范围。
- 粘连和可信度数值是可审计工程初值，尚未通过玩家行为数据标定。

## Recommended Next Step

先用一个受控的“预想—实际结果”单步闭环接入反馈层：公开保存动作前唤醒的候选、动作后玩家真正看到的变化和系统完整性审计，再验证一次正确预测、一次研究零收益纠错、一次漏看注意修正都能在下一次同类局面被召回。第10、11项宏观规划和远期归因继续保持暂停。
