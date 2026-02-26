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

const MASTER_PLAYLIST_URLS = [
  'https://iptv-org.github.io/iptv/languages/urd.m3u',
  'https://iptv-org.github.io/iptv/index.m3u'
];

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
    
    let targetUrls = [...MASTER_PLAYLIST_URLS];
    let manualContent = null;

    if (credentials) {
      if (credentials.m3u_content) {
        manualContent = credentials.m3u_content;
      } else if (credentials.m3u_url) {
        targetUrls = [credentials.m3u_url];
      }
    }

    let playlistContent = '';

    if (manualContent) {
      playlistContent = manualContent;
    } else {
      // Fetch from URL(s)
      for (const url of targetUrls) {
        try {
          console.log(`🌐 Fetching playlist from: ${url}`);
          const response = await axios.get(url, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': '*/*'
            }
          });
          playlistContent += response.data + '\n';
        } catch (err) {
          console.error(`❌ Error fetching playlist from ${url}:`, err.message);
        }
      }

      if (!playlistContent.trim()) {
        // Fallback to basic Master if all failed
        const masterRes = await axios.get(MASTER_PLAYLIST_URLS[1]);
        playlistContent = masterRes.data;
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
        
        // 1. Check for Urdu/Pakistani Priority
        if (lowerLine.includes('urdu') || lowerLine.includes('(pk)') || lowerLine.includes('pakistan') || lowerLine.includes('geo ') || lowerLine.includes('ary ') || lowerLine.includes('hum tv') || lowerLine.includes('ptv') || lowerLine.includes('samaa') || lowerLine.includes('express news') || lowerLine.includes('dunya')) {
          category = 'Pakistani Channels';
        } 
        // 2. Islamic
        else if (lowerLine.includes('islamic') || lowerLine.includes('quran') || lowerLine.includes('madani') || lowerLine.includes('makkah') || lowerLine.includes('prayer')) {
          category = 'Islamic';
        }
        // 3. Cricket
        else if (lowerLine.includes('cricket') || lowerLine.includes('psl') || lowerLine.includes('ipl') || lowerLine.includes('t20') || lowerLine.includes('world cup') || lowerLine.includes('willow')) {
          category = 'Cricket';
        }
        // 4. Indian
        else if (lowerLine.includes('(in)') || lowerLine.includes('india') || lowerLine.includes('star plus') || lowerLine.includes('colors') || lowerLine.includes('sony') || lowerLine.includes('zee tv')) {
          category = 'Indian Channels';
        }
        // 5. Sports
        else if (lowerLine.includes('sports') || lowerLine.includes('football') || lowerLine.includes('ten sports')) {
          category = 'Sports';
        }
        // 6. Others
        else if (lowerLine.includes('kids') || lowerLine.includes('cartoon')) {
          category = 'Kids';
        } else if (lowerLine.includes('movie') || lowerLine.includes('cinema') || lowerLine.includes('hbo')) {
          category = 'Movies';
        } else if (lowerLine.includes('news')) {
          category = 'News';
        }

        // --- NEW INJECTION LOGIC ---
        // Remove any existing group-title or category tags
        let cleanInf = line.replace(/group-title="[^"]*"/g, '').replace(/tvg-group="[^"]*"/g, '');
        
        // Inject our category right after the duration (usually -1)
        // Example: #EXTINF:-1 group-title="Pakistani Channels", CHANNEL NAME
        if (cleanInf.includes(',')) {
          // Use regex to find the comma that separates the attributes from the channel name
          // This is safer than split(',') because names can contain commas
          line = cleanInf.replace(/^(#EXTINF:[-0-9\s]+)(.*),(.*)$/, `$1 group-title="${category}"$2,$3`);
          
          // Fallback if regex fails to match
          if (line === cleanInf) {
            const lastCommaIndex = cleanInf.lastIndexOf(',');
            const infoPart = cleanInf.substring(0, lastCommaIndex);
            const namePart = cleanInf.substring(lastCommaIndex + 1);
            line = `${infoPart} group-title="${category}",${namePart}`;
          }
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

export default router;

