#!/usr/bin/env bash
# Копирует static/public в standalone после next build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .next/standalone/server.js ]]; then
  echo "Сначала выполните: npm run build"
  exit 1
fi

mkdir -p .next/standalone/.next
mkdir -p .next/standalone/public

rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static

if [[ -L public/uploads ]]; then
  rm -rf .next/standalone/public/uploads
  cp -a public/uploads .next/standalone/public/uploads
elif [[ -d public ]]; then
  rsync -a --delete public/ .next/standalone/public/ 2>/dev/null || cp -a public/. .next/standalone/public/
fi

echo "Standalone готов: .next/standalone/server.js"
