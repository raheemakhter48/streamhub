# Quick Azure Deployment Script for StreamFlow Backend
# Prerequisites: Azure CLI installed and logged in

param(
    [Parameter(Mandatory=$false)]
    [string]$AppName = "streamflow-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "streamflow-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$MongoUri = "",
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret = ""
)

Write-Host "`n🚀 StreamFlow Backend - Azure Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Azure CLI
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "`n❌ Azure CLI not found!" -ForegroundColor Red
    Write-Host "Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check login
Write-Host "`n📝 Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}

# Get MongoDB URI if not provided
if (-not $MongoUri) {
    Write-Host "`n💾 MongoDB Connection String:" -ForegroundColor Yellow
    Write-Host "Enter your MongoDB Atlas connection string:" -ForegroundColor Cyan
    $MongoUri = Read-Host
}

# Get JWT Secret if not provided
if (-not $JwtSecret) {
    Write-Host "`n🔐 JWT Secret:" -ForegroundColor Yellow
    Write-Host "Enter a secret key for JWT (or press Enter for auto-generated):" -ForegroundColor Cyan
    $JwtSecret = Read-Host
    if (-not $JwtSecret) {
        $JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        Write-Host "Auto-generated JWT Secret: $JwtSecret" -ForegroundColor Green
    }
}

# Create Resource Group
Write-Host "`n📦 Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location | Out-Null

# Create App Service Plan
Write-Host "🌐 Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
  --name "${AppName}-plan" `
  --resource-group $ResourceGroup `
  --sku B1 `
  --is-linux | Out-Null

# Create Web App
Write-Host "🚀 Creating Web App..." -ForegroundColor Yellow
az webapp create `
  --name $AppName `
  --resource-group $ResourceGroup `
  --plan "${AppName}-plan" `
  --runtime "NODE:18-lts" | Out-Null

# Set Environment Variables
Write-Host "⚙️  Setting Environment Variables..." -ForegroundColor Yellow
az webapp config appsettings set `
  --name $AppName `
  --resource-group $ResourceGroup `
  --settings `
    NODE_ENV=production `
    PORT=3000 `
    MONGODB_URI="$MongoUri" `
    JWT_SECRET="$JwtSecret" `
    JWT_EXPIRE=7d `
    FRONTEND_URL="*" | Out-Null

# Deploy Code
Write-Host "📤 Deploying Code..." -ForegroundColor Yellow
$zipFile = "..\backend-deploy.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create ZIP
Get-ChildItem -Path . -Exclude node_modules,*.zip,.git | Compress-Archive -DestinationPath $zipFile -Force

# Deploy
az webapp deployment source config-zip `
  --resource-group $ResourceGroup `
  --name $AppName `
  --src $zipFile | Out-Null

# Cleanup
Remove-Item $zipFile -Force -ErrorAction SilentlyContinue

# Get URL
$backendUrl = "https://${AppName}.azurewebsites.net"

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n🌍 Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host "`n📱 Ab mobile app ko update karein:" -ForegroundColor Yellow
Write-Host "cd ..\mobile" -ForegroundColor Cyan
Write-Host ".\update-api-url.ps1 -BackendUrl $backendUrl" -ForegroundColor Cyan
Write-Host "`n🧪 Test karein:" -ForegroundColor Yellow
Write-Host "$backendUrl/health" -ForegroundColor Cyan

