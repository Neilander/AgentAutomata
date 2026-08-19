# Agent Handoff: 划词记录网页修改条目名称

- Date: 2026-08-17
- Agent/thread: `/root`
- Scope: 为本地划词记录网页增加安全的条目名称编辑
- Status: complete

## User Intent

用户需要直接在划词记录工具的本地网页中修改已有条目的名称，不手工编辑JSONL，也不改变条目正文。

## Completed

- 每张条目卡片增加“修改名称”，支持内联输入、保存和取消。
- 编辑时按回车保存、按Esc取消；空名称会在网页和服务端同时拒绝。
- 新增本地重命名接口，按条目ID只更新`name`并写入`updatedAt`，保留`id`、`body`和`createdAt`。
- JSONL更新使用同目录临时文件和备份替换，避免直接覆盖写到一半留下损坏文件。
- 写接口要求工具进程生成的一次性本地令牌；页面先从同源接口取得令牌，缺少令牌的请求返回403。
- 旧条目无需迁移；没有`updatedAt`的记录会在第一次改名时自动补上。
- 自测在正式快捷键被常驻实例占用时自动使用`Ctrl+Alt+F11/F12`，无需关闭正在运行的工具。

## Files Changed

- `tools/codex_quick_capture/QuickCapture.ps1`: 重命名存储、HTTP写接口、本地会话令牌和完整自测。
- `tools/codex_quick_capture/web/index.html`: 条目名称内联编辑和保存反馈。
- `tools/codex_quick_capture/README.md`: 新增改名操作和本地写接口说明。

## Validation

- `powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File .\QuickCapture.ps1 -SelfTest`: PASS。
- 自测覆盖JSONL重命名、正文保留、`updatedAt`、网页API改名、本地会话令牌、无令牌403、首页功能标记和快捷键注册/冲突。
- 网页内嵌JavaScript由Node解析：PASS。
- 自测只使用系统临时目录和随机回环端口，没有读取或修改用户真实`data/entries.jsonl`。

## Current State

退出当前托盘中的旧实例并重新双击`Start.cmd`后，按`Alt+O`打开条目页，每个条目右上角都会显示“修改名称”。正文不可编辑，原创建时间保持不变。

## Unresolved

- 本轮没有加入正文编辑或删除功能，范围只限修改名称。
- 没有自动关闭用户当前正在运行的旧实例；必须手动从托盘退出并重启一次才能加载新的PowerShell服务代码。
- 自动测试覆盖网页接口与脚本语法，没有实际点击浏览器中的按钮做视觉烟测。

## Recommended Next Step

用户重启工具后，随便选择一条非重要记录修改名称，刷新网页确认名称持久化且正文未变。
