$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$env:PYTHONPATH = $Here

& $Python (Join-Path $Here "run_experiment.py")
exit $LASTEXITCODE
