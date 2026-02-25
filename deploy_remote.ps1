# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_remote.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [string]$Servers = $env:DEPLOY_SERVERS
)

$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
$RepoDir = "/home/ubuntu/account" 
$DeployDir = "/home/ubuntu/account/deploy/correction"
$PgAdminEmail = $env:PGADMIN_DEFAULT_EMAIL
$PgAdminPassword = $env:PGADMIN_DEFAULT_PASSWORD
$ServerList = @()
if ($Servers) {
    $ServerList = $Servers.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}
if (-not $ServerList -or $ServerList.Count -eq 0) {
    $ServerList = @("119.91.71.30")
}

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
    CORS_VALUE="https://account.iasbt.com,https://account.iasbt.com.pages.dnsoe5.com,https://account1-76iej0ca.edgeone.dev,http://119.91.71.30,http://119.91.71.30:5173,https://account-*.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
    if [ -f .env ]; then
        if grep -q "^CORS_ALLOWLIST=" .env; then
            awk -v v="$CORS_VALUE" 'BEGIN{FS=OFS="="} $1=="CORS_ALLOWLIST"{$2=v} {print}' .env > .env.tmp && mv .env.tmp .env
        else
            echo "CORS_ALLOWLIST=$CORS_VALUE" >> .env
        fi
    else
        echo "CORS_ALLOWLIST=$CORS_VALUE" > .env
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
    
    # 1.6 Copy .env to deploy context (CRITICAL FIX)
    echo '>>> Copying .env to deployment directory...'
    cp .env __DEPLOY_DIR__/.env
    
    # 2. 进入部署目录 (Context Alignment)
    echo '>>> Switching to Deployment Context: __DEPLOY_DIR__'
    cd __DEPLOY_DIR__
    
    # 3. 暴力清理废弃容器 (Legacy Ban)
    echo '>>> Cleaning up legacy containers...'
    sudo docker rm -f nginx-gateway postgres-business postgrest 2>/dev/null || true
    
    # 4. 启动新服务 (Docker Compose)
    echo '>>> Starting services (Incremental Update)...'
    # 停止旧服务（不再完全销毁，保留容器以利用缓存）
    # sudo docker compose down --remove-orphans
    # sudo docker volume rm correction_pgadmin_data 2>/dev/null || true
    
    # 启动新服务 (构建 - 仅重建变更部分)
    sudo docker compose up -d --build --remove-orphans
    
    # 5. 网络对齐 (Network Alignment)
    echo '>>> Aligning Networks...'
    # 确保 iasbt-postgres 加入 correction_default 网络
    sudo docker network connect correction_default iasbt-postgres 2>/dev/null || echo 'iasbt-postgres already in network or network not ready'
    
    # 重启后端以确保 DNS 解析生效 (iasbt-postgres hostname)
    echo '>>> Restarting backend to ensure DB connection...'
    sudo docker restart account-backend
    
    echo '>>> Waiting for services to initialize...'
    sleep 10
    
    # 6. 版本强校验 (Strong Version Verification) - Simplest
    echo '>>> Verifying Health & Version (Expected: __LOCAL_VERSION__)...'
    HEALTH_JSON=$(curl -s http://localhost:3000/health)
    echo "Health Response: $HEALTH_JSON"
    
    # Simplest check: does the response contain the version string?
    if echo "$HEALTH_JSON" | grep "__LOCAL_VERSION__"; then
        echo "✅ Version Verification PASSED: __LOCAL_VERSION__"
    else
        echo "❌ Version Verification FAILED!"
        exit 1
    fi
    
    echo '>>> Pruning dangling images...'
    sudo docker image prune -f
    
    echo '>>> Disk usage after prune...'
    df -h
    
    # 7. Debug Logs (Auto-Evolution)
    echo '>>> Debug Logs (Last 20 lines)...'
    sudo docker logs account-backend --tail 20
'@

$DeployCmd = $DeployCmd.Replace("__REPO_DIR__", $RepoDir)
$DeployCmd = $DeployCmd.Replace("__DEPLOY_DIR__", $DeployDir)
$DeployCmd = $DeployCmd.Replace("__LOCAL_VERSION__", $LocalVersion)
$DeployCmd = $DeployCmd.Replace("__PGADMIN_EMAIL__", $PgAdminEmail)
$DeployCmd = $DeployCmd.Replace("__PGADMIN_PASSWORD__", $PgAdminPassword)

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
