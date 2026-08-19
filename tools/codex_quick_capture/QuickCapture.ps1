[CmdletBinding()]
param(
    [switch]$SelfTest
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public sealed class QuickCaptureHotKeyEventArgs : EventArgs
{
    public int Id { get; private set; }
    public QuickCaptureHotKeyEventArgs(int id) { Id = id; }
}

public sealed class QuickCaptureHotKeyWindow : NativeWindow, IDisposable
{
    public event EventHandler<QuickCaptureHotKeyEventArgs> HotKeyPressed;

    public QuickCaptureHotKeyWindow()
    {
        CreateHandle(new CreateParams());
    }

    protected override void WndProc(ref Message message)
    {
        const int WM_HOTKEY = 0x0312;
        if (message.Msg == WM_HOTKEY && HotKeyPressed != null)
            HotKeyPressed(this, new QuickCaptureHotKeyEventArgs(message.WParam.ToInt32()));
        base.WndProc(ref message);
    }

    public void Dispose()
    {
        DestroyHandle();
    }
}

public static class QuickCaptureNativeMethods
{
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint modifiers, uint virtualKey);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    [DllImport("user32.dll")]
    public static extern uint GetClipboardSequenceNumber();

    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int virtualKey);
}
'@

$script:AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:DataFile = Join-Path $script:AppRoot 'data\entries.jsonl'
$script:WebFile = Join-Path $script:AppRoot 'web\index.html'
$script:CsrfToken = [Guid]::NewGuid().ToString('N')
$script:ConfigFile = Join-Path $script:AppRoot 'config.json'
$script:Listener = $null
$script:HotKeyWindow = $null
$script:CaptureFormOpen = $false
$script:RegisteredHotKeyIds = @()
$script:NotifyIcon = $null

function Read-AppConfig {
    if (-not (Test-Path -LiteralPath $script:ConfigFile)) {
        throw "找不到配置文件：$($script:ConfigFile)"
    }
    $config = Get-Content -LiteralPath $script:ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $config.captureHotkey -or -not $config.browseHotkey) {
        throw 'config.json 必须包含 captureHotkey 和 browseHotkey。'
    }
    $port = [int]$config.port
    if ($port -lt 1024 -or $port -gt 65535) {
        throw 'config.json 的 port 必须在 1024 到 65535 之间。'
    }
    return $config
}

function ConvertTo-HotKeySpec {
    param([Parameter(Mandatory = $true)][string]$Text)

    $modifiers = [uint32]0
    $keyToken = $null
    foreach ($rawToken in ($Text -split '\+')) {
        $token = $rawToken.Trim()
        switch -Regex ($token) {
            '^(Ctrl|Control)$' { $modifiers = $modifiers -bor 0x0002; continue }
            '^Alt$'            { $modifiers = $modifiers -bor 0x0001; continue }
            '^Shift$'          { $modifiers = $modifiers -bor 0x0004; continue }
            '^(Win|Windows)$'  { $modifiers = $modifiers -bor 0x0008; continue }
            default {
                if ($keyToken) { throw "快捷键只能包含一个普通键：$Text" }
                $keyToken = $token
            }
        }
    }
    if (-not $keyToken -or $modifiers -eq 0) {
        throw "快捷键必须包含修饰键和普通键：$Text"
    }
    try {
        $key = [System.Windows.Forms.Keys]([System.Enum]::Parse([System.Windows.Forms.Keys], $keyToken, $true))
    }
    catch {
        throw "无法识别快捷键中的按键 '$keyToken'：$Text"
    }
    return [pscustomobject]@{ Modifiers = $modifiers; Key = [uint32]$key; Display = $Text }
}

