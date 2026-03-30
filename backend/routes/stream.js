import express from 'express';
import axios from 'axios';

const router = express.Router();

// @route   GET /api/stream/proxy
// @desc    Proxy video stream to avoid CORS issues
// @access  Public (no auth header needed so HLS player can call it)
router.get('/proxy', async (req, res, next) => {
  // Set CORS headers early for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Stream URL is required'
      });
    }

    const decodedUrl = decodeURIComponent(url);
    console.log('Proxy request for URL:', decodedUrl);

    // Validate URL
    try {
      new URL(decodedUrl);
    } catch (error) {
      console.error('Invalid URL format:', decodedUrl);
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Check if it's an HLS manifest
    if (decodedUrl.includes('.m3u8') || decodedUrl.includes('m3u')) {
      console.log('Processing HLS manifest');
      // Fetch HLS manifest
      const response = await axios.get(decodedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, */*'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });

      if (response.status >= 400) {
        console.error('HLS manifest fetch failed:', response.status, response.statusText);
        return res.status(response.status).json({
          success: false,
          message: `Failed to fetch HLS manifest: ${response.statusText}`
        });
      }

      let manifestContent = response.data;
      
      // Rewrite URLs in manifest to use proxy for segments
      const baseUrl = new URL(decodedUrl);
      const proxyBase = `${req.protocol}://${req.get('host')}/api/stream/proxy?url=`;
      
      // Replace absolute URLs with proxied URLs
      manifestContent = manifestContent.replace(
        /(https?:\/\/[^\s\n]+)/g,
        (match) => {
          try {
            const url = new URL(match.trim());
            return `${proxyBase}${encodeURIComponent(url.toString())}`;
          } catch {
            return match;
          }
        }
      );

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(manifestContent);
    } else {
      // For video segments or direct video streams, stream directly
      console.log('Processing direct video stream');
      
      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected from stream');
      });

      try {
        // First, try to get the final URL after redirects (for logging and validation)
        let finalUrl = decodedUrl;
        let redirectDetected = false;
        try {
          const headResponse = await axios.head(decodedUrl, {
            timeout: 10000,
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            validateStatus: () => true // Don't throw on any status
          });
          finalUrl = headResponse.request.res.responseUrl || decodedUrl;
          if (finalUrl !== decodedUrl) {
            redirectDetected = true;
            console.log(`Stream redirects from ${decodedUrl} to ${finalUrl}`);
            
            // Check if redirected domain is reachable
            try {
              const redirectUrl = new URL(finalUrl);
              // Try to resolve the redirected domain
              await axios.head(finalUrl, {
                timeout: 5000,
                maxRedirects: 0, // Don't follow further redirects
                validateStatus: () => true
              });
            } catch (redirectError) {
              if (redirectError.code === 'ENOTFOUND') {
                const domainMatch = redirectError.message.match(/ENOTFOUND ([^\s]+)/);
                const domain = domainMatch ? domainMatch[1] : 'unknown';
                console.error(`Redirect target domain ${domain} is unreachable`);
                return res.status(502).json({
                  success: false,
                  message: `Stream redirects to unreachable domain: ${domain}. The stream server may be down or the URL is incorrect.`,
                  error: 'REDIRECT_TO_UNREACHABLE_DOMAIN',
                  originalUrl: decodedUrl,
                  redirectUrl: finalUrl,
                  unreachableDomain: domain
                });
              }
            }
          }
        } catch (headError) {
          // If HEAD fails with DNS error, don't try GET
          if (headError.code === 'ENOTFOUND') {
            const domainMatch = headError.message.match(/ENOTFOUND ([^\s]+)/);
            const domain = domainMatch ? domainMatch[1] : 'unknown';
            console.error(`Original domain ${domain} is unreachable`);
            return res.status(502).json({
              success: false,
              message: `Stream server unreachable: Cannot resolve domain ${domain}. The stream may be down or the URL is incorrect.`,
              error: 'DNS_RESOLUTION_FAILED',
              domain: domain
            });
          }
          // For other HEAD errors, we'll try GET anyway
          console.log('HEAD request failed, will try GET:', headError.message);
        }

        const response = await axios({
          method: 'GET',
          url: decodedUrl,
          responseType: 'stream',
          timeout: 30000,
          maxRedirects: 5, // Allow up to 5 redirects
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': decodedUrl,
            'Origin': new URL(decodedUrl).origin,
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'DNT': '1',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          validateStatus: (status) => {
            // Don't throw on 4xx, but handle 520 (Cloudflare error) specially
            return status < 500 || status === 520;
          }
        });

        // Handle Cloudflare 520 error specifically
        if (response.status === 520) {
          console.error('Cloudflare 520 error - Origin server issue');
          
          // Try one more time with different approach - maybe the stream needs different headers
          try {
            console.log('Retrying with simpler headers...');
            const retryResponse = await axios({
              method: 'GET',
              url: decodedUrl,
              responseType: 'stream',
              timeout: 20000,
              maxRedirects: 5,
              headers: {
                'User-Agent': 'VLC/3.0.0', // Try VLC user agent
                'Accept': '*/*'
              },
              validateStatus: (status) => status < 500 || status === 520
            });
            
            if (retryResponse.status < 400) {
              // Retry succeeded! Use this response
              console.log('Retry successful with VLC user agent');
              response = retryResponse;
            } else {
              // Retry also failed
              return res.status(502).json({
                success: false,
                message: 'Stream server error (520): The IPTV server is not responding correctly. This may be due to:\n• Incorrect credentials\n• Server is down or overloaded\n• URL format is incorrect\n• Cloudflare protection blocking the request\n\nPlease verify your IPTV credentials or try opening the stream in VLC player.',
                error: 'CLOUDFLARE_520_ERROR',
                statusCode: 520,
                originalUrl: decodedUrl
              });
            }
          } catch (retryError) {
            console.error('Retry also failed:', retryError.message);
            return res.status(502).json({
              success: false,
              message: 'Stream server error (520): The IPTV server is not responding correctly. Please try:\n• Opening in VLC player (better compatibility)\n• Verifying your IPTV credentials\n• Trying another channel',
              error: 'CLOUDFLARE_520_ERROR',
              statusCode: 520,
              originalUrl: decodedUrl
            });
          }
        }

        if (response.status >= 400 && response.status !== 520) {
          console.error('Stream fetch failed:', response.status, response.statusText);
          return res.status(response.status).json({
            success: false,
            message: `Failed to fetch stream: ${response.statusText} (${response.status})`
          });
        }

        // Handle Range requests for video seeking
        const range = req.headers.range;
        if (range) {
          // For now, just pass through - axios stream handles this
          // But we should set Accept-Ranges header
          res.setHeader('Accept-Ranges', 'bytes');
        } else {
          res.setHeader('Accept-Ranges', 'bytes');
        }

        // Set appropriate headers (CORS already set above)
        const contentType = response.headers['content-type'] || 'video/mp2t';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Copy any range headers if present (for seeking)
        if (response.headers['accept-ranges']) {
          res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
        }
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        
        // Important: Set these headers for video streaming
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for faster start

        // Handle stream errors
        response.data.on('error', (err) => {
          console.error('Stream error:', err.message);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: `Stream error: ${err.message}`
            });
          }
        });

        // Handle client disconnect during streaming
        res.on('close', () => {
          if (response.data && typeof response.data.destroy === 'function') {
            response.data.destroy();
          }
        });

        // Pipe the stream
        response.data.pipe(res);
      } catch (axiosError) {
        console.error('Axios error:', axiosError.message);
        console.error('Error code:', axiosError.code);
        
        // Handle DNS resolution errors specifically
        if (axiosError.code === 'ENOTFOUND' || axiosError.message.includes('getaddrinfo ENOTFOUND')) {
          const domainMatch = axiosError.message.match(/ENOTFOUND ([^\s]+)/);
          const domain = domainMatch ? domainMatch[1] : 'unknown domain';
          console.error(`DNS resolution failed for domain: ${domain}`);
          console.error(`Original URL: ${decodedUrl} redirects to unreachable domain: ${domain}`);
          // Return JSON error with proper CORS headers
          return res.status(502).json({
            success: false,
            message: `Stream server unreachable: Cannot resolve domain ${domain}. The stream may be down or the URL is incorrect.`,
            error: 'DNS_RESOLUTION_FAILED',
            domain: domain
          });
        }
        
        // Handle connection refused
        if (axiosError.code === 'ECONNREFUSED') {
          return res.status(502).json({
            success: false,
            message: 'Stream server refused connection. The server may be down.'
          });
        }
        
        // Handle timeout
        if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
          return res.status(504).json({
            success: false,
            message: 'Stream server timeout. The server took too long to respond.'
          });
        }
        
        if (axiosError.response) {
          // Server responded with error status
          return res.status(axiosError.response.status).json({
            success: false,
            message: `Stream server error: ${axiosError.response.statusText}`
          });
        } else if (axiosError.request) {
          // Request made but no response
          return res.status(504).json({
            success: false,
            message: 'Stream server timeout or unreachable'
          });
        } else {
          // Error setting up request
          return res.status(500).json({
            success: false,
            message: `Failed to setup stream: ${axiosError.message}`
          });
        }
      }
    }
  } catch (error) {
    console.error('Stream proxy error:', error.message);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Failed to proxy stream: ${error.message}`
      });
    }
  }
});

// @route   GET /api/stream/resolve
// @desc    Resolve redirects and get final URL for external players
// @access  Public
router.get('/resolve', async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Stream URL is required'
      });
    }

    const decodedUrl = decodeURIComponent(url);
    let finalUrl = decodedUrl;
    let redirectChain = [];

    try {
      // Follow redirects to get final URL
      const response = await axios.head(decodedUrl, {
        timeout: 15000,
        maxRedirects: 10, // Allow up to 10 redirects
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: () => true // Don't throw on any status
      });

      finalUrl = response.request.res.responseUrl || decodedUrl;
      
      // Check if redirected
      if (finalUrl !== decodedUrl) {
        redirectChain.push({ from: decodedUrl, to: finalUrl });
        
        // Verify final URL is reachable
        try {
          await axios.head(finalUrl, {
            timeout: 5000,
            maxRedirects: 0,
            validateStatus: () => true
          });
        } catch (finalError) {
          if (finalError.code === 'ENOTFOUND') {
            const domainMatch = finalError.message.match(/ENOTFOUND ([^\s]+)/);
            return res.status(502).json({
              success: false,
              message: `Redirect leads to unreachable domain: ${domainMatch ? domainMatch[1] : 'unknown'}`,
              originalUrl: decodedUrl,
              finalUrl: finalUrl,
              error: 'UNREACHABLE_REDIRECT_TARGET'
            });
          }
        }
      }

      res.json({
        success: true,
        originalUrl: decodedUrl,
        finalUrl: finalUrl,
        redirected: finalUrl !== decodedUrl,
        redirectChain: redirectChain
      });

    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        const domainMatch = error.message.match(/ENOTFOUND ([^\s]+)/);
        return res.status(502).json({
          success: false,
          message: `Cannot resolve domain: ${domainMatch ? domainMatch[1] : 'unknown'}`,
          error: 'DNS_RESOLUTION_FAILED'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/stream/check
// @desc    Check if a stream URL is accessible (diagnostic endpoint)
// @access  Public
router.get('/check', async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Stream URL is required'
      });
    }

    const decodedUrl = decodeURIComponent(url);
    const diagnostics = {
      originalUrl: decodedUrl,
      accessible: false,
      statusCode: null,
      finalUrl: null,
      redirects: [],
      error: null,
      contentType: null,
      headers: {}
    };

    try {
      // Try HEAD request first to check accessibility
      const response = await axios.head(decodedUrl, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: () => true // Don't throw on any status
      });

      diagnostics.statusCode = response.status;
      diagnostics.finalUrl = response.request.res.responseUrl || decodedUrl;
      diagnostics.contentType = response.headers['content-type'];
      diagnostics.headers = response.headers;
      diagnostics.accessible = response.status < 400;

      // Check if redirected
      if (diagnostics.finalUrl !== decodedUrl) {
        diagnostics.redirects.push({
          from: decodedUrl,
          to: diagnostics.finalUrl
        });
      }

    } catch (error) {
      diagnostics.error = error.message;
      diagnostics.accessible = false;

      if (error.code === 'ENOTFOUND') {
        const domainMatch = error.message.match(/ENOTFOUND ([^\s]+)/);
        diagnostics.error = `DNS resolution failed for domain: ${domainMatch ? domainMatch[1] : 'unknown'}`;
      } else if (error.code === 'ECONNREFUSED') {
        diagnostics.error = 'Connection refused - server may be down';
      } else if (error.code === 'ETIMEDOUT') {
        diagnostics.error = 'Connection timeout - server took too long to respond';
      }
    }

    res.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;

