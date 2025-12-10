# Fix Android Project Setup

## Problem
Error: "Android project not found" - This happens because we manually created the React Native structure but didn't initialize the native Android/iOS folders.

## Solution

We need to properly initialize the React Native project. Here are two options:

### Option 1: Initialize Fresh Project (Recommended)

1. **Backup your current code:**
   ```bash
   cd mobile
   # Your src/ folder and other files are already there
   ```

2. **Initialize a fresh React Native project in a temp location:**
   ```bash
   cd ..
   npx react-native@latest init StreamFlowTemp --skip-install
   ```

3. **Copy Android/iOS folders to mobile:**
   ```bash
   # Copy Android folder
   xcopy /E /I StreamFlowTemp\android mobile\android
   
   # Copy iOS folder (if on macOS)
   xcopy /E /I StreamFlowTemp\ios mobile\ios
   ```

4. **Update Android package name (if needed):**
   - Open `mobile/android/app/src/main/AndroidManifest.xml`
   - Change package name to `com.streamflowmobile` or keep default

5. **Clean up:**
   ```bash
   rmdir /S /Q StreamFlowTemp
   ```

6. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

7. **Run the app:**
   ```bash
   npm run android
   ```

### Option 2: Use React Native CLI to Initialize (Alternative)

1. **Go to parent directory:**
   ```bash
   cd ..
   ```

2. **Initialize React Native project:**
   ```bash
   npx react-native@latest init StreamFlowMobile --skip-install
   ```

3. **Copy your custom code:**
   ```bash
   # Copy src folder
   xcopy /E /I mobile\src StreamFlowMobile\src
   
   # Copy App.tsx, index.js, etc.
   copy mobile\App.tsx StreamFlowMobile\App.tsx
   copy mobile\index.js StreamFlowMobile\index.js
   copy mobile\package.json StreamFlowMobile\package.json
   copy mobile\tsconfig.json StreamFlowMobile\tsconfig.json
   copy mobile\babel.config.js StreamFlowMobile\babel.config.js
   copy mobile\metro.config.js StreamFlowMobile\metro.config.js
   ```

4. **Install dependencies:**
   ```bash
   cd StreamFlowMobile
   npm install
   ```

5. **Run the app:**
   ```bash
   npm run android
   ```

## Quick Fix (Simplest)

If you want the quickest solution, run this in PowerShell from the `mobile` directory:

```powershell
# Go to parent directory
cd ..

# Initialize React Native project (will create android/ios folders)
npx react-native@latest init StreamFlowNew --skip-install

# Copy android folder to mobile
xcopy /E /I StreamFlowNew\android mobile\android

# Clean up
rmdir /S /Q StreamFlowNew

# Go back to mobile and install
cd mobile
npm install

# Run the app
npm run android
```

## After Setup

1. Make sure Android Studio is installed
2. Start Android Emulator or connect physical device
3. Run `npm run android`

## Notes

- The `android/` folder contains all native Android code
- The `ios/` folder contains all native iOS code (macOS only)
- Your custom React code in `src/` will work with the native folders
- You may need to configure package name in `android/app/build.gradle`

