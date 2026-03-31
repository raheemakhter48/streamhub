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

const generateEPGFromCredentials = (serverUrl, username, password) => {
  try {
    let cleanUrl = serverUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    
    const url = new URL(cleanUrl);
    url.pathname = '/xmltv.php';
    url.search = '';
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    return url.toString();
  } catch (error) {
    const baseUrl = serverUrl.trim().replace(/\/$/, '');
    const protocol = baseUrl.startsWith('http') ? '' : 'http://';
    return `${protocol}${baseUrl}/xmltv.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
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
        epgUrl: credentials.epg_url,
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
    const { providerName, username, password, serverUrl, m3uUrl, epgUrl, m3uContent } = req.body;

    let finalM3uUrl = m3uUrl;
    let finalEpgUrl = epgUrl;

    // Generate URLs from credentials if provided
    if (serverUrl && username && password) {
      if (!m3uUrl) finalM3uUrl = generateM3UFromCredentials(serverUrl, username, password);
      if (!epgUrl) finalEpgUrl = generateEPGFromCredentials(serverUrl, username, password);
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
        epg_url: finalEpgUrl || null,
        m3u_content: m3uContent || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase credentials error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database error while saving credentials: ' + error.message
      });
    }

    if (!credentials) {
      console.error('❌ No credentials returned after upsert');
      return res.status(500).json({
        success: false,
        message: 'Failed to save credentials - no data returned'
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
        epgUrl: credentials.epg_url,
        hasCredentials: true
      }
    });
  } catch (error) {
    next(error);
  }
});

const MASTER_PLAYLIST_URLS = [
  'https://iptv-org.github.io/iptv/languages/urd.m3u',
  'https://iptv-org.github.io/iptv/countries/in.m3u',
  'https://iptv-org.github.io/iptv/index.m3u'
];

// @route   GET /api/iptv/playlist
// @desc    Fetch and return M3U playlist (Master or User-specific) with caching
// @access  Private
router.get('/playlist', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const CACHE_EXPIRY_HOURS = 24;

    // 1. Check if we have a valid cache in Supabase
    const { data: cache, error: cacheError } = await supabase
      .from('playlist_cache')
      .select('content, updated_at')
      .eq('user_id', userId)
      .single();

    if (cache && !cacheError) {
      const lastUpdate = new Date(cache.updated_at);
      const hoursSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < CACHE_EXPIRY_HOURS) {
        console.log(`🚀 Serving playlist from cache for user: ${userId}`);
        return res.send(cache.content);
      }
      console.log(`⏰ Cache expired for user: ${userId}, fetching fresh data...`);
    }

    // 2. If no cache or expired, fetch from URLs
    const { data: credentials } = await supabase
      .from('iptv_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    let targetUrls = [...MASTER_PLAYLIST_URLS];
    let manualContent = '';

    if (credentials) {
      if (credentials.m3u_content) {
        manualContent = credentials.m3u_content + '\n';
      }
      if (credentials.m3u_url) {
        targetUrls = [credentials.m3u_url, ...MASTER_PLAYLIST_URLS];
      }
    }

    let playlistContent = manualContent;

    for (const url of targetUrls) {
      try {
        console.log(`🌐 Fetching fresh playlist from: ${url}`);
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          }
        });
        playlistContent += response.data + '\n';
      } catch (err) {
        console.error(`❌ Error fetching ${url}:`, err.message);
      }
    }

    if (!playlistContent.trim()) {
      // Final fallback
      const masterRes = await axios.get(MASTER_PLAYLIST_URLS[1]);
      playlistContent = masterRes.data;
    }

    // 3. Save to Cache in Supabase (Non-blocking)
    supabase.from('playlist_cache').upsert({
      user_id: userId,
      content: playlistContent,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) console.error('❌ Failed to update cache:', error.message);
      else console.log('✅ Cache updated successfully');
    });

    // 4. Auto-Categorization Logic
    const lines = playlistContent.split('\n');
    let updatedPlaylist = '#EXTM3U\n';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        let nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : '';
        
        // Categorization based on name
        let category = 'General';
        const lowerLine = line.toLowerCase();
        
        // 1. Check for Urdu/Pakistani Priority
        if (lowerLine.includes('urdu') || lowerLine.includes('(pk)') || lowerLine.includes('pakistan') || lowerLine.includes('geo ') || lowerLine.includes('ary ') || lowerLine.includes('hum tv') || lowerLine.includes('ptv') || lowerLine.includes('samaa') || lowerLine.includes('express news') || lowerLine.includes('dunya') || lowerLine.includes('news 18 urdu') || lowerLine.includes('madani channel urdu')) {
          category = 'Pakistani Channels';
        } 
        // 2. Cricket
        else if (lowerLine.includes('cricket') || lowerLine.includes('psl') || lowerLine.includes('ipl') || lowerLine.includes('t20') || lowerLine.includes('world cup') || lowerLine.includes('willow') || lowerLine.includes('star sports 1 hindi')) {
          category = 'Cricket';
        }
        // 3. Islamic
        else if (lowerLine.includes('islamic') || lowerLine.includes('quran') || lowerLine.includes('madani') || lowerLine.includes('makkah') || lowerLine.includes('prayer')) {
          category = 'Islamic';
        }
        // 4. Indian
        else if (lowerLine.includes('(in)') || lowerLine.includes('india') || lowerLine.includes('star plus') || lowerLine.includes('colors') || lowerLine.includes('sony') || lowerLine.includes('zee tv') || lowerLine.includes('sab tv') || lowerLine.includes('and tv') || lowerLine.includes('ndtv') || lowerLine.includes('republic') || lowerLine.includes('aaj tak')) {
          category = 'Indian Channels';
        }
        // 5. Sports
        else if (lowerLine.includes('sports') || lowerLine.includes('football') || lowerLine.includes('ten sports')) {
          category = 'Sports';
        }

        // --- IMPROVED INJECTION LOGIC ---
        // Clean line from existing group titles
        let cleanInf = line.replace(/group-title="[^"]*"/gi, '').replace(/tvg-group="[^"]*"/gi, '').trim();
        
        // Ensure space after #EXTINF:-1 before adding group-title
        if (cleanInf.includes(',')) {
          const lastCommaIndex = cleanInf.lastIndexOf(',');
          const infoPart = cleanInf.substring(0, lastCommaIndex);
          const namePart = cleanInf.substring(lastCommaIndex); // Includes the comma
          
          // Construct: #EXTINF:-1 group-title="Category",Name
          line = `${infoPart} group-title="${category}"${namePart}`;
        } else {
          line = `${cleanInf} group-title="${category}"`;
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

// @route   GET /api/iptv/epg
// @desc    Fetch and return EPG (Electronic Program Guide)
// @access  Private
router.get('/epg', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get EPG URL from credentials
    const { data: credentials } = await supabase
      .from('iptv_credentials')
      .select('epg_url')
      .eq('user_id', userId)
      .single();
    
    if (!credentials || !credentials.epg_url) {
      return res.status(404).json({
        success: false,
        message: 'No EPG URL configured'
      });
    }

    console.log(`🌐 Fetching EPG from: ${credentials.epg_url}`);
    
    const response = await axios.get(credentials.epg_url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    res.setHeader('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('❌ EPG Fetch Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EPG'
    });
  }
});

export default router;