function Add-Entry {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Body
    )

    $dataDirectory = Split-Path -Parent $script:DataFile
    [System.IO.Directory]::CreateDirectory($dataDirectory) | Out-Null
    $entry = [ordered]@{
        id = [Guid]::NewGuid().ToString('N')
        name = $Name.Trim()
        body = $Body
        createdAt = [DateTimeOffset]::Now.ToString('o')
    }
    if ([string]::IsNullOrWhiteSpace($entry.name)) {
        throw '条目名称不能为空。'
    }
    $line = ($entry | ConvertTo-Json -Compress) + [Environment]::NewLine
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::AppendAllText($script:DataFile, $line, $utf8NoBom)
    return [pscustomobject]$entry
}

function Get-Entries {
    $result = New-Object System.Collections.Generic.List[object]
    if (-not (Test-Path -LiteralPath $script:DataFile)) { return @() }
    foreach ($line in [System.IO.File]::ReadLines($script:DataFile, [Text.Encoding]::UTF8)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $result.Add(($line | ConvertFrom-Json)) }
        catch { Write-Warning "跳过无法解析的条目数据行：$($_.Exception.Message)" }
    }
    return @($result | Sort-Object createdAt -Descending)
}

function Rename-Entry {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $trimmedId = $Id.Trim()
    $trimmedName = $Name.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmedId)) { throw '条目ID不能为空。' }
    if ([string]::IsNullOrWhiteSpace($trimmedName)) { throw '条目名称不能为空。' }
    if (-not (Test-Path -LiteralPath $script:DataFile)) { throw '找不到条目。' }

    $entries = @(Get-Entries)
    $entry = @($entries | Where-Object { $_.id -eq $trimmedId }) | Select-Object -First 1
    if (-not $entry) { throw '找不到条目。' }

    $entry.name = $trimmedName
    $updatedAt = [DateTimeOffset]::Now.ToString('o')
    if ($entry.PSObject.Properties['updatedAt']) { $entry.updatedAt = $updatedAt }
    else { $entry | Add-Member -NotePropertyName updatedAt -NotePropertyValue $updatedAt }

    $lines = @($entries | ForEach-Object { $_ | ConvertTo-Json -Compress })
    $content = if ($lines.Count) { ($lines -join [Environment]::NewLine) + [Environment]::NewLine } else { '' }
    $temporary = "$($script:DataFile).tmp-$([Guid]::NewGuid().ToString('N'))"
    $backup = "$($script:DataFile).bak-$([Guid]::NewGuid().ToString('N'))"
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    try {
        [System.IO.File]::WriteAllText($temporary, $content, $utf8NoBom)
        [System.IO.File]::Replace($temporary, $script:DataFile, $backup)
    }
    finally {
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
        if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
    }
    return $entry
}

function ConvertFrom-UrlEncoded {
    param([string]$Value)
    if ($null -eq $Value) { return '' }
    return [Uri]::UnescapeDataString($Value.Replace('+', ' '))
}

function Get-QueryParameters {
    param([string]$RequestTarget)
    $result = @{}
    $separator = $RequestTarget.IndexOf('?')
    if ($separator -lt 0 -or $separator -eq ($RequestTarget.Length - 1)) { return $result }
    foreach ($pair in $RequestTarget.Substring($separator + 1).Split('&')) {
        if (-not $pair) { continue }
        $equals = $pair.IndexOf('=')
        $rawKey = if ($equals -ge 0) { $pair.Substring(0, $equals) } else { $pair }
        $rawValue = if ($equals -ge 0) { $pair.Substring($equals + 1) } else { '' }
        $key = ConvertFrom-UrlEncoded $rawKey
        $value = ConvertFrom-UrlEncoded $rawValue
        $result[$key] = $value
    }
    return $result
}

function Send-HttpResponse {
    param(
        [Parameter(Mandatory = $true)]$Stream,
        [Parameter(Mandatory = $true)][int]$StatusCode,
        [Parameter(Mandatory = $true)][string]$ContentType,
        [Parameter(Mandatory = $true)][byte[]]$Body
    )
    $statusText = switch ($StatusCode) {
        200 { 'OK' }
        400 { 'Bad Request' }
        403 { 'Forbidden' }
        404 { 'Not Found' }
        405 { 'Method Not Allowed' }
        default { 'Error' }
    }
    $header = "HTTP/1.1 $StatusCode $statusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    $Stream.Write($Body, 0, $Body.Length)
    $Stream.Flush()
}

