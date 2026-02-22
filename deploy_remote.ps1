# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_remote.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
# 强制指定正确路径
$RepoDir = "/home/ubuntu/account" 
$DeployDir = "/home/ubuntu/account/deploy/correction"

# 1. 提交代码到 GitHub
Write-Host ">>> [1/3] Committing and Pushing to GitHub..." -ForegroundColor Cyan
git add .
# 只有当有变更时才提交
if ((git status --porcelain) -ne "") {
    git commit -m "$Message"
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
Write-Host ">>> [2/3] Deploying on Remote Server ($ServerIP)..." -ForegroundColor Cyan

# 使用 PowerShell Here-String (@" ... "@) 避免转义噩梦
$DeployCmd = @"
    set -e
    
    # 0. 确保 git 目录安全
    git config --global --add safe.directory $RepoDir
    
    # 1. 进入 Repo 目录更新代码
    echo '>>> Updating Code in $RepoDir...'
    if [ ! -d "$RepoDir" ]; then
        echo 'Directory not found! Cloning...'
        git clone https://github.com/iasbt/account.git $RepoDir
    fi
    cd $RepoDir
    git fetch origin main
    git reset --hard origin/main
    
    # 2. 进入部署目录 (Context Alignment)
    echo '>>> Switching to Deployment Context: $DeployDir'
    cd $DeployDir
    
    # 3. 暴力清理废弃容器 (Legacy Ban)
    echo '>>> Cleaning up legacy containers...'
    sudo docker rm -f nginx-gateway postgres-business postgrest 2>/dev/null || true
    
    # 4. 启动新服务 (Docker Compose)
    echo '>>> Starting services...'
    # 停止旧服务（如果存在）
    sudo docker compose down --remove-orphans
    
    # 启动新服务 (构建)
    sudo docker compose up -d --build
    
    # 5. 网络对齐 (Network Alignment)
    echo '>>> Aligning Networks...'
    # 确保 iasbt-postgres 加入 correction_default 网络
    # 注意：如果已加入，命令会报错，所以加 || true
    sudo docker network connect correction_default iasbt-postgres 2>/dev/null || echo 'iasbt-postgres already in network or network not ready'
    
    # 重启后端以确保 DNS 解析生效 (iasbt-postgres hostname)
    echo '>>> Restarting backend to ensure DB connection...'
    sudo docker restart account-backend
    
    echo '>>> Waiting for services to initialize...'
    sleep 5
    
    # 6. 版本对齐验证 (Version Check)
    echo '>>> Verifying Health & Version...'
    HEALTH_JSON=`$(curl -s http://localhost/api/health)`
    echo "Health Response: `$HEALTH_JSON"
    
    # 简单的 Grep 检查 (由于没有 jq)
    if echo "`$HEALTH_JSON" | grep -q "version"; then
        echo "✅ Version check passed!"
    else
        echo "❌ Version check FAILED! Response invalid."
        exit 1
    fi
    
    echo '>>> Current Containers (Whitelist Check: account-backend, account-frontend, iasbt-postgres):'
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'account|iasbt|portainer|NAMES'
"@

# 执行远程命令
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $DeployCmd

Write-Host "`nDeployment Complete!" -ForegroundColor Green
