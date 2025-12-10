# ✅ Azure Deployment - Next Steps

## 📋 Current Status

✅ **Web App Configuration Complete:**
- Name: `streamflow-rg`
- Runtime: Node 22 LTS ✅
- OS: Linux ✅
- Region: East Asia
- Plan: Basic (Small) ✅

---

## 🚀 Step 1: Create Web App

1. **Bottom par "Create" button (blue) click karein**
2. ⏳ **Wait 2-3 minutes** for deployment
3. Deployment complete hone par **"Go to resource"** button dikhega

---

## ⚙️ Step 2: Environment Variables Set Karein

Deployment complete hone ke baad:

1. **"Go to resource"** button par click karein
2. Left sidebar se **"Configuration"** select karein
3. **"Application settings"** tab par jao
4. **"+ New application setting"** click karein (har ek ke liye):

### Required Settings:

**1. NODE_ENV**
```
Name: NODE_ENV
Value: production
```

**2. PORT**
```
Name: PORT
Value: 3000
```

**3. MONGODB_URI**
```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/streamflow
```
⚠️ Apna MongoDB Atlas connection string paste karein

**4. JWT_SECRET**
```
Name: JWT_SECRET
Value: your-super-secret-key-min-32-characters
```
⚠️ Koi bhi random string (minimum 32 characters)

**5. JWT_EXPIRE**
```
Name: JWT_EXPIRE
Value: 7d
```

**6. FRONTEND_URL**
```
Name: FRONTEND_URL
Value: *
```

5. Har setting ke baad **"OK"** click karein
6. Sab settings add karne ke baad, top par **"Save"** button click karein
7. **"Continue"** confirm karein
8. ⏳ Wait for settings to apply (30 seconds)

---

## 📤 Step 3: Code Deploy Karein

### Option A: ZIP Deploy (Easiest)

1. **Backend folder ko ZIP karein:**
   ```powershell
   cd D:\applications\fasco\backend
   # node_modules exclude karein
   Compress-Archive -Path * -Exclude node_modules -DestinationPath ..\backend-deploy.zip -Force
   ```

2. **Azure Portal:**
   - Web App → Left sidebar → **"Deployment Center"**
   - Source: **"Local Git"** ya **"ZIP Deploy"** select karein
   - **"ZIP Deploy"** tab par jao
   - **"Browse"** click karein
   - `backend-deploy.zip` file select karein
   - **"Deploy"** click karein
   - ⏳ Wait for deployment (2-5 minutes)

### Option B: VS Code Extension

1. VS Code mein Azure extension install karein
2. Azure icon → Web App → Right click → "Deploy to Web App"

---

## ✅ Step 4: Test Karein

1. Web App → **"Overview"** tab
2. **"URL"** copy karein (e.g., `https://streamflow-rg.azurewebsites.net`)
3. Browser mein open karein:
   ```
   https://streamflow-rg.azurewebsites.net/health
   ```
4. Should return: `{"status":"ok","timestamp":"..."}`

✅ Agar yeh response aaye to backend successfully deployed hai!

---

## 📱 Step 5: Mobile & Web Apps Update

### Mobile App:
```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://streamflow-rg.azurewebsites.net
```

Phir APK rebuild karein:
```powershell
cd mobile/android
.\gradlew assembleRelease
```

### Web App:
`streamflow-hub/.env` file mein:
```env
VITE_API_URL=https://streamflow-rg.azurewebsites.net/api
```

---

## 🎯 Quick Checklist

- [ ] Web App created (Create button clicked)
- [ ] Deployment complete
- [ ] Environment variables set (6 settings)
- [ ] Code deployed (ZIP)
- [ ] Health check test kiya
- [ ] Mobile app updated
- [ ] Web app updated

---

## 🔧 Troubleshooting

### Backend not starting?
1. Azure Portal → Web App → **"Log stream"**
2. Check environment variables
3. Verify MongoDB connection string

### 500 Error?
- Check logs: Azure Portal → Web App → **"Log stream"**
- Verify all environment variables set hain

### Health check fails?
- Wait 1-2 minutes after deployment
- Check logs for errors
- Verify MongoDB connection

---

**Ab "Create" button click karein aur wait karein! 🚀**

