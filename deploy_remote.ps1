# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_remote.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
# 强制指定正确路径
$RemoteDir = "/home/ubuntu/account" 

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
# 变量 $RemoteDir 会被 PowerShell 展开
# 变量 `$Var (如 `$COMPOSE_FILE) 会保持原样传给 Linux Shell
$DeployCmd = @"
    set -e
    
    # 0. 确保 git 目录安全
    git config --global --add safe.directory $RemoteDir
    
    # 1. 进入正确目录
    echo '>>> Entering $RemoteDir...'
    if [ ! -d "$RemoteDir" ]; then
        echo 'Directory not found! Cloning...'
        git clone https://github.com/iasbt/account.git $RemoteDir
    fi
    cd $RemoteDir
    
    # 2. 拉取最新代码
    echo '>>> Pulling latest code...'
    git fetch origin main
    git reset --hard origin/main
    
    # 3. 暴力清理废弃容器 (除恶务尽)
    echo '>>> Cleaning up legacy containers...'
    sudo docker rm -f nginx-gateway postgres-business postgrest 2>/dev/null || true
    
    # 4. 精准定位部署文件启动
    echo '>>> Starting services with CORRECT compose file...'
    # 指定绝对路径的 compose 文件
    COMPOSE_FILE="$RemoteDir/deploy/correction/docker-compose.yml"
    
    if [ ! -f "`$COMPOSE_FILE" ]; then
        echo "Error: Compose file not found at `$COMPOSE_FILE"
        exit 1
    fi
    
    # 停止旧服务（如果存在）
    sudo docker compose -f "`$COMPOSE_FILE" down --remove-orphans
    
    # 启动新服务
    sudo docker compose -f "`$COMPOSE_FILE" up -d --build
    
    echo '>>> Waiting for services to initialize...'
    sleep 5
    
    echo '>>> Verifying Health...'
    curl -s http://localhost/api/health
    
    echo '>>> Current Containers (Should only be: account-backend, account-frontend, iasbt-postgres, portainer):'
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"@

# 执行远程命令
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $DeployCmd

Write-Host "`nDeployment Complete!" -ForegroundColor Green
