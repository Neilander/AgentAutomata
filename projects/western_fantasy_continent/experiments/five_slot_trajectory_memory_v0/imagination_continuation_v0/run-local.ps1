$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$MemoryRoot = (Resolve-Path (Join-Path $Here "..")).Path
$Python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$env:PYTHONPATH = $MemoryRoot + ";" + $Here

& $Python (Join-Path $Here "run_demo.py")
exit $LASTEXITCODE