function Invoke-PendingHttpRequests {
    if (-not $script:Listener) { return }
    while ($script:Listener.Pending()) {
        $client = $null
        try {
            $client = $script:Listener.AcceptTcpClient()
            $client.ReceiveTimeout = 1500
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            $headers = @{}
            while ($true) {
                $headerLine = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($headerLine)) { break }
                $colon = $headerLine.IndexOf(':')
                if ($colon -gt 0) {
                    $headers[$headerLine.Substring(0, $colon).Trim().ToLowerInvariant()] = $headerLine.Substring($colon + 1).Trim()
                }
            }
            $method = 'GET'
            $requestTarget = '/'
            if ($requestLine -match '^([A-Z]+)\s+([^\s]+)\s+HTTP/') {
                $method = $Matches[1]
                $requestTarget = $Matches[2]
            }
            $path = $requestTarget.Split('?')[0]

            if ($method -eq 'GET' -and $path -eq '/api/entries') {
                $json = ConvertTo-Json -InputObject @(Get-Entries) -Depth 5 -Compress
                if (-not $json) { $json = '[]' }
                $body = [Text.Encoding]::UTF8.GetBytes($json)
                Send-HttpResponse -Stream $stream -StatusCode 200 -ContentType 'application/json; charset=utf-8' -Body $body
            }
            elseif ($method -eq 'GET' -and $path -eq '/api/session') {
                $json = @{ token = $script:CsrfToken } | ConvertTo-Json -Compress
                $body = [Text.Encoding]::UTF8.GetBytes($json)
                Send-HttpResponse -Stream $stream -StatusCode 200 -ContentType 'application/json; charset=utf-8' -Body $body
            }
            elseif ($method -eq 'POST' -and $path -eq '/api/entries/rename') {
                if ($headers['x-quick-capture-token'] -ne $script:CsrfToken) {
                    $body = [Text.Encoding]::UTF8.GetBytes('{"error":"invalid local session"}')
                    Send-HttpResponse -Stream $stream -StatusCode 403 -ContentType 'application/json; charset=utf-8' -Body $body
                }
                else {
                    try {
                        $query = Get-QueryParameters $requestTarget
                        $renamed = Rename-Entry -Id ([string]$query['id']) -Name ([string]$query['name'])
                        $json = $renamed | ConvertTo-Json -Depth 5 -Compress
                        $body = [Text.Encoding]::UTF8.GetBytes($json)
                        Send-HttpResponse -Stream $stream -StatusCode 200 -ContentType 'application/json; charset=utf-8' -Body $body
                    }
                    catch {
                        $json = @{ error = $_.Exception.Message } | ConvertTo-Json -Compress
                        $body = [Text.Encoding]::UTF8.GetBytes($json)
                        Send-HttpResponse -Stream $stream -StatusCode 400 -ContentType 'application/json; charset=utf-8' -Body $body
                    }
                }
            }
            elseif ($method -eq 'GET' -and ($path -eq '/' -or $path -eq '/index.html')) {
                $body = [System.IO.File]::ReadAllBytes($script:WebFile)
                Send-HttpResponse -Stream $stream -StatusCode 200 -ContentType 'text/html; charset=utf-8' -Body $body
            }
            else {
                $body = [Text.Encoding]::UTF8.GetBytes('Not found')
                Send-HttpResponse -Stream $stream -StatusCode 404 -ContentType 'text/plain; charset=utf-8' -Body $body
            }
        }
        catch {
            Write-Warning "处理本地网页请求失败：$($_.Exception.Message)"
        }
        finally {
            if ($client) { $client.Close() }
        }
    }
}

