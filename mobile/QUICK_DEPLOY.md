# 🚀 Quick Deployment Guide - Kisi Bhi WiFi Se Kaam Kare

## 🎯 Goal
App ko kisi bhi WiFi network se kaam karne ke liye backend ko public URL par deploy karna hai.

---

## ⚡ Quick Start (ngrok - Testing ke liye)

### Step 1: ngrok Install

**Option A: Auto Install Script (Recommended)**
```powershell
cd D:\applications\fasco
.\install-ngrok.ps1
```

**Option B: Direct Download**
1. Visit: https://ngrok.com/download
2. Download Windows version
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok`)
4. Use: `C:\ngrok\ngrok.exe http 3000`

### Step 2: Backend Start
```powershell
cd D:\applications\fasco\backend
npm run dev
```

### Step 3: ngrok Start (Naya terminal)
```powershell
ngrok http 3000
```

### Step 4: ngrok URL Copy karein
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### Step 5: Mobile App Update
```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://abc123.ngrok.io
```

### Step 6: Production Mode Enable
`mobile/src/config/api.ts` file kholen aur yeh changes karein:

```typescript
// Line 12 ko comment karein:
// export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// Line 16 ko uncomment karein:
export const API_URL = PRODUCTION_API_URL;
```

### Step 7: APK Build
```powershell
cd mobile/android
.\gradlew assembleRelease
```

### Step 8: APK Install
Desktop par `app-release.apk` copy ho jayega, phone par install karein.

**✅ Ab app kisi bhi WiFi se kaam karega!**

---

## 🌐 Production Deployment (Azure)

### Step 1: Azure CLI Install
```powershell
winget install -e --id Microsoft.AzureCLI
```

### Step 2: Azure Login
```powershell
az login
```

### Step 3: Backend Deploy
```powershell
cd D:\applications\fasco\backend
.\quick-deploy-azure.ps1
```

Script aap se puchenga:
- MongoDB connection string
- JWT secret key

### Step 4: Backend URL mil jayega
```
https://streamflow-backend.azurewebsites.net
```

### Step 5: Mobile App Update
```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://streamflow-backend.azurewebsites.net
```

### Step 6: Production Mode Enable
Same as ngrok Step 6

### Step 7: APK Build
Same as ngrok Step 7

---

## 📝 Important Notes

1. **ngrok** - Free tier mein har restart par URL change hota hai. Testing ke liye theek hai.
2. **Azure** - Production ke liye best. URL permanent rahega.
3. **Production Mode** - `src/config/api.ts` mein production line uncomment karna zaroori hai.
4. **MongoDB** - Azure deploy karne se pehle MongoDB Atlas setup karein.

---

## 🔧 Troubleshooting

### Backend not accessible?
- Check backend logs
- Verify MongoDB connection
- Test URL in browser: `https://your-url/health`

### App can't connect?
- Verify `API_URL` in `mobile/src/config/api.ts`
- Check production mode enabled hai
- Rebuild APK after changes

---

## ✅ Checklist

- [ ] Backend running (localhost:3000)
- [ ] ngrok/Azure deployed
- [ ] Backend URL tested in browser
- [ ] `update-api-url.ps1` script run kiya
- [ ] Production mode enabled
- [ ] New APK built
- [ ] APK installed on phone
- [ ] Tested on different WiFi

---

**Ab app kisi bhi WiFi se kaam karega! 🎉**

