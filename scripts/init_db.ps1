# init_db.sh 의 PowerShell 포팅 버전 (Windows 배포 대상용)
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $RootDir "backend\.env"
$InitSql = Join-Path $RootDir "database\init.sql"

function Read-EnvValue {
    param([string]$Key, [string]$File = $EnvFile)
    if (-not (Test-Path $File)) { return "" }
    $val = ""
    Get-Content $File | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#')) {
            if ($line -match '^\s*([^=]+)\s*=\s*(.*)$') {
                $k = $Matches[1].Trim()
                if ($k -eq $Key) {
                    $val = ($Matches[2] -split '#')[0].Trim().Trim("'").Trim('"')
                }
            }
        }
    }
    return $val
}

function Is-LocalDbTarget {
    param([string]$Target)
    switch (("$Target").ToLower()) {
        "" { return $true }
        "localhost" { return $true }
        "127.0.0.1" { return $true }
        "::1" { return $true }
        "db" { return $true }
        "postgresql-17" { return $true }
        "codemap-db" { return $true }
        default { return $false }
    }
}

function Extract-DatabaseUrlHost {
    param([string]$Value)
    if ($Value -and $Value -match '@([^/:?]+)') { return $Matches[1] }
    return ""
}

$DbHostValue = Read-EnvValue "DB_HOST"
$DbUser = Read-EnvValue "DB_USER"
if (-not $DbUser) { $DbUser = "codemap" }
$DbName = Read-EnvValue "DB_NAME"
if (-not $DbName) { $DbName = "codemap" }
$DbPassword = Read-EnvValue "DB_PASSWORD"

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

$containerId = docker compose -f "$ScriptDir\docker-compose.yml" --env-file "$RootDir\backend\.env" ps -q db
if ($LASTEXITCODE -ne 0 -or -not $containerId -or $containerId -match 'error' -or $containerId -match 'failed') {
    $containerId = $null
} else {
    $containerId = $containerId.Trim()
}

if (-not $containerId) {
    Write-Host "Local PostgreSQL container service (db) is not running."
    exit 1
}

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    docker exec "$containerId" pg_isready -U "$DbUser" -d "$DbName" | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host "Local database container ($containerId) did not become ready in time."
    exit 1
}

Write-Host "Applying local database schema from database/init.sql..."
if ($DbPassword) {
    Get-Content $InitSql -Raw | docker exec -i -e PGPASSWORD="$DbPassword" "$containerId" psql -U "$DbUser" -d "$DbName"
} else {
    Get-Content $InitSql -Raw | docker exec -i "$containerId" psql -U "$DbUser" -d "$DbName"
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to apply database/init.sql"
    exit 1
}

Write-Host "Database schema initialization completed."