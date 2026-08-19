@echo off
cd /d "%~dp0"
start "Codex Quick Capture" "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -WindowStyle Hidden -NoLogo -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0QuickCapture.ps1"
