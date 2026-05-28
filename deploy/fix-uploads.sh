#!/usr/bin/env bash
set -euo pipefail

UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/eclipse-cheats/uploads}"
APP_DIR="${APP_DIR:-/root/eclipse}"

echo "==> Uploads dir: $UPLOADS_DIR"
mkdir -p "$UPLOADS_DIR/product-lines" "$UPLOADS_DIR/categories"
mkdir -p "$APP_DIR/public"
chmod -R 755 /var/lib/eclipse-cheats "$UPLOADS_DIR" 2>/dev/null || true
chmod 755 /root /root/eclipse /root/eclipse/public 2>/dev/null || true

if [ -d "$APP_DIR/public/uploads" ] && [ ! -L "$APP_DIR/public/uploads" ]; then
  echo "==> Moving existing uploads into $UPLOADS_DIR"
  shopt -s nullglob
  for dir in product-lines categories; do
    if [ -d "$APP_DIR/public/uploads/$dir" ]; then
      cp -an "$APP_DIR/public/uploads/$dir/." "$UPLOADS_DIR/$dir/" 2>/dev/null || true
    fi
  done
fi

echo "==> Symlink public/uploads -> $UPLOADS_DIR"
rm -rf "$APP_DIR/public/uploads"
ln -sf "$UPLOADS_DIR" "$APP_DIR/public/uploads"

echo "==> Done. Files:"
ls -la "$UPLOADS_DIR/product-lines/" | head

echo
echo "Test one file:"
FILE=$(ls "$UPLOADS_DIR/product-lines/" 2>/dev/null | head -1 || true)
if [ -n "$FILE" ]; then
  curl -I "http://127.0.0.1:3000/uploads/product-lines/$FILE" || true
  echo "Also test: curl -I https://eclipse-cheats.ru/uploads/product-lines/$FILE"
else
  echo "No files in product-lines yet"
fi
