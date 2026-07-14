#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
INIT_DB_SCRIPT="$SCRIPT_DIR/init_db.sh"
FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env"

IMAGE_NAME="${BACKEND_IMAGE:-${1:-}}"
CONTAINER_NAME="${BACKEND_CONTAINER_NAME:-backend_app}"
APP_PORT="${BACKEND_PORT:-8000}"
DOCKER_NETWORK="${CODEMAP_DOCKER_NETWORK:-codemap-net}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-generic}"
INGRESS_MODE="${INGRESS_MODE:-direct}"
PUBLIC_BACKEND_URL="${PUBLIC_BACKEND_URL:-${DIRECT_PUBLIC_URL:-}}"
INGRESS_CHECK_REQUIRED="${INGRESS_CHECK_REQUIRED:-false}"
NGINX_CHECK_REQUIRED="${NGINX_CHECK_REQUIRED:-$INGRESS_CHECK_REQUIRED}"
NGINX_EXPECTED_PROXY="${NGINX_EXPECTED_PROXY:-http://127.0.0.1:$APP_PORT}"
NGINX_PUBLIC_URL="${NGINX_PUBLIC_URL:-$PUBLIC_BACKEND_URL}"

if [ -z "$IMAGE_NAME" ]; then
  echo "BACKEND_IMAGE or the first argument is required."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing backend env file: $ENV_FILE"
  exit 1
fi

read_env_value() {
  grep -E "^[[:space:]]*$1[[:space:]]*=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f2- | tr -d '\r' | xargs 2>/dev/null || true
}

read_frontend_env_value() {
  if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    return 0
  fi
  grep -E "^[[:space:]]*$1[[:space:]]*=" "$FRONTEND_ENV_FILE" | tail -n 1 | cut -d '=' -f2- | tr -d '\r' | xargs 2>/dev/null || true
}

normalize_url_without_trailing_slash() {
  local value="$1"
  value="${value%/}"
  printf "%s" "$value"
}

run_required_or_warn() {
  local message="$1"
  if [ "$INGRESS_CHECK_REQUIRED" = "true" ] || [ "$NGINX_CHECK_REQUIRED" = "true" ]; then
    echo "Ingress check failed: $message"
    exit 1
  fi
  echo "Ingress check warning: $message"
}

http_probe() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -kfsS "$url" >/dev/null 2>&1
    return $?
  fi
  if command -v wget >/dev/null 2>&1; then
    wget --no-check-certificate -q --spider "$url" >/dev/null 2>&1
    return $?
  fi
  return 127
}

extract_database_url_host() {
  local value="$1"
  local host=""
  if [ -n "$value" ]; then
    host="$(printf "%s" "$value" | sed -E 's#^[^@]*@([^/:?]+).*#\1#')"
    if [ "$host" = "$value" ]; then
      host=""
    fi
  fi
  printf "%s" "$host"
}

replace_database_url_host() {
  local value="$1"
  local host="$2"
  if [ -z "$value" ]; then
    return 0
  fi
  printf "%s" "$value" | sed -E "s#^([^:]+://[^@/]*@)[^/:?]+#\\1$host#; t done; s#^([^:]+://)[^/:?@]+#\\1$host#; :done"
}

is_local_db_target() {
  case "$1" in
    ""|"localhost"|"127.0.0.1"|"::1"|"db"|"postgresql-17")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

run_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    echo "Docker Compose is required for local DB setup."
    exit 1
  fi
}

resolve_clone_path() {
  local clone_path os_type
  clone_path="$(read_env_value CLONE_BASE_DIR)"
  if [ -z "$clone_path" ]; then
    os_type="$(uname -s 2>/dev/null || echo Linux)"
    if [[ "$os_type" == *"NT"* ]] || [[ "$os_type" == *"MINGW"* ]] || [[ "$os_type" == *"MSYS"* ]]; then
      clone_path="$(read_env_value CLONE_BASE_DIR_WINDOWS)"
    else
      clone_path="$(read_env_value CLONE_BASE_DIR_UNIX)"
    fi
  fi
  if [ -z "$clone_path" ]; then
    os_type="$(uname -s 2>/dev/null || echo Linux)"
    if [[ "$os_type" == *"NT"* ]] || [[ "$os_type" == *"MINGW"* ]] || [[ "$os_type" == *"MSYS"* ]]; then
      clone_path="C:/temp/codemap/jobs"
    else
      clone_path="/tmp/codemap/jobs"
    fi
  fi
  printf "%s" "$clone_path"
}

