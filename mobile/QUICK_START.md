# Quick Start Guide

## ✅ Step 1: Metro Bundler (Already Running)
Metro bundler start ho gaya hai. Isko chalta rehne do.

## ✅ Step 2: Android Emulator/Device
Make sure Android emulator ya physical device connected hai.

**Check karne ke liye:**
```bash
adb devices
```

Agar device dikhe to theek hai, warna:
- Android Studio se emulator start karo, ya
- Physical device connect karo with USB debugging enabled

## ✅ Step 3: Backend URL Configuration

**IMPORTANT:** Android emulator ke liye `localhost` kaam nahi karega!

Edit `mobile/src/lib/api.ts`:

**For Android Emulator:**
```typescript
const API_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Android emulator ke liye
  : 'https://your-backend.azurewebsites.net/api';
```

**For Physical Device:**
```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // Apne computer ka IP address
  : 'https://your-backend.azurewebsites.net/api';
```

**Computer ka IP address find karne ke liye (Windows):**
```powershell
ipconfig
```
IPv4 Address dekho (usually 192.168.x.x)

## ✅ Step 4: Backend Start Karein

**Naya terminal kholo** aur backend start karo:
```bash
cd backend
npm start
```

Backend `http://localhost:3000` par chalna chahiye.

## ✅ Step 5: Android App Run Karein

**Naya terminal kholo** (Metro bundler wala terminal chalta rehne do):
```bash
cd mobile
npm run android
```

**Note:** Command `android` hai, `andriod` nahi! 😊

## Troubleshooting

### Error: "Could not connect to development server"
- Metro bundler running hai na? Check karo
- Backend running hai na? Check karo
- API_URL sahi hai na? Android emulator ke liye `10.0.2.2` use karo

### Error: "No devices found"
```bash
adb devices
```
Agar kuch nahi dikha, to:
- Android Studio se emulator start karo
- USB debugging enable karo (physical device ke liye)

### Error: "Cannot connect to backend"
- Backend `http://localhost:3000` par chal raha hai na?
- Android emulator ke liye API_URL `10.0.2.2` hai na?
- Firewall check karo

## Summary

1. ✅ Metro bundler running (already done)
2. ⏳ Android emulator/device ready
3. ⏳ Backend URL configure karo (`10.0.2.2` for emulator)
4. ⏳ Backend start karo
5. ⏳ `npm run android` run karo

Good luck! 🚀

