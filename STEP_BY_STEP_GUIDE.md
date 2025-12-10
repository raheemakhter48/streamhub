# 📋 Step-by-Step Guide - Ab Kya Karna Hai

## 🎯 Ab Aapko Ye Steps Follow Karne Hain:

### Step 1: MongoDB Setup (5 minutes)

1. **MongoDB Atlas Account Banao:**
   - https://www.mongodb.com/cloud/atlas par jao
   - "Try Free" button click karo
   - Account banao (Google se bhi ho sakta hai)

2. **Cluster Create Karo:**
   - "Build a Database" click karo
   - Free tier (M0) select karo
   - Region select karo (closest to you)
   - "Create" click karo

3. **Database User Banao:**
   - "Database Access" par jao
   - "Add New Database User" click karo
   - Username aur Password set karo (save karo!)
   - "Add User" click karo

4. **Network Access Setup:**
   - "Network Access" par jao
   - "Add IP Address" click karo
   - "Allow Access from Anywhere" select karo (0.0.0.0/0)
   - "Confirm" click karo

5. **Connection String Lo:**
   - "Database" par jao
   - "Connect" button click karo
   - "Connect your application" select karo
   - Connection string copy karo
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/streamflow?retryWrites=true&w=majority`
   - `<password>` ko apna password se replace karo

---

### Step 2: Backend Configuration (2 minutes)

1. **Backend Folder Mein Jao:**
   ```bash
   cd backend
   ```

2. **Environment File Banao:**
   ```bash
   # Windows PowerShell mein:
   Copy-Item .env.example .env
   
   # Ya manually .env file banao
   ```

3. **`.env` File Edit Karo:**
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamflow?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-key-minimum-32-characters-long-change-this
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:8080
   ```
   
   **Important:** 
   - `MONGODB_URI` mein apna connection string paste karo
   - `JWT_SECRET` ko koi strong random string se replace karo

4. **Dependencies Install Karo:**
   ```bash
   npm install
   ```

---

### Step 3: Backend Start Karo (1 minute)

```bash
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 3000
📡 Environment: development
```

Agar ye dikhe to backend successfully start ho gaya! ✅

**Test Karo:**
Browser mein jao: `http://localhost:3000/health`
Response: `{"status":"ok","timestamp":"..."}`

---

### Step 4: Frontend Configuration (2 minutes)

1. **Frontend Folder Mein Jao:**
   ```bash
   cd ../streamflow-hub
   ```

2. **Environment File Banao:**
   ```bash
   # .env file banao streamflow-hub folder mein
   ```

3. **`.env` File Mein Ye Add Karo:**
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Dependencies Install Karo (agar pehle nahi kiye):**
   ```bash
   npm install
   ```

---

### Step 5: Frontend Start Karo (1 minute)

**Naya Terminal Window Kholo** (backend wala band mat karo):

```bash
cd streamflow-hub
npm run dev
```

Frontend `http://localhost:8080` par start ho jayega.

---

### Step 6: Test Karo (5 minutes)

1. **Browser Mein Jao:**
   - `http://localhost:8080` open karo

2. **Account Banao:**
   - "Sign Up" tab
   - Email aur password dalo
   - "Sign Up" click karo

3. **IPTV Credentials Add Karo:**
   - Setup page par jao
   - "Username/Password" tab select karo
   - Server URL: `http://otv.to:8080`
   - Username: `294372104`
   - Password: `120072161`
   - "Save & Continue" click karo

4. **Channels Check Karo:**
   - Dashboard par channels automatically load honge
   - Agar load nahi ho rahe, refresh button click karo

5. **Channel Play Karo:**
   - Koi channel click karo
   - Video play hona chahiye

---

### Step 7: Azure Deployment (Optional - Jab Ready Ho)

#### 7.1 Azure Account Setup

1. **Azure Account Banao:**
   - https://azure.microsoft.com/free/ par jao
   - Free account banao (credit card zaroori hai but free tier hai)

2. **Azure CLI Install Karo:**
   - https://aka.ms/installazurecliwindows
   - Download aur install karo

#### 7.2 Backend Deploy Karo

```bash
cd backend

# Azure login
az login

# Deployment script run karo
chmod +x azure-deploy.sh  # Linux/Mac
# Windows PowerShell mein directly run karo:
./azure-deploy.sh
```

Ya manually:

```bash
# Resource group banao
az group create --name streamflow-rg --location eastus

# App Service plan banao
az appservice plan create --name streamflow-plan --resource-group streamflow-rg --sku B1 --is-linux

# Web App banao
az webapp create --name streamflow-backend --resource-group streamflow-rg --plan streamflow-plan --runtime "NODE:18-lts"

# Environment variables set karo
az webapp config appsettings set --name streamflow-backend --resource-group streamflow-rg --settings MONGODB_URI="your-mongodb-uri" JWT_SECRET="your-secret" NODE_ENV=production FRONTEND_URL="https://your-frontend-url.com"
```

#### 7.3 Frontend Update Karo

Backend deploy hone ke baad:

1. **Backend URL Note Karo:**
   - Example: `https://streamflow-backend.azurewebsites.net`

2. **Frontend `.env` Update Karo:**
   ```env
   VITE_API_URL=https://streamflow-backend.azurewebsites.net/api
   ```

3. **Frontend Rebuild Karo:**
   ```bash
   npm run build
   ```

---

### Step 8: GitHub Push Karo

```bash
# Root folder mein jao
cd d:\applications\fasco

# Git initialize (agar pehle nahi kiya)
git init

# Remote add karo
git remote add origin https://github.com/raheemakhter48/streamflow-hub.git

# Sab files add karo
git add .

# Commit karo
git commit -m "Complete backend with MongoDB integration and Azure deployment ready"

# Push karo
git push -u origin main
```

Agar authentication error aaye:
- GitHub → Settings → Developer settings → Personal access tokens
- New token generate karo
- Token ko password ki tarah use karo

---

## ✅ Checklist

- [ ] MongoDB Atlas account bana liya
- [ ] MongoDB cluster create kar liya
- [ ] Database user bana liya
- [ ] Connection string mil gaya
- [ ] Backend `.env` file configure kar li
- [ ] Backend dependencies install kiye
- [ ] Backend start ho gaya (port 3000)
- [ ] Frontend `.env` file configure kar li
- [ ] Frontend start ho gaya (port 8080)
- [ ] Account register/login test kiya
- [ ] IPTV credentials add kiye
- [ ] Channels load ho rahe hain
- [ ] Video play ho raha hai
- [ ] (Optional) Azure deploy kiya
- [ ] (Optional) GitHub push kiya

---

## 🆘 Agar Koi Problem Aaye

### Backend Start Nahi Ho Raha?
- MongoDB connection string check karo
- `.env` file sahi hai ya nahi
- Port 3000 already use ho raha hai? Change karo

### Frontend API Connect Nahi Ho Raha?
- Backend running hai? Check karo
- `VITE_API_URL` sahi hai?
- Browser console check karo

### Channels Load Nahi Ho Rahe?
- Backend logs check karo
- IPTV credentials sahi hain?
- MongoDB connection working hai?

---

## 📞 Quick Commands

```bash
# Backend start
cd backend
npm run dev

# Frontend start (naya terminal)
cd streamflow-hub
npm run dev

# Backend test
curl http://localhost:3000/health

# MongoDB test (backend running hona chahiye)
# Browser: http://localhost:3000/health
```

---

**Ab aap step-by-step follow karo!** 🚀

