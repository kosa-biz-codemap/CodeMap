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
  grep -E "^[[:space:]]*$1[[:space:]]*=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f2- | tr -d '\r' | xargs 2>/dev/null || true
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

DB_HOST_VALUE="$(read_env_value DB_HOST)"
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
until docker exec postgresql-17 pg_isready -U codemap -d codemap; do
  sleep 1
done

echo "Applying local database schema from database/init.sql..."
docker exec -i postgresql-17 psql -U codemap -d codemap < "$INIT_SQL"

echo "Database schema initialization completed."
