
# Scripts to run integration tests
$ComposeFile = "$PSScriptRoot\..\tests\integration\docker-compose.yml"

Write-Host ">>> Starting Test Infrastructure..." -ForegroundColor Cyan
docker-compose -f $ComposeFile up -d

Write-Host ">>> Waiting for DB to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ">>> Running Integration Tests..." -ForegroundColor Cyan
$env:NODE_ENV = "test"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5433"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "password"
$env:DB_NAME = "account_test"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6380"

try {
    npm run test:integration
} finally {
    Write-Host ">>> Tearing Down Test Infrastructure..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile down
}
