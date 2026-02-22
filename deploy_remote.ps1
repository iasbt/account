# 自动化部署脚本 (本地 -> GitHub -> 腾讯云)
# 使用方法: ./deploy_remote.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
# 假设远程仓库在 /home/ubuntu/stack 且已关联 git
$RemoteDir = "/home/ubuntu/stack" 

Write-Host ">>> [1/3] Committing and Pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "$Message"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed! Aborting deployment."
    exit 1
}

Write-Host ">>> [2/3] Connecting to Remote Server ($ServerIP)..." -ForegroundColor Cyan
$DeployCmd = "
    cd $RemoteDir || exit 1;
    echo '>>> Pulling latest code...';
    git pull origin main;
    
    echo '>>> Rebuilding containers...';
    # 使用 correction 目录下的 compose 文件 (根据最新架构 V1.6)
    # 注意：根据之前的沟通，修正文件在 deploy/correction/
    cd deploy/correction;
    sudo docker compose down;
    sudo docker compose up -d --build;
    
    echo '>>> Deployment finished!';
"

ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $DeployCmd

Write-Host ">>> [3/3] Verifying Health..." -ForegroundColor Cyan
# 等待几秒让服务启动
Start-Sleep -Seconds 5
$HealthCheck = "curl -s http://localhost/api/health"
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $HealthCheck

Write-Host "`nDeployment Complete!" -ForegroundColor Green
