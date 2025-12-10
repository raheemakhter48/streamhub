#!/bin/bash

# Azure Deployment Script for StreamFlow Backend

echo "🚀 Starting Azure deployment..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login to Azure (if not already logged in)
echo "📝 Checking Azure login status..."
az account show &> /dev/null || az login

# Set variables (update these)
RESOURCE_GROUP="streamflow-rg"
APP_NAME="streamflow-backend"
LOCATION="eastus"
SKU="B1"  # Basic tier

echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "🌐 Creating App Service plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku $SKU \
  --is-linux

echo "🚀 Creating Web App..."
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "NODE:18-lts"

echo "⚙️  Configuring environment variables..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    MONGODB_URI="your-mongodb-connection-string" \
    JWT_SECRET="your-jwt-secret" \
    JWT_EXPIRE=7d \
    FRONTEND_URL="https://your-frontend-url.com"

echo "✅ Deployment complete!"
echo "🌍 Your API is available at: https://${APP_NAME}.azurewebsites.net"

