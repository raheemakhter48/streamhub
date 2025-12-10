// API Configuration
// Change this to your production backend URL when deploying

// Production URL (Azure/Heroku/etc) - Update this after deploying backend
const PRODUCTION_API_URL = 'https://3de170c76fe9.ngrok-free.app/api';

// Development URL (local network)
const DEVELOPMENT_API_URL = 'http://192.168.16.105:3000/api';

// Use production URL in release builds, development URL in debug builds
// For testing with any WiFi, set this to your deployed backend URL
// export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// For production: Always use production URL regardless of __DEV__
// Uncomment the line below and comment the line above when deploying:
export const API_URL = PRODUCTION_API_URL;

console.log('🌐 API URL:', API_URL);

