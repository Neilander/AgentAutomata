$ErrorActionPreference = "Stop"

$python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
& $python "$PSScriptRoot\run_validation.py"

