# 自动化部署图库项目 (本地 -> 腾讯云)
# 使用方法: .\deploy_gallery.ps1 "Commit Message"
# 适用位置: 必须放置在 C:\My_Project\image 根目录下

param(
    [string]$Message = "Auto deploy Gallery: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
$RemoteGalleryDir = "/home/ubuntu/image"

# 1. 检查当前目录
# 获取脚本所在目录作为基准路径
$ScriptDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = Get-Location
}
Write-Host ">>> [1/3] Deployment Context: $ScriptDir" -ForegroundColor Cyan

if (!(Test-Path "$ScriptDir\Dockerfile")) {
    Write-Error "Error: Dockerfile not found in $ScriptDir. Please ensure this script is in the Gallery project root."
    exit 1
}

# 2. 远程部署
Write-Host ">>> [2/3] Preparing Local Source Code..." -ForegroundColor Cyan

$TarFile = "image.tar.gz" 
$TarOutput = Join-Path $ScriptDir $TarFile

if (Test-Path $TarOutput) { Remove-Item $TarOutput }

Write-Host "Creating archive from $ScriptDir..." -ForegroundColor Yellow

# Use git archive if git is available, otherwise tar
if (Test-Path "$ScriptDir\.git") {
    # Ensure changes are picked up (optional, but good practice)
    # git add .
    # git commit -m "WIP: Deployment snapshot" 
    git archive --format=tar.gz -o "$TarOutput" HEAD
} else {
    Write-Warning "Git repo not found. Archiving all files (this might include node_modules if not careful)..."
    tar -czf "$TarOutput" --exclude=node_modules --exclude=.git --exclude=$TarFile .
}

Write-Host ">>> [2.5/3] Uploading to Remote Server..." -ForegroundColor Cyan
$Size = (Get-Item $TarOutput).Length / 1MB
Write-Host "Archive size: $([math]::Round($Size, 2)) MB." -ForegroundColor Yellow
Write-Host "Please ignore any QR code banners from the server." -ForegroundColor Yellow

# Upload Archive
scp -i $KeyPath -o StrictHostKeyChecking=no $TarOutput "${User}@${ServerIP}:/home/ubuntu/"

Remove-Item $TarOutput

$DeployCmd = @"
    set -e
    
    # 1. Extract Archive
    if [ -d "$RemoteGalleryDir" ]; then
        echo "Cleaning up existing Gallery directory..."
        rm -rf "$RemoteGalleryDir"
    fi
    mkdir -p "$RemoteGalleryDir"
    echo "Extracting archive to $RemoteGalleryDir..."
    tar -xzf /home/ubuntu/image.tar.gz -C "$RemoteGalleryDir"
    rm /home/ubuntu/image.tar.gz

    cd "$RemoteGalleryDir"

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
    echo "Building Docker Image..."
    
    # Load env vars for build args
    export `$(grep -v '^#' .env | xargs)

    sudo docker build \
      --build-arg VITE_SUPABASE_URL="http://119.91.71.30" \
      --build-arg VITE_ACCOUNT_URL="http://119.91.71.30" \
      --build-arg VITE_ACCOUNT_WEB_URL="http://119.91.71.30" \
      --build-arg VITE_SUPABASE_ANON_KEY="`$VITE_SUPABASE_ANON_KEY" \
      --build-arg VITE_SUPABASE_SCHEMA="`$VITE_SUPABASE_SCHEMA" \
      --build-arg VITE_AMAP_KEY="`$VITE_AMAP_KEY" \
      --build-arg VITE_AMAP_SECURITY_CODE="`$VITE_AMAP_SECURITY_CODE" \
      --build-arg VITE_IMAGEKIT_URL_ENDPOINT="`$VITE_IMAGEKIT_URL_ENDPOINT" \
      --build-arg VITE_R2_WORKER_URL="`$VITE_R2_WORKER_URL" \
      --build-arg VITE_R2_TOKEN="`$VITE_R2_TOKEN" \
      --build-arg VITE_DEV_EMAIL="`$VITE_DEV_EMAIL" \
      --build-arg VITE_DEV_PASSWORD="`$VITE_DEV_PASSWORD" \
      -t gallery-frontend .

    # 4. Run Container
    echo ">>> Running Container..."
    
    if [ `$(sudo docker ps -aq -f name=gallery-frontend) ]; then
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
