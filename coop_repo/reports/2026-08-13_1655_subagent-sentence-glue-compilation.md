# Agent Handoff: 子 Agent 逐句生成并粘接 UFS 规则

- Date: 2026-08-13
- Agent/thread: Codex root + blind_ufs_glue_compile / blind_ufs_glue_compile_r2
- Scope: 规范可粘连Action，并验证子Agent能否只依据规则逐句生成可执行临时程序
- Status: complete

## User Intent

先规范一个可粘连Action的定义，再让子Agent依据规则和定义逐句生成、逐句粘连，检验最终能否形成正确的UFS局部程序。

## Completed

- 建立`glue_program_v1`合同：每个粘接单元必须记录规则来源、触发条件、注意力区域和筛选、产生动作、优先级与调度。
- 建立机器校验器：检查R01到R08只能顺序追加，拒绝示例飞船ID、重复unit、未知动作、未知字段、未知上下文路径和错误条件运算。
- 冻结8句玩家可见规则与公开世界合同；子Agent被禁止读取旧编译答案、正式引擎、测试和报告。
- 第一轮严格逐句盲编译：8步/8 units，旧宽松结构校验通过，但隐藏行为仅3/12。根因是合同允许AI发明运行器不认识的接口。
- 根据第一轮失败收紧合同：逐项规定每种Action的精确输入与result字段；明确格子用`kind`、状态用`entity.state.*`、数组条件用`includes/excludes`；明确可修正参数必须走`compute → notice → adjust → execute`。
- 第二个全新子Agent重新逐句盲编译：首次11/12，只漏同列更深位置的第二架飞船。
- 只反馈“同列第二架没移动”，未告知修法；子Agent最小补充注意力区域的`sky_down`连接，最终18/18通过。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/glue-action-contract-v1.md`: 可粘连单元与精确Action合同。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/glue-program-v1.js`: 合同校验与编译器。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/test-glue-program-v1.js`: 7项结构拒绝/接受测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/blind_compile_v1/public-world-contract.json`: 子Agent可见世界接口。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/blind_compile_v1/rules/R01.txt`至`R08.txt`: 严格逐句输入。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/blind_compile_v1/program-round1.json`: 第一轮失败证据。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/blind_compile_v1/program.json`: 第二轮最终8步/8 units可执行程序。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/evaluate-blind-glue-program-v1.js`: 18项隐藏行为、重组与前缀增长测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/README.md`: 实验过程与结论。

## Validation

- 合同测试：PASS，7/7。
- 第一轮宽松合同隐藏行为：3/12；收紧后旧输出被校验器直接识别34项接口错误。
- 第二轮首次行为：11/12；唯一失败为R01注意区域没有沿`sky_down`覆盖列内第二架飞船。
- 仅反馈失败现象后的局部修正：PASS，18/18。
- 完整行为覆盖：普通下降、防空-1、同列多船、1点归零、母舰下降、骷髅失败、箭头后二次结果粘接、城市伤害返航、白骰随机边界、爆炸零动作。
- 重组覆盖：所有unit声明倒序结果不变；拆掉R05后箭头连锁在原格自然停止。
- 前缀覆盖：R01、R02、R04、R05、R07、R08加入时，对应能力才逐句出现。
- 原注意力链5项、旧UFS编译10项、程序版UFS适配5项全部回归PASS。
- 相关JS`node --check`与目标目录`git diff --check`: PASS。
- independent_review: 子Agent为实验对象，不是代码审查者；行为由主Agent隐藏测试独立验收。

## Current State

当前已经证明：在这8句UFS局部规则范围内，只要动作接口是封闭、精确且可机器校验的，未读取旧答案的子Agent能够按句建立局部粘接单元，逐步形成可执行临时程序。第一次失败也证明，单纯规定JSON外形不够；核心是动作参数、result字段和上下文引用必须形成真正的接口类型系统。

## Unresolved

- 目前只做了一次成功的第二轮生成，尚未证明不同模型/多次采样的稳定率。
- 箭头公开合同目前只表达向右一格；复杂箭头目标、左箭头和跨多格需要更完整的空间接口。
- 当前校验器验证字段与路径，但尚未静态验证“某个memory key一定先写后读”等数据流类型。
- 仍未加入人类式漏粘概率、注意力预算和熟练度；本轮目标是先验证完整正确的临时程序构建能力。

## Recommended Next Step

不要立即扩成完整UFS。先用同一合同做第二种规则系统（例如卡牌事件或简化棋子动作）的全新盲编译，检验合同是否真的跨游戏；同时增加memory key先写后读和动作result类型的数据流静态检查。
