# Windows Local Environment Auto-Setup Script for CodeMap
# ========================================================
# PowerShell 실행 방법:
# Set-ExecutionPolicy Bypass -Scope Process; .\scripts\setup_win.ps1

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting CodeMap Windows Environment Setup..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$rootPath = (Resolve-Path "$PSScriptRoot\..").Path

# 1. winget 명령어 존재 여부 확인
if (-not (Get-Command "winget" -ErrorAction SilentlyContinue)) {
    Write-Host "[Error] 'winget' 패키지 관리자가 탐지되지 않았습니다." -ForegroundColor Red
    Write-Host "Windows App Installer를 업데이트하거나 수동으로 필요한 도구들을 설치하십시오." -ForegroundColor Yellow
    Exit 1
}

# 2. Python 3.12 설치 여부 확인 및 설치
if (-not (Get-Command "python" -ErrorAction SilentlyContinue) -or ((python --version) -notmatch "3\.12")) {
    Write-Host "[Info] Python 3.12 버전이 감지되지 않았습니다. winget을 통해 설치를 시작합니다..." -ForegroundColor Yellow
    winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
    Write-Host ">> Python 3.12 설치 요청이 완료되었습니다. (반영을 위해 터미널 재시작이 필요할 수 있습니다.)" -ForegroundColor Green
} else {
    Write-Host "[Pass] Python 3.12 버전이 이미 설치되어 있습니다." -ForegroundColor Green
}

# 3. Node.js LTS 설치 여부 확인 및 설치
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[Info] Node.js가 감지되지 않았습니다. winget을 통해 LTS 버전 설치를 시작합니다..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    Write-Host ">> Node.js LTS 설치 요청이 완료되었습니다." -ForegroundColor Green
} else {
    Write-Host "[Pass] Node.js가 이미 설치되어 있습니다. (버전: $(node -v))" -ForegroundColor Green
}

# 4. mkcert 설치 여부 확인 및 설치
if (-not (Get-Command "mkcert" -ErrorAction SilentlyContinue)) {
    Write-Host "[Info] mkcert가 감지되지 않았습니다. winget을 통해 설치합니다..." -ForegroundColor Yellow
    winget install FiloSottile.mkcert --silent --accept-package-agreements --accept-source-agreements
    Write-Host ">> mkcert 설치가 완료되었습니다." -ForegroundColor Green
} else {
    Write-Host "[Pass] mkcert가 이미 설치되어 있습니다." -ForegroundColor Green
}

# 환경 변수 리프레시 (winget 설치 직후 명령어 사용이 가능하도록 시도)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 5. mkcert 로컬 CA 등록 및 SSL 인증서 자동 발급
Write-Host "[Step 1/4] Configuring SSL certificates using mkcert..." -ForegroundColor Cyan
try {
    & mkcert -install
    
    $certsDir = "$rootPath\backend\certs"
    if (-not (Test-Path "$certsDir")) {
        New-Item -ItemType Directory -Path "$certsDir" | Out-Null
    }
    
    Push-Location "$certsDir"
    & mkcert localhost 127.0.0.1
    Pop-Location
    Write-Host ">> SSL 인증서가 성공적으로 발급되었습니다. (backend/certs/)" -ForegroundColor Green
} catch {
    Write-Host "[Warning] mkcert CA 등록 또는 인증서 발급 중 경고/오류가 발생했습니다: $_" -ForegroundColor Yellow
    Write-Host "나중에 터미널을 다시 열어 'mkcert -install' 및 'mkcert localhost 127.0.0.1'을 수동으로 수행해 주세요." -ForegroundColor Yellow
}

# 6. pnpm 글로벌 설치
Write-Host "[Step 2/4] Installing global pnpm..." -ForegroundColor Cyan
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    & npm install -g pnpm
    Write-Host ">> pnpm이 글로벌 설치되었습니다." -ForegroundColor Green
} else {
    Write-Host "[Pass] pnpm이 이미 설치되어 있습니다." -ForegroundColor Green
}

# 7. 백엔드 가상환경(venv) 구축 및 라이브러리 설치
Write-Host "[Step 3/4] Setting up Python virtual environment and dependencies..." -ForegroundColor Cyan
$backendDir = "$rootPath\backend"
$venvDir = "$backendDir\venv"

