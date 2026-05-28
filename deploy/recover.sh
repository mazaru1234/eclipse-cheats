#!/usr/bin/env bash
# Если VPS перезагрузился и сайт не открывается: bash deploy/recover.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== nginx ==="
systemctl start nginx 2>/dev/null || true
nginx -t && systemctl reload nginx

echo "=== PM2 ==="
if pm2 describe eclipse >/dev/null 2>&1; then
  pm2 restart eclipse --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "=== статус ==="
pm2 status
curl -sI "http://127.0.0.1:3000/" | sed -n '1,3p' || echo "Next.js не отвечает на :3000"
curl -sI "https://eclipse-cheats.ru/" | sed -n '1,3p' || echo "HTTPS не отвечает"

echo "Готово."
