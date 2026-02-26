---
title: Streamflow API
emoji: 📺
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Streamflow Backend API

Backend API for StreamFlow IPTV streaming application.

## Features

- ✅ User Authentication (JWT)
- ✅ MongoDB Integration
- ✅ IPTV Credentials Management
- ✅ M3U Playlist Fetching (No CORS issues!)
- ✅ Favorites Management
- ✅ Recently Watched
- ✅ Stream Proxy
- ✅ Azure Deployment Ready

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamflow
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Run Production Server

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### IPTV
- `GET /api/iptv/credentials` - Get user credentials
- `POST /api/iptv/credentials` - Save/update credentials
- `GET /api/iptv/playlist` - Fetch M3U playlist

### Favorites
- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:channelUrl` - Remove favorite

### Recently Watched
- `GET /api/favorites/recently-watched` - Get recently watched
- `POST /api/favorites/recently-watched` - Add to recently watched

### Stream
- `GET /api/stream/proxy?url=...` - Proxy video stream

## Azure Deployment

### Option 1: Azure App Service

1. Create Azure Web App
2. Set environment variables in Azure Portal
3. Deploy using GitHub Actions or Azure CLI

### Option 2: Docker Container

```bash
docker build -t streamflow-backend .
docker run -p 3000:3000 --env-file .env streamflow-backend
```

## MongoDB Setup

1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Add to `.env` as `MONGODB_URI`

