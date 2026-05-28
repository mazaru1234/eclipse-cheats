#!/usr/bin/env bash
# Запуск на сервере из ~/eclipse:  bash deploy/apply-on-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPLOADS_DIR="/var/lib/eclipse-cheats/uploads"
APP_DIR="$ROOT"

echo "=== 1. Папки uploads ==="
mkdir -p "$UPLOADS_DIR/product-lines" "$UPLOADS_DIR/categories"
mkdir -p "$APP_DIR/public"
chmod -R 755 /var/lib/eclipse-cheats "$UPLOADS_DIR" 2>/dev/null || true
chmod 755 /root /root/eclipse /root/eclipse/public 2>/dev/null || true

if [ -d "$APP_DIR/public/uploads" ] && [ ! -L "$APP_DIR/public/uploads" ]; then
  echo "Копирую старые фото в $UPLOADS_DIR ..."
  cp -an "$APP_DIR/public/uploads/product-lines/." "$UPLOADS_DIR/product-lines/" 2>/dev/null || true
  cp -an "$APP_DIR/public/uploads/categories/." "$UPLOADS_DIR/categories/" 2>/dev/null || true
fi

rm -rf "$APP_DIR/public/uploads"
ln -sf "$UPLOADS_DIR" "$APP_DIR/public/uploads"
echo "Symlink: public/uploads -> $UPLOADS_DIR"

echo
echo "=== 2. nginx ==="
cp "$ROOT/deploy/nginx/eclipse-cheats.ru" /etc/nginx/sites-available/eclipse-cheats.ru
ln -sf /etc/nginx/sites-available/eclipse-cheats.ru /etc/nginx/sites-enabled/eclipse-cheats.ru
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "nginx OK"

echo
echo "=== 3. PM2 ==="
cd "$ROOT"
pm2 restart eclipse --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save
if ! systemctl is-enabled pm2-root >/dev/null 2>&1; then
  echo "Подсказка: после перезагрузки VPS запусти один раз: pm2 startup && pm2 save"
fi

echo
echo "=== 4. Проверка ==="
FILE=$(ls "$UPLOADS_DIR/product-lines/" 2>/dev/null | head -1 || true)
if [ -n "$FILE" ]; then
  echo "Файл: $FILE"
  curl -sI "https://eclipse-cheats.ru/uploads/product-lines/$FILE" | head -5
else
  echo "В product-lines пока нет файлов — загрузите фото в админке"
fi

echo
echo "Готово."
