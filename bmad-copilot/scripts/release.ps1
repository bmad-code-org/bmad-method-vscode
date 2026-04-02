# release.ps1 — BMAD Copilot Adapter release helper (Windows)
# Usage: .\scripts\release.ps1 [-Bump patch|minor|major]
param(
    [ValidateSet("patch", "minor", "major")]
    [string]$Bump = "patch"
)

$ErrorActionPreference = "Stop"

Write-Host "=== BMAD Copilot Adapter Release ===" -ForegroundColor Cyan
Write-Host "Bump type: $Bump"
Write-Host ""

# Pre-flight checks
Write-Host "[1/6] Pre-flight checks..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "ERROR: Working tree has uncommitted changes. Commit or stash first." -ForegroundColor Red
    exit 1
}

Write-Host "[2/6] Clean build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/6] Type-check..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/6] Bump version ($Bump)..." -ForegroundColor Yellow
npm version $Bump -m "release: %s"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/6] Push tag to remote..." -ForegroundColor Yellow
git push --follow-tags
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[6/6] Publish to npm..." -ForegroundColor Yellow
npm publish --access public
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Release complete ===" -ForegroundColor Green
Write-Host "npm: https://www.npmjs.com/package/bmad-copilot-adapter"
Write-Host ""
Write-Host "To publish VSIX to VS Code Marketplace:"
Write-Host "  npx @vscode/vsce publish"
Write-Host ""
Write-Host "To build VSIX locally:"
Write-Host "  npm run vsce:package"
