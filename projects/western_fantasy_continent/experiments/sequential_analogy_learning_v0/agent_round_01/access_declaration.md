# Round 01 访问声明

本轮盲测实际只读取了以下两个公开文件，并且每个文件只读取前100行：

- `data/learn_public.jsonl`前100行；
- `data/eval_public.jsonl`前100行。

读取训练文件时使用其中公开的`before`、`interactions`和`result`形成`agent_memory.jsonl`。读取评测文件时只看公开的`before`和`interactions`，没有看到任何评测结果。

本轮没有读取或运行：

- `family_catalog`；
- `learn_ideal`；
- `eval_ideal`；
- 名称含`secret`的文件；
- 任何评分器；
- 任何`artifacts`结果；
- 两个公开文件100行以后的其他批次。

`predictions.jsonl`中的结果值只复用了训练前100条`result`里实际出现过的值。无法从这些训练经历找到足够类比证据时，标记为`uncertain:true`，未用常识创造新的结果值。
