# IPTV Setup Guide

## Quick Setup for OTV Provider

### Your Credentials:
- **Server URL**: `http://otv.to:8080`
- **Username**: `294372104`
- **Password**: `120072161`

### Steps to Setup:

1. **Login/Signup** to the application
2. Go to **Setup** page (or click Settings icon)
3. Select **"Username/Password"** tab
4. Enter the following:
   - Provider Name: `OTV` (optional)
   - Server URL: `http://otv.to:8080`
   - Username: `294372104`
   - Password: `120072161`
5. Click **"Save & Continue"**

The application will automatically generate the M3U URL:
```
http://otv.to:8080/get.php?username=294372104&password=120072161&type=m3u_plus
```

### Troubleshooting CORS Issues:

If you see CORS errors in the console:
- The app will automatically try to use a CORS proxy for fetching the M3U playlist
- Video streams should work directly as HLS.js handles CORS for media streams
- If channels don't load, try refreshing the page or clicking the refresh button

### Zero Buffering Features:

The player is optimized for zero buffering with:
- Low buffer settings (10 seconds)
- Auto quality selection
- Auto-reconnect on errors
- Fast start playback

Enjoy streaming! 🎬

