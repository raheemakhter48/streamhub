# 🚀 Azure Deployment - Complete Guide

## 📋 Overview

**Backend:** Web aur Mobile dono ke liye **ek hi backend** hai  
**Location:** `backend/` folder  
**Deploy to:** Azure App Service (Linux)

---

## ✅ Prerequisites

1. ✅ Azure Account (portal.azure.com)
2. ✅ MongoDB Atlas connection string
3. ✅ Azure CLI (optional, portal se bhi kar sakte hain)

---

## 🎯 Step-by-Step Deployment

### Step 1: MongoDB Atlas Setup (Agar nahi hai)

1. Visit: https://www.mongodb.com/cloud/atlas
2. Login/Register
3. Create Free Cluster
4. Database Access → Create User
5. Network Access → Add IP: `0.0.0.0/0` (all IPs)
6. Connect → Get connection string
   ```
   mongodb+srv://username:password@cluster.mongodb.net/streamflow
   ```

---

### Step 2: Azure Portal se Deploy (Easiest Method)

#### 2.1 Create Resource Group

1. Azure Portal → Search "Resource groups"
2. Click "Create"
3. **Resource group name:** `streamflow-rg`
4. **Region:** East US (or apna region)
5. Click "Review + create" → "Create"

#### 2.2 Create App Service Plan

1. Azure Portal → Search "App Service plans"
2. Click "Create"
3. **Basics:**
   - **Resource Group:** `streamflow-rg`
   - **Name:** `streamflow-plan`
   - **Operating System:** Linux
   - **Region:** Same as Resource Group
   - **Pricing tier:** Basic B1 (or Free F1 for testing)
4. Click "Review + create" → "Create"

#### 2.3 Create Web App

1. Azure Portal → Search "Web App"
2. Click "Create"
3. **Basics:**
   - **Resource Group:** `streamflow-rg`
   - **Name:** `streamflow-backend` (unique name, change if taken)
   - **Publish:** Code
   - **Runtime stack:** Node 20 LTS (ya Node 22 LTS)
   - ⚠️ Node 18 LTS available nahi hai, Node 20/22 LTS use karein
   - **Operating System:** Linux
   - **Region:** Same as Resource Group
   - **App Service Plan:** `streamflow-plan`
4. Click "Review + create" → "Create"

#### 2.4 Set Environment Variables

1. Web App → Configuration → Application settings
2. Click "+ New application setting" for each:

   ```
   Name: NODE_ENV
   Value: production
   ```

   ```
   Name: PORT
   Value: 3000
   ```

   ```
   Name: MONGODB_URI
   Value: mongodb+srv://username:password@cluster.mongodb.net/streamflow
   ```

   ```
   Name: JWT_SECRET
   Value: your-super-secret-key-min-32-characters
   ```

   ```
   Name: JWT_EXPIRE
   Value: 7d
   ```

   ```
   Name: FRONTEND_URL
   Value: *
   ```

3. Click "Save"

#### 2.5 Deploy Code (ZIP Deploy)

1. **Backend folder ko ZIP karein:**
   ```powershell
   cd D:\applications\fasco\backend
   # node_modules exclude karein
   Compress-Archive -Path * -Exclude node_modules -DestinationPath ..\backend-deploy.zip -Force
   ```

2. **Azure Portal:**
   - Web App → Deployment Center
   - Source: "Local Git" ya "ZIP Deploy"
   - ZIP Deploy select karein
   - ZIP file upload karein
   - Deploy

---

### Step 3: Azure CLI se Deploy (Alternative)

```powershell
# Azure CLI install (agar nahi hai)
winget install -e --id Microsoft.AzureCLI

# Login
az login

# Deployment script run
cd D:\applications\fasco\backend
.\quick-deploy-azure.ps1
```

Script aap se puchenga:
- MongoDB connection string
- JWT secret

---

## 🔗 Backend URL

Deployment ke baad backend URL:
```
https://streamflow-backend.azurewebsites.net
```

Health check:
```
https://streamflow-backend.azurewebsites.net/health
```

---

## 📱 Step 4: Mobile App Update

```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://streamflow-backend.azurewebsites.net
```

Phir `mobile/src/config/api.ts` mein production mode enable karein (already enabled hai).

---

## 🌐 Step 5: Web App Update

`streamflow-hub/.env` file mein:

```env
VITE_API_URL=https://streamflow-backend.azurewebsites.net/api
```

---

## ✅ Testing

### Backend Test:
```powershell
# Browser mein open karein:
https://streamflow-backend.azurewebsites.net/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Mobile App:
- APK rebuild karein
- Install karein
- Kisi bhi WiFi se test karein

### Web App:
- `npm run dev` se start karein
- Login/Register test karein

---

## 🔧 Troubleshooting

### Backend not starting?
1. Azure Portal → Web App → Log stream
2. Check environment variables
3. Verify MongoDB connection string

### 500 Error?
- Check logs: Azure Portal → Web App → Log stream
- Verify all environment variables set hain

### CORS Error?
- `FRONTEND_URL=*` set karein (already set hai)

---

## 📊 Cost Estimate

- **Free Tier (F1):** Free (limited resources)
- **Basic B1:** ~$13/month (recommended for production)
- **MongoDB Atlas:** Free tier available

---

## 🎯 Final Checklist

- [ ] MongoDB Atlas setup
- [ ] Azure Resource Group created
- [ ] App Service Plan created
- [ ] Web App created
- [ ] Environment variables set
- [ ] Code deployed
- [ ] Backend URL tested
- [ ] Mobile app updated
- [ ] Web app updated
- [ ] Everything tested!

---

**Ab web aur mobile dono kisi bhi WiFi se kaam karenge! 🚀**

