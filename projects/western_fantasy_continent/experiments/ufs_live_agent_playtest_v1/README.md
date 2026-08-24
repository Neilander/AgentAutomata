# UFS Live Agent Playtest V1

一次真正按 `start → 当前 response → 一个 operation → 新 response` 运行的盲测试玩。
本次唯一 Attempt 在第三次放置后抵达 `unknown: no_rule_for:placement_room_state`；按真实
停止边界封卷，没有为凑完整回合重试。结论见 `RESULTS.md`。

- `PROTOCOL.md`：白名单、时序和解释边界。
- `thought-log.jsonl`：玩家在每个 response 后、提交动作前追加的判断记录。
- `machine-transcript.jsonl`：会话返回与单步 operation 的完整时序证据。
- `choices/`：每个文件只有一个当步 operation，无未来动作数组。
- `responses/`：逐步机器快照。
- `runtime/final-checkpoint.json`：封卷时 checkpoint。
- `posthoc-audit.json`：封卷后的合同审计；记录为何没有对不完整回合运行 formal oracle。
- `test-live-playtest.js`：时序、单操作文件、确定性重放与依赖污染检查。

运行入口：

```powershell
node session-cli.js start
node session-cli.js advance choices/001.json
```

白骰随机边界使用：

```powershell
node random-gateway.js
```

这不是 OS 级盲测；隔离依赖于严格阅读白名单与只追加时序文件。
