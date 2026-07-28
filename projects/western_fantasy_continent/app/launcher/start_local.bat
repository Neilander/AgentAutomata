@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_local.ps1" %*
if errorlevel 1 (
  echo.
  echo Start Local failed. The error is shown above.
  pause
)
