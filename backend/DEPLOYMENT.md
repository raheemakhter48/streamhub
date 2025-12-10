# Azure Deployment Guide

## Prerequisites

1. Azure Account
2. Azure CLI installed
3. MongoDB Atlas account (or MongoDB instance)

## Step 1: Setup MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Add your IP to whitelist

## Step 2: Deploy to Azure

### Option A: Using Azure CLI

```bash
# Make script executable
chmod +x azure-deploy.sh

# Run deployment script
./azure-deploy.sh
```

### Option B: Manual Deployment

1. **Create Resource Group:**
```bash
az group create --name streamflow-rg --location eastus
```

2. **Create App Service Plan:**
```bash
az appservice plan create \
  --name streamflow-plan \
  --resource-group streamflow-rg \
  --sku B1 \
  --is-linux
```

3. **Create Web App:**
```bash
az webapp create \
  --name streamflow-backend \
  --resource-group streamflow-rg \
  --plan streamflow-plan \
  --runtime "NODE:18-lts"
```

4. **Set Environment Variables:**
```bash
az webapp config appsettings set \
  --name streamflow-backend \
  --resource-group streamflow-rg \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    MONGODB_URI="your-mongodb-connection-string" \
    JWT_SECRET="your-secret-key" \
    JWT_EXPIRE=7d \
    FRONTEND_URL="https://your-frontend-url.com"
```

5. **Deploy Code:**
```bash
# Using Git
az webapp deployment source config-local-git \
  --name streamflow-backend \
  --resource-group streamflow-rg

# Or using ZIP deploy
cd backend
zip -r ../backend.zip .
az webapp deployment source config-zip \
  --resource-group streamflow-rg \
  --name streamflow-backend \
  --src ../backend.zip
```

## Step 3: Update Frontend

Update `streamflow-hub/.env`:

```env
VITE_API_URL=https://streamflow-backend.azurewebsites.net/api
```

## Step 4: Test Deployment

Visit: `https://streamflow-backend.azurewebsites.net/health`

Should return: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### Check Logs
```bash
az webapp log tail --name streamflow-backend --resource-group streamflow-rg
```

### Restart App
```bash
az webapp restart --name streamflow-backend --resource-group streamflow-rg
```

