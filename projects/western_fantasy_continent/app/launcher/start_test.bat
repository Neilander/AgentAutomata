@echo off
setlocal
cd /d "%~dp0..\..\..\.."
set NODE_EXE=C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
if not exist "%NODE_EXE%" set NODE_EXE=node
set PORT=3778
set APP_MODE=test
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ids = Get-NetTCPConnection -LocalPort 3778 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if(-not $ids){ $ids = netstat -ano | Select-String ':3778\s' | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique }; foreach ($id in $ids) { Stop-Process -Id ([int]$id) -Force -ErrorAction SilentlyContinue }"
start "Western Fantasy Test Server" "%NODE_EXE%" "projects\western_fantasy_continent\app\server\server.js"
timeout /t 1 >nul
start "" "http://localhost:3778/workbench/"
