# StreamFlow Mobile App

React Native mobile application for StreamFlow IPTV streaming platform.

## Features

- ✅ User Authentication (Login/Register)
- ✅ IPTV Credentials Setup (M3U URL, Username/Password, Paste M3U)
- ✅ Channel List with Search & Categories
- ✅ Ultra-fast Video Playback with react-native-video
- ✅ Favorites System
- ✅ Recently Watched
- ✅ External Player Support (VLC, MX Player)
- ✅ Optimized Performance (Pagination, Memoization)
- ✅ Dark Theme UI

## Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS - macOS only)

## Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. For iOS (macOS only):
```bash
cd ios
pod install
cd ..
```

## Configuration

### API URL Setup

API URL `src/config/api.ts` file mein configure hota hai:

```typescript
// Production URL (Azure/Heroku/etc)
const PRODUCTION_API_URL = 'https://your-backend.azurewebsites.net/api';

// Development URL (local network)
const DEVELOPMENT_API_URL = 'http://192.168.16.105:3000/api';
```

### Quick Update Script

Backend deploy karne ke baad, API URL update karne ke liye:

```powershell
cd mobile
.\update-api-url.ps1 -BackendUrl https://your-backend.azurewebsites.net
```

### Production Mode

Kisi bhi WiFi se kaam karne ke liye, production mode enable karein:

`src/config/api.ts` mein:
```typescript
// Production mode - always use production URL
export const API_URL = PRODUCTION_API_URL;
```

**Detailed instructions:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Start Metro Bundler
```bash
npm start
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable components
│   │   ├── ChannelCard.tsx
│   │   └── VideoPlayer.tsx
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx
│   ├── lib/              # Utilities and API client
│   │   └── api.ts
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── AuthScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── PlayerScreen.tsx
│   │   └── SetupScreen.tsx
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Helper functions
│       └── m3uParser.ts
├── App.tsx               # Main app component
├── index.js              # Entry point
└── package.json
```

## Performance Optimizations

- **Pagination**: Loads 50 channels per page
- **Memoization**: Uses `useMemo` and `useCallback` for expensive operations
- **FlatList**: Virtualized list rendering for large datasets
- **Image Optimization**: Uses `react-native-fast-image` for better image performance
- **Lazy Loading**: Channels loaded on-demand

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

## Backend Integration

The mobile app connects to the same Node.js backend as the web app. Make sure your backend is running and accessible from your device/emulator.

For Android emulator, use `10.0.2.2` instead of `localhost`.
For iOS simulator, `localhost` works fine.

## External Players

The app supports opening streams in external players:
- **VLC**: `vlc://` protocol
- **MX Player**: Android only, uses intent scheme

## License

Same as main project.

