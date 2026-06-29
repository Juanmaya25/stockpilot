#!/usr/bin/env bash
# Build the static demo (frontend + in-browser mock backend) and publish it to
# the gh-pages branch, served at https://juanmaya25.github.io/stockpilot/
#
# Usage:  bash scripts/deploy-demo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
REMOTE="$(git -C "$ROOT" remote get-url origin)"
TMP="$(mktemp -d)"

echo "▶ Building static demo (NEXT_PUBLIC_DEMO=1)…"
cd "$WEB"
NEXT_PUBLIC_DEMO=1 npx next build

echo "▶ Preparing gh-pages payload…"
cp -r "$WEB/out/." "$TMP/"
touch "$TMP/.nojekyll"            # stop GitHub Pages' Jekyll from hiding _next/

echo "▶ Publishing to gh-pages…"
cd "$TMP"
git init -q
git checkout -q -b gh-pages
git add -A
git commit -q -m "Deploy StockPilot static demo to GitHub Pages"
git push -q --force "$REMOTE" gh-pages

rm -rf "$TMP"
echo "✓ Done → https://juanmaya25.github.io/stockpilot/"
