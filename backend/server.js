import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes import
import authRoutes from './routes/auth.js';
import iptvRoutes from './routes/iptv.js';
import favoritesRoutes from './routes/favorites.js';
import streamRoutes from './routes/stream.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7860;

// Environment check
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Backend might not function correctly without these.');
}

// Trust reverse proxy (Hugging Face / Cloudflare / Nginx)
app.set('trust proxy', true);

// Basic Middleware
app.use(cors());
app.use(express.json());

// Request Logger (Hugging Face logs mein nazar ayega)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check (Isse pata chalega server zinda hai)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'not set',
    diagnostics: {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_key: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      jwt_secret: !!process.env.JWT_SECRET,
      missing: missingEnvVars
    }
  });
});

// Root route (Hugging Face default page ke liye)
app.get('/', (req, res) => {
  if (missingEnvVars.length > 0) {
    res.status(500).send(`
      <h1>StreamFlow API is Running!</h1>
      <p style="color: red;">⚠️ <b>Warning:</b> Missing environment variables: ${missingEnvVars.join(', ')}</p>
      <p>Check your Hugging Face Space settings and add these variables.</p>
      <p>Use <a href="/health">/health</a> to check detailed status.</p>
    `);
  } else {
    res.send('StreamFlow API is Running! Everything looks good. Use /health to check status.');
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/iptv', iptvRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/stream', streamRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found on this server` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server - 0.0.0.0 is MANDATORY for Hugging Face
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is listening on 0.0.0.0:${PORT}`);
});

export default app;

