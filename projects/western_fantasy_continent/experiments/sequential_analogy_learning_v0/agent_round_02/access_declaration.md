# Round 02 访问声明

本轮实际读取范围：

- 自己在Round 01生成的`agent_memory.jsonl`；
- `data/learn_public.jsonl`第101—200行；
- `data/eval_public.jsonl`第101—200行。

本轮没有读取Round 01的`score.json`，也没有读取或运行任何评分文件、评分器、`family_catalog`、`learn_ideal`、`eval_ideal`、名称含`secret`的文件、`artifacts`结果及公开文件第201行以后的批次。

Round 02记忆由Round 01的100条记忆原样保留，再追加本轮100条公开训练经历形成。预测只使用累计200条训练记忆；没有使用Round 01评测答案或得分反馈。`predictions.jsonl`中的`value`只来自累计训练结果，无法建立可靠类比时标记`uncertain:true`。
