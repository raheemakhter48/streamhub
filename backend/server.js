import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import iptvRoutes from './routes/iptv.js';
import favoritesRoutes from './routes/favorites.js';
import streamRoutes from './routes/stream.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
// Configure helmet to allow video streaming
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "*", "blob:", "data:"],
      connectSrc: ["'self'", "*"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding video
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
}));
app.use(compression({
  filter: (req, res) => {
    // Don't compress video streams
    if (req.path.includes('/api/stream/proxy')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(cors({
  origin: '*', // Allow all origins for mobile app
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length', 'Accept-Ranges']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/iptv', iptvRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/stream', streamRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server - listen on all interfaces (0.0.0.0) to allow mobile app connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Accessible at: http://localhost:${PORT} and http://192.168.16.105:${PORT}`);
});

export default app;

