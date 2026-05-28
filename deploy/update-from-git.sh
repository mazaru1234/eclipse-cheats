#!/usr/bin/env bash
# Обновление с GitHub на сервере: bash deploy/update-from-git.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== git pull ==="
git pull --ff-only

echo "=== миграции (если нужны) ==="
sqlite3 /var/lib/eclipse-cheats/eclipse.db "ALTER TABLE products ADD COLUMN external_url text;" 2>/dev/null || true

echo "=== build ==="
unset NODE_ENV
npm install --include=dev
npm run build
bash deploy/prepare-standalone.sh

echo "=== PM2 ==="
pm2 restart eclipse --update-env
pm2 save

echo "Готово: $(git log -1 --oneline)"
