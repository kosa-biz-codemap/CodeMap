#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/backend/.env"
INIT_SQL="$ROOT_DIR/database/init.sql"

read_env_value() {
  if [ ! -f "$ENV_FILE" ]; then
    return 0
  fi
  grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -E "^[[:space:]]*$1[[:space:]]*=" | tail -n 1 | cut -d '=' -f2- | cut -d '#' -f1 | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r'
}

is_local_db_target() {
  case "$1" in
    ""|"localhost"|"127.0.0.1"|"::1"|"db"|"postgresql-17"|"codemap-db")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

DB_HOST_VALUE="$(read_env_value DB_HOST)"
DB_USER="$(read_env_value DB_USER)"
DB_USER="${DB_USER:-codemap}"
DB_NAME="$(read_env_value DB_NAME)"
DB_NAME="${DB_NAME:-codemap}"
DB_PASSWORD="$(read_env_value DB_PASSWORD)"

DATABASE_URL_VALUE="$(read_env_value DATABASE_URL)"
DATABASE_URL_HOST=""

if [ -n "$DATABASE_URL_VALUE" ]; then
  DATABASE_URL_HOST="$(printf "%s" "$DATABASE_URL_VALUE" | sed -E 's#^[^@]*@([^/:?]+).*#\1#')"
  if [ "$DATABASE_URL_HOST" = "$DATABASE_URL_VALUE" ]; then
    DATABASE_URL_HOST=""
  fi
fi

DB_TARGET="${DB_HOST_VALUE:-$DATABASE_URL_HOST}"
DB_TARGET_LOWER="$(printf "%s" "$DB_TARGET" | tr '[:upper:]' '[:lower:]')"

if ! is_local_db_target "$DB_TARGET_LOWER"; then
  echo "External SQL server detected in backend/.env: $DB_TARGET"
  echo "Skipping database/init.sql initialization."
  exit 0
fi

echo "Initializing local CodeMap database schema..."
echo "Waiting for local database container to be ready..."

CONTAINER_ID="$(docker compose -f "$SCRIPT_DIR/docker-compose.yml" --env-file "$ENV_FILE" ps -q db | tr -d '\r')"
if [ -z "$CONTAINER_ID" ]; then
  echo "Local PostgreSQL container service (db) is not running."
  exit 1
fi

READY=false
for i in $(seq 1 60); do
  if docker exec "$CONTAINER_ID" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" != true ]; then
  echo "Database did not become ready in time."
  exit 1
fi

echo "Applying local database schema from database/init.sql..."
if [ -n "$DB_PASSWORD" ]; then
  docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_ID" psql -U "$DB_USER" -d "$DB_NAME" < "$INIT_SQL"
else
  docker exec -i "$CONTAINER_ID" psql -U "$DB_USER" -d "$DB_NAME" < "$INIT_SQL"
fi

echo "Database schema initialization completed."
