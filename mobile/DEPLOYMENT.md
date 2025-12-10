# Mobile App Deployment Guide

## 🌐 Backend ko Public URL par Deploy karein

App ko kisi bhi WiFi se kaam karne ke liye, backend ko public URL par deploy karna zaroori hai.

### Option 1: Azure Deployment (Recommended)

#### Step 1: Azure CLI Install karein
```powershell
# Windows
winget install -e --id Microsoft.AzureCLI
```

#### Step 2: Azure Login
```powershell
az login
```

#### Step 3: Backend Deploy karein
```powershell
cd D:\applications\fasco\backend

# Resource Group create
az group create --name streamflow-rg --location eastus

# App Service Plan create
az appservice plan create `
  --name streamflow-plan `
  --resource-group streamflow-rg `
  --sku B1 `
  --is-linux

# Web App create
az webapp create `
  --name streamflow-backend `
  --resource-group streamflow-rg `
  --plan streamflow-plan `
  --runtime "NODE:18-lts"

# Environment Variables set karein
az webapp config appsettings set `
  --name streamflow-backend `
  --resource-group streamflow-rg `
  --settings `
    NODE_ENV=production `
    PORT=3000 `
    MONGODB_URI="your-mongodb-connection-string" `
    JWT_SECRET="your-jwt-secret-key" `
    JWT_EXPIRE=7d `
    FRONTEND_URL="*"
```

#### Step 4: Code Deploy karein
```powershell
# ZIP create
Compress-Archive -Path * -DestinationPath ../backend.zip -Force

# Deploy
az webapp deployment source config-zip `
  --resource-group streamflow-rg `
  --name streamflow-backend `
  --src ../backend.zip
```

#### Step 5: Backend URL mil jayega
```
https://streamflow-backend.azurewebsites.net
```

---

### Option 2: ngrok (Quick Testing)

Agar Azure deploy nahi karna, to ngrok se quickly test kar sakte hain:

#### Step 1: ngrok Install
```powershell
# Download from https://ngrok.com/download
# Or use chocolatey
choco install ngrok
```

#### Step 2: Backend Start karein
```powershell
cd D:\applications\fasco\backend
npm run dev
```

#### Step 3: ngrok Start
```powershell
ngrok http 3000
```

#### Step 4: ngrok URL copy karein
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

---

## 📱 Mobile App ko Update karein

### Step 1: API Config Update

`mobile/src/config/api.ts` file mein production URL update karein:

```typescript
// Azure URL (after deployment)
const PRODUCTION_API_URL = 'https://streamflow-backend.azurewebsites.net/api';

// OR ngrok URL (for testing)
const PRODUCTION_API_URL = 'https://abc123.ngrok.io/api';
```

### Step 2: Production Mode Enable

`mobile/src/config/api.ts` mein yeh line uncomment karein:

```typescript
// Production mode - always use production URL
export const API_URL = PRODUCTION_API_URL;
```

Aur yeh line comment karein:
```typescript
// export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
```

### Step 3: New APK Build karein

```powershell
cd D:\applications\fasco\mobile\android
.\gradlew assembleRelease
```

### Step 4: APK Install karein

Desktop par `app-release.apk` copy ho jayega, usko phone par install karein.

---

## ✅ Testing

1. **Backend Health Check:**
   ```
   https://your-backend-url/health
   ```
   Should return: `{"status":"ok"}`

2. **Mobile App:**
   - Kisi bhi WiFi se connect karein
   - App open karein
   - Login/Register karein
   - Channels load honge

---

## 🔧 Troubleshooting

### Backend not accessible?
- Check Azure logs: `az webapp log tail --name streamflow-backend --resource-group streamflow-rg`
- Verify environment variables
- Check MongoDB connection

### App can't connect?
- Verify `API_URL` in `mobile/src/config/api.ts`
- Check backend is running
- Test backend URL in browser: `https://your-backend-url/health`

### Network errors?
- Make sure backend allows CORS (already configured)
- Check firewall settings
- Verify backend is publicly accessible

---

## 🎯 Final Checklist

- [ ] Backend deployed to Azure/ngrok
- [ ] Backend URL tested in browser
- [ ] `mobile/src/config/api.ts` updated with production URL
- [ ] Production mode enabled in API config
- [ ] New APK built
- [ ] APK installed on phone
- [ ] App tested on different WiFi network

---

**Ab app kisi bhi WiFi se kaam karega! 🚀**

