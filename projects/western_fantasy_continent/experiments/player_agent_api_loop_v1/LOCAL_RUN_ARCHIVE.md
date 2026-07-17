# 本地运行记录归档

逐轮 request/response 和完整未瘦身 session 不再作为源码提交，统一放在：

`projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/`

这个目录被 Git 忽略，但保留原始相对路径，并有 `archive-manifest.json` 记录文件大小和 SHA-256。原路径中的 session 是可提交的精简版；完整原件仍在本地归档中。

执行：

```powershell
node archive-run-artifacts.js
node archive-run-artifacts.js --apply
```

第一条只显示计划，第二条才执行迁移。脚本发现已有归档清单或目标冲突时会停止，不覆盖已有记录。

精简 session 保留行为、结果、情绪、事件摘要、角色印象、知识更新、归因和最终认知状态；移除完整 decision request、原始/语义逐事件日志、重复的累计 trace 和 API response 列表。

需要调查历史细节时，使用清单中的 `archivedOriginal` 或 `archivedAt` 路径读取本地原件。不要从精简 session 推断已经被明确标记为归档的底层字段。
