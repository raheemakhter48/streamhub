# Java Installation Guide for React Native Android

## Problem
Your system has Java 24 installed, but Gradle 8.11.1 doesn't support Java 24 yet. You need Java 17 or 21.

## Solution: Install Java 17

### Option 1: Download Java 17 (Recommended)
1. Download Java 17 from: https://adoptium.net/temurin/releases/?version=17
2. Select:
   - Version: 17 (LTS)
   - Operating System: Windows
   - Architecture: x64
   - Package Type: JDK
3. Install it (default location: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`)

### Option 2: Use Android Studio's Bundled Java
If you have Android Studio installed, it comes with Java 17:
- Location: `C:\Users\YourUsername\AppData\Local\Android\Sdk\jbr`
- Or: `C:\Program Files\Android\Android Studio\jbr`

## After Installation:

### Set JAVA_HOME (Temporary - for this session):
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"
# Or if using Android Studio's Java:
$env:JAVA_HOME = "$env:LOCALAPPDATA\Android\Sdk\jbr"
```

### Set JAVA_HOME (Permanent):
1. Open System Properties → Environment Variables
2. Add new System Variable:
   - Name: `JAVA_HOME`
   - Value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot`
3. Add to PATH: `%JAVA_HOME%\bin`

### Verify:
```powershell
java -version
# Should show: java version "17.0.x"
```

## Then Run:
```bash
cd D:\applications\fasco\mobile
npm run android
```