function Start-LocalServer {
    param([Parameter(Mandatory = $true)][int]$Port)
    if (-not (Test-Path -LiteralPath $script:WebFile)) { throw "找不到网页文件：$($script:WebFile)" }
    $script:Listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Port)
    $script:Listener.Start()
}

function Open-EntryPage {
    param([Parameter(Mandatory = $true)][int]$Port)
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = "http://127.0.0.1:$Port/"
    $info.UseShellExecute = $true
    [Diagnostics.Process]::Start($info) | Out-Null
}

function Show-Notification {
    param([string]$Title, [string]$Message, [System.Windows.Forms.ToolTipIcon]$Icon = [System.Windows.Forms.ToolTipIcon]::Info)
    if ($script:NotifyIcon) { $script:NotifyIcon.ShowBalloonTip(2500, $Title, $Message, $Icon) }
}

function Get-SelectedText {
    # WM_HOTKEY arrives while the user may still be holding Ctrl/Shift/Alt/Win.
    # Wait briefly for release so the synthetic Ctrl+C does not become Ctrl+Shift+C.
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        $modifierDown = $false
        foreach ($virtualKey in @(0x10, 0x11, 0x12, 0x5B, 0x5C)) {
            if (([QuickCaptureNativeMethods]::GetAsyncKeyState($virtualKey) -band 0x8000) -ne 0) {
                $modifierDown = $true
                break
            }
        }
        if (-not $modifierDown) { break }
        Start-Sleep -Milliseconds 20
    }
    $sequence = [QuickCaptureNativeMethods]::GetClipboardSequenceNumber()
    [System.Windows.Forms.SendKeys]::SendWait('^c')
    for ($attempt = 0; $attempt -lt 16; $attempt++) {
        Start-Sleep -Milliseconds 25
        if ([QuickCaptureNativeMethods]::GetClipboardSequenceNumber() -ne $sequence) { break }
    }
    if ([QuickCaptureNativeMethods]::GetClipboardSequenceNumber() -eq $sequence) { return $null }
    try {
        if ([Windows.Forms.Clipboard]::ContainsText()) { return [Windows.Forms.Clipboard]::GetText() }
    }
    catch { return $null }
    return $null
}

