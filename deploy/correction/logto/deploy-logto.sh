#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
MODE="${1:-local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "未找到环境文件: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1"
    exit 1
  fi
}

assert_isolation() {
  if [[ "${DOCKER_NETWORK:-}" == "correction_default" && "${LOGTO_ALLOW_SHARED_NETWORK:-0}" != "1" ]]; then
    echo "检测到共享账户项目网络 correction_default，已阻止部署。"
    echo "如确需共享网络，请在 .env 设置 LOGTO_ALLOW_SHARED_NETWORK=1。"
    exit 1
  fi
}

run_deploy() {
  local compose_file="$1"
  local env_file="$2"

  echo "==> [1/5] 环境检查"
  need_cmd docker
  need_cmd curl
  docker compose version >/dev/null
  assert_isolation
  : "${LOGTO_CONTAINER_NAME:=logto-core}"
  : "${LOGTO_DB_CONTAINER_NAME:=logto-postgres}"

  echo "==> [2/5] 目录创建"
  mkdir -p "$LOGTO_DATA_DIR/postgres" "$LOGTO_DATA_DIR/logto"

  echo "==> [3/5] Docker 网络配置"
  if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
    docker network create "$DOCKER_NETWORK" >/dev/null
  fi

  echo "==> [4/5] 启动 Logto"
  docker compose --env-file "$env_file" -f "$compose_file" up -d

  echo "==> 等待服务就绪"
  local is_ready=0
  for _ in {1..40}; do
    if curl -fsS "http://127.0.0.1:${LOGTO_PORT}/api/health" >/dev/null 2>&1; then
      is_ready=1
      break
    fi
    sleep 3
  done
  if [[ "$is_ready" -ne 1 ]]; then
    echo "Logto 健康检查未通过，请执行 check-logto.sh 查看详情"
    exit 1
  fi

  echo "==> [5/5] 初始化管理员账户"
  docker compose --env-file "$env_file" -f "$compose_file" exec -T logto sh -lc "npm run cli db seed -- --swe --encrypt-base-role" || true

  echo "==> 触发首次管理员初始化入口"
  echo "请打开: ${LOGTO_ADMIN_URL:-$LOGTO_BASE_URL}"
  echo "使用以下信息完成一次性首个管理员创建："
  echo "用户名: ${LOGTO_ADMIN_USERNAME:-admin}"
  echo "邮箱: ${LOGTO_ADMIN_EMAIL:-admin@local}"
  echo "密码: ${LOGTO_ADMIN_PASSWORD:-请在 .env 中设置}"
}

run_remote() {
  need_cmd ssh
  need_cmd scp

  local server_ip="${DEPLOY_SERVER_IP:?DEPLOY_SERVER_IP 未设置}"
  local server_user="${DEPLOY_USER:-ubuntu}"
  local key_path="${DEPLOY_KEY_PATH:-$HOME/.ssh/id_rsa}"
  local remote_dir="${REMOTE_LOGTO_DIR:-/home/ubuntu/account/deploy/correction/logto}"

  echo "==> 上传部署文件到 ${server_user}@${server_ip}:${remote_dir}"
  ssh -i "$key_path" -o StrictHostKeyChecking=no "${server_user}@${server_ip}" "mkdir -p '$remote_dir'"
  scp -i "$key_path" -o StrictHostKeyChecking=no "$COMPOSE_FILE" "${server_user}@${server_ip}:${remote_dir}/docker-compose.yml"
  scp -i "$key_path" -o StrictHostKeyChecking=no "$ENV_FILE" "${server_user}@${server_ip}:${remote_dir}/.env"
  scp -i "$key_path" -o StrictHostKeyChecking=no "$SCRIPT_DIR/deploy-logto.sh" "${server_user}@${server_ip}:${remote_dir}/deploy-logto.sh"
  scp -i "$key_path" -o StrictHostKeyChecking=no "$SCRIPT_DIR/check-logto.sh" "${server_user}@${server_ip}:${remote_dir}/check-logto.sh"

  echo "==> 在远程服务器执行部署"
  ssh -i "$key_path" -o StrictHostKeyChecking=no "${server_user}@${server_ip}" "bash -s" <<EOF
set -Eeuo pipefail
cd "$remote_dir"
chmod +x ./deploy-logto.sh ./check-logto.sh 2>/dev/null || true
ENV_FILE="$remote_dir/.env" bash "$remote_dir/deploy-logto.sh" local
EOF
}

case "$MODE" in
  local)
    cd "$SCRIPT_DIR"
    run_deploy "$COMPOSE_FILE" "$ENV_FILE"
    ;;
  remote)
    run_remote
    ;;
  *)
    echo "用法: bash deploy-logto.sh [local|remote]"
    exit 1
    ;;
esac