check_backend_local_health() {
  local url="http://127.0.0.1:$APP_PORT/"
  local attempt
  echo "Checking backend container health at $url"
  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    echo "curl or wget is required to verify backend HTTP health; skipping local HTTP probe."
    return 0
  fi
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if http_probe "$url"; then
      echo "Backend responded on local port $APP_PORT."
      return 0
    fi
    sleep 2
  done
  echo "Backend did not respond on local port $APP_PORT within the wait window."
  docker logs --tail 80 "$CONTAINER_NAME" || true
  exit 1
}

check_nginx_forwarding() {
  local config expected public_url status_found proxy_found
  expected="$NGINX_EXPECTED_PROXY"
  public_url="$(normalize_url_without_trailing_slash "$NGINX_PUBLIC_URL")"

  if [ -z "$public_url" ]; then
    public_url="$(normalize_url_without_trailing_slash "$(read_frontend_env_value BACKEND_URL)")"
  fi

  echo "Checking Nginx port forwarding configuration."
  echo "Expected upstream target: $expected"

  if ! command -v nginx >/dev/null 2>&1; then
    run_required_or_warn "nginx command is not installed."
    return 0
  fi

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
      echo "Nginx service is active."
    else
      run_required_or_warn "nginx service is not active."
    fi
  fi

  if nginx -t >/dev/null 2>&1; then
    echo "Nginx configuration syntax is valid."
  else
    run_required_or_warn "nginx -t reported an invalid configuration."
  fi

  config="$(nginx -T 2>/dev/null || true)"
  proxy_found="false"
  if printf "%s" "$config" | grep -F "proxy_pass $expected" >/dev/null 2>&1; then
    proxy_found="true"
  elif printf "%s" "$config" | grep -F "proxy_pass http://localhost:$APP_PORT" >/dev/null 2>&1; then
    proxy_found="true"
  fi

  if [ "$proxy_found" = "true" ]; then
    echo "Nginx proxy_pass points to the backend port."
  else
    run_required_or_warn "proxy_pass to $expected was not found in nginx -T output."
  fi

  status_found="false"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -E ':(80|443)[[:space:]]' >/dev/null 2>&1; then
      status_found="true"
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -ltn | grep -E ':(80|443)[[:space:]]' >/dev/null 2>&1; then
      status_found="true"
    fi
  fi

  if [ "$status_found" = "true" ]; then
    echo "Nginx appears to be listening on HTTP/HTTPS ports."
  else
    run_required_or_warn "could not confirm that ports 80 or 443 are listening."
  fi

  if [ -n "$public_url" ]; then
    echo "Checking public backend URL through Nginx: $public_url"
    if http_probe "$public_url/" || http_probe "$public_url"; then
      echo "Public backend URL responded through Nginx."
    else
      run_required_or_warn "public backend URL did not respond: $public_url"
    fi
  else
    echo "No NGINX_PUBLIC_URL or frontend BACKEND_URL found; skipped public URL check."
  fi
}

check_listening_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | grep -E ":$port[[:space:]]" >/dev/null 2>&1
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ltn | grep -E ":$port[[:space:]]" >/dev/null 2>&1
    return $?
  fi
  return 127
}

resolve_public_backend_url() {
  local public_url
  public_url="$(normalize_url_without_trailing_slash "$PUBLIC_BACKEND_URL")"
  if [ -z "$public_url" ]; then
    public_url="$(normalize_url_without_trailing_slash "$(read_frontend_env_value BACKEND_URL)")"
  fi
  printf "%s" "$public_url"
}

