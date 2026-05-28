#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${DATA_DIR:-/var/lib/eclipse-cheats}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/www/eclipse-cheats/public/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/eclipse-cheats}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/$STAMP"

mkdir -p "$TARGET"

if [[ -f "$DATA_DIR/eclipse.db" ]]; then
  sqlite3 "$DATA_DIR/eclipse.db" ".backup '$TARGET/eclipse.db'"
  echo "DB backup: $TARGET/eclipse.db"
fi

if [[ -d "$UPLOADS_DIR" ]]; then
  tar -czf "$TARGET/uploads.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  echo "Uploads backup: $TARGET/uploads.tar.gz"
fi

echo "Backup complete: $TARGET"
