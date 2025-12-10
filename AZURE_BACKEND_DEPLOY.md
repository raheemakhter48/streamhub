# 📤 Backend Azure Deployment - Step by Step

## 📦 Step 1: ZIP File Ready

✅ ZIP file create ho gaya: `backend-deploy.zip`

---

## 🌐 Step 2: Azure Portal mein Deploy

### Method 1: ZIP Deploy (Easiest)

1. **Azure Portal** open karein
2. **Web App** (`streamflow-rg`) open karein
3. Left sidebar se **"Deployment Center"** click karein
4. **"Source"** dropdown se **"Local Git"** ya **"ZIP Deploy"** select karein
5. **"ZIP Deploy"** tab par jao
6. **"Browse"** button click karein
7. `backend-deploy.zip` file select karein
   - Location: `D:\applications\fasco\backend-deploy.zip`
8. **"Deploy"** button click karein
9. ⏳ Wait 2-5 minutes for deployment

### Method 2: VS Code Extension

1. VS Code mein **Azure App Service** extension install karein
2. Azure icon → **Web App** → Right click → **"Deploy to Web App"**
3. `backend` folder select karein
4. Deploy

### Method 3: Azure CLI

```powershell
cd D:\applications\fasco\backend
az webapp deployment source config-zip `
  --resource-group streamflow-rg_group `
  --name streamflow-rg `
  --src ..\backend-deploy.zip
```

---

## ✅ Step 3: Deployment Check

1. **Azure Portal** → Web App → **"Deployment Center"**
2. **"Logs"** tab check karein
3. Status: **"Success"** dikhna chahiye

---

## 🧪 Step 4: Test Backend

1. Web App → **"Overview"** tab
2. **"Browse"** button click karein
   - Ya manually: `https://streamflow-rg-dsf3h7exavffb0cv.eastasia-01.azurewebsites.net/health`
3. Should return: `{"status":"ok","timestamp":"..."}`

✅ Agar yeh response aaye to backend successfully deployed hai!

---

## ⚠️ Important Notes

1. **Environment Variables** pehle set karein (agar nahi kiye)
   - Azure Portal → Configuration → Environment variables
   - 6 settings add karein (NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRE, FRONTEND_URL)

2. **MongoDB Connection** verify karein
   - MongoDB Atlas mein IP whitelist: `0.0.0.0/0` (all IPs)

3. **Logs Check** karein agar error aaye
   - Azure Portal → Web App → **"Log stream"**

---

## 🔧 Troubleshooting

### Deployment fails?
- Check ZIP file size (should be < 100MB)
- Verify all files included (except node_modules)
- Check logs in Deployment Center

### 500 Error after deployment?
- Check environment variables set hain
- Verify MongoDB connection string
- Check Log stream for errors

### Health check fails?
- Wait 1-2 minutes after deployment
- Check Log stream
- Verify PORT=3000 set hai

---

**Ab Azure Portal mein "Deployment Center" par jao aur ZIP Deploy karein! 🚀**

