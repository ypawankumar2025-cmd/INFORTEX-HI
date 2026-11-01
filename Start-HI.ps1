$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is required. Install it from the official Docker website, enable its WSL2 engine, and start it.'
}
if (-not (Test-Path '.env')) {
    $bytes = New-Object byte[] 24
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    $config = (Get-Content '.env.example' -Raw).Replace('DB_PASSWORD=CHANGE_ME', 'DB_PASSWORD=' + $secret)
    [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $config)
}
docker compose up --build -d --wait --wait-timeout 180
if ($LASTEXITCODE -ne 0) { throw 'Build/start failed. Read the Docker error above.' }
$origin = 'http://localhost:8080'
Get-Content '.env' | ForEach-Object {
    if ($_ -match '^APP_ORIGIN=(.+)$') { $origin = $Matches[1].Trim() }
}
Write-Host "HI is ready at $origin. Register your own account. Demo mode requires no API key."
Start-Process $origin