function Show-CaptureWindow {
    param([Parameter(Mandatory = $true)][string]$SelectedText)
    if ($script:CaptureFormOpen) {
        Show-Notification '快速记录' '创建窗口已经打开。'
        return
    }
    $script:CaptureFormOpen = $true

    $form = New-Object Windows.Forms.Form
    $form.Text = '创建快速条目'
    $form.Size = New-Object Drawing.Size(570, 410)
    $form.MinimumSize = New-Object Drawing.Size(500, 340)
    $form.StartPosition = 'Manual'
    $form.TopMost = $true
    $form.ShowInTaskbar = $true
    $form.Font = New-Object Drawing.Font('Microsoft YaHei UI', 9)

    $workingArea = [Windows.Forms.Screen]::FromPoint([Windows.Forms.Cursor]::Position).WorkingArea
    $left = [Math]::Min([Math]::Max($workingArea.Left, [Windows.Forms.Cursor]::Position.X - 285), $workingArea.Right - $form.Width)
    $top = [Math]::Min([Math]::Max($workingArea.Top, [Windows.Forms.Cursor]::Position.Y - 80), $workingArea.Bottom - $form.Height)
    $form.Location = New-Object Drawing.Point($left, $top)

    $nameLabel = New-Object Windows.Forms.Label
    $nameLabel.Text = '条目名称'
    $nameLabel.AutoSize = $true
    $nameLabel.Location = New-Object Drawing.Point(18, 18)

    $nameBox = New-Object Windows.Forms.TextBox
    $nameBox.Location = New-Object Drawing.Point(18, 43)
    $nameBox.Size = New-Object Drawing.Size(518, 30)
    $nameBox.Anchor = 'Top,Left,Right'

    $previewLabel = New-Object Windows.Forms.Label
    $previewLabel.Text = '划选内容（只读）'
    $previewLabel.AutoSize = $true
    $previewLabel.Location = New-Object Drawing.Point(18, 86)

    $preview = New-Object Windows.Forms.RichTextBox
    $preview.Location = New-Object Drawing.Point(18, 111)
    $preview.Size = New-Object Drawing.Size(518, 205)
    $preview.Anchor = 'Top,Bottom,Left,Right'
    $preview.ReadOnly = $true
    $preview.BackColor = [Drawing.Color]::FromArgb(247, 248, 250)
    $preview.Text = $SelectedText

    $cancel = New-Object Windows.Forms.Button
    $cancel.Text = '取消'
    $cancel.Size = New-Object Drawing.Size(82, 31)
    $cancel.Location = New-Object Drawing.Point(364, 329)
    $cancel.Anchor = 'Bottom,Right'
    $cancel.DialogResult = [Windows.Forms.DialogResult]::Cancel

    $save = New-Object Windows.Forms.Button
    $save.Text = '保存'
    $save.Size = New-Object Drawing.Size(82, 31)
    $save.Location = New-Object Drawing.Point(454, 329)
    $save.Anchor = 'Bottom,Right'
    $save.Add_Click({
        if ([string]::IsNullOrWhiteSpace($nameBox.Text)) {
            [Windows.Forms.MessageBox]::Show($form, '请填写条目名称。', '快速记录', 'OK', 'Information') | Out-Null
            $nameBox.Focus()
            return
        }
        try {
            Add-Entry -Name $nameBox.Text -Body $SelectedText | Out-Null
            Show-Notification '已保存' $nameBox.Text
            $form.DialogResult = [Windows.Forms.DialogResult]::OK
            $form.Close()
        }
        catch {
            [Windows.Forms.MessageBox]::Show($form, "保存失败：$($_.Exception.Message)", '快速记录', 'OK', 'Error') | Out-Null
        }
    })

    $form.AcceptButton = $save
    $form.CancelButton = $cancel
    $form.Controls.AddRange(@($nameLabel, $nameBox, $previewLabel, $preview, $cancel, $save))
    $form.Add_Shown({ $form.Activate(); $nameBox.Focus() })
    try { $form.ShowDialog() | Out-Null }
    finally { $form.Dispose(); $script:CaptureFormOpen = $false }
}

function Register-AppHotKey {
    param([int]$Id, $Spec)
    $ok = [QuickCaptureNativeMethods]::RegisterHotKey($script:HotKeyWindow.Handle, $Id, $Spec.Modifiers, $Spec.Key)
    if ($ok) { $script:RegisteredHotKeyIds += $Id }
    return $ok
}

function Stop-AppResources {
    foreach ($id in $script:RegisteredHotKeyIds) {
        [QuickCaptureNativeMethods]::UnregisterHotKey($script:HotKeyWindow.Handle, $id) | Out-Null
    }
    $script:RegisteredHotKeyIds = @()
    if ($script:Listener) { $script:Listener.Stop(); $script:Listener = $null }
    if ($script:HotKeyWindow) { $script:HotKeyWindow.Dispose(); $script:HotKeyWindow = $null }
    if ($script:NotifyIcon) { $script:NotifyIcon.Visible = $false; $script:NotifyIcon.Dispose(); $script:NotifyIcon = $null }
}

