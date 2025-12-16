# StreamFlow - Ultra-fast IPTV Streaming Platform

StreamFlow ek complete IPTV streaming solution hai jo web aur mobile dono platforms par kaam karta hai. Ye platform live TV channels stream karne ke liye design kiya gaya hai with ultra-fast playback aur smooth user experience.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

StreamFlow ek full-stack IPTV streaming application hai jo teen main components se bana hai:

1. **Backend API** - Node.js/Express based REST API
2. **Web Frontend** - React + Vite based web application
3. **Mobile App** - React Native mobile application (Android/iOS)

Ye platform users ko allow karta hai:
- IPTV credentials setup karne ke liye (M3U URL, Username/Password)
- Live TV channels browse aur stream karne ke liye
- Favorites manage karne ke liye
- Recently watched channels track karne ke liye
- Multiple devices par seamless experience

## ✨ Features

### Backend Features
- ✅ JWT-based User Authentication
- ✅ MongoDB Database Integration
- ✅ IPTV Credentials Management
- ✅ M3U Playlist Fetching (CORS-free)
- ✅ Favorites System
- ✅ Recently Watched Tracking
- ✅ Video Stream Proxy
- ✅ Rate Limiting & Security
- ✅ Docker Support
- ✅ Health Check Endpoint

### Web Frontend Features
- ✅ Modern React UI with Tailwind CSS
- ✅ User Authentication (Login/Register)
- ✅ IPTV Setup Wizard
- ✅ Channel List with Search & Categories
- ✅ HLS Video Player
- ✅ Favorites Management
- ✅ Recently Watched
- ✅ Responsive Design
- ✅ Dark Theme Support

### Mobile App Features
- ✅ React Native Cross-platform App
- ✅ User Authentication
- ✅ IPTV Credentials Setup
- ✅ Channel List with Search
- ✅ Ultra-fast Video Playback
- ✅ Favorites System
- ✅ Recently Watched
- ✅ External Player Support (VLC, MX Player)
- ✅ Optimized Performance

## 📁 Project Structure

```
fasco/
├── backend/                 # Node.js/Express Backend API
│   ├── config/             # Database configuration
│   ├── middleware/          # Auth middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   ├── Dockerfile          # Docker configuration
│   └── package.json
│
├── streamflow-hub/         # React Web Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # API client
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   └── package.json
│
├── mobile/                 # React Native Mobile App
│   ├── android/            # Android native code
│   ├── src/
│   │   ├── components/     # React Native components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/     # Navigation setup
│   │   ├── config/         # API configuration
│   │   └── lib/            # API client
│   └── package.json
│
└── README.md               # This file
```

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS, Rate Limiting
- **Deployment:** Docker, Azure App Service, Render, Railway

### Web Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Video Player:** HLS.js
- **Routing:** React Router

### Mobile App
- **Framework:** React Native 0.73
- **Language:** TypeScript
- **Navigation:** React Navigation
- **Video Player:** react-native-video
- **Storage:** AsyncStorage
- **Platforms:** Android, iOS

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB Atlas** account (free tier available)
- **Git** installed

For Mobile Development:
- **Android Studio** (for Android)
- **Xcode** (for iOS - macOS only)
- **Java JDK 17** (for Android builds)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fasco
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

### 3. Web Frontend Setup

```bash
cd streamflow-hub
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Mobile App Setup

```bash
cd mobile
npm install
```

For iOS (macOS only):
```bash
cd ios
pod install
cd ..
```

## ⚙️ Configuration

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a free cluster (M0)
4. Create database user (username/password)
5. Network Access: Add IP `0.0.0.0/0` (allow all)
6. Get connection string and add to backend `.env`

### API URL Configuration

**Web Frontend:**
- Development: `VITE_API_URL=http://localhost:3000/api`
- Production: `VITE_API_URL=https://your-backend-url.com/api`

**Mobile App:**
- Edit `mobile/src/config/api.ts`
- Development: `http://192.168.x.x:3000/api` (your computer's IP)
- Production: `https://your-backend-url.com/api`

## 🏃 Running the Project

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3000`

**Terminal 2 - Web Frontend:**
```bash
cd streamflow-hub
npm run dev
```
Frontend will run on `http://localhost:8080`

**Terminal 3 - Mobile App (Optional):**
```bash
cd mobile
npm start
# In another terminal:
npm run android  # or npm run ios
```

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Web Frontend:**
```bash
cd streamflow-hub
npm run build
npm run preview
```

## 🚢 Deployment

### Backend Deployment Options

#### Option 1: Docker (Recommended)
```bash
cd backend
docker build -t streamflow-backend .
docker run -p 3000:3000 --env-file .env streamflow-backend
```

#### Option 2: Render
1. Go to [Render](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Environment: Docker
5. Root Directory: `backend`
6. Add environment variables
7. Deploy

#### Option 3: Railway
1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repo
4. Root Directory: `backend`
5. Add environment variables
6. Deploy

#### Option 4: Azure App Service
See `backend/DEPLOYMENT.md` for detailed instructions.

### Web Frontend Deployment

**Vercel (Recommended):**
```bash
cd streamflow-hub
npm run build
# Deploy dist folder to Vercel
```

**Netlify:**
```bash
cd streamflow-hub
npm run build
# Deploy dist folder to Netlify
```

### Mobile App Deployment

**Android:**
```bash
cd mobile/android
./gradlew assembleRelease
# APK will be in: app/build/outputs/apk/release/
```

**iOS:**
```bash
cd mobile/ios
# Open in Xcode and archive
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### IPTV Endpoints

- `GET /api/iptv/credentials` - Get user IPTV credentials
- `POST /api/iptv/credentials` - Save/update IPTV credentials
- `GET /api/iptv/playlist` - Fetch M3U playlist (requires auth)

### Favorites Endpoints

- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add favorite channel
- `DELETE /api/favorites/:channelUrl` - Remove favorite

### Recently Watched

- `GET /api/favorites/recently-watched` - Get recently watched
- `POST /api/favorites/recently-watched` - Add to recently watched

### Stream Endpoints

- `GET /api/stream/proxy?url=...` - Proxy video stream
- `GET /health` - Health check endpoint

## 🔧 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Check MongoDB Atlas connection string
- Verify network access IP whitelist
- Check database user credentials

**Port Already in Use:**
- Change PORT in `.env` file
- Or kill process using port 3000

### Frontend Issues

**CORS Error:**
- Ensure backend CORS is configured for frontend URL
- Check `VITE_API_URL` in `.env` file
- Restart dev server after changing `.env`

**API Connection Failed:**
- Verify backend is running
- Check API URL in configuration
- Check browser console for errors

### Mobile App Issues

**Build Fails:**
- Check Java version (should be JDK 17)
- Clean build: `cd android && ./gradlew clean`
- Check Android SDK path in `local.properties`

**Cannot Connect to Backend:**
- For emulator: Use `10.0.2.2:3000`
- For physical device: Use computer's IP address
- Ensure phone and computer on same WiFi

**Metro Bundler Issues:**
```bash
npm start -- --reset-cache
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-url.com
```

### Web Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **StreamFlow Team**

## 🙏 Acknowledgments

- React Native Community
- Express.js Team
- MongoDB Atlas
- All open-source contributors

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in each folder
- Review troubleshooting section

---

**Made with ❤️ for seamless IPTV streaming experience**

