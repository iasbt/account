# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_remote.ps1 "Commit Message"


param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [string]$Servers = "",
    [string]$KeyPath = ""
)

# Load configuration
. "$PSScriptRoot\scripts\load_env.ps1"

$User = $global:DEPLOY_USER

if (-not $KeyPath) {
    $KeyPath = $global:DEPLOY_KEY_PATH
}
$PreferredDeployKey = "C:\My_Project\account\yuanchengmiyao.pem"
if ($KeyPath -eq "D:\OneDrive\Desktop\trae.pem" -and (Test-Path $PreferredDeployKey)) {
    $KeyPath = $PreferredDeployKey
}
if (-not $KeyPath) {
    Write-Warning "DEPLOY_KEY_PATH is not set. Using fallback key path."
    if (Test-Path $PreferredDeployKey) {
        $KeyPath = $PreferredDeployKey
    } else {
        $KeyPath = "$HOME\.ssh\id_rsa"
    }
}

if (-not (Test-Path $KeyPath)) {
    Write-Warning "SSH Key not found at: $KeyPath. Remote commands may fail."
}

if (-not $Servers) {
    $Servers = $global:DEPLOY_SERVER_IP
}

$RepoDir = $global:REMOTE_APP_DIR
$DeployDir = "$RepoDir/deploy/correction"
$LogtoBaseUrl = $global:LOGTO_BASE_URL
$LogtoAdminUrl = $global:LOGTO_ADMIN_URL
$LogtoBaseHost = ([uri]$LogtoBaseUrl).Host
$LogtoAdminHost = ([uri]$LogtoAdminUrl).Host
$PrimaryDomain = $global:PRIMARY_DOMAIN
$AccountPublicUrl = $global:ACCOUNT_PUBLIC_URL
$AllowedDomains = ".$PrimaryDomain,localhost,127.0.0.1"

$PgAdminEmail = $env:PGADMIN_DEFAULT_EMAIL
$PgAdminPassword = $env:PGADMIN_DEFAULT_PASSWORD
$ServerList = @()
if ($Servers) {
    $ServerList = $Servers.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}
if (-not $ServerList -or $ServerList.Count -eq 0) {
    if ($env:DEPLOY_TARGET_IP) {
        $ServerList = @($env:DEPLOY_TARGET_IP)
    } else {
        Write-Warning "DEPLOY_TARGET_IP is not set. Using default IP: $($global:DEPLOY_SERVER_IP)"
        $ServerList = @($global:DEPLOY_SERVER_IP)
    }
}

Write-Host ">>> Using SSH Key: $KeyPath" -ForegroundColor Cyan

# 0. 读取本地版本 (Source of Truth)
$PackageJson = Get-Content -Path "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$LocalVersion = $PackageJson.version
Write-Host ">>> [0/3] Target Version: $LocalVersion" -ForegroundColor Cyan

# 1. 提交代码到 GitHub
Write-Host ">>> [1/3] Committing and Pushing to GitHub..." -ForegroundColor Cyan
git add .
# 只有当有变更时才提交
if ((git status --porcelain) -ne "") {
    git commit -m "$Message (v$LocalVersion)"
    git push origin main
} else {
    Write-Host "No changes to commit, pushing anyway to ensure remote is up to date..." -ForegroundColor Yellow
    git push origin main
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed! Check your git configuration."
    # 不退出，尝试直接部署
}

# 2. 远程执行部署
Write-Host ">>> [2/3] Deploying on Remote Servers: $($ServerList -join ', ')" -ForegroundColor Cyan

