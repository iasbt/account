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

DOCKER_CMD=(docker)

init_docker_cmd() {
  if docker info >/dev/null 2>&1; then
    DOCKER_CMD=(docker)
    return
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n docker info >/dev/null 2>&1; then
    DOCKER_CMD=(sudo docker)
    return
  fi
  echo "当前用户无 Docker 权限。请执行: sudo usermod -aG docker \$USER ; newgrp docker"
  exit 1
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
  init_docker_cmd
  "${DOCKER_CMD[@]}" compose version >/dev/null
  assert_isolation
  : "${LOGTO_CONTAINER_NAME:=logto-core}"
  : "${LOGTO_DB_CONTAINER_NAME:=logto-postgres}"

  echo "==> [2/5] 目录创建"
  mkdir -p "$LOGTO_DATA_DIR/postgres" "$LOGTO_DATA_DIR/logto"

  echo "==> [3/5] Docker 网络配置"
  if ! "${DOCKER_CMD[@]}" network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
    "${DOCKER_CMD[@]}" network create "$DOCKER_NETWORK" >/dev/null
  fi

  echo "==> [4/5] 启动 PostgreSQL 并执行数据库变更"
  "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" up -d postgres
  local logto_version
  logto_version="$("${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" run --rm --entrypoint sh logto -lc "npm run cli -- --version | grep -Eo '[0-9]+\\.[0-9]+\\.[0-9]+' | head -n 1")"
  logto_version="$(printf '%s' "$logto_version" | tr -d '\r' | tail -n 1)"
  if [[ -z "$logto_version" ]]; then
    echo "无法获取 Logto 版本号，停止部署。"
    exit 1
  fi
  echo "==> 数据库变更目标版本: $logto_version"

  echo "==> 等待数据库就绪..."
  for i in {1..30}; do
    if "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done

  # Check if DB is initialized (has logto_config table)
  if "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-logto} -c "SELECT 1 FROM logto_config LIMIT 1;" >/dev/null 2>&1; then
    echo "检测到现有数据库，执行升级变更..."
    "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" run --rm --entrypoint sh logto -lc "npm run alteration deploy $logto_version"
  else
    echo "检测到空数据库，执行初始化 (seed)..."
    "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" run --rm --entrypoint sh logto -lc "npm run cli db seed -- --swe --encrypt-base-role"
  fi
  "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" up -d logto

  echo "==> 等待服务就绪"
  local is_ready=0
  for _ in {1..40}; do
    if curl -fsS "http://127.0.0.1:${LOGTO_PORT}/api/status" >/dev/null 2>&1; then
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
  "${DOCKER_CMD[@]}" compose --env-file "$env_file" -f "$compose_file" exec -T logto sh -lc "npm run cli db seed -- --swe --encrypt-base-role" || true

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
  local resolved_key_path="$key_path"

  if [[ ! -f "$resolved_key_path" && "$key_path" =~ ^[A-Za-z]:[\\/] ]]; then
    local drive_letter
    drive_letter="$(printf '%s' "${key_path:0:1}" | tr '[:upper:]' '[:lower:]')"
    local rest_path
    rest_path="$(printf '%s' "${key_path:2}" | tr '\\' '/')"
    local wsl_style="/mnt/${drive_letter}${rest_path}"
    local msys_style="/${drive_letter}${rest_path}"
    if [[ -f "$wsl_style" ]]; then
      resolved_key_path="$wsl_style"
    elif [[ -f "$msys_style" ]]; then
      resolved_key_path="$msys_style"
    fi
  fi

  if [[ ! -f "$resolved_key_path" ]]; then
    echo "SSH 密钥不存在: $key_path"
    echo "请在 deploy/correction/logto/.env 中设置有效 DEPLOY_KEY_PATH 后重试。"
    exit 1
  fi

  if [[ "$resolved_key_path" == /mnt/* || "$resolved_key_path" == /c/* ]]; then
    local secure_key_path="$HOME/.ssh/logto_deploy_key"
    mkdir -p "$HOME/.ssh"
    cp "$resolved_key_path" "$secure_key_path"
    chmod 600 "$secure_key_path"
    resolved_key_path="$secure_key_path"
  fi

  local ssh_opts=(-i "$resolved_key_path" -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=15)

  echo "==> 上传部署文件到 ${server_user}@${server_ip}:${remote_dir}"
  ssh "${ssh_opts[@]}" "${server_user}@${server_ip}" "mkdir -p '$remote_dir'"
  scp "${ssh_opts[@]}" "$COMPOSE_FILE" "${server_user}@${server_ip}:${remote_dir}/docker-compose.yml"
  scp "${ssh_opts[@]}" "$ENV_FILE" "${server_user}@${server_ip}:${remote_dir}/.env"
  scp "${ssh_opts[@]}" "$SCRIPT_DIR/deploy-logto.sh" "${server_user}@${server_ip}:${remote_dir}/deploy-logto.sh"
  scp "${ssh_opts[@]}" "$SCRIPT_DIR/check-logto.sh" "${server_user}@${server_ip}:${remote_dir}/check-logto.sh"

  echo "==> 在远程服务器执行部署"
  ssh "${ssh_opts[@]}" "${server_user}@${server_ip}" "bash -s" <<EOF
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
