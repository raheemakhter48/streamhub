# Complete Setup Guide - StreamFlow IPTV

## Architecture

```
Frontend (React) → Backend API (Node.js/Express) → MongoDB
                                    ↓
                            IPTV Provider (No CORS!)
```

## Step 1: Backend Setup

### 1.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 1.2 Setup MongoDB

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 - Free tier)
3. Create database user
4. Get connection string
5. Whitelist IP: `0.0.0.0/0` (or your specific IP)

### 1.3 Configure Environment

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamflow
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

### 1.4 Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

## Step 2: Frontend Setup

### 2.1 Install Frontend Dependencies

```bash
cd streamflow-hub
npm install
```

### 2.2 Configure API URL

Create `streamflow-hub/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 2.3 Start Frontend

```bash
cd streamflow-hub
npm run dev
```

Frontend will run on `http://localhost:8080`

## Step 3: Azure Deployment

### 3.1 Deploy Backend to Azure

#### Option A: Using Azure CLI

```bash
cd backend
chmod +x azure-deploy.sh
./azure-deploy.sh
```

#### Option B: Manual Deployment

1. Install Azure CLI
2. Login: `az login`
3. Create resource group:
```bash
az group create --name streamflow-rg --location eastus
```

4. Create App Service:
```bash
az webapp create \
  --name streamflow-backend \
  --resource-group streamflow-rg \
  --plan streamflow-plan \
  --runtime "NODE:18-lts"
```

5. Set environment variables in Azure Portal:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE=7d`
   - `FRONTEND_URL=https://your-frontend-url.com`
   - `NODE_ENV=production`

6. Deploy code:
```bash
cd backend
zip -r ../backend.zip .
az webapp deployment source config-zip \
  --resource-group streamflow-rg \
  --name streamflow-backend \
  --src ../backend.zip
```

### 3.2 Update Frontend for Production

Update `streamflow-hub/.env`:

```env
VITE_API_URL=https://streamflow-backend.azurewebsites.net/api
```

### 3.3 Deploy Frontend

Deploy to Vercel, Netlify, or Azure Static Web Apps.

## Step 4: Test Everything

1. **Backend Health Check:**
   ```
   https://your-backend.azurewebsites.net/health
   ```

2. **Frontend:**
   - Register/Login
   - Add IPTV credentials
   - Load channels (should work without CORS!)
   - Play channels

## Benefits of This Setup

✅ **No CORS Issues** - Backend fetches M3U playlists
✅ **Secure** - Credentials stored server-side
✅ **Fast** - Server-side caching
✅ **Scalable** - Azure auto-scaling
✅ **Stream Proxy** - Video streams work without CORS

## Troubleshooting

### Backend not starting?
- Check MongoDB connection string
- Verify environment variables
- Check logs: `az webapp log tail`

### Frontend can't connect?
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Verify backend is running

### Channels not loading?
- Check backend logs
- Verify IPTV credentials
- Test M3U URL directly

