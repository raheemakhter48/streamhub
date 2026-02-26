import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stream/proxy
// @desc    Proxy video stream to avoid CORS and mixed content issues
// @access  Public (for player compatibility)
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const decodedUrl = url; // Express already decodes query parameters
    console.log(`🎥 Proxying stream: ${decodedUrl}`);

    const isM3U8 = decodedUrl.toLowerCase().includes('.m3u8');

    if (isM3U8) {
      // For HLS manifests, we fetch as text and rewrite relative URLs
      const response = await axios.get(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        }
      });

      let content = response.data;
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
      
      // Determine the public host for proxying
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const proxyBase = `${proto}://${host}/api/stream/proxy?url=`;

      // Basic rewrite logic for relative paths
      const lines = content.split('\n');
      const rewrittenLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return line;

        // 1. Handle URI="relative.ts" in tags (like #EXT-X-MAP or #EXT-X-MEDIA)
        if (trimmed.startsWith('#') && (trimmed.includes('URI="') || trimmed.includes('URI='))) {
          return line.replace(/URI=(["']?)([^"',\s]+)\1/g, (match, quote, p1) => {
            if (p1.startsWith('http')) {
              return `URI=${quote}${proxyBase}${encodeURIComponent(p1)}${quote}`;
            }
            const abs = new URL(p1, baseUrl).toString();
            return `URI=${quote}${proxyBase}${encodeURIComponent(abs)}${quote}`;
          });
        }

        // 2. Handle segment/variant URLs (lines not starting with #)
        if (!trimmed.startsWith('#')) {
          if (trimmed.startsWith('http')) {
            // Even absolute URLs should be proxied to avoid CORS/Mixed Content
            return `${proxyBase}${encodeURIComponent(trimmed)}`;
          }
          // Relative URL
          const absoluteUrl = new URL(trimmed, baseUrl).toString();
          return `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
        }
        
        return line;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(rewrittenLines.join('\n'));
    }

    // For other streams (.ts, etc.), pipe directly
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    });

    const contentType = response.headers['content-type'] || 'video/mp2t';
    res.setHeader('Content-Type', contentType);
    
    if (contentType.includes('video/mp2t') || decodedUrl.toLowerCase().includes('.ts')) {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
    }

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('❌ Stream pipe error:', err.message);
      res.end();
    });

  } catch (error) {
    console.error('❌ Stream proxy error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to proxy stream' });
  }
});

export default router;

