#!/usr/bin/env sh
set -eu

SOURCE_DIR="${1:-}"

if [ -z "$SOURCE_DIR" ]; then
  echo "Usage: scripts/restore.sh <backup-directory>"
  exit 1
fi

if [ ! -f "$SOURCE_DIR/database.sql" ]; then
  echo "database.sql not found in $SOURCE_DIR"
  exit 1
fi

if command -v docker >/dev/null 2>&1; then
  echo "Restoring PostgreSQL..."
  docker compose exec -T postgres psql -U "${POSTGRES_USER:-blog}" "${POSTGRES_DB:-blog}" < "$SOURCE_DIR/database.sql"

  if [ -d "$SOURCE_DIR/minio" ]; then
    echo "Restoring MinIO data is handled by replacing the minio_data volume while MinIO is stopped."
  fi

  echo "Restore completed. Rebuild or restart the stack as needed."
else
  echo "Docker is not available."
  exit 1
fi
