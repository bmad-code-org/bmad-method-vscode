#!/usr/bin/env bash
# release.sh — BMAD Copilot Adapter release helper
# Usage: ./scripts/release.sh [patch|minor|major]
set -euo pipefail

BUMP="${1:-patch}"

echo "=== BMAD Copilot Adapter Release ==="
echo "Bump type: $BUMP"
echo ""

# Pre-flight checks
echo "[1/6] Pre-flight checks..."
if ! git diff --quiet; then
  echo "ERROR: Working tree has uncommitted changes. Commit or stash first."
  exit 1
fi

if ! git diff --cached --quiet; then
  echo "ERROR: Staged changes detected. Commit first."
  exit 1
fi

echo "[2/6] Clean build..."
npm run build

echo "[3/6] Type-check..."
npm run lint

echo "[4/6] Bump version ($BUMP)..."
npm version "$BUMP" -m "release: %s"

echo "[5/6] Push tag to remote..."
git push --follow-tags

echo "[6/6] Publish to npm..."
npm publish --access public

echo ""
echo "=== Release complete ==="
echo "npm: https://www.npmjs.com/package/bmad-copilot-adapter"
echo ""
echo "To publish VSIX to VS Code Marketplace:"
echo "  npx @vscode/vsce publish"
echo ""
echo "To build VSIX locally:"
echo "  npm run vsce:package"
