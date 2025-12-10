# React Native Mobile App Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **iOS Setup (macOS only)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure Backend URL**
   
   Edit `src/lib/api.ts` and update the `API_URL`:
   
   - **Development (Android Emulator)**: `http://10.0.2.2:3000/api`
   - **Development (iOS Simulator)**: `http://localhost:3000/api`
   - **Development (Physical Device)**: `http://YOUR_COMPUTER_IP:3000/api`
   - **Production**: `https://your-backend.azurewebsites.net/api`

4. **Run the App**
   
   **Android:**
   ```bash
   npm run android
   ```
   
   **iOS:**
   ```bash
   npm run ios
   ```

## Finding Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for IPv4 Address (usually 192.168.x.x)

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show
```

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Android Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Fails
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Cannot Connect to Backend

1. Make sure backend is running on port 3000
2. Check firewall settings
3. For physical device, ensure phone and computer are on same network
4. For Android emulator, use `10.0.2.2` instead of `localhost`

## Testing on Physical Device

1. Connect device via USB
2. Enable USB Debugging (Android) or Developer Mode (iOS)
3. Run `npm run android` or `npm run ios`
4. Make sure device and computer are on the same WiFi network
5. Update API_URL to your computer's IP address

## Production Build

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
# Open in Xcode and archive
```

