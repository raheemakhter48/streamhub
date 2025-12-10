# ⚙️ Azure Environment Variables Setup

## 📍 Current Status

✅ **Web App Deployed:**
- Name: `streamflow-rg`
- Status: Running
- URL: `https://streamflow-rg-dsf3h7exavffb0cv.eastasia-01.azurewebsites.net`

---

## 🔧 Step 1: Environment Variables Set Karein

### Navigation:
1. Left sidebar se **"Configuration"** click karein
2. **"Application settings"** tab par jao (default selected)
3. **"+ New application setting"** button par click karein

### Required Settings (6 total):

#### Setting 1: NODE_ENV
```
Name: NODE_ENV
Value: production
```
Click **"OK"**

#### Setting 2: PORT
```
Name: PORT
Value: 3000
```
Click **"OK"**

#### Setting 3: MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/streamflow
```
⚠️ **Apna MongoDB Atlas connection string paste karein**
- MongoDB Atlas → Connect → Get connection string
- Username aur password replace karein
- Click **"OK"**

#### Setting 4: JWT_SECRET
```
Name: JWT_SECRET
Value: your-super-secret-key-min-32-characters
```
⚠️ **Koi bhi random string (minimum 32 characters)**
Example: `mySecretKey12345678901234567890`
- Click **"OK"**

#### Setting 5: JWT_EXPIRE
```
Name: JWT_EXPIRE
Value: 7d
```
Click **"OK"**

#### Setting 6: FRONTEND_URL
```
Name: FRONTEND_URL
Value: *
```
Click **"OK"**

---

## 💾 Step 2: Save Settings

1. Sab settings add karne ke baad, top par **"Save"** button (blue) click karein
2. Confirmation dialog mein **"Continue"** click karein
3. ⏳ Wait 30-60 seconds for settings to apply
4. Success message dikhega

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
   - Left sidebar se **"Deployment Center"** click karein
   - Source dropdown se **"Local Git"** ya **"ZIP Deploy"** select karein
   - **"ZIP Deploy"** tab par jao
   - **"Browse"** button click karein
   - `backend-deploy.zip` file select karein
   - **"Deploy"** button click karein
   - ⏳ Wait 2-5 minutes for deployment

### Option B: VS Code Extension

1. VS Code mein Azure extension install karein
2. Azure icon → Web App → Right click → "Deploy to Web App"

---

## ✅ Step 4: Test Karein

1. Web App → **"Overview"** tab
2. **"Browse"** button click karein (top par)
   - Ya manually open karein: `https://streamflow-rg-dsf3h7exavffb0cv.eastasia-01.azurewebsites.net/health`
3. Should return: `{"status":"ok","timestamp":"..."}`

✅ Agar yeh response aaye to backend successfully working hai!

---

## 📱 Step 5: Mobile & Web Apps Update

### Mobile App:
```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://streamflow-rg-dsf3h7exavffb0cv.eastasia-01.azurewebsites.net
```

Phir APK rebuild karein:
```powershell
cd mobile/android
.\gradlew assembleRelease
```

### Web App:
`streamflow-hub/.env` file mein:
```env
VITE_API_URL=https://streamflow-rg-dsf3h7exavffb0cv.eastasia-01.azurewebsites.net/api
```

---

## 🎯 Quick Checklist

- [ ] Configuration page open kiya
- [ ] 6 environment variables add kiye
- [ ] Settings save kiye
- [ ] Code deployed (ZIP)
- [ ] Health check test kiya
- [ ] Mobile app updated
- [ ] Web app updated

---

## 🔧 Troubleshooting

### Settings save nahi ho rahe?
- Check har setting mein "OK" click kiya hai
- Top par "Save" button click kiya hai
- Wait karein 30-60 seconds

### Health check fails?
- Wait 1-2 minutes after code deployment
- Check logs: Left sidebar → "Log stream"
- Verify MongoDB connection string correct hai

### 500 Error?
- Check environment variables sab set hain
- Verify MongoDB connection
- Check logs for specific errors

---

**Ab "Configuration" par click karein aur environment variables set karein! 🚀**