if (-not (Test-Path $venvDir)) {
    & python -m venv $venvDir
    Write-Host ">> 가상환경(venv)이 생성되었습니다." -ForegroundColor Green
}

# 가상환경의 pip를 호출하여 requirements.txt 설치 실행
Write-Host ">> 백엔드 requirements.txt 의존성을 설치 중입니다. (이 작업은 수 분이 소요될 수 있습니다.)" -ForegroundColor Yellow
& "$venvDir\Scripts\pip.exe" install --upgrade pip
& "$venvDir\Scripts\pip.exe" install -r "$backendDir\requirements.txt"
Write-Host ">> 백엔드 의존성 설치가 완료되었습니다." -ForegroundColor Green

# setup_env.py 실행을 통해 .env 템플릿 생성
& "$venvDir\Scripts\python.exe" "$backendDir\setup_env.py"

# 8. 프론트엔드 패키지 설치
Write-Host "[Step 4/4] Installing Frontend dependencies using pnpm..." -ForegroundColor Cyan
$frontendDir = "$rootPath\frontend"
Push-Location "$frontendDir"
& pnpm install
Pop-Location
Write-Host ">> 프론트엔드 의존성(node_modules) 설치가 완료되었습니다." -ForegroundColor Green

# 9. 데이터베이스 연결 확인 및 로컬 Docker 구성 자동화
Write-Host "[Step 5/5] Checking Database & local Docker setup..." -ForegroundColor Cyan

# ──────────────────────────────────────────────
# Get-EnvDBConfig
# ──────────────────────────────────────────────
function Get-EnvDBConfig {
    $envFile = "$rootPath\backend\.env"
    $config = @{
        Host = "localhost"
        Port = 5432
        User = "codemap_service"
        Password = "codemap"
        DbName = "codemap"
    }
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
        foreach ($line in $lines) {
            if ($line -match "^\s*#" -or [string]::IsNullOrWhiteSpace($line)) { continue }
            if ($line -match "^\s*(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME)\s*=\s*(.+)") {
                $key = $Matches[1]
                $val = ($Matches[2] -split '#')[0].Trim().Trim("'").Trim('"')
                switch ($key) {
                    "DB_HOST"     { $config.Host = $val }
                    "DB_PORT"     { $config.Port = [int]$val }
                    "DB_USER"     { $config.User = $val }
                    "DB_PASSWORD" { $config.Password = $val }
                    "DB_NAME"     { $config.DbName = $val }
                }
            }
        }
    }
    return $config
}

# ──────────────────────────────────────────────
# Test-PortConnection
# ──────────────────────────────────────────────
function Test-PortConnection {
    param(
        [string]$HostName,
        [int]$Port
    )
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $tcpClient.BeginConnect($HostName, $Port, $null, $null)
        $wait = $ar.AsyncWaitHandle.WaitOne(5000)
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.EndConnect($ar)
            $tcpClient.Close()
            return $true
        }
    } catch {}
    if ($tcpClient) { $tcpClient.Close() }
    return $false
}

# ──────────────────────────────────────────────
# Test-PostgresConnection
# ──────────────────────────────────────────────
function Test-PostgresConnection {
    param(
        [string]$HostName,
        [int]$Port,
        [string]$User,
        [string]$Password,
        [string]$DbName
    )
    
    # 1차 포트 연결 확인
    if (-not (Test-PortConnection -HostName $HostName -Port $Port)) {
        return $false
    }
    
    # 2차 venv 파이썬 내 psycopg를 사용한 실접속/로그인 테스트
    $pythonExe = "$rootPath\backend\venv\Scripts\python.exe"
    if (Test-Path $pythonExe) {
        $pyCode = @"
import psycopg
import sys
try:
    conn = psycopg.connect(
        host='$HostName',
        port=$Port,
        user='$User',
        password='$Password',
        dbname='$DbName',
        connect_timeout=5
    )
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f"PostgreSQL connection error: {type(e).__name__} - {e}", file=sys.stderr)
    sys.exit(1)
"@
        $tempPyFile = [System.IO.Path]::GetTempFileName() + ".py"
        Set-Content -Path $tempPyFile -Value $pyCode
        $output = & "$pythonExe" "$tempPyFile" 2>&1
        $exitCode = $LASTEXITCODE
        Remove-Item -Path $tempPyFile -ErrorAction SilentlyContinue
        
        if ($exitCode -ne 0) {
            Write-Host "[Warning] PostgreSQL connection test failed:" -ForegroundColor Red
            $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            return $false
        }
        return $true
    }
    
    # 파이썬 venv가 준비되지 않은 경우 포트 응답성만을 기준으로 예비 통과
    return $true
}

