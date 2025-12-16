import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import IPTVCredentials from '../models/IPTVCredentials.js';

const router = express.Router();

// Generate M3U URL from credentials
const generateM3UFromCredentials = (serverUrl, username, password) => {
  try {
    let cleanUrl = serverUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    
    const url = new URL(cleanUrl);
    
    if (url.pathname === '/' || url.pathname === '' || url.pathname.includes('get.php')) {
      url.pathname = '/get.php';
      url.search = '';
      url.searchParams.set('username', username);
      url.searchParams.set('password', password);
      url.searchParams.set('type', 'm3u_plus');
      return url.toString();
    }
    
    url.pathname = `/${username}/${password}/m3u_plus.m3u`;
    url.search = '';
    return url.toString();
  } catch (error) {
    const baseUrl = serverUrl.trim().replace(/\/$/, '');
    const protocol = baseUrl.startsWith('http') ? '' : 'http://';
    return `${protocol}${baseUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus`;
  }
};

// @route   GET /api/iptv/credentials
// @desc    Get user's IPTV credentials
// @access  Private
router.get('/credentials', protect, async (req, res, next) => {
  try {
    const credentials = await IPTVCredentials.findOne({ user: req.user._id });
    
    if (!credentials) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        id: credentials._id,
        providerName: credentials.providerName,
        username: credentials.username ? '***' : null,
        serverUrl: credentials.serverUrl,
        m3uUrl: credentials.m3uUrl,
        hasCredentials: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/iptv/credentials
// @desc    Save or update IPTV credentials
// @access  Private
router.post('/credentials', protect, async (req, res, next) => {
  try {
    const { providerName, username, password, serverUrl, m3uUrl, m3uContent } = req.body;

    let finalM3uUrl = m3uUrl;

    // Generate M3U URL from credentials if provided
    if (serverUrl && username && password && !m3uUrl) {
      finalM3uUrl = generateM3UFromCredentials(serverUrl, username, password);
    }

    const credentials = await IPTVCredentials.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        providerName: providerName || null,
        username: username || null,
        password: password || null,
        serverUrl: serverUrl || null,
        m3uUrl: finalM3uUrl || null,
        m3uContent: m3uContent || null,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'IPTV credentials saved successfully',
      data: {
        id: credentials._id,
        providerName: credentials.providerName,
        hasCredentials: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/iptv/playlist
// @desc    Fetch and return M3U playlist
// @access  Private
router.get('/playlist', protect, async (req, res, next) => {
  try {
    const credentials = await IPTVCredentials.findOne({ user: req.user._id });
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'IPTV credentials not found'
      });
    }

    let playlistContent = '';

    // If manual content exists, use it
    if (credentials.m3uContent) {
      playlistContent = credentials.m3uContent;
    } else if (credentials.m3uUrl) {
      // Fetch from URL (server-side, no CORS issues!)
      try {
        const response = await axios.get(credentials.m3uUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain, */*'
          }
        });
        playlistContent = response.data;
      } catch (error) {
        console.error('Error fetching M3U:', error.message);
        return res.status(500).json({
          success: false,
          message: `Failed to fetch playlist: ${error.message}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No M3U URL or content found'
      });
    }

    // Validate M3U format
    const hasExtInf = playlistContent.includes('#EXTINF');
    const hasExtM3U = playlistContent.includes('#EXTM3U');
    const hasHttpUrls = /https?:\/\//.test(playlistContent);

    if (!hasExtInf && !hasExtM3U && !hasHttpUrls) {
      if (playlistContent.includes('<!DOCTYPE') || playlistContent.includes('<html')) {
        return res.status(400).json({
          success: false,
          message: 'Received HTML instead of M3U playlist'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid M3U format'
      });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(playlistContent);
  } catch (error) {
    next(error);
  }
});

export default router;