print_ingress_guidance() {
  echo "Cloud provider: $CLOUD_PROVIDER"
  echo "Ingress mode: $INGRESS_MODE"

  case "$CLOUD_PROVIDER:$INGRESS_MODE" in
    gcp:direct)
      echo "GCP direct mode: allow tcp:$APP_PORT in VPC firewall rules for the VM target."
      ;;
    aws:direct)
      echo "AWS direct mode: allow tcp:$APP_PORT in the instance security group inbound rules."
      ;;
    gcp:load-balancer)
      echo "GCP load-balancer mode: configure backend service health checks to target port $APP_PORT."
      ;;
    aws:load-balancer)
      echo "AWS load-balancer mode: configure ALB/NLB target group health checks to target port $APP_PORT."
      ;;
    *:nginx)
      echo "Nginx mode: Nginx should proxy to $NGINX_EXPECTED_PROXY."
      ;;
    *)
      echo "Generic mode: expose or route traffic to server port $APP_PORT."
      ;;
  esac
}

check_direct_or_lb_ingress() {
  local public_url
  print_ingress_guidance

  if check_listening_port "$APP_PORT"; then
    echo "Backend port $APP_PORT is listening on this server."
  else
    run_required_or_warn "could not confirm that backend port $APP_PORT is listening."
  fi

  public_url="$(resolve_public_backend_url)"
  if [ -n "$public_url" ]; then
    echo "Checking public backend URL: $public_url"
    if http_probe "$public_url/" || http_probe "$public_url"; then
      echo "Public backend URL responded."
    else
      run_required_or_warn "public backend URL did not respond: $public_url"
    fi
  else
    echo "No PUBLIC_BACKEND_URL, DIRECT_PUBLIC_URL, or frontend BACKEND_URL found; skipped public endpoint check."
  fi
}

check_ingress() {
  case "$INGRESS_MODE" in
    nginx)
      print_ingress_guidance
      check_nginx_forwarding
      ;;
    direct|load-balancer|none)
      if [ "$INGRESS_MODE" = "none" ]; then
        echo "Ingress mode is none; skipped public ingress checks."
        return 0
      fi
      check_direct_or_lb_ingress
      ;;
    *)
      run_required_or_warn "unknown INGRESS_MODE '$INGRESS_MODE'. Use direct, nginx, load-balancer, or none."
      ;;
  esac
}

DB_HOST_VALUE="$(read_env_value DB_HOST)"
DATABASE_URL_VALUE="$(read_env_value DATABASE_URL)"
DATABASE_URL_HOST="$(extract_database_url_host "$DATABASE_URL_VALUE")"
DB_TARGET="${DB_HOST_VALUE:-$DATABASE_URL_HOST}"
DB_TARGET_LOWER="$(printf "%s" "$DB_TARGET" | tr '[:upper:]' '[:lower:]')"
CLONE_PATH="$(resolve_clone_path)"

echo "Using backend image: $IMAGE_NAME"
echo "Clone volume path: $CLONE_PATH"
mkdir -p "$CLONE_PATH"

docker network create "$DOCKER_NETWORK" >/dev/null 2>&1 || true

DOCKER_DB_ARGS=()
if is_local_db_target "$DB_TARGET_LOWER"; then
  echo "Local DB target detected (${DB_TARGET:-empty}). Preparing PostgreSQL container."
  run_compose up -d db
  docker network connect "$DOCKER_NETWORK" postgresql-17 >/dev/null 2>&1 || true
  "$INIT_DB_SCRIPT"
  DOCKER_DB_ARGS=(--network "$DOCKER_NETWORK" -e DB_HOST=postgresql-17)
  if [ -n "$DATABASE_URL_VALUE" ]; then
    LOCAL_DATABASE_URL="$(replace_database_url_host "$DATABASE_URL_VALUE" postgresql-17)"
    DOCKER_DB_ARGS+=(-e "DATABASE_URL=$LOCAL_DATABASE_URL")
  fi
else
  echo "External SQL server detected in backend/.env: $DB_TARGET"
  echo "Skipping local database container and database/init.sql setup."
  DOCKER_DB_ARGS=(--network "$DOCKER_NETWORK")
fi

echo "Pulling backend image."
docker pull "$IMAGE_NAME"

echo "Replacing backend container."
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  -p "$APP_PORT:8000" \
  -v "$CLONE_PATH:$CLONE_PATH" \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  "${DOCKER_DB_ARGS[@]}" \
  "$IMAGE_NAME"

check_backend_local_health
check_ingress

echo "Pruning unused Docker images."
docker image prune -f

echo "Backend deployment completed."
