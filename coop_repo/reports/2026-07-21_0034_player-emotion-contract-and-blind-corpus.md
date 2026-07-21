# Agent Handoff: 玩家情绪模型契约与盲测案例库

- Date: 2026-07-21
- Agent/thread: Codex / root
- Scope: 玩家情绪模型输入输出契约、血清素轴、案例验证协议、首个大规模盲测语料
- Status: partial

## User Intent

建立一个由物理/化学状态、精神与认知评价、长期事件与记忆共同驱动的玩家情绪模型，输出可共存且带强度、对象和时间顺序的情绪；随后用大量文学、影视、新闻纪实和实验材料检验，追查错误并迭代。生理轴必须显式包含血清素。

## Completed

- 审计当前 V27：正式系统仍是单一 `emotion.value`，不能表达多情绪、对象和行为方向；现有事件知识、因果知识、假设、目标与失败记忆可作为未来上游输入。
- 固定 V1 程序契约：
  - 12 个显式化学轴，包含独立 `serotonin`，不再用其他名字隐藏。
  - 17 个认知评价轴。
  - 长期背景、个体基线、敏感度、清除速度和记忆的边界。
  - 多情绪输出包含情绪族、强度、对象、原因、置信度、起始、持续时间、行动倾向和证据。
- 增加案例契约校验器，拒绝未知化学轴、由标准答案反推的输入、时间倒序和同一来源跨数据集泄漏。
- 建立“盲测材料”和“已看答案的发现材料”隔离规则。已看过情绪答案的文学、影视与口述史不计入盲测准确率。
- 下载并处理 ISEAR `filtered` 数据，共 7,343 条第一人称事件叙述。
- 合并原始分片后按 `国家:城市:受访者` 重新做 70/15/15 确定性切分：
  - train：5,068 条，757 人。
  - development：1,228 条，183 人。
  - sealed_test：1,047 条，155 人。
  - 同一个人的所有案例只进入一组。
- 将输入与标准答案写入不同文件。输入中没有自报情绪、强度和事后生理/评价问卷。
- 增加严格推断轨：排除原文直接写出 angry、afraid、ashamed 等答案词的案例，共 5,479 条；自然叙述轨仍保留全部案例。
- 原始与生成数据保存在 Git 忽略目录，代码、协议、来源清单和哈希规则进入版本记录。

## Files Changed

- `projects/western_fantasy_continent/design/PLAYER_EMOTION_MODEL_CONTRACT_V1.md`：V1 输入、动力学、输出和验证契约。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/emotion-model-contract.js`：案例契约与语料泄漏校验。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/test-emotion-model-contract.js`：契约小测试。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/prepare-isear-blind-corpus.js`：按人物隔离并拆分输入/标准答案。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/convert-isear-parquet.py`：读取本地完整分片，绕开网页限流。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/fetch-isear-corpus.ps1`：可断点续取的备用下载器。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/fetch-isear-corpus.js`：数据接口下载器。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/DATASET_PROTOCOL.md`：盲测协议与运行说明。
- `projects/western_fantasy_continent/experiments/player_emotion_model_v1/discovery-source-inventory.json`：首批实验、文学、影视和纪实发现来源。
- `.gitignore`：忽略可重新生成的原始数据、盲测分片和临时读取依赖。

## Validation

- `node .../test-emotion-model-contract.js`：PASS。确认 12 个化学轴、显式血清素、多情绪标准答案、循环输入拒绝、来源泄漏拒绝。
- 本地三个 Parquet 分片读取：train 5,874、validation 734、test 735，总数 7,343。
- `node .../prepare-isear-blind-corpus.js`：PASS。生成 train 5,068、development 1,228、sealed_test 1,047；输入/答案 ID 完全对应；无人物跨组；无答案字段进入输入。
- 生成文件均写入 SHA-256 哈希，后续可以检查封存集是否被改动。

## Current State

模型的“输入是什么、哪些不能偷看、血清素如何作为独立状态存在、输出是什么”已经固定；首个千级封存集也已经生成。正式 V27 尚未修改，避免未经验证的新模型影响现有玩家模拟。

## Unresolved

- 隔离的生理动力学与多情绪输出计算器尚未开发，当前只有程序契约。
- ISEAR 是受访者在指定情绪提示下回忆事件，存在提示偏差，不能作为唯一证据来源。
- 严格推断轨当前只检查直接英文情绪词，尚未覆盖全部同义表达和隐性泄漏。
- ISEAR 事后问卷缩写字段尚需找到可靠 codebook 后才能用于中间生理/认知轴验证；当前被安全地留在 gold 侧。
- 文学、影视、新闻和口述史目前只有发现来源清单，尚未形成独立盲标案例。
- `sealed_test.gold.jsonl` 已生成但不得用于模型调参；下一阶段只能读取 train 和 development 的答案。

## Recommended Next Step

从 `PLAYER_EMOTION_MODEL_CONTRACT_V1.md` 和 `DATASET_PROTOCOL.md` 开始，开发隔离的情绪动力学模拟器。先用人工构造的小案例验证时间顺序、共存情绪、对象和血清素调节作用，再只在 development 集分析错误；封存测试集保持不动。
