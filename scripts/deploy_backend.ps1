# deploy_backend.sh 의 PowerShell 포팅 버전 (Windows 배포 대상용)
# 주의: sudo/systemctl/nginx -T 등 Linux 전용 기능은 대응 항목이 없어 생략했습니다.
#       (ingress 체크는 direct/load-balancer/none만 지원, nginx 모드는 미지원 경고만 출력)
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$EnvFile = Join-Path $BackendDir ".env"
$ComposeFile = Join-Path $ScriptDir "docker-compose.yml"
$InitDbScript = Join-Path $ScriptDir "init_db.ps1"
$FrontendEnvFile = Join-Path $RootDir "frontend\.env"

$ImageName = if ($env:BACKEND_IMAGE) { $env:BACKEND_IMAGE } elseif ($args.Count -gt 0) { $args[0] } else { "" }
$ContainerName = if ($env:BACKEND_CONTAINER_NAME) { $env:BACKEND_CONTAINER_NAME } else { "backend_app" }
$AppPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "8000" }
$DockerNetwork = if ($env:CODEMAP_DOCKER_NETWORK) { $env:CODEMAP_DOCKER_NETWORK } else { "codemap-net" }
$CloudProvider = if ($env:CLOUD_PROVIDER) { $env:CLOUD_PROVIDER } else { "generic" }
$IngressMode = if ($env:INGRESS_MODE) { $env:INGRESS_MODE } else { "direct" }
$PublicBackendUrl = if ($env:PUBLIC_BACKEND_URL) { $env:PUBLIC_BACKEND_URL } elseif ($env:DIRECT_PUBLIC_URL) { $env:DIRECT_PUBLIC_URL } else { "" }
$IngressCheckRequired = if ($env:INGRESS_CHECK_REQUIRED) { $env:INGRESS_CHECK_REQUIRED } else { "false" }

if (-not $ImageName) {
    Write-Host "BACKEND_IMAGE (env) or the first argument is required."
    exit 1
}

if (-not (Test-Path $EnvFile)) {
    Write-Host "Missing backend env file: $EnvFile"
    exit 1
}

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

function Http-Probe {
    param([string]$Url)
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Extract-DatabaseUrlHost {
    param([string]$Value)
    if ($Value -and $Value -match '@([^/:?]+)') { return $Matches[1] }
    return ""
}

# ──────────────────────────────────────────────
# Resolve-ClonePath
# ──────────────────────────────────────────────
function Resolve-ClonePath {
    $clonePath = Read-EnvValue "CLONE_BASE_DIR"
    if (-not $clonePath) {
        $clonePath = Read-EnvValue "CLONE_BASE_DIR_WINDOWS"
    }
    if (-not $clonePath) {
        $clonePath = "C:/temp/codemap/jobs"
    }
    return $clonePath
}

$DbHostValue = Read-EnvValue "DB_HOST"
$DatabaseUrlValue = Read-EnvValue "DATABASE_URL"
$DatabaseUrlHost = Extract-DatabaseUrlHost $DatabaseUrlValue
$DbTarget = if ($DbHostValue) { $DbHostValue } else { $DatabaseUrlHost }
$ClonePath = Resolve-ClonePath

Write-Host "Using backend image: $ImageName"
Write-Host "Clone volume path: $ClonePath"

if (-not (Test-Path $ClonePath)) {
    New-Item -ItemType Directory -Force -Path $ClonePath | Out-Null
}

docker network create $DockerNetwork 2>$null | Out-Null

$DockerDbArgs = @()
if (Is-LocalDbTarget $DbTarget) {
    Write-Host "Local DB target detected ($DbTarget). Preparing PostgreSQL container."
    docker compose -f $ComposeFile --env-file $EnvFile up -d db

    $containerId = docker compose -f $ComposeFile --env-file $EnvFile ps -q db
    if ($LASTEXITCODE -ne 0 -or -not $containerId -or $containerId -match 'error' -or $containerId -match 'failed') {
        $containerId = $null
    } else {
        $containerId = $containerId.Trim()
    }

    if (-not $containerId) {
        Write-Host "Local database container (db) was not created successfully."
        exit 1
    }

    docker network connect $DockerNetwork "$containerId" 2>$null | Out-Null
    & $InitDbScript
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $DockerDbArgs = @("--network", $DockerNetwork, "-e", "DB_HOST=codemap-db")
    if ($DatabaseUrlValue) {
        $LocalDatabaseUrl = $DatabaseUrlValue -replace '(@)[^/:?]+', '${1}codemap-db'
        $DockerDbArgs += @("-e", "DATABASE_URL=$LocalDatabaseUrl")
    }
} else {
    Write-Host "External SQL server detected in backend/.env: $DbTarget"
    Write-Host "Skipping local database container and database/init.sql setup."
    $DockerDbArgs = @("--network", $DockerNetwork)
}

Write-Host "Pulling backend image."
docker pull $ImageName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Replacing backend container."
docker rm -f $ContainerName 2>$null | Out-Null
docker run -d `
    -p "${AppPort}:8000" `
    -v "${ClonePath}:${ClonePath}" `
    --name $ContainerName `
    --env-file $EnvFile `
    @DockerDbArgs `
    $ImageName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- 헬스체크 ---
$healthUrl = "http://127.0.0.1:$AppPort/"
Write-Host "Checking backend container health at $healthUrl"
$healthy = $false
for ($i = 1; $i -le 10; $i++) {
    if (Http-Probe $healthUrl) { $healthy = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $healthy) {
    Write-Host "Backend did not respond on local port $AppPort within the wait window."
    docker logs --tail 80 $ContainerName
    exit 1
}
Write-Host "Backend responded on local port $AppPort."

# --- Ingress 체크 (nginx 모드는 Windows 미지원, direct/load-balancer/none만 지원) ---
Write-Host "Cloud provider: $CloudProvider"
Write-Host "Ingress mode: $IngressMode"

switch ($IngressMode) {
    "none" {
        Write-Host "Ingress mode is none; skipped public ingress checks."
    }
    "nginx" {
        Write-Host "Nginx ingress check is not supported on Windows targets yet; skipping. (INGRESS_CHECK_REQUIRED=$IngressCheckRequired)"
        if ($IngressCheckRequired -eq "true") {
            Write-Host "INGRESS_CHECK_REQUIRED=true 이지만 Windows에서 nginx 검증을 지원하지 않아 실패 처리합니다."
            exit 1
        }
    }
    default {
        $publicUrl = if ($PublicBackendUrl) { $PublicBackendUrl.TrimEnd('/') } else {
            (Read-EnvValue "BACKEND_URL" $FrontendEnvFile).TrimEnd('/')
        }
        if ($publicUrl) {
            Write-Host "Checking public backend URL: $publicUrl"
            if (Http-Probe "$publicUrl/") {
                Write-Host "Public backend URL responded."
            } else {
                $msg = "public backend URL did not respond: $publicUrl"
                if ($IngressCheckRequired -eq "true") {
                    Write-Host "Ingress check failed: $msg"
                    exit 1
                } else {
                    Write-Host "Ingress check warning: $msg"
                }
            }
        } else {
            Write-Host "No PUBLIC_BACKEND_URL, DIRECT_PUBLIC_URL, or frontend BACKEND_URL found; skipped public endpoint check."
        }
    }
}

Write-Host "Pruning unused Docker images."
docker image prune -f | Out-Null

Write-Host "Backend deployment completed."
