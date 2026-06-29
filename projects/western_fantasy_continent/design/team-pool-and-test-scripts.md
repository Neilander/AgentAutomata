# Team Pool And Test Scripts

这份文档整理当前项目里和战斗验证、随机生成、训练原型相关的脚本，并定义新的“预制队伍池 + 随机探索追加”流程。

## 当前结论

现阶段不要把队伍生成包装成 AI 训练。更稳的路线是：

1. 先维护一批符合配队逻辑的预制队伍。
2. 每轮加入少量随机探索队伍。
3. 用 `combat-sim` 验证。
4. 把有价值的随机队伍追加进队伍池。
5. 暂时不淘汰旧队伍。

这个流程保留设计师先验，也给意外组合留下空间。

## 现有脚本类型

| 脚本 | 类型 | 主要用途 | 输出 | 备注 |
| --- | --- | --- | --- | --- |
| `simulate-archetype-matchups.js` | 标准流派 matrix | 现有 preset 两两对战，检查胜率、强弱预期、生态状态 | `design/archetype-matchup-report.md`, `design/balance/archetype-matchup-evidence.json` | 正常流派生态验证，不是随机探索。 |
| `analyze-matchup-extremes.js` | 极端 matchup 归因 | 读取 matrix evidence，解释 0/100 或 90/10 的原因标签 | `design/balance/archetype-extreme-diagnosis.md/json` | 当前还是流派级，不是单技能 offender 级。 |
| `analyze-archetype-signals.js` | 流派信号合同 | 检查每个 preset 是否产生预期信号曲线 | `design/archetype-signal-report.md` | 适合确认流派幻想是否成立。 |
| `analyze-archetypes.js` | 流派设计审计 | 汇总 preset 技能、标签、角色构成 | `design/archetype-analysis-report.md` | 偏设计盘点。 |
| `redteam-skill-pool.js` | 随机队伍红队 | 随机组 4 人队，打所有标准 preset，找 breaker | `design/balance/skill-pool-redteam-report.md` | 这是已有的随机生成检查，但它不维护长期队伍池。 |
| `analyze-role-ecology.js` | 1v1 / 2v2 / 4v4 职业结构检查 | 固定角色组合，检查职业生态、无前排、双战士等结构 | `design/balance/role-ecology-report.md` | 里面的 4v4 是结构压力测试，不等同正式队伍平衡。 |
| `analyze-role-character-contributions.js` | 单角色贡献诊断 | 从 preset 对战中拆每个角色的伤害、承伤、治疗、护盾、异常贡献 | `design/balance/role-character-diagnostics.md/json` | 用于发现某职业或角色包是否越界。 |
| `simulate-encounter-levels.js` | 关卡组合验算 | 枚举关卡 roster 的可选组合，检查多少组合能过关 | `design/encounter-level-report.md/json` | 面向可玩关卡，不是全局生态。 |
| `team-training-prototype.js` | 训练/推荐原型 | 生成样本、轻量打分模型、推荐队伍，再用 combat-sim 验证 | `design/team_training/*` | 当前更像 retrieval/scoring，不应直接认为有涌现。 |
| `analyze-attribute-growth-prototype.js` | 属性成长原型 | 测试大属性路线和成长方向 | `design/attribute-growth-prototype-test-report.md` | 不应直接修改职业基础数值。 |
| `analyze-attribute-build-routes-v2.js` | 属性路线 1v1 | 用属性路线模拟 1v1 构筑差异 | `design/attribute-build-route-simulation-v2.md` | 属性系统原型，不是正式队伍池。 |
| `analyze-attribute-team-routes-v2.js` | 属性路线 2v2/4v4 | 随机队友/敌人测试焦点角色属性路线 | `design/attribute-team-route-simulation-v2.md` | 属性系统原型，不是正式队伍池。 |
| `validate-combat-signals.js` | 信号系统校验 | 检查基础 combat signal 是否存在并可用 | 控制台输出 | 适合改信号系统后跑。 |
| `validate-skill-assets.js` | 技能资产校验 | 检查技能 JSON 和角色引用是否合法 | 控制台输出 | 改技能后必须跑。 |
| `validate-game-data.js` | 游戏数据校验 | 检查数据整体可加载 | 控制台输出 | 泛用数据 sanity check。 |
| `build-skill-assets.js` | 资产构建 | 从 `skill_assets` 生成 `skill-assets.js` | `game_data/skill-assets.js` | 改 JSON 技能后运行。 |

## 新流程：Team Pool Evolver

新增脚本：

