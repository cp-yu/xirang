param([switch]$SmokeTest)

$ErrorActionPreference = 'Stop'
$startedAt = Get-Date
$artifactRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
$probeDir = Join-Path $artifactRoot 'xirang-windows-startup'
New-Item -ItemType Directory -Path $probeDir -Force | Out-Null
$log = Join-Path $probeDir 'probe.log'
Set-Content -LiteralPath $log -Value '' -Encoding UTF8

function Write-Probe([string]$Message) {
    $line = '[{0:O}] {1}' -f (Get-Date).ToUniversalTime(), $Message
    Write-Host $line
    Add-Content -LiteralPath $log -Value $line -Encoding UTF8
}

function Invoke-Child([string]$Label, [string]$Exe, [string]$Arguments, [int]$TimeoutMs) {
    Write-Probe "start $Label exe=$Exe"
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $info = New-Object Diagnostics.ProcessStartInfo($Exe, $Arguments)
    $info.WorkingDirectory = $PWD.ProviderPath
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardInput = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.StandardOutputEncoding = [Text.Encoding]::UTF8
    $info.StandardErrorEncoding = [Text.Encoding]::UTF8
    $p = New-Object Diagnostics.Process
    $p.StartInfo = $info
    try {
        [void]$p.Start()
        $p.StandardInput.Close()
        $out = $p.StandardOutput.ReadToEndAsync()
        $err = $p.StandardError.ReadToEndAsync()
        if (!$p.WaitForExit($TimeoutMs)) {
            $p.Kill()
            Write-Probe "timeout $Label pid=$($p.Id) elapsedMs=$($timer.ElapsedMilliseconds)"
            return 124
        }
        foreach ($stream in @($out, $err)) {
            if ($stream.Wait(2000)) {
                if ($stream.Result) { Write-Host $stream.Result }
            } else { Write-Probe "$Label output pipe did not close" }
        }
        Write-Probe ('exit {0} pid={1} signed={2} ntstatus=0x{2:X8} elapsedMs={3}' -f $Label, $p.Id, $p.ExitCode, $timer.ElapsedMilliseconds)
        return $p.ExitCode
    } catch {
        Write-Probe "spawn/error ${Label}: $($_.Exception.GetBaseException().Message)"
        return 125
    } finally {
        $p.Dispose()
    }
}

function Write-HostState([string]$Phase) {
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $session = [Diagnostics.Process]::GetCurrentProcess().SessionId
        $counts = (Get-Process | Group-Object SessionId | ForEach-Object { '{0}:{1}' -f $_.Name,$_.Count }) -join ','
        Write-Probe "$Phase os=$($os.Caption) build=$($os.BuildNumber) session=$session processesBySession=$counts freePhysicalKiB=$($os.FreePhysicalMemory) freeVirtualKiB=$($os.FreeVirtualMemory)"
    } catch { Write-Probe "$Phase host-state unavailable: $($_.FullyQualifiedErrorId)" }
}

function Write-FailureEvents {
    $filters = @(
        @{LogName='Application'; Id=1000,1001,1026; StartTime=$startedAt},
        @{LogName='System'; Id=2004,243; StartTime=$startedAt},
        @{LogName='Microsoft-Windows-Win32k/Operational'; Id=243; StartTime=$startedAt}
    )
    foreach ($filter in $filters) {
        try {
            $events = Get-WinEvent -FilterHashtable $filter -ErrorAction Stop | Where-Object {
                $_.LogName -ne 'Application' -or $_.Message -match '(?i)0xc0000142|(?:pwsh|powershell|cmd|node|turbo|conhost)\.exe'
            }
            foreach ($event in $events) {
                $message = $event.Message -replace '[\r\n]+', ' '
                Write-Probe "event $($event.TimeCreated.ToUniversalTime().ToString('O')) $($event.LogName)/$($event.ProviderName)/$($event.Id): $message"
            }
            Write-Probe "event scan $($filter.LogName): $(@($events).Count) matches"
        } catch { Write-Probe "event scan $($filter.LogName): $($_.FullyQualifiedErrorId)" }
    }
}

if ($SmokeTest) { Set-Location -LiteralPath $env:WINDIR }
$pwsh = (Get-Command pwsh.exe).Source
$cmd = (Get-Command cmd.exe).Source
$node = (Get-Command node.exe).Source
Write-Probe "image=$env:ImageOS imageVersion=$env:ImageVersion supervisor=$($PSVersionTable.PSVersion) cwd=$($PWD.ProviderPath)"
Write-HostState before
foreach ($tool in @($pwsh, $cmd, $node)) {
    $arg = switch ($tool) { $pwsh {'-NoProfile -NonInteractive -Command exit 0'} $cmd {'/d /c exit 0'} $node {'-e "process.exit(0)"'} }
    if ((Invoke-Child preflight $tool $arg 5000) -ne 0) { Write-FailureEvents; exit 1 }
}

$phases = if ($SmokeTest) {
    @{Name='smoke'; Commands=@('exit 37')}
} else {
    @{Name='vendor'; Commands=@('pnpm run likec4:typecheck', 'pnpm run likec4:build')},
    @{Name='root'; Commands=@('pnpm run lint', 'pnpm run build', 'pnpm test')}
}
foreach ($phase in $phases) {
    $scriptPath = Join-Path $probeDir "$($phase.Name).ps1"
    $body = @('$ErrorActionPreference = "stop"') + @($phase.Commands | ForEach-Object {
        "Write-Host 'begin $_'"; $_; 'if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }'
    })
    Set-Content -LiteralPath $scriptPath -Value $body -Encoding UTF8
    $arg = '-command ". ''{0}''; if (Test-Path variable:LASTEXITCODE) {{ exit $LASTEXITCODE }}"' -f $scriptPath.Replace("'", "''")
    $code = Invoke-Child $phase.Name $pwsh $arg 900000
    if ($code -ne 0) {
        Write-FailureEvents
        Write-HostState failure
        foreach ($tool in @($pwsh, $cmd, $node)) {
            $arg = switch ($tool) { $pwsh {'-NoProfile -NonInteractive -Command exit 0'} $cmd {'/d /c exit 0'} $node {'-e "process.exit(0)"'} }
            [void](Invoke-Child postfailure $tool $arg 5000)
        }
        Write-FailureEvents
        exit $code
    }
}
Write-HostState after