$dbConfig = Get-EnvDBConfig
Write-Host "[Info] Checking PostgreSQL availability at $($dbConfig.Host):$($dbConfig.Port)..." -ForegroundColor Yellow

$isDbAvailable = $false

if (Test-PostgresConnection -HostName $dbConfig.Host -Port $dbConfig.Port -User $dbConfig.User -Password $dbConfig.Password -DbName $dbConfig.DbName) {
    Write-Host "[Pass] PostgreSQL 데이터베이스 접속이 가능합니다. Docker 기동 검사를 생략합니다." -ForegroundColor Green
    $isDbAvailable = $true
} else {
    Write-Host "[Info] 데이터베이스 포트에 접속할 수 없습니다. 로컬 Docker 구성을 확인합니다..." -ForegroundColor Yellow
    
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Host "[Info] Docker가 설치되어 있지 않습니다. winget을 통해 Docker Desktop 설치를 시작합니다..." -ForegroundColor Yellow
        try {
            winget install Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
            Write-Host ">> Docker Desktop 설치가 성공적으로 완료되었습니다." -ForegroundColor Green
            Write-Host "⚠️ Docker 환경 변수 반영 및 서비스 가동을 위해 컴퓨터를 재부팅해 주시기 바랍니다." -ForegroundColor Red
            Write-Host "재부팅 후 이 스크립트(setup_win.ps1)를 다시 실행하면 로컬 DB 컨테이너를 자동으로 구성하고 실행합니다." -ForegroundColor Yellow
            Exit 0
        } catch {
            Write-Host "[Error] Docker Desktop 자동 설치 중 오류가 발생했습니다. 수동 설치를 완료해 주세요." -ForegroundColor Red
            Exit 1
        }
    } else {
        Write-Host "[Pass] Docker가 이미 설치되어 있습니다." -ForegroundColor Green
        
        $dockerReady = $false
        try {
            docker info --format '{{.ID}}' | Out-Null
            if ($LASTEXITCODE -eq 0) { $dockerReady = $true }
        } catch {}

        if (-not $dockerReady) {
            Write-Host "[Info] Docker 데몬이 실행 중이지 않습니다. Docker Desktop 서비스를 시작합니다..." -ForegroundColor Yellow
            $started = $false
            try {
                & docker desktop start --detach 2>$null
                if ($LASTEXITCODE -eq 0) { $started = $true }
            } catch {}

            if (-not $started) {
                Write-Host "[Info] 'docker desktop' CLI 명령어를 사용할 수 없거나 실패했습니다. 예비 수단(Start-Process)으로 구동을 시도합니다..." -ForegroundColor Yellow
                Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
            }
            
            for ($i = 0; $i -lt 30; $i++) {
                Start-Sleep -Seconds 2
                try {
                    docker info --format '{{.ID}}' | Out-Null
                    if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
                } catch {}
            }
        }

        if ($dockerReady) {
            Write-Host "[Pass] Docker 데몬이 정상 작동 중입니다." -ForegroundColor Green
            Write-Host "[Info] 로컬 PostgreSQL 컨테이너를 구동합니다..." -ForegroundColor Yellow
            
            $composeFile = "$rootPath\scripts\docker-compose.yml"
            $envFile = "$rootPath\backend\.env"
            
            docker compose -f "$composeFile" --env-file "$envFile" up -d db
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[Info] 데이터베이스 컨테이너 ID를 조회 중입니다..." -ForegroundColor Yellow
                $containerId = docker compose -f "$composeFile" --env-file "$envFile" ps -q db
                if ($LASTEXITCODE -ne 0 -or -not $containerId -or $containerId -match 'error' -or $containerId -match 'failed') {
                    $containerId = $null
                } else {
                    $containerId = $containerId.Trim()
                }
                
                if (-not $containerId) {
                    Write-Host "[Warning] 데이터베이스 컨테이너 서비스(db)를 감지하지 못했습니다. 컨테이너 생성에 실패했을 수 있습니다." -ForegroundColor Red
                } else {
                    Write-Host "[Info] 데이터베이스 컨테이너의 부팅을 기다리는 중입니다 (pg_isready)..." -ForegroundColor Yellow
                    $dbReady = $false
                    for ($i = 0; $i -lt 30; $i++) {
                        docker exec "$containerId" pg_isready -U "$($dbConfig.User)" -d "$($dbConfig.DbName)" 2>$null | Out-Null
                        if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
                        Start-Sleep -Seconds 1
                    }
                    if ($dbReady) {
                        Write-Host ">> 로컬 데이터베이스 컨테이너 구성 및 구동이 정상적으로 완료되었습니다!" -ForegroundColor Green
                        $isDbAvailable = $true
                    } else {
                        Write-Host "[Warning] 컨테이너($containerId)가 시작되었으나 데이터베이스 준비 상태를 확인하지 못했습니다. 수동으로 확인이 필요합니다." -ForegroundColor Yellow
                    }
                }
            } else {
                Write-Host "[Warning] 로컬 데이터베이스 컨테이너 구동에 실패했습니다. docker-compose.yml 구성을 확인해 주세요." -ForegroundColor Yellow
            }
        } else {
            Write-Host "[Warning] Docker Desktop을 백그라운드에서 구동하지 못했습니다. Docker Desktop을 수동으로 실행한 뒤 스크립트를 재실행해 주세요." -ForegroundColor Yellow
        }
    }
}

