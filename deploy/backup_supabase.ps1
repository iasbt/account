param(
    [Parameter(Mandatory=$true)]
    [string]$DbUrl,
    
    [string]$Output = "supabase_full_backup.sql"
)

Write-Host "=== Supabase 数据备份工具 ===" -ForegroundColor Cyan
Write-Host "正在尝试连接 Supabase 并导出数据..."
Write-Host "连接串: $DbUrl"

# 检查 docker 是否存在 (推荐使用 docker 运行 pg_dump 以避免版本问题)
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    Write-Host "检测到 Docker，使用 docker 运行 pg_dump..." -ForegroundColor Green
    
    # 解析 host, port, user, dbname 从 URL (这里简化处理，直接传参给 pg_dump 可能会有解析问题，最好用 alpine 容器直接执行)
    # 为了通用性，我们直接运行一个临时的 postgres 容器来执行 pg_dump
    # 注意：在 PowerShell 中传递特殊字符可能需要转义
    
    docker run --rm -e PGPASSWORD=$((([uri]$DbUrl).UserInfo).Split(':')[1]) postgres:15 pg_dump -h $((([uri]$DbUrl).Host)) -p 5432 -U $((([uri]$DbUrl).UserInfo).Split(':')[0]) -d $((([uri]$DbUrl).AbsolutePath).Trim('/')) --clean --if-exists --no-owner --no-privileges > $Output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "备份成功！文件已保存为: $Output" -ForegroundColor Green
    } else {
        Write-Host "备份失败，请检查连接串或网络。" -ForegroundColor Red
    }
} else {
    Write-Host "未检测到 Docker，尝试使用本地 pg_dump..." -ForegroundColor Yellow
    if (Get-Command "pg_dump" -ErrorAction SilentlyContinue) {
        pg_dump $DbUrl --clean --if-exists --no-owner --no-privileges --file=$Output
    } else {
        Write-Host "错误: 未找到 pg_dump 工具，请先安装 PostgreSQL 或 Docker。" -ForegroundColor Red
    }
}