function Invoke-SelfTest {
    $originalDataFile = $script:DataFile
    $testRoot = Join-Path ([IO.Path]::GetTempPath()) ('codex-quick-capture-' + [Guid]::NewGuid().ToString('N'))
    [IO.Directory]::CreateDirectory($testRoot) | Out-Null
    $script:DataFile = Join-Path $testRoot 'entries.jsonl'
    $port = 21000 + (Get-Random -Minimum 0 -Maximum 10000)
    try {
        $saved = Add-Entry -Name '自测条目' -Body "第一行`n第二行"
        $entries = @(Get-Entries)
        if ($entries.Count -ne 1 -or $entries[0].name -ne '自测条目' -or $entries[0].body -notmatch '第二行') {
            throw '存储往返校验失败。'
        }
        Rename-Entry -Id $saved.id -Name '改名后的条目' | Out-Null
        $renamedEntries = @(Get-Entries)
        if ($renamedEntries[0].name -ne '改名后的条目' -or $renamedEntries[0].body -notmatch '第二行' -or -not $renamedEntries[0].updatedAt) {
            throw '条目重命名没有保留正文或写入更新时间。'
        }

        Start-LocalServer -Port $port
        $request = [Net.WebRequest]::Create("http://127.0.0.1:$port/api/entries")
        $pending = $request.BeginGetResponse($null, $null)
        while (-not $pending.IsCompleted) { Invoke-PendingHttpRequests; Start-Sleep -Milliseconds 10 }
        $response = $request.EndGetResponse($pending)
        $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
        $apiText = $reader.ReadToEnd()
        $reader.Dispose(); $response.Dispose()
        $apiEntries = @($apiText | ConvertFrom-Json)
        if (-not $apiText.TrimStart().StartsWith('[')) { throw '只有一个条目时，本地网页 API 没有返回 JSON 数组。' }
        if ($apiEntries.Count -ne 1 -or $apiEntries[0].id -ne $saved.id) { throw '本地网页 API 校验失败。' }

        $request = [Net.WebRequest]::Create("http://127.0.0.1:$port/api/session")
        $pending = $request.BeginGetResponse($null, $null)
        while (-not $pending.IsCompleted) { Invoke-PendingHttpRequests; Start-Sleep -Milliseconds 10 }
        $response = $request.EndGetResponse($pending)
        $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
        $sessionText = $reader.ReadToEnd()
        $reader.Dispose(); $response.Dispose()
        if (($sessionText | ConvertFrom-Json).token -ne $script:CsrfToken) { throw '网页本地会话令牌校验失败。' }

        $request = [Net.WebRequest]::Create("http://127.0.0.1:$port/api/entries/rename?id=$($saved.id)&name=unauthorized")
        $request.Method = 'POST'
        $request.ContentLength = 0
        $pending = $request.BeginGetResponse($null, $null)
        while (-not $pending.IsCompleted) { Invoke-PendingHttpRequests; Start-Sleep -Milliseconds 10 }
        $unauthorizedRejected = $false
        try { $response = $request.EndGetResponse($pending); $response.Dispose() }
        catch [Net.WebException] {
            $unauthorizedRejected = $_.Exception.Response.StatusCode.value__ -eq 403
            $_.Exception.Response.Dispose()
        }
        if (-not $unauthorizedRejected) { throw '缺少本地会话令牌的重命名请求没有被拒绝。' }

        $newName = '网页接口改名'
        $renameUrl = "http://127.0.0.1:$port/api/entries/rename?id=$([Uri]::EscapeDataString($saved.id))&name=$([Uri]::EscapeDataString($newName))"
        $request = [Net.WebRequest]::Create($renameUrl)
        $request.Method = 'POST'
        $request.ContentLength = 0
        $request.Headers.Add('X-Quick-Capture-Token', $script:CsrfToken)
        $pending = $request.BeginGetResponse($null, $null)
        while (-not $pending.IsCompleted) { Invoke-PendingHttpRequests; Start-Sleep -Milliseconds 10 }
        try { $response = $request.EndGetResponse($pending) }
        catch [Net.WebException] {
            $errorResponse = $_.Exception.Response
            if ($errorResponse) {
                $errorReader = New-Object IO.StreamReader($errorResponse.GetResponseStream(), [Text.Encoding]::UTF8)
                $errorText = $errorReader.ReadToEnd()
                $errorReader.Dispose(); $errorResponse.Dispose()
                throw "网页重命名接口返回错误：$errorText"
            }
            throw
        }
        $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
        $renameText = $reader.ReadToEnd()
        $reader.Dispose(); $response.Dispose()
        $renamedFromApi = $renameText | ConvertFrom-Json
        if ($renamedFromApi.name -ne $newName -or @(Get-Entries)[0].name -ne $newName) { throw '网页重命名接口校验失败。' }

        $request = [Net.WebRequest]::Create("http://127.0.0.1:$port/")
        $pending = $request.BeginGetResponse($null, $null)
        while (-not $pending.IsCompleted) { Invoke-PendingHttpRequests; Start-Sleep -Milliseconds 10 }
        $response = $request.EndGetResponse($pending)
        $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
        $pageText = $reader.ReadToEnd()
        $reader.Dispose(); $response.Dispose()
        if ($pageText -notmatch 'id="search"' -or $pageText -notmatch '复制正文' -or $pageText -notmatch '修改名称') { throw '条目页的搜索、复制或重命名功能缺失。' }

        $script:HotKeyWindow = New-Object QuickCaptureHotKeyWindow
        $config = Read-AppConfig
        $first = ConvertTo-HotKeySpec $config.captureHotkey
        $second = ConvertTo-HotKeySpec $config.browseHotkey
        $firstRegistered = Register-AppHotKey -Id 91 -Spec $first
        $secondRegistered = if ($firstRegistered) { Register-AppHotKey -Id 92 -Spec $second } else { $false }
        if (-not ($firstRegistered -and $secondRegistered)) {
            if ($firstRegistered) {
                [QuickCaptureNativeMethods]::UnregisterHotKey($script:HotKeyWindow.Handle, 91) | Out-Null
                $script:RegisteredHotKeyIds = @($script:RegisteredHotKeyIds | Where-Object { $_ -ne 91 })
            }
            if ($secondRegistered) {
                [QuickCaptureNativeMethods]::UnregisterHotKey($script:HotKeyWindow.Handle, 92) | Out-Null
                $script:RegisteredHotKeyIds = @($script:RegisteredHotKeyIds | Where-Object { $_ -ne 92 })
            }
            $first = ConvertTo-HotKeySpec 'Ctrl+Alt+F11'
            $second = ConvertTo-HotKeySpec 'Ctrl+Alt+F12'
            if (-not (Register-AppHotKey -Id 91 -Spec $first)) { throw '自测备用记录快捷键 Ctrl+Alt+F11 注册失败。' }
            if (-not (Register-AppHotKey -Id 92 -Spec $second)) { throw '自测备用查看快捷键 Ctrl+Alt+F12 注册失败。' }
            Write-Host 'INFO hotkeys: 正式快捷键正被运行实例或其他程序占用，改用自测备用键。'
        }
        $conflictAccepted = [QuickCaptureNativeMethods]::RegisterHotKey($script:HotKeyWindow.Handle, 93, $first.Modifiers, $first.Key)
        if ($conflictAccepted) {
            [QuickCaptureNativeMethods]::UnregisterHotKey($script:HotKeyWindow.Handle, 93) | Out-Null
            throw '系统未按预期拒绝重复快捷键，冲突校验失败。'
        }

        Write-Host 'PASS storage: JSONL 写入、重命名与正文保留'
        Write-Host 'PASS web: 首页、搜索/复制/重命名与本地 API'
        Write-Host "PASS hotkeys: $($first.Display) / $($second.Display)，重复注册被拒绝"
        Write-Host "SELFTEST PASS (port $port)"
    }
    finally {
        Stop-AppResources
        $script:DataFile = $originalDataFile
        if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
    }
}