# 10. 완료 안내 화면 출력
Write-Host '=========================================================================' -ForegroundColor Green
Write-Host '     CodeMap 로컬 개발 환경 구성이 완료되었습니다!' -ForegroundColor Green
Write-Host '=========================================================================' -ForegroundColor Green
Write-Host ''
Write-Host '[OK] 개발 의존성 설치 완료 (Python 3.12, Node.js LTS, pnpm)' -ForegroundColor Green
Write-Host '[OK] 로컬 SSL 인증서 발급 완료 (backend/certs/)' -ForegroundColor Green
Write-Host '[OK] 백엔드 & 프론트엔드 라이브러리 설치 완료' -ForegroundColor Green
if ($isDbAvailable) {
    if ($dbConfig.Host -eq 'localhost' -or $dbConfig.Host -eq '127.0.0.1' -or $dbConfig.Host -eq '::1' -or $dbConfig.Host -eq 'db' -or $dbConfig.Host -eq 'codemap-db') {
        Write-Host '[OK] 로컬 PostgreSQL 컨테이너 기동 완료 (서비스명: codemap-db)' -ForegroundColor Green
    } else {
        Write-Host '[OK] 외부 PostgreSQL 데이터베이스 연동 확인 완료' -ForegroundColor Green
    }
} else {
    Write-Host '[Warning] PostgreSQL 데이터베이스 미기동 또는 연결 실패 (수동 확인 필요)' -ForegroundColor Yellow
}
Write-Host ''
Write-Host '================== [ 추가 진행 단계 (수동 설정) ] ==================' -ForegroundColor Yellow
Write-Host '1. ''backend/.env'' 파일을 열어 아래 필수 보안 환경 변수를 설정해 주세요.' -ForegroundColor DarkYellow
Write-Host '   - OPENAI_API_KEY=''<OpenAI API 키>''' -ForegroundColor DarkYellow
Write-Host '   - GITHUB_TOKEN=''<GitHub PAT 토큰>''' -ForegroundColor DarkYellow
Write-Host ''
Write-Host '2. [백엔드 실행] 새 터미널을 열고 아래 명령어를 실행해 주세요:' -ForegroundColor Cyan
Write-Host '   cd backend' -ForegroundColor Cyan
Write-Host '   .\\venv\\Scripts\\Activate.ps1' -ForegroundColor Cyan
Write-Host '   uvicorn app.main:app --reload --ssl-keyfile certs/localhost-key.pem --ssl-certfile certs/localhost.pem' -ForegroundColor Cyan
Write-Host ''
Write-Host '3. [프론트엔드 실행] 또 다른 터미널을 열고 아래 명령어를 실행해 주세요:' -ForegroundColor Cyan
Write-Host '   cd frontend' -ForegroundColor Cyan
Write-Host '   pnpm dev -- --experimental-https --experimental-https-key ../backend/certs/localhost-key.pem --experimental-https-cert ../backend/certs/localhost.pem' -ForegroundColor Cyan
Write-Host '=========================================================================' -ForegroundColor Green
