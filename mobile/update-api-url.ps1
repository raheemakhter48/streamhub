# Quick script to update API URL in mobile app
param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

$configFile = "src\config\api.ts"

if (-not (Test-Path $configFile)) {
    Write-Host "❌ Config file not found: $configFile" -ForegroundColor Red
    exit 1
}

# Remove trailing slash
$BackendUrl = $BackendUrl.TrimEnd('/')

# Add /api if not present
if (-not $BackendUrl.EndsWith('/api')) {
    $BackendUrl = "$BackendUrl/api"
}

Write-Host "`n🔄 Updating API URL to: $BackendUrl" -ForegroundColor Cyan

# Read current file
$content = Get-Content $configFile -Raw

# Update PRODUCTION_API_URL
$content = $content -replace "const PRODUCTION_API_URL = '[^']*';", "const PRODUCTION_API_URL = '$BackendUrl';"

# Enable production mode (uncomment production line, comment dev line)
$content = $content -replace "// export const API_URL = PRODUCTION_API_URL;", "export const API_URL = PRODUCTION_API_URL;"
$content = $content -replace "export const API_URL = __DEV__ \? DEVELOPMENT_API_URL : PRODUCTION_API_URL;", "// export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;"

# Write back
Set-Content -Path $configFile -Value $content -NoNewline

Write-Host "✅ API URL updated successfully!" -ForegroundColor Green
Write-Host "`n📱 Ab naya APK build karein:" -ForegroundColor Yellow
Write-Host "cd android" -ForegroundColor Cyan
Write-Host ".\gradlew assembleRelease" -ForegroundColor Cyan

