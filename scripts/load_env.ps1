
# scripts/load_env.ps1
# Helper script to load environment variables for PowerShell scripts

$EnvFile = "$PSScriptRoot\..\.env.ps1"
if (Test-Path $EnvFile) {
    . $EnvFile
} else {
    Write-Warning "No .env.ps1 file found. Using default/environment values."
}

# Set defaults if not set by .env.ps1 or environment
if (-not $global:DEPLOY_SERVER_IP) { $global:DEPLOY_SERVER_IP = "119.91.71.30" }
if (-not $global:DEPLOY_USER) { $global:DEPLOY_USER = "ubuntu" }
if (-not $global:PRIMARY_DOMAIN) { $global:PRIMARY_DOMAIN = "iasbt.cloud" }
if (-not $global:ACCOUNT_PUBLIC_URL) { $global:ACCOUNT_PUBLIC_URL = "https://account.$($global:PRIMARY_DOMAIN)" }
if (-not $global:LOGTO_BASE_URL) { $global:LOGTO_BASE_URL = "https://logto.$($global:PRIMARY_DOMAIN)" }
if (-not $global:LOGTO_ADMIN_URL) { $global:LOGTO_ADMIN_URL = "https://logto-console.$($global:PRIMARY_DOMAIN)" }
$PreferredDeployKey = "C:\My_Project\account\yuanchengmiyao.pem"
$LegacyDeployKey = "D:\OneDrive\Desktop\trae.pem"
if (Test-Path $PreferredDeployKey) {
    $global:DEPLOY_KEY_PATH = $PreferredDeployKey
} elseif (-not $global:DEPLOY_KEY_PATH) {
    if (Test-Path $LegacyDeployKey) {
        $global:DEPLOY_KEY_PATH = $LegacyDeployKey
    } else {
        $global:DEPLOY_KEY_PATH = "$HOME\.ssh\id_rsa"
    }
}
if (-not $global:REMOTE_APP_DIR) { $global:REMOTE_APP_DIR = "/home/ubuntu/account" }

if (-not $global:CORS_ALLOWLIST) {
    $global:CORS_ALLOWLIST = "$($global:ACCOUNT_PUBLIC_URL),https://www.$($global:PRIMARY_DOMAIN),https://account.$($global:PRIMARY_DOMAIN),http://$($global:DEPLOY_SERVER_IP),https://$($global:DEPLOY_SERVER_IP),http://$($global:DEPLOY_SERVER_IP):5173,https://account-*.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
}
