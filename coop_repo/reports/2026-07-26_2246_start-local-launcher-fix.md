# Agent Handoff: Start Local 启动器修复

- Date: 2026-07-26
- Agent/thread: `/root`
- Scope: 修复双击 `start_local.bat` 后工作台无法访问且没有可见错误的问题
- Status: complete

## User Intent

用户应能直接点击既有 Start Local 启动器，等待本地工作台真正启动后自动打开网页；不应再出现浏览器先打开但 3777 拒绝连接，也不应在失败时把错误藏在后台。

## Completed

- 复现并抓到根因：当前 Windows 环境同时存在大小写不同的 `Path` 与 `PATH`，PowerShell `Start-Process` 构造子进程环境时抛出重复键错误，Node 服务因此根本没有启动。
- `start_local.bat` 不再复制一套脆弱的停止端口、启动服务和固定等待逻辑，改为只委托给 `start_local.ps1`；启动失败时保留命令窗口并显示错误。
- PowerShell 启动器改用 `.NET ProcessStartInfo` 和系统 shell 继承环境，绕过 `Start-Process` 的重复环境变量错误。
- 启动器会解析绝对仓库路径与服务入口，优先使用系统 Node，找不到时再使用 Codex bundled Node 或 PATH 中的 Node。
- 重启前只停止 3777 的监听进程；启动后轮询 `/api/health` 最多 10 秒，健康检查成功才打开工作台。
- 浏览器打开也改用 `.NET ProcessStartInfo`，避免再次触发同一个 `Path`/`PATH` 错误。
- 新增 `-NoBrowser` 诊断参数并从 `.bat` 透传，便于测试完整启动器而不弹浏览器。

## Files Changed

- `projects/western_fantasy_continent/app/launcher/start_local.bat`: 委托 PowerShell、自身保留错误窗口、透传诊断参数。
- `projects/western_fantasy_continent/app/launcher/start_local.ps1`: 稳健进程启动、Node 检测、端口清理、健康轮询和错误反馈。
- `projects/western_fantasy_continent/app/launcher/README.md`: 记录健康检查行为与无浏览器诊断命令。

## Validation

- 直接前台运行 `server.js`: 服务可正常启动，证明问题不在服务器代码。
- 原 PowerShell 子进程方式：稳定复现 `Item has already been added. Key in dictionary: 'Path' Key being added: 'PATH'`。
- `powershell ... start_local.ps1 -NoBrowser`: PASS；退出码 0，`/api/health`、`/workbench/`、`/five_day_guard_raid/` 均为 HTTP 200。
- `cmd /d /c "...start_local.bat -NoBrowser"`: PASS；完整 BAT 入口退出码 0，健康检查和工作台均为 HTTP 200。
- `node --check projects/western_fantasy_continent/app/server/server.js`: PASS。
- `git diff --check -- projects/western_fantasy_continent/app/launcher`: PASS（仅既有 CRLF 提示）。

## Current State

3777 服务当前正在运行，工作台和十五日游戏都可访问。用户之后仍只需双击原来的 `start_local.bat`；无需点击新文件或使用单独启动器。

## Unresolved

- 本轮自动测试使用 `-NoBrowser`，没有替用户弹出真实浏览器窗口；实际默认分支只比已验证路径多一步由 Windows 打开工作台 URL。
- 工作区存在本轮之前的未提交改动，未回退或覆盖。

## Recommended Next Step

用户双击原来的 `start_local.bat` 确认浏览器能自动打开工作台；如果已有页面开着，直接刷新即可，因为 3777 服务当前已经恢复。
