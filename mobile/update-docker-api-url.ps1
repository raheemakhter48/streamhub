# Update Mobile App API URL for Docker Deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

$apiConfigPath = "src/config/api.ts"

if (-not (Test-Path $apiConfigPath)) {
    Write-Host "❌ API config file not found: $apiConfigPath" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$ApiUrl = $ApiUrl.TrimEnd('/')
# Add /api if not present
if (-not $ApiUrl.EndsWith('/api')) {
    $ApiUrl = "$ApiUrl/api"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "UPDATING API URL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "New API URL: $ApiUrl`n" -ForegroundColor Yellow

# Read current file
$content = Get-Content $apiConfigPath -Raw

# Update PRODUCTION_API_URL
$content = $content -replace "const PRODUCTION_API_URL = '[^']*';", "const PRODUCTION_API_URL = '$ApiUrl';"

# Ensure we're using PRODUCTION_API_URL
$content = $content -replace "// export const API_URL = __DEV__.*", "// export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;"
$content = $content -replace "export const API_URL = [^;]*;", "export const API_URL = PRODUCTION_API_URL;"

# Write back
Set-Content -Path $apiConfigPath -Value $content -NoNewline

Write-Host "✅ API URL updated successfully!" -ForegroundColor Green
Write-Host "`nFile: $apiConfigPath" -ForegroundColor Gray
Write-Host "New URL: $ApiUrl`n" -ForegroundColor Gray

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild mobile app: npm run android" -ForegroundColor White
Write-Host "2. Test connection to backend`n" -ForegroundColor White