function Start-App {
    $config = Read-AppConfig
    $captureSpec = ConvertTo-HotKeySpec $config.captureHotkey
    $browseSpec = ConvertTo-HotKeySpec $config.browseHotkey

    $createdNew = $false
    $mutex = New-Object Threading.Mutex($true, 'Local\CodexQuickCapture', [ref]$createdNew)
    if (-not $createdNew) {
        [Windows.Forms.MessageBox]::Show('快速记录工具已经在运行。', '快速记录', 'OK', 'Information') | Out-Null
        $mutex.Dispose()
        return
    }

    try {
        Start-LocalServer -Port ([int]$config.port)
        $script:HotKeyWindow = New-Object QuickCaptureHotKeyWindow

        $script:NotifyIcon = New-Object Windows.Forms.NotifyIcon
        $script:NotifyIcon.Icon = [Drawing.SystemIcons]::Information
        $script:NotifyIcon.Text = '划词快速记录'
        $script:NotifyIcon.Visible = $true

        $menu = New-Object Windows.Forms.ContextMenuStrip
        $createItem = $menu.Items.Add('从剪贴板创建条目')
        $browseItem = $menu.Items.Add("查看条目（$($config.browseHotkey)）")
        $menu.Items.Add('-') | Out-Null
        $exitItem = $menu.Items.Add('退出')
        $script:NotifyIcon.ContextMenuStrip = $menu

        $captureAction = {
            $text = Get-SelectedText
            if ([string]::IsNullOrWhiteSpace($text)) {
                Show-Notification '没有读取到文字' '请先在任意应用中划选文字，再按记录快捷键。' ([Windows.Forms.ToolTipIcon]::Warning)
                return
            }
            Show-CaptureWindow -SelectedText $text
        }
        $createItem.Add_Click({
            $clipboardText = $null
            try {
                if ([Windows.Forms.Clipboard]::ContainsText()) { $clipboardText = [Windows.Forms.Clipboard]::GetText() }
            }
            catch { }
            if ([string]::IsNullOrWhiteSpace($clipboardText)) {
                Show-Notification '剪贴板没有文字' '请先复制一段文字。' ([Windows.Forms.ToolTipIcon]::Warning)
            }
            else { Show-CaptureWindow -SelectedText $clipboardText }
        })
        $browseItem.Add_Click({ Open-EntryPage -Port ([int]$config.port) })
        $script:NotifyIcon.Add_DoubleClick({ Open-EntryPage -Port ([int]$config.port) })
        $exitItem.Add_Click({ [Windows.Forms.Application]::Exit() })

        $captureOk = Register-AppHotKey -Id 1 -Spec $captureSpec
        $browseOk = Register-AppHotKey -Id 2 -Spec $browseSpec
        if (-not $captureOk -or -not $browseOk) {
            $failed = @()
            if (-not $captureOk) { $failed += $config.captureHotkey }
            if (-not $browseOk) { $failed += $config.browseHotkey }
            [Windows.Forms.MessageBox]::Show("以下快捷键注册失败，可能已被占用：`n$($failed -join ', ')`n`n请退出工具，修改 config.json 后重试。", '快捷键冲突', 'OK', 'Warning') | Out-Null
        }

        $script:HotKeyWindow.add_HotKeyPressed({
            param($sender, $eventArgs)
            if ($eventArgs.Id -eq 1) { & $captureAction }
            elseif ($eventArgs.Id -eq 2) { Open-EntryPage -Port ([int]$config.port) }
        })

        $timer = New-Object Windows.Forms.Timer
        $timer.Interval = 100
        $timer.Add_Tick({ Invoke-PendingHttpRequests })
        $timer.Start()
        Show-Notification '划词快速记录已启动' "记录：$($config.captureHotkey)；查看：$($config.browseHotkey)"
        [Windows.Forms.Application]::Run()
        $timer.Stop(); $timer.Dispose()
    }
    finally {
        Stop-AppResources
        if ($createdNew) { $mutex.ReleaseMutex() | Out-Null }
        $mutex.Dispose()
    }
}

try {
    if ($SelfTest) { Invoke-SelfTest }
    else { Start-App }
}
catch {
    if ($SelfTest) { Write-Error $_; exit 1 }
    [Windows.Forms.MessageBox]::Show("启动失败：`n$($_.Exception.Message)", '划词快速记录', 'OK', 'Error') | Out-Null
    Stop-AppResources
    exit 1
}