```bash
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=init
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=report
```

数据库：

```text
projects/western_fantasy_continent/game_data/team_pools/team-pool-db.json
```

报告：

```text
projects/western_fantasy_continent/design/team_pool/team-pool-evolver-report.md
projects/western_fantasy_continent/design/team_pool/team-pool-last-round.json
```

### 数据库结构

数据库维护一个长期队伍池：

- 初始 `140` 支队伍：按配队逻辑生成。
- 每轮 `60` 支随机探索队伍：随机职业、随机技能、随机站位。
- 如果随机队伍有价值，就追加进数据库。
- 暂时不做淘汰。

初始 140 支设计逻辑队伍来自这些模式：

| 模式 | 含义 |
| --- | --- |
| `one_front_three_back` | 一前排三后排 |
| `two_front_two_back` | 两前排两后排 |
| `three_front_one_back` | 三前排一后排 |
| `four_front` | 四前排 |
| `protect_carry` | 一核心三保护 |
| `status_engine` | 状态铺设与引爆 |
| `control_burst` | 控制爆发 |

### 每轮随机探索

默认一轮：

```bash
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve --random=60 --seeds=2 --opponent-sample=48
```

流程：

1. 读取 `team-pool-db.json`。
2. 生成 60 支随机队伍。
3. 每支随机队伍打：
   - 所有标准 preset。
   - 队伍池前若干支预制队伍，默认 48 支。
4. 记录胜率、硬克制对象、明显弱点。
5. 满足价值规则的队伍追加进数据库。

### 价值规则

随机队伍满足任意强信号即可进入候选：

- 总平均胜率达到阈值。
- 对标准 preset 的平均胜率达到阈值。
- 有多个硬克制对象。
- 能稳定 counter 某个标准 preset，即使整体胜率不高。

这意味着我们不是只保留“全局最强队伍”。一个平均胜率不高、但专杀某个主流强队的队伍也有价值。

### 为什么先不淘汰

当前组合空间非常大，前期从 140 增长到 200、260、320 都是可接受的。相比过早淘汰，保留历史队伍更利于观察结构演化。

未来如果队伍池太大，再加入淘汰规则：

- 低胜率且无特殊 counter。
- 与已有队伍高度相似且表现更差。
- 长期没有被推荐、没有作为关卡解法、没有作为 counter 的队伍。

## 推荐使用顺序

改技能后：

```bash
node projects/western_fantasy_continent/game_data/build-skill-assets.js
node projects/western_fantasy_continent/game_data/validate-skill-assets.js
node projects/western_fantasy_continent/game_data/simulate-archetype-matchups.js
node projects/western_fantasy_continent/game_data/redteam-skill-pool.js
```

要扩展可玩队伍池时：

```bash
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve
```

要检查随机探索但不写入数据库时：

```bash
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve --random=10 --seeds=1 --opponent-sample=12 --dry-run
```

## 边界

- `team-pool-evolver` 不是训练模型。
- `team-pool-evolver` 不直接改技能数值。
- `team-pool-evolver` 的 promoted 队伍只是“值得看”，不是自动进入正式 meta。
- 正式采用前仍然需要在 UI 中观察战斗、看信号归因、检查是否好理解。

## 小怪强度水表：Mob Waterline

新增脚本：

```bash
node projects/western_fantasy_continent/game_data/mob-waterline-builder.js --mode=build --target=500 --batch=200 --max-batches=40 --force
node projects/western_fantasy_continent/game_data/mob-waterline-builder.js --mode=score-roles
```

数据库：

```text
projects/western_fantasy_continent/game_data/team_pools/mob-waterline-db.json
```

报告：

```text
projects/western_fantasy_continent/design/team_pool/mob-waterline-report.md
projects/western_fantasy_continent/design/team_pool/mob-waterline-role-score-report.md
```

这个脚本不是用来找最强队，而是生成一把“强度尺”。每支随机/模板候选队会打 `17` 个固定标准 preset，并按打赢数量分桶：

| 分桶 | 目标数量 | 含义 |
| --- | ---: | --- |
| `0-2` | 100 | 垃圾/低压小怪 |
| `3-7` | 160 | 普通小怪 |
| `8-12` | 140 | 精英小怪 |
| `13-14` | 70 | Boss 候选 |
| `15-17` | 30 | 顶级/异常小怪 |

当前已成功构建 `500` 支水表队，评估候选 `2400` 支，五个分桶都正好填满。后续任何新队伍都可以打一遍这 500 支水表队，得到一个“清小怪能力”分数，而不是只看它和少数 preset 的互相克制。

