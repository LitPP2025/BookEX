#!/usr/bin/env sh
set -eu

echo "⏳ Waiting for Postgres..."
until python - <<'PY'
import os, sys
import psycopg2
from urllib.parse import urlparse

url = os.environ.get("DATABASE_URL")
if not url:
    print("DATABASE_URL is not set", file=sys.stderr)
    sys.exit(1)

u = urlparse(url)
try:
    conn = psycopg2.connect(
        dbname=(u.path or "").lstrip("/"),
        user=u.username,
        password=u.password,
        host=u.hostname,
        port=u.port or 5432,
    )
    conn.close()
except Exception:
    sys.exit(1)
PY
do
  sleep 1
done
echo "✅ Postgres is ready"

if [ -n "${MINIO_ENDPOINT:-}" ]; then
  MINIO_SCHEME="http"
  if [ "${MINIO_SECURE:-false}" = "true" ]; then
    MINIO_SCHEME="https"
  fi
  echo "⏳ Waiting for MinIO at ${MINIO_SCHEME}://${MINIO_ENDPOINT}..."
  until curl -fsS "${MINIO_SCHEME}://${MINIO_ENDPOINT}/minio/health/ready" >/dev/null 2>&1; do
    sleep 1
  done
  echo "✅ MinIO is ready"
fi

echo "🗄️  Running migrations..."
alembic upgrade head

echo "🚀 Starting backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

