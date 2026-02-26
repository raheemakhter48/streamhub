import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

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
    const { data: credentials, error } = await supabase
      .from('iptv_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
      throw error;
    }

    if (!credentials) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        id: credentials.id,
        providerName: credentials.provider_name,
        username: credentials.username ? '***' : null,
        serverUrl: credentials.server_url,
        m3uUrl: credentials.m3u_url,
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

    const { data: credentials, error } = await supabase
      .from('iptv_credentials')
      .upsert({
        user_id: req.user.id,
        provider_name: providerName || null,
        username: username || null,
        password: password || null,
        server_url: serverUrl || null,
        m3u_url: finalM3uUrl || null,
        m3u_content: m3uContent || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'IPTV credentials saved successfully',
      data: {
        id: credentials.id,
        providerName: credentials.provider_name,
        hasCredentials: true
      }
    });
  } catch (error) {
    next(error);
  }
});

const MASTER_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';

// @route   GET /api/iptv/playlist
// @desc    Fetch and return M3U playlist (Master or User-specific)
// @access  Private
router.get('/playlist', protect, async (req, res, next) => {
  try {
    // Check if user has custom credentials
    const { data: credentials, error } = await supabase
      .from('iptv_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    
    let targetUrl = MASTER_PLAYLIST_URL;
    let manualContent = null;

    if (credentials) {
      if (credentials.m3u_content) {
        manualContent = credentials.m3u_content;
      } else if (credentials.m3u_url) {
        targetUrl = credentials.m3u_url;
      }
    }

    let playlistContent = '';

    if (manualContent) {
      playlistContent = manualContent;
    } else {
      // Fetch from URL (Master or User's)
      try {
        console.log(`🌐 Fetching playlist from: ${targetUrl}`);
        const response = await axios.get(targetUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          }
        });
        playlistContent = response.data;
      } catch (err) {
        console.error('❌ Error fetching playlist:', err.message);
        // Fallback to Master if user's fails
        if (targetUrl !== MASTER_PLAYLIST_URL) {
          console.log('🔄 Falling back to Master Playlist...');
          const masterRes = await axios.get(MASTER_PLAYLIST_URL);
          playlistContent = masterRes.data;
        } else {
          return res.status(500).json({ success: false, message: 'Failed to load playlist' });
        }
      }
    }

    // Auto-Categorization Logic
    const lines = playlistContent.split('\n');
    let updatedPlaylist = '#EXTM3U\n';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        let nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : '';
        
        // Categorization based on name
        let category = 'General';
        const lowerLine = line.toLowerCase();
        
        // Priority Based Categorization
        if (lowerLine.includes('islamic') || lowerLine.includes('quran') || lowerLine.includes('madani') || lowerLine.includes('prayer') || lowerLine.includes('makkah')) {
          category = 'Islamic';
        } else if (lowerLine.includes('cricket') || lowerLine.includes('psl') || lowerLine.includes('ipl') || lowerLine.includes('t20') || lowerLine.includes('world cup')) {
          category = 'Cricket';
        } else if (lowerLine.includes('sports') || lowerLine.includes('football') || lowerLine.includes('ten sports') || lowerLine.includes('ptv sports') || lowerLine.includes('star sports')) {
          category = 'Sports';
        } else if (lowerLine.includes('(pk)') || lowerLine.includes('pakistan') || lowerLine.includes('geo') || lowerLine.includes('ary') || lowerLine.includes('hum tv') || lowerLine.includes('ptv')) {
          category = 'Pakistani Channels';
        } else if (lowerLine.includes('(in)') || lowerLine.includes('india') || lowerLine.includes('star plus') || lowerLine.includes('colors') || lowerLine.includes('sony') || lowerLine.includes('zee tv')) {
          category = 'Indian Channels';
        } else if (lowerLine.includes('kids') || lowerLine.includes('cartoon') || lowerLine.includes('nick') || lowerLine.includes('pogo')) {
          category = 'Kids';
        } else if (lowerLine.includes('movie') || lowerLine.includes('hbo') || lowerLine.includes('cinema') || lowerLine.includes('action')) {
          category = 'Movies';
        } else if (lowerLine.includes('news')) {
          category = 'News';
        }

        // Add or Replace group-title
        if (line.includes('group-title="')) {
          line = line.replace(/group-title="[^"]*"/, `group-title="${category}"`);
        } else {
          line = line.replace('#EXTINF:', `#EXTINF:-1 group-title="${category}",`);
        }

        // Support MPEG-TS URLs specifically
        if (nextLine.toLowerCase().includes('.ts') || nextLine.toLowerCase().includes('/live/')) {
          // You could add special tags here if needed
        }

        updatedPlaylist += line + '\n' + nextLine + '\n';
        i++; // Skip the URL line
      }
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(updatedPlaylist);
  } catch (error) {
    next(error);
  }
});

export default router;