$DeployCmd = @'
    set -e
    
    # 0. 确保 git 目录安全
    git config --global --add safe.directory __REPO_DIR__
    
    # 1. 进入 Repo 目录更新代码
    echo '>>> Updating Code in __REPO_DIR__...'
    if [ ! -d "__REPO_DIR__" ]; then
        echo 'Directory not found! Cloning...'
        git clone git@github.com:iasbt/account.git __REPO_DIR__
    fi
    cd __REPO_DIR__
    
    # 强制切换到 SSH 协议 (配合 Deploy Key 使用)
    git remote set-url origin git@github.com:iasbt/account.git
    
    # 首次连接自动接受 GitHub Host Key (避免交互式卡死)
    mkdir -p ~/.ssh
    ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts 2>/dev/null || true
    
    # [Auto-Fix] Configure SSH over 443 for GitHub (Bypass Port 22 Block)
    if [ ! -f ~/.ssh/config ] || ! grep -q "Host github.com" ~/.ssh/config; then
        echo ">>> Configuring GitHub SSH over Port 443..."
        echo "Host github.com" >> ~/.ssh/config
        echo "  Hostname ssh.github.com" >> ~/.ssh/config
        echo "  Port 443" >> ~/.ssh/config
        echo "  User git" >> ~/.ssh/config
        # Update known_hosts for ssh.github.com
        ssh-keyscan -p 443 -t rsa ssh.github.com >> ~/.ssh/known_hosts 2>/dev/null || true
    fi
    
    git fetch origin main
    git reset --hard origin/main
    
    # 1.5 Update .env for CORS (Auto Evolution)
    echo '>>> Updating .env CORS configuration...'
    CORS_VALUE="__CORS_ALLOWLIST__"
    if [ -f .env ]; then
        if grep -q "^CORS_ALLOWLIST=" .env; then

            awk -v v="$CORS_VALUE" 'BEGIN{FS=OFS="="} $1=="CORS_ALLOWLIST"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
        else
            echo "CORS_ALLOWLIST=$CORS_VALUE" >> .env
        fi
    else
        echo "CORS_ALLOWLIST=$CORS_VALUE" > .env
    fi
    if grep -q "^PRIMARY_DOMAIN=" .env; then
        awk -v v="__PRIMARY_DOMAIN__" 'BEGIN{FS=OFS="="} $1=="PRIMARY_DOMAIN"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
    else
        echo "PRIMARY_DOMAIN=__PRIMARY_DOMAIN__" >> .env
    fi
    if grep -q "^ACCOUNT_PUBLIC_URL=" .env; then
        awk -v v="__ACCOUNT_PUBLIC_URL__" 'BEGIN{FS=OFS="="} $1=="ACCOUNT_PUBLIC_URL"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
    else
        echo "ACCOUNT_PUBLIC_URL=__ACCOUNT_PUBLIC_URL__" >> .env
    fi
    if grep -q "^OIDC_ISSUER=" .env; then
        awk -v v="__ACCOUNT_PUBLIC_URL__" 'BEGIN{FS=OFS="="} $1=="OIDC_ISSUER"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
    else
        echo "OIDC_ISSUER=__ACCOUNT_PUBLIC_URL__" >> .env
    fi
    if grep -q "^OIDC_INTERNAL_REDIRECT_URI=" .env; then
        awk -v v="__ACCOUNT_PUBLIC_URL__" 'BEGIN{FS=OFS="="} $1=="OIDC_INTERNAL_REDIRECT_URI"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
    else
        echo "OIDC_INTERNAL_REDIRECT_URI=__ACCOUNT_PUBLIC_URL__" >> .env
    fi
    if grep -q "^ALLOWED_DOMAINS=" .env; then
        awk -v v="__ALLOWED_DOMAINS__" 'BEGIN{FS=OFS="="} $1=="ALLOWED_DOMAINS"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
    else
        echo "ALLOWED_DOMAINS=__ALLOWED_DOMAINS__" >> .env
    fi
    
    if [ -n "__PGADMIN_EMAIL__" ]; then
        if grep -q "^PGADMIN_DEFAULT_EMAIL=" .env; then
            awk -v v="__PGADMIN_EMAIL__" 'BEGIN{FS=OFS="="} $1=="PGADMIN_DEFAULT_EMAIL"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
        else
            echo "PGADMIN_DEFAULT_EMAIL=__PGADMIN_EMAIL__" >> .env
        fi
    fi
    
    if [ -n "__PGADMIN_PASSWORD__" ]; then
        if grep -q "^PGADMIN_DEFAULT_PASSWORD=" .env; then
            awk -v v="__PGADMIN_PASSWORD__" 'BEGIN{FS=OFS="="} $1=="PGADMIN_DEFAULT_PASSWORD"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
        else
            echo "PGADMIN_DEFAULT_PASSWORD=__PGADMIN_PASSWORD__" >> .env
        fi
    fi

    # 1.6 Logto Configuration Injection (Auto Evolution)
    echo '>>> Injecting Logto Environment Variables...'
    if grep -q "^LOGTO_BASE_URL=" .env; then
        sed -i 's|^LOGTO_BASE_URL=.*|LOGTO_BASE_URL=https://logto.iasbt.cloud|g' .env
    else
        echo "LOGTO_BASE_URL=https://logto.iasbt.cloud" >> .env
    fi
    if grep -q "^LOGTO_ISSUER=" .env; then
        sed -i 's|^LOGTO_ISSUER=.*|LOGTO_ISSUER=https://logto.iasbt.cloud/oidc|g' .env
    else
        echo "LOGTO_ISSUER=https://logto.iasbt.cloud/oidc" >> .env
    fi
    if grep -q "^LOGTO_JWKS_URL=" .env; then
        sed -i 's|^LOGTO_JWKS_URL=.*|LOGTO_JWKS_URL=https://logto.iasbt.cloud/oidc/jwks|g' .env
    else
        echo "LOGTO_JWKS_URL=https://logto.iasbt.cloud/oidc/jwks" >> .env
    fi
    if grep -q "^LOGTO_AUDIENCE=" .env; then
        sed -i 's|^LOGTO_AUDIENCE=.*|LOGTO_AUDIENCE=https://logto.iasbt.cloud/oidc|g' .env
    else
        echo "LOGTO_AUDIENCE=https://logto.iasbt.cloud/oidc" >> .env
    fi
    if grep -q "^LOGTO_END_SESSION_ENDPOINT=" .env; then
        sed -i 's|^LOGTO_END_SESSION_ENDPOINT=.*|LOGTO_END_SESSION_ENDPOINT=https://logto.iasbt.cloud/oidc/session/end|g' .env
    else
        echo "LOGTO_END_SESSION_ENDPOINT=https://logto.iasbt.cloud/oidc/session/end" >> .env
    fi
    
    # 1.7 Copy .env to deploy context (CRITICAL FIX)
    echo '>>> Copying .env to deployment directory...'
    cp .env __DEPLOY_DIR__/.env

    # 1.7 Ensure Persistent RSA Keys (Prevent Session Invalidation)
    echo '>>> Checking/Generating Persistent RSA Keys...'
    sudo mkdir -p __DEPLOY_DIR__/certs
    if [ ! -f __DEPLOY_DIR__/certs/private.pem ]; then
        echo '>>> Generating NEW persistent RSA keys...'
        sudo openssl genrsa -out __DEPLOY_DIR__/certs/private.pem 2048
        sudo openssl rsa -in __DEPLOY_DIR__/certs/private.pem -pubout -out __DEPLOY_DIR__/certs/public.pem
        sudo chmod 644 __DEPLOY_DIR__/certs/*.pem
    else
        echo '>>> Existing RSA keys found. Keeping them.'
    fi
    
    # 2. 进入部署目录 (Context Alignment)
    echo '>>> Switching to Deployment Context: __DEPLOY_DIR__'
    cd __DEPLOY_DIR__
    
    # 3. 暴力清理废弃容器 (Legacy Ban)
    echo '>>> Cleaning up legacy containers...'
    sudo docker rm -f nginx-gateway postgres-business 2>/dev/null || true
    
    # 4. 启动新服务 (Docker Compose)
    echo '>>> Starting services (Incremental Update)...'
    # 停止旧服务（不再完全销毁，保留容器以利用缓存）
    # sudo docker compose down --remove-orphans
    # sudo docker volume rm correction_pgadmin_data 2>/dev/null || true
    
    # 启动新服务 (构建 - 仅重建变更部分)
    sudo docker compose up -d --build --remove-orphans
    echo '>>> Restarting frontend to apply latest nginx.conf...'
    sudo docker restart account-frontend
    
    # 5. 网络对齐 (Network Alignment)
    echo '>>> Aligning Networks...'
    # 确保 iasbt-postgres 加入 correction_default 网络
    sudo docker network connect correction_default iasbt-postgres 2>/dev/null || echo 'iasbt-postgres already in network or network not ready'
    # 确保 gallery-frontend 可被 account-frontend 反向代理访问
    sudo docker network connect correction_default gallery-frontend 2>/dev/null || echo 'gallery-frontend already in network or container not found'
    
    # 重启后端以确保 DNS 解析生效 (iasbt-postgres hostname)
    echo '>>> Restarting backend to ensure DB connection...'
    sudo docker restart account-backend
    
    echo '>>> Waiting for services to initialize...'
    sleep 20
    
    # 6. 版本强校验 (Strong Version Verification) - Simplest
    echo '>>> Verifying Health & Version (Expected: __LOCAL_VERSION__)...'
    HEALTH_JSON=$(curl -s http://localhost:3000/health || true)
    if [ -z "$HEALTH_JSON" ] || echo "$HEALTH_JSON" | grep -q "404"; then
        HEALTH_JSON=$(curl -s http://localhost:3000/api/health || true)
    fi
    echo "Health Response: $HEALTH_JSON"
    
    # Simplest check: does the response contain the version string?
    if echo "$HEALTH_JSON" | grep "__LOCAL_VERSION__"; then
        echo "✅ Version Verification PASSED: __LOCAL_VERSION__"
    else
        echo "❌ Version Verification FAILED!"
        echo ">>> Debug Logs (Last 50 lines)..."
        sudo docker logs account-backend --tail 50
        exit 1
    fi

    # 7. Logto Configuration Fix
    echo '>>> Fixing Logto Configuration...'
    LOGTO_DIR="__REPO_DIR__/deploy/correction/logto"
    if [ -d "$LOGTO_DIR" ]; then
        cd "$LOGTO_DIR"
        echo '>>> Updating LOGTO URLs in .env...'
        if [ ! -f .env ]; then
            echo "⚠️ Logto .env not found. Skipping auto-update."
        else
            if grep -q "^LOGTO_BASE_URL=" .env; then
                sed -i 's|^LOGTO_BASE_URL=.*|LOGTO_BASE_URL=__LOGTO_BASE_URL__|g' .env
            else
                echo "LOGTO_BASE_URL=__LOGTO_BASE_URL__" >> .env
            fi
            if grep -q "^LOGTO_ADMIN_URL=" .env; then
                sed -i 's|^LOGTO_ADMIN_URL=.*|LOGTO_ADMIN_URL=__LOGTO_ADMIN_URL__|g' .env
            else
                echo "LOGTO_ADMIN_URL=__LOGTO_ADMIN_URL__" >> .env
            fi
            echo '>>> Restarting Logto services...'
            sudo docker compose up -d --remove-orphans
            sleep 5
            echo '>>> Validating Logto routes via local Nginx host headers...'
            for i in 1 2 3 4 5 6; do
                if curl -fsS -H "Host: __LOGTO_BASE_HOST__" http://127.0.0.1/oidc/.well-known/openid-configuration >/dev/null; then
                    break
                fi
                if [ "$i" -eq 6 ]; then
                    echo "❌ Logto base route check failed after retries."
                    sudo docker logs logto-core --tail 80 || true
                    exit 1
                fi
                sleep 5
            done
            for i in 1 2 3 4 5 6; do
                if curl -fsS -H "Host: __LOGTO_ADMIN_HOST__" http://127.0.0.1/ >/dev/null; then
                    break
                fi
                if [ "$i" -eq 6 ]; then
                    echo "❌ Logto admin route check failed after retries."
                    sudo docker logs logto-core --tail 80 || true
                    exit 1
                fi
                sleep 5
            done
            echo '✅ Logto proxy checks passed.'
        fi
    fi
    
    echo '>>> Pruning Build Cache & System Garbage...'
    sudo docker builder prune -f
    sudo docker system prune -f
    
    echo '>>> Disk usage after prune...'
    df -h
    
    # 7. Debug Logs (Auto-Evolution)
    echo '>>> Debug Logs (Last 20 lines)...'
    sudo docker logs account-backend --tail 20
'@

$DeployCmd = $DeployCmd.Replace("__REPO_DIR__", $RepoDir)
$DeployCmd = $DeployCmd.Replace("__CORS_ALLOWLIST__", $global:CORS_ALLOWLIST)
$DeployCmd = $DeployCmd.Replace("__DEPLOY_DIR__", $DeployDir)
$DeployCmd = $DeployCmd.Replace("__LOCAL_VERSION__", $LocalVersion)
$DeployCmd = $DeployCmd.Replace("__PGADMIN_EMAIL__", $PgAdminEmail)
$DeployCmd = $DeployCmd.Replace("__PGADMIN_PASSWORD__", $PgAdminPassword)
$DeployCmd = $DeployCmd.Replace("__LOGTO_BASE_URL__", $LogtoBaseUrl)
$DeployCmd = $DeployCmd.Replace("__LOGTO_ADMIN_URL__", $LogtoAdminUrl)
$DeployCmd = $DeployCmd.Replace("__LOGTO_BASE_HOST__", $LogtoBaseHost)
$DeployCmd = $DeployCmd.Replace("__LOGTO_ADMIN_HOST__", $LogtoAdminHost)
$DeployCmd = $DeployCmd.Replace("__PRIMARY_DOMAIN__", $PrimaryDomain)
$DeployCmd = $DeployCmd.Replace("__ACCOUNT_PUBLIC_URL__", $AccountPublicUrl)
$DeployCmd = $DeployCmd.Replace("__ALLOWED_DOMAINS__", $AllowedDomains)
$DeployCmd = $DeployCmd -replace "`r`n", "`n"

# 3. 执行远程命令
$Failures = @()
foreach ($ServerIP in $ServerList) {
    Write-Host ">>> [3/3] Executing Remote Commands on $ServerIP..." -ForegroundColor Cyan
    $DeployCmd | ssh -i $KeyPath -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=10 "${User}@${ServerIP}" "bash -s"
    if ($LASTEXITCODE -ne 0) {
        $Failures += $ServerIP
    }
}

if ($Failures.Count -eq 0) {
    Write-Host "`nDeployment Complete & Verified!" -ForegroundColor Green
} else {
    Write-Error "`nDeployment FAILED on: $($Failures -join ', ')"
}
