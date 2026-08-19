# Agent Handoff: Windows 划词快速记录工具

- Date: 2026-08-16
- Agent/thread: `/root/codex_quick_capture`（由 `/root` 委派的独立子 Agent）
- Scope: 不修改 Codex 本体，实现跨应用划词、全局快捷键命名保存与本地网页浏览
- Status: complete

## User Intent

提供一个常驻 Windows 外置工具：用户在 Codex 或任意应用划选文字后按快捷键，弹出只需填写条目名称的创建窗口；另一快捷键打开本地网页快速浏览条目。

## Completed

- 在完全隔离的 `tools/codex_quick_capture/` 中实现 Windows PowerShell 5.1 + WinForms 常驻工具，无 npm、pip 或额外运行库。
- 默认 `Ctrl+Shift+M` 捕获当前应用的划选文字，等待快捷键修饰键释放后发送 `Ctrl+C`，用剪贴板序号判断是否真的得到新内容，避免无选择时误存旧剪贴板。
- 创建窗口只要求条目名称，正文为只读预览；回车或按钮保存，Esc 取消。
- 条目以 UTF-8 JSONL 保存，字段为 `id`、`name`、`body`、`createdAt`；私人数据目录有独立 `.gitignore`。
- 默认 `Ctrl+Shift+O` 打开仅监听 `127.0.0.1:17823` 的本地网页；页面支持名称/正文搜索、按时间倒序浏览和复制正文。
- 提供托盘菜单、双击托盘查看、单实例限制、端口占用报错、快捷键冲突提示，以及可编辑 `config.json`。
- 提供双击启动的 `Start.cmd`、双击自测的 `Run-SelfTest.cmd` 和中文 README。

## Files Changed

- `tools/codex_quick_capture/QuickCapture.ps1`: 常驻应用、全局快捷键、划词捕获、保存窗口、本地 HTTP 服务和自测。
- `tools/codex_quick_capture/web/index.html`: 本地条目浏览、搜索和复制页面。
- `tools/codex_quick_capture/config.json`: 默认快捷键与端口。
- `tools/codex_quick_capture/Start.cmd`: 隐藏控制台的一键启动入口。
- `tools/codex_quick_capture/Run-SelfTest.cmd`: 自测入口。
- `tools/codex_quick_capture/data/.gitignore`: 忽略全部私人条目，仅保留忽略规则。
- `tools/codex_quick_capture/README.md`: 中文使用、配置、隐私、排障与自测说明。
- `coop_repo/reports/2026-08-16_2010_codex-quick-capture.md`: 本报告。
- `coop_repo/LATEST.md`: 增加本工具报告入口，不替换既有实验重点。
- `coop_repo/REPORT_INDEX.md`: 在 2026-08-16 章节追加本报告。

## Validation

- Windows PowerShell 5.1 `QuickCapture.ps1 -SelfTest`: PASS。
  - JSONL 名称、跨行正文、时间/id 的写入读取往返通过。
  - 随机回环端口上的首页与 `/api/entries` 通过；单条数据也确认返回 JSON 数组，页面搜索与复制功能标记存在。
  - 默认 `Ctrl+Shift+M` 与 `Ctrl+Shift+O` 在当前机器注册/释放成功；重复注册同一组合被 Windows 拒绝，冲突检测分支成立。
- 真实常驻进程烟测：用 Windows PowerShell 5.1 `-STA` 隐藏启动正式脚本，`http://127.0.0.1:17823/api/entries` 返回 HTTP 200 与 `[]`，随后按 PID 关闭测试进程。
- `git check-ignore -v tools/codex_quick_capture/data/entries.jsonl`: 命中 `data/.gitignore:1:*`，私人条目不会进入版本控制。
- 工作树原本已有大量其他 Agent 的修改；实现仅新增隔离工具目录及追加协作记录，没有回退或覆盖其内容。

## Current State

用户可直接双击 `tools/codex_quick_capture/Start.cmd`。启动后划选文字并按 `Ctrl+Shift+M` 创建条目，按 `Ctrl+Shift+O` 查看；配置修改后需从托盘退出并重启。

## Unresolved

- 自动验证没有实际驱动 Codex 窗口完成“鼠标划选 → 快捷键 → 弹窗输入 → 回车”整条可视交互；需要用户做一次人工烟测。底层剪贴板变化、快捷键注册、存储和正式常驻服务均已真实验证。
- 普通权限进程不能向以管理员权限运行的应用发送 `Ctrl+C`；README 已说明。若 Codex 普通权限运行则不受影响。
- Windows PowerShell 的 WinForms 方案仅面向 Windows；这是当前需求范围内的有意约束。
- JSONL 目前没有编辑/删除入口，符合“不要扩大成复杂知识库”的约束；误存条目需退出后手工编辑数据文件。

## Recommended Next Step

用户首次启动后在 Codex 中选一段无敏感信息的测试文字，完整保存并在网页搜索/复制一次；如默认组合与个人软件习惯冲突，退出后只需修改 `config.json`。

