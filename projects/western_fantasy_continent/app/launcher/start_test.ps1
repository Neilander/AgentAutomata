$repo = Resolve-Path "$PSScriptRoot\..\..\..\.."
$node = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) {
  $node = "node"
}

function Stop-PortProcess($port) {
  $procIds = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  if (-not $procIds) {
    $procIds = netstat -ano |
      Select-String ":$port\s" |
      ForEach-Object { ($_ -split "\s+")[-1] } |
      Sort-Object -Unique
  }
  foreach ($procId in $procIds) {
    Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
  }
}

$env:PORT = "3778"
$env:APP_MODE = "test"
Stop-PortProcess 3778

Start-Process -FilePath $node -ArgumentList "projects\western_fantasy_continent\app\server\server.js" -WorkingDirectory $repo -WindowStyle Hidden
Start-Sleep -Seconds 1
Start-Process "http://localhost:3778/workbench/"
