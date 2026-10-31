#!/usr/bin/env bash
set -euo pipefail

cd /opt/baby-shop
exec 9>/opt/baby-shop/.deploy.lock
flock -n 9 || exit 0

if ! getent passwd babyshop-api >/dev/null; then
  sudo useradd --system --uid 10001 --user-group --no-create-home --home-dir /nonexistent --shell /sbin/nologin babyshop-api
fi

git fetch --quiet origin main
target="$(git rev-parse origin/main)"
deployed="$(cat /opt/baby-shop/.deployed-revision 2>/dev/null || true)"

if [[ "$deployed" == "$target" ]]; then
  exit 0
fi

git merge --ff-only origin/main
docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml build api
docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml up -d --no-deps api

for _ in {1..30}; do
  status="$(docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml ps --format '{{.Health}}' api 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    printf '%s\n' "$target" > /opt/baby-shop/.deployed-revision
    exit 0
  fi
  if [[ "$status" == "unhealthy" ]]; then
    echo "Baby Shop API health check failed at $target" >&2
    exit 1
  fi
  sleep 2
done

echo "Timed out waiting for Baby Shop API health check at $target" >&2
exit 1
