# 🎯 Azure Portal - Step by Step (Abhi Jo Screen Hai)

## 📍 Current Screen: "Create a resource"

### Step 1: Web App Create Karein

1. **"Popular Azure services"** section mein **"Web App"** par click karein
   - Blue globe/network icon wala
   - "Create" link par click

---

## 📝 Web App Creation Form

### Basics Tab:

1. **Subscription:** Apna subscription select karein
2. **Resource Group:** 
   - "Create new" click karein
   - Name: `streamflow-rg`
   - Click "OK"

3. **Name:** 
   - `streamflow-backend` (ya koi unique name)
   - ⚠️ Unique hona chahiye (check karein available hai)

4. **Publish:** 
   - `Code` select karein

5. **Runtime stack:** 
   - `Node 20 LTS` select karein (ya `Node 22 LTS`)
   - ⚠️ Node 18 LTS available nahi hai, Node 20/22 LTS use karein
   - ✅ Backend Node 18+ compatible hai, Node 20 perfect kaam karega

6. **Operating System:** 
   - `Linux` select karein

7. **Region:** 
   - `East US` (ya apna preferred region)

8. **App Service Plan:** 
   - "Create new" click
   - Name: `streamflow-plan`
   - Pricing tier: `Basic B1` (ya `Free F1` for testing)
   - Click "OK"

9. **Click "Review + create"** button

### Review + Create Tab:

1. Review all settings
2. Click **"Create"** button
3. ⏳ Wait for deployment (2-3 minutes)

---

## ⚙️ Step 2: Environment Variables Set Karein

Deployment complete hone ke baad:

1. **"Go to resource"** button par click karein
2. Left menu se **"Configuration"** select karein
3. **"Application settings"** tab par jao
4. **"+ New application setting"** click karein (har ek ke liye):

   **Setting 1:**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click "OK"

   **Setting 2:**
   - Name: `PORT`
   - Value: `3000`
   - Click "OK"

   **Setting 3:**
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/streamflow`
   - (Apna MongoDB connection string paste karein)
   - Click "OK"

   **Setting 4:**
   - Name: `JWT_SECRET`
   - Value: `your-super-secret-key-min-32-characters`
   - (Koi bhi random string, minimum 32 characters)
   - Click "OK"

   **Setting 5:**
   - Name: `JWT_EXPIRE`
   - Value: `7d`
   - Click "OK"

   **Setting 6:**
   - Name: `FRONTEND_URL`
   - Value: `*`
   - Click "OK"

5. Top par **"Save"** button click karein
6. **"Continue"** confirm karein

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
   - Web App → Left menu → **"Deployment Center"**
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
2. **"URL"** copy karein (e.g., `https://streamflow-backend.azurewebsites.net`)
3. Browser mein open karein:
   ```
   https://streamflow-backend.azurewebsites.net/health
   ```
4. Should return: `{"status":"ok","timestamp":"..."}`

---

## 📱 Step 5: Mobile & Web Apps Update

### Mobile App:
```powershell
cd D:\applications\fasco\mobile
.\update-api-url.ps1 -BackendUrl https://streamflow-backend.azurewebsites.net
```

### Web App:
`streamflow-hub/.env` file mein:
```env
VITE_API_URL=https://streamflow-backend.azurewebsites.net/api
```

---

## 🎯 Quick Checklist

- [ ] Web App create kiya
- [ ] Resource Group: `streamflow-rg`
- [ ] App Service Plan: `streamflow-plan`
- [ ] Environment variables set kiye (6 settings)
- [ ] Code deploy kiya (ZIP)
- [ ] Health check test kiya
- [ ] Mobile app updated
- [ ] Web app updated

---

**Ab "Web App" par click karein aur create karein! 🚀**

