#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "未找到环境文件: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a
: "${LOGTO_CONTAINER_NAME:=logto-core}"
: "${LOGTO_DB_CONTAINER_NAME:=logto-postgres}"

DOCKER_CMD=(docker)
if ! docker info >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1 && sudo -n docker info >/dev/null 2>&1; then
    DOCKER_CMD=(sudo docker)
  else
    echo "当前用户无 Docker 权限。请执行: sudo usermod -aG docker \$USER ; newgrp docker"
    exit 1
  fi
fi

echo "==> [1/3] 验证容器运行状态"
"${DOCKER_CMD[@]}" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

if [[ "$("${DOCKER_CMD[@]}" inspect -f '{{.State.Running}}' "$LOGTO_CONTAINER_NAME" 2>/dev/null || echo false)" != "true" ]]; then
  echo "Logto 容器未运行: $LOGTO_CONTAINER_NAME"
  exit 1
fi

if [[ "$("${DOCKER_CMD[@]}" inspect -f '{{.State.Running}}' "$LOGTO_DB_CONTAINER_NAME" 2>/dev/null || echo false)" != "true" ]]; then
  echo "PostgreSQL 容器未运行: $LOGTO_DB_CONTAINER_NAME"
  exit 1
fi

echo "==> [2/3] 验证数据库连接"
"${DOCKER_CMD[@]}" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "==> [3/3] 验证 API 可访问性"
HEALTH_URL="${LOGTO_BASE_URL}/api/status"
if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "健康检查通过: $HEALTH_URL"
else
  echo "域名健康检查失败，尝试本地端口..."
  curl -fsS "http://127.0.0.1:${LOGTO_PORT}/api/status" >/dev/null
  echo "本地端口健康检查通过: http://127.0.0.1:${LOGTO_PORT}/api/status"
fi

echo "Logto 部署验证完成"
