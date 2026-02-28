$PackageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$LocalVersion = $PackageJson.version
Write-Host "Version: '$LocalVersion'"
