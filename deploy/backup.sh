#!/bin/bash

# --- 配置区域 ---
# 缤纷云 S3 配置 (需先安装 rclone 或 aws-cli，这里假设使用 aws-cli)
S3_BUCKET="s3://your-backup-bucket"
BACKUP_DIR="./backups"
DATA_DIR="./data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="iasbt_stack_backup_$TIMESTAMP.tar.gz"
MYSQL_DUMP_NAME="mysql_dump_$TIMESTAMP.sql"
PG_DUMP_NAME="postgres_dump_$TIMESTAMP.sql"

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

echo "[Start] 开始备份任务: $TIMESTAMP"

# 1. 确保备份目录存在
mkdir -p $BACKUP_DIR

# 2. 导出数据库 (热备份)
echo "[Step 1] 导出数据库..."

# 2.1 MySQL
echo "  - 正在导出 MySQL..."
docker exec mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/$MYSQL_DUMP_NAME"

# 2.2 Postgres
echo "  - 正在导出 Postgres..."
docker exec iasbt-postgres pg_dump -U postgres postgres > "$BACKUP_DIR/$PG_DUMP_NAME" 2>/dev/null || echo "Warning: Postgres backup failed or container not running"

if [ ! -f "$BACKUP_DIR/$MYSQL_DUMP_NAME" ]; then
    echo "[Error] 主要数据库(MySQL)导出失败！"
    exit 1
fi

# 3. 打包所有数据
echo "[Step 2] 打包数据文件..."
# 打包内容：docker-compose.yml, .env, data目录, 以及刚刚导出的sql
tar -czf "$BACKUP_DIR/$FILENAME" \
    docker-compose.yml \
    .env \
    "$DATA_DIR" \
    "$BACKUP_DIR/$MYSQL_DUMP_NAME" \
    "$BACKUP_DIR/$PG_DUMP_NAME"

# 4. 清理临时 SQL 文件
rm "$BACKUP_DIR/$MYSQL_DUMP_NAME"
rm -f "$BACKUP_DIR/$PG_DUMP_NAME"

# 5. 上传到 S3 (需要预先配置好 AWS CLI)
# 如果没有配置 AWS CLI，这步会失败。建议使用 rclone 或简单的 curl PUT
echo "[Step 3] 上传到云端存储..."
# 示例：使用 aws cli
# aws s3 cp "$BACKUP_DIR/$FILENAME" "$S3_BUCKET/" --endpoint-url https://s3.bitiful.net

# 示例：如果不方便装 aws cli，可以使用 rclone
# rclone copy "$BACKUP_DIR/$FILENAME" bitiful:backups/

echo "[Success] 备份完成！文件位于: $BACKUP_DIR/$FILENAME"

# 6. 清理本地旧备份 (保留最近 7 天)
find "$BACKUP_DIR" -name "iasbt_stack_backup_*.tar.gz" -mtime +7 -exec rm {} \;
