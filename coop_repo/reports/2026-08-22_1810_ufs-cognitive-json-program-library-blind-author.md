# Agent Handoff: UFS认知JSON小程序库与隔离Agent盲开发

- Date: 2026-08-22 18:10 +08:00
- Agent/thread: Codex `/root`；隔离作者 `/root/ufs_json_program_author`
- Scope: 统一管理可存取/修订的认知小程序，并验证Agent只读规则自主开发准确度
- Status: complete（5个放置程序；剩余轨迹与反馈自动修订待后续）

## User Intent

抽象轨迹落到当前对象所需的小程序应集中管理，允许保存、获取和修改；具体规则程序不应由开发者预先逐条写死，而应让AI在读规则过程中临时开发、安装并根据反例完善。本轮要求隔离Agent不能看主流程实现或答案，只能依据规则与指导写程序，完成后只报告路径，由主Agent验收。

## Completed

- 冻结盲开发公共包：四条规则原文、有限JSON DSL合同和空提交模板。
- 隔离Agent使用`fork_turns=none`，被明确禁止读取/搜索其他仓库文件，只写一个提交文件；完成消息只有路径。
- Agent提交声明只使用三份允许输入，独立生成普通下降、防空下降、防空无房间产出、多格完整性和单格房间值5个JSON程序。
- 主流程在Agent提交完成后才创建解释器与库实现，避免作者看到参考程序。
- 实现统一库：store/get/revise/list/save/load；revision追加且旧版不可覆盖；每版保留来源与作者provenance。
- 实现受限JSON解释器：有限表达式、动态注意路径、声明读取门、注意读取门、类型与patch边界检查；不执行自然语言或任意代码。
- 安装Agent提交到持久库，记录隔离作者和允许输入。
- 删除最新放置设想中的5个预写grounding分支；改为GTE轨迹→关系门→库中唯一程序→JSON解释器→临时patch。
- trace增加programId、revision和Agent来源。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/`: 盲开发规则、合同与模板。
- `.../submissions/agent_01_programs.json`: 隔离Agent自主提交。
- `.../program-validator.js`: 程序、触发、读取、表达式和输出合同校验。
- `.../cognitive-program-library.js`: 存储、获取、修订、历史、保存与恢复。
- `.../json-program-interpreter.js`: 受限表达式执行、注意读取门与程序选择。
- `.../install-agent-submission.js`: 输入审计、程序集合检查和安装。
- `.../library/program-library.json`: 当前5个程序及provenance。
- `.../test-program-library.js`: 隐藏功能、版本与越权测试。
- `.../README.md`: 架构、结果和边界。
- `.../ufs_first_action_imagination_v0/placement-rule-imagination.js`: 删除预写ground，接统一库和解释器。
- `.../test-first-action-imagination.js`: 断言程序ID、版本、隔离作者和无旧grounding名称。
- 两级README与coop入口：更新当前事实。

## Validation

- 小程序库与解释器：6/6 PASS。
- 真实A/B/C第一步、GTE连接增强和认知消融：10/10 PASS。
- 合计16/16 PASS；上游设想流水线另10/10 PASS。
- 隐藏多格完整例：骰3+骰4−修正1=房间值6；不完整例正确返回缺格与null。
- 防空边界：骰1→0、骰6→5；单格战斗机骰5−修正1→4；防空房无阶段产出。
- 未声明注意读取被拒绝。
- revision 2实际改变JSON表达式；latest返回v2、指定revision取回v1、保存恢复后历史与provenance仍存在。
- `placement-rule-imagination.js`源码不再出现旧5个预写grounding程序名。

## Current State

当前放置一步不再依赖开发者逐规则预写ground函数。AI读规则生成五槽边；隔离Agent按公共DSL生成对象绑定JSON程序；真实GTE唤醒后从统一库选择程序并由固定解释器执行。具体程序可以追加revision而不覆盖历史。

## Unresolved

- 隔离是流程约束和作者自报输入审计，不是OS级文件权限沙箱。
- 当前只有5个放置程序；剩余20条初始轨迹尚未让Agent按阶段生成程序。
- DSL仅支持当前公开有限操作；新动态模式可能需要增加通用安全指令或沙箱插件。
- revise接口已经可用，但反馈学习尚未决定何时自动生成修订并安装。
- 当前programId含`-v1`同时另有revision字段，历史兼容但命名略冗余；后续新增程序宜使用稳定语义ID、不把版本写进ID。

## Recommended Next Step

沿用同一盲开发合同，下一批只给白骰、最终箭头落点、母舰下降格和撞城规则，扩展DSL的随机停止与对象移动patch；让新的隔离Agent生成程序，再用它未见过的真实天空状态验收，不能回退为预写ground函数。
