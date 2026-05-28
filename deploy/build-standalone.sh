#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.production ]]; then
  echo "Create .env.production from .env.production.example first."
  exit 1
fi

set -a
source .env.production
set +a

export NEXT_TELEMETRY_DISABLED=1

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js standalone"
npm run build

echo "==> Preparing release directory"
RELEASE="${RELEASE_DIR:-/var/www/eclipse-cheats}"
sudo mkdir -p "$RELEASE"
sudo rsync -a --delete \
  .next/standalone/ \
  .next/static/ \
  public/ \
  drizzle/ \
  "$RELEASE/"

sudo mkdir -p "$RELEASE/.next"
sudo rsync -a .next/static/ "$RELEASE/.next/static/"

sudo mkdir -p /var/lib/eclipse-cheats
sudo chown -R "$(whoami):$(whoami)" "$RELEASE" /var/lib/eclipse-cheats 2>/dev/null || true

echo "==> Done. Standalone app is in $RELEASE"
echo "Run: cd $RELEASE && NODE_ENV=production node server.js"