职业评分模式会取每个职业当前来自固定 preset 的标准队，分别打 500 支水表队。这个分数表示“该职业现有标准队的水表通过率”，不是职业单体强度。当前结果摘要：

| 职业 | 平均胜率 | 备注 |
| --- | ---: | --- |
| 刺客 | 75% | 毒巢标准队很强，暗影处决中等偏强。 |
| 法师 | 74% | 余烬/炼金/霜控几个标准壳都能清水表。 |
| 炼金师 | 64% | 两个强壳，一个净化消耗壳偏弱。 |
| 骑士 | 63% | 上限高，但不同 preset 壳差异很大。 |
| 狂战士 | 60% | 王冠核心强，低血狂怒和王骑破阵偏低。 |
| 术士 | 58% | 毒巢很强，殉道/净化壳偏低。 |
| 牧师 | 54% | 多数偏中档，王冠/霜控壳较强。 |
| 吟游诗人 | 53% | 王冠壳较强，铁壁/壁垒壳偏低。 |
| 战士 | 53% | 余烬壳很强，防御/决斗壳偏低。 |
| 游侠 | 48% | 目前标准壳整体最低。 |

注意：水表本身包含强弱层级，所以职业标准队平均胜率不需要都接近 50%。更理想的目标是：成熟标准队能稳定吃掉低压和普通小怪，对精英有分化，对顶级小怪明显吃力。

## 职业小队池：Role Team Pool Evolver

新增脚本：

```bash
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=init
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=report
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=evolve --role=priest --focus-skill=purifyingWard --dry-run
```

数据库：

```text
projects/western_fantasy_continent/game_data/team_pools/role-team-pool-db.json
```

报告：

```text
projects/western_fantasy_continent/design/team_pool/role-team-pool-report.md
projects/western_fantasy_continent/design/team_pool/role-team-pool-last-round.json
```

这个数据库给每个职业维护一个小型测试队伍集。默认每职业 `10` 队：

- `7` 个设计逻辑队。
- `3` 个随机种子队。

用途是测试“某职业本身”或“某职业新技能”进入不同队伍后的表现。比如牧师新增一个技能，可以先强制这个技能进入牧师焦点单位，然后生成 3 个随机牧师候选队，拿它们去打主队伍池。

### 数据量估算

如果主队伍池取 `200` 队：

```text
单职业：10 role teams x 200 main teams = 2,000 matchup pairs
十职业：100 role teams x 200 main teams = 20,000 matchup pairs
seeds=2 时，全职业就是 40,000 场战斗
```

所以默认建议先按单职业跑，尤其是刚做完一个职业的新技能时。

### 职业小池的 7 个逻辑模板

| 模板 | 含义 |
| --- | --- |
| `balanced_shell` | 焦点职业放进均衡队 |
| `double_front_shell` | 焦点职业放进双前排壳 |
| `protect_focus` | 保护焦点职业 |
| `status_partner` | 给焦点职业配异常搭档 |
| `control_window` | 给焦点职业配控制窗口 |
| `tempo_shell` | 给焦点职业配诗人节奏壳 |
| `mirror_pair` | 双同职验证，检查堆叠问题 |

### 更新逻辑

和主队伍池一样：

1. 每个职业先保留 10 个基础队。
2. 每轮随机生成 3 个候选队。
3. 候选队打主队伍池。
4. 如果候选队有价值，就追加进该职业的小池。
5. 暂时不淘汰旧队。

有价值的定义包括：

- 平均胜率够高。
- 有多个硬克制对象。
- 焦点职业自己确实有贡献。
- 能 counter 某些主队伍池中的强队。

### 职业小池矩阵

新增矩阵脚本：

```bash
node projects/western_fantasy_continent/game_data/role-team-pool-matrix.js
```

输出：

```text
projects/western_fantasy_continent/design/team_pool/role-vs-main-matrix.json
projects/western_fantasy_continent/design/team_pool/role-vs-main-matrix-report.md
```

默认每个格子只跑一局，因为当前战斗随机性很低。每格只存 summary：

- 胜负。
- 战斗时长。
- 双方残血。
- 双方伤害/治疗/护盾摘要。
- 焦点职业单位伤害、治疗、护盾、是否存活。
- 首死时间/阵营/职业。
- 少量标签，比如 `focus-damage`、`focus-sustain`、`hard-loss`。

不存完整 signals，不存 replay cache。需要分析某个具体格子时，再用对应 `roleTeamId` 和 `mainTeamId` 重跑。
