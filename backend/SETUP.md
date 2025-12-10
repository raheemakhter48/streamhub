# Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)

### 3. Environment Variables

Create `.env` file:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

### 4. Run Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### IPTV
- `GET /api/iptv/credentials` - Get credentials
- `POST /api/iptv/credentials` - Save credentials
- `GET /api/iptv/playlist` - Get M3U playlist (no CORS!)

### Favorites
- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:channelUrl` - Remove favorite

### Recently Watched
- `GET /api/favorites/recently-watched` - Get recently watched
- `POST /api/favorites/recently-watched` - Add to recently watched

### Stream Proxy
- `GET /api/stream/proxy?url=...` - Proxy video stream

## Testing

Test health endpoint:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

