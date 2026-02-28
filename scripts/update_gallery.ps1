$ErrorActionPreference = "Stop"

$GallerySrc = "..\image\src"

if (-not (Test-Path $GallerySrc)) {
    Write-Error "Gallery source directory not found at $GallerySrc. Please check the path."
    exit 1
}

Write-Host "Updating Gallery files..."

# Ensure lib directory exists
$LibDir = "$GallerySrc\lib"
if (-not (Test-Path $LibDir)) {
    New-Item -ItemType Directory -Path $LibDir -Force
}

Copy-Item -Path "gallery-updates\auth-utils.ts" -Destination "$LibDir\auth-utils.ts" -Force
Copy-Item -Path "gallery-updates\pkce.ts" -Destination "$LibDir\pkce.ts" -Force
Copy-Item -Path "gallery-updates\utils.ts" -Destination "$LibDir\utils.ts" -Force
Copy-Item -Path "gallery-updates\api.ts" -Destination "$LibDir\api.ts" -Force

# Ensure store directory exists
$StoreDir = "$GallerySrc\store"
if (-not (Test-Path $StoreDir)) {
    New-Item -ItemType Directory -Path $StoreDir -Force
}

Copy-Item -Path "gallery-updates\authStore.ts" -Destination "$StoreDir\authStore.ts" -Force

# Ensure pages directory exists
$PagesDir = "$GallerySrc\pages"
if (-not (Test-Path $PagesDir)) {
    New-Item -ItemType Directory -Path $PagesDir -Force
}

Copy-Item -Path "gallery-updates\AuthCallback.tsx" -Destination "$PagesDir\AuthCallback.tsx" -Force

Write-Host "Gallery updated successfully!"
