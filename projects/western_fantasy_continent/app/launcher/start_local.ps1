$repo = Resolve-Path "$PSScriptRoot\..\..\..\.."
$node = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) {
  $node = "node"
}

$env:PORT = "3778"
$procIds = Get-NetTCPConnection -LocalPort 3778 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $procIds) {
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Start-Process -FilePath $node -ArgumentList "projects\western_fantasy_continent\app\server\server.js" -WorkingDirectory $repo -WindowStyle Hidden
Start-Sleep -Seconds 1
Start-Process "http://localhost:3778/workbench/"
