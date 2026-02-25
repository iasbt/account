# 自动化部署图库项目 (本地 -> GitHub -> 腾讯云)
# 使用方法: .\deploy_gallery.ps1 "Commit Message"

param(
    [string]$Message = "Auto deploy Gallery: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
$RemoteAccountDir = "/home/ubuntu/account"
$RemoteGalleryDir = "/home/ubuntu/image"
$GalleryRepo = "git@github.com:iasbt/image-gallery.git"

# 1. 提交 Account 代码 (包含部署脚本与配置)
Write-Host ">>> [1/3] Syncing Account Deployment Scripts..." -ForegroundColor Cyan
git add .
if ((git status --porcelain) -ne "") {
    git commit -m "$Message [Account Sync]"
    git push origin main
} else {
    Write-Host "No changes in Account repo, syncing anyway..." -ForegroundColor Yellow
    git push origin main
}

# 2. 远程部署
Write-Host ">>> [2/3] Deploying Gallery on Remote Server..." -ForegroundColor Cyan

$DeployCmd = @"
    set -e
    
    # 0. Update Account Repo (to get latest Dockerfile)
    cd $RemoteAccountDir
    git pull origin main

    # 1. Ensure Gallery Repo exists
    if [ ! -d "$RemoteGalleryDir" ]; then
        echo ">>> Cloning Gallery repository..."
        git clone $GalleryRepo $RemoteGalleryDir
    else
        echo ">>> Updating Gallery Code..."
        cd $RemoteGalleryDir
        git pull origin main
    fi

    cd $RemoteGalleryDir

    # 2. Configure Environment
    if [ ! -f .env ]; then
        echo ">>> Creating default .env..."
        cp .env.example .env
        # Replace localhost or domain with Server IP
        sed -i 's|http://localhost:3000|http://119.91.71.30|g' .env
        sed -i 's|http://localhost:5173|http://119.91.71.30:5173|g' .env
        sed -i 's|https://account.iasbt.com|http://119.91.71.30|g' .env
        sed -i 's|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=http://119.91.71.30|g' .env
    fi

    # 3. Build Docker Image
    echo ">>> Building Docker Image..."
    
    # Copy Dockerfile/nginx.conf from Account repo
    cp $RemoteAccountDir/deploy/gallery/Dockerfile .
    cp $RemoteAccountDir/deploy/gallery/nginx.conf .

    # Load env vars for build args (Quick hack to export .env vars)
    export \$(grep -v '^#' .env | xargs)

    sudo docker build \
      --build-arg VITE_SUPABASE_URL="http://119.91.71.30" \
      --build-arg VITE_ACCOUNT_URL="http://119.91.71.30" \
      --build-arg VITE_ACCOUNT_WEB_URL="http://119.91.71.30" \
      --build-arg VITE_SUPABASE_ANON_KEY="\$VITE_SUPABASE_ANON_KEY" \
      --build-arg VITE_SUPABASE_SCHEMA="\$VITE_SUPABASE_SCHEMA" \
      --build-arg VITE_AMAP_KEY="\$VITE_AMAP_KEY" \
      --build-arg VITE_AMAP_SECURITY_CODE="\$VITE_AMAP_SECURITY_CODE" \
      --build-arg VITE_IMAGEKIT_URL_ENDPOINT="\$VITE_IMAGEKIT_URL_ENDPOINT" \
      --build-arg VITE_R2_WORKER_URL="\$VITE_R2_WORKER_URL" \
      --build-arg VITE_R2_TOKEN="\$VITE_R2_TOKEN" \
      -t gallery-frontend .

    # 4. Run Container
    echo ">>> Running Container..."
    
    # Check if container exists
    if [ \$(sudo docker ps -aq -f name=gallery-frontend) ]; then
        sudo docker rm -f gallery-frontend
    fi
    
    # Run in correction_default network
    sudo docker run -d \
      --name gallery-frontend \
      --network correction_default \
      --restart unless-stopped \
      -p 5173:80 \
      gallery-frontend

    echo ">>> Deployment Complete! Access at http://119.91.71.30:5173"
"@

$DeployCmd | ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" "bash -s"
