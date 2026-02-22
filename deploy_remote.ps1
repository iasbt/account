# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_remote.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
$RemoteDir = "/home/ubuntu/stack" 

# 1. 提交代码到 GitHub (作为备份)
Write-Host ">>> [1/4] Committing and Pushing to GitHub..." -ForegroundColor Cyan
git add .
# 只有当有变更时才提交
if ((git status --porcelain) -ne "") {
    git commit -m "$Message"
    git push origin main
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed! Check your git configuration."
    # 不退出，尝试直接部署
}

# 2. 打包当前代码 (确保包含最新提交)
Write-Host ">>> [2/4] Packaging code..." -ForegroundColor Cyan
# 使用 git archive 打包最新提交的代码
git archive --format=zip --output=deploy.zip HEAD

if (-not (Test-Path "deploy.zip")) {
    Write-Error "Failed to create deploy.zip"
    exit 1
}

# 3. 上传代码包到服务器
Write-Host ">>> [3/4] Uploading to Remote Server ($ServerIP)..." -ForegroundColor Cyan
# 使用 scp 上传
scp -i $KeyPath -o StrictHostKeyChecking=no deploy.zip "${User}@${ServerIP}:/home/ubuntu/deploy.zip"

if ($LASTEXITCODE -ne 0) {
    Write-Error "SCP upload failed!"
    exit 1
}

# 4. 远程解压并部署
Write-Host ">>> [4/4] Deploying on Remote Server..." -ForegroundColor Cyan
$DeployCmd = "
    set -e
    
    echo '>>> Extracting code...'
    # 创建新目录解压
    rm -rf stack_new
    mkdir -p stack_new
    unzip -o deploy.zip -d stack_new > /dev/null
    
    echo '>>> Preserving configuration...'
    # 如果存在旧环境，保留 .env 文件
    if [ -f stack/.env ]; then
        cp stack/.env stack_new/.env
        echo 'Found and preserved .env file.'
    else
        echo 'Warning: No .env file found in existing stack!'
    fi
    
    echo '>>> Switching directories...'
    # 备份旧目录 (可选，为了安全保留最近一次)
    rm -rf stack_old
    if [ -d stack ]; then
        mv stack stack_old
    fi
    mv stack_new stack
    
    echo '>>> Cleaning up old containers...'
    # 强制清理可能存在的冲突容器
    docker rm -f postgres-business postgrest nginx-gateway 2>/dev/null || true
    
    echo '>>> Starting new services...'
    cd stack/deploy/correction
    
    # 停止当前目录下的服务 (如果有)
    docker compose down --remove-orphans
    
    # 启动新服务
    docker compose up -d --build
    
    echo '>>> Waiting for services to initialize...'
    sleep 5
    
    echo '>>> Verifying Health...'
    curl -s http://localhost/api/health
    
    # 清理上传的压缩包
    rm ~/deploy.zip
"

ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $DeployCmd

Write-Host "`nDeployment Complete!" -ForegroundColor Green

# 清理本地压缩包
Remove-Item deploy.zip -ErrorAction SilentlyContinue
