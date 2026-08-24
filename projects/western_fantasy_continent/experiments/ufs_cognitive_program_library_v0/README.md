# UFS 认知 JSON 小程序库与隔离 Agent 盲开发 V0

这个实验验证：AI只读规则和有限DSL合同，能否独立写出可保存、可执行、可修订的JSON认知小程序；运行时由固定解释器把抽象轨迹绑定到当前注意对象，只形成临时 `imaginedWorld` patch，不调用真实游戏引擎。

## 当前结果

- 4名隔离Agent共生成25个程序：首轮5个放置程序，第二轮天空4个、房间8个、母舰/生成/终局8个。
- `library/program-library.json` 统一保存25个程序及每个revision的作者、允许输入与提交来源。
- 20个第二轮程序全部通过结构审计、逐程序隐藏状态测试和连续真实局面切片。
- 20个第二轮程序现已全部接入普通游戏事件→自动Q→真实GTE轨迹→程序链路；事件输入不再直接指定 `qKind` 或规则来源。
- 原有第一步选择→GTE轨迹→JSON程序→脑内patch链路无回归。

覆盖内容包括普通/防空下降、房间完整性与房间值、白骰重投随机停止、最终箭头、母舰下降格、撞城、能源支付与收益、战斗机、研究选择、挖掘、研究顺序、最终研究限制、母舰阶段、生成优先级和胜负检查。

## 隔离盲开发

首轮Agent只读 `public_bundle/` 的规则、合同和空模板。第二轮三个Agent分别只读 `public_bundle_round2/sky|room|phase` 中自己的规则与试卷，以及共享DSL和空模板；禁止看解释器、程序库、其他提交、场景、测试和游戏引擎。每人只写自己的submission，完成后只回复路径。主流程等三份全部封卷后才扩展解释器和读取提交。

这是流程隔离及Agent自报输入审计，不是操作系统级强沙箱证明。

## 统一库

`CognitiveProgramLibrary`支持：

- `store(program, provenance)`：新增revision 1；
- `get(programId, revision)`：获取最新或指定历史版本；
- `revise(programId, nextProgram, provenance)`：追加新版本，不覆盖旧版；
- `list()`：列出最新或全部版本；
- `save()` / `load()`：持久化程序、版本和来源。

`source-catalog.js` 合并四份冻结规则源。`install-round2-submissions.js` 先核对每名Agent声明的输入与精确程序ID集合，再安装20个程序。

## JSON解释器

解释器不理解自然语言，也不执行任意代码。AI把规则写成有限JSON表达式；V2支持：

```text
read / read_template / var / get
map / filter / length / first / pluck / unique / concat
eq / not / and / or / lte / gte / contains
add / subtract / min / max / sum / if
```

每次读取同时受两层限制：程序必须在 `requiredReads` 声明路径，当前注意对象也必须暴露该路径。动态路径如 `sky.column:${columnId}.shipIds` 也只授权自己的命名空间。输出kind和字段集合固定，运行时还检查数字、数组、布尔值、停止类型和终局结果。

## 运行链路

已接入的首步链路：

```text
真实GTE轨迹候选 → 关系门 → 唯一JSON程序 → 注意读取 → 临时imaginedWorld patch
```

底层 `cognitive-program-runtime.js` 可按已激活轨迹选择程序；上层 `../ufs_first_action_imagination_v0/ufs-event-rule-imagination.js` 已负责从普通游戏事件和公开局面自动判断Q类型、投影注意、形成五槽Q、查询25条真实GTE矩阵并经过关系门，不再由测试直接提供规则来源。

`test-real-slices.js` 使用较完整的规范化游戏局面测试了：

1. 放置白骰后，只标记未放置骰子为随机未知并停止，不编造点数；
2. 母舰下降→绑定本行行动→生成并列最远投放点，在玩家选择处停止；
3. 已选择结算能源房后，按上限想象实际增量；
4. 研究到顶后立即在终局停止。

这些是真实规则状态切片，但尚不是直接读取完整UFS游戏实现的端到端对局。

## 验收

- 程序库首轮隐藏测试：6/6 PASS。
- 第二轮20程序测试：8/8 PASS（每个程序至少被一个局面执行；关键边界有额外反例）。
- 连续真实状态切片：5/5 PASS。
- 原有真实第一步与消融：10/10 PASS。
- 原有问题1—6设想流水线：10/10 PASS。
- 新增20类自动Q端到端：20/20 PASS。
- 新增注意不足、错误高分候选、未知、随机、选择和输入不可变边界：6/6 PASS。
- 新接线26/26；加上既有39项回归共65/65 PASS。

## 仍然缺少什么

- 20类认知事件已能自动形成Q并激活程序；尚未接入正式玩家循环的连续阶段调度与真实动作执行。
- 当前接线接受普通结构化游戏事件与公开局面，尚未把正式UFS引擎每一种原生事件对象直接转换为该合同；这属于后续玩家循环适配，不再需要重做Q或轨迹。
- 白骰随机结果必须由真实世界后续观察提供；程序正确停在 `random`，不会脑补。
- `revise()` 已支持版本化修改，但问题8的反馈学习尚未自动决定该加强轨迹、修订程序还是调整注意力。

下一步可以进入连续玩家循环：把一次事件设想的停止结果交回决策层，再由正式环境执行动作并提供反馈。反馈学习仍按问题8另行处理。

## 运行

```powershell
node projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/install-round2-submissions.js
node --test projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/test-program-library.js
node --test projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/test-round2-programs.js
node --test projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/test-real-slices.js
```
