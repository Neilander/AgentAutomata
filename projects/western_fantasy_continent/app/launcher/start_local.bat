@echo off
setlocal
cd /d "%~dp0..\..\..\.."
set NODE_EXE=C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
if not exist "%NODE_EXE%" set NODE_EXE=node
set PORT=3778
powershell -NoProfile -ExecutionPolicy Bypass -Command "$procIds = Get-NetTCPConnection -LocalPort 3778 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $procIds) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }"
start "Western Fantasy Server" "%NODE_EXE%" "projects\western_fantasy_continent\app\server\server.js"
timeout /t 1 >nul
start "" "http://localhost:3778/workbench/"
