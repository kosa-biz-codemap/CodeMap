# init_db.sh 의 PowerShell 포팅 버전 (Windows 배포 대상용)
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $RootDir "backend\.env"
$InitSql = Join-Path $RootDir "database\init.sql"

function Read-EnvValue {
    param([string]$Key, [string]$File = $EnvFile)
    if (-not (Test-Path $File)) { return "" }
    $line = Get-Content $File | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -Last 1
    if (-not $line) { return "" }
    return ($line -split '=', 2)[1].Trim()
}

function Is-LocalDbTarget {
    param([string]$Target)
    switch ($Target.ToLower()) {
        "" { return $true }
        "localhost" { return $true }
        "127.0.0.1" { return $true }
        "::1" { return $true }
        "db" { return $true }
        "postgresql-17" { return $true }
        default { return $false }
    }
}

function Extract-DatabaseUrlHost {
    param([string]$Value)
    if ($Value -and $Value -match '@([^/:?]+)') { return $Matches[1] }
    return ""
}

$DbHostValue = Read-EnvValue "DB_HOST"
$DatabaseUrlValue = Read-EnvValue "DATABASE_URL"
$DatabaseUrlHost = Extract-DatabaseUrlHost $DatabaseUrlValue
$DbTarget = if ($DbHostValue) { $DbHostValue } else { $DatabaseUrlHost }

if (-not (Is-LocalDbTarget $DbTarget)) {
    Write-Host "External SQL server detected in backend/.env: $DbTarget"
    Write-Host "Skipping database/init.sql initialization."
    exit 0
}

Write-Host "Initializing local CodeMap database schema..."
Write-Host "Waiting for local database container to be ready..."

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    docker exec postgresql-17 pg_isready -U codemap -d codemap | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host "postgresql-17 container did not become ready in time."
    exit 1
}

Write-Host "Applying local database schema from database/init.sql..."
Get-Content $InitSql -Raw | docker exec -i postgresql-17 psql -U codemap -d codemap
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to apply database/init.sql"
    exit 1
}

Write-Host "Database schema initialization completed."