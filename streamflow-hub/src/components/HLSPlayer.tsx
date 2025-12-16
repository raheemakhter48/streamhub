import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, Play, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamAPI } from "@/lib/api";

interface HLSPlayerProps {
  url: string;
  useProxy?: boolean;
}

const HLSPlayer = ({ url, useProxy = true }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // Check if this is an HLS stream (.m3u8) - check ORIGINAL URL, not proxy URL
  const isHlsStream = !!url && (url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('m3u'));

  // Use proxy URL if enabled (for HLS streams, proxy helps with manifest rewriting)
  // For non-HLS streams, we can try direct or proxy based on CORS
  const streamUrl = useProxy && url ? streamAPI.getProxyUrl(url) : url;

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    const video = videoRef.current;

    // If NOT an HLS stream, use native video player directly
    if (!isHlsStream) {
      console.log('Using native video player for non-HLS stream:', url);
      setIsLoading(true);
      setError(null);

      // For non-HLS streams, use proxy first (avoids CORS issues)
      // VLC works because it doesn't have CORS restrictions
      const directUrl = url;
      const proxyUrl = useProxy ? streamAPI.getProxyUrl(url) : url;
      
      // Set crossOrigin to handle CORS properly
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      
      // Try proxy URL first (better for CORS)
      console.log('Trying proxy URL first:', proxyUrl);
      video.src = proxyUrl;

      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        video.play().catch(() => {
          // Autoplay blocked
        });
      });

      video.addEventListener('error', async (e) => {
        console.error('Video error:', e);
        const videoElement = e.target as HTMLVideoElement;
        const currentSrc = videoElement.src;
        const errorCode = videoElement.error?.code;
        const errorMessage = videoElement.error?.message || '';
        
        console.log('Video error details:', {
          code: errorCode,
          message: errorMessage,
          currentSrc: currentSrc.substring(0, 100),
          directUrl: directUrl.substring(0, 100),
          proxyUrl: proxyUrl?.substring(0, 100)
        });
        
        // If proxy URL fails, try direct URL as fallback
        if (currentSrc === proxyUrl || currentSrc.includes('/api/stream/proxy')) {
          console.log('Proxy URL failed, trying direct URL as fallback:', directUrl);
          setIsLoading(true);
          setError('Trying direct connection...');
          
          // Remove crossOrigin for direct URL (might help)
          video.crossOrigin = null;
          video.src = directUrl;
          video.load();
        } else {
          // Both proxy and direct failed
          setIsLoading(false);
          console.error('Both proxy and direct URL failed. Error code:', errorCode);
          
          // Check error code for more specific messages
          if (errorCode === 4) { // MEDIA_ELEMENT_ERROR: Format error
            setError('Stream format not supported by browser. VLC player works perfectly - click "Open In" → "VLC Player" for best experience.');
          } else if (errorCode === 2) { // MEDIA_ELEMENT_ERROR: Network error
            setError('Network error: Browser cannot reach stream. VLC works - try opening in VLC player using the "Open In" button.');
          } else {
            // Try to check proxy status
            try {
              const proxyResponse = await fetch(proxyUrl, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
              });
              
              if (!proxyResponse.ok) {
                const errorText = await proxyResponse.text().catch(() => '');
                let errorData;
                try {
                  errorData = JSON.parse(errorText);
                } catch {
                  errorData = { message: proxyResponse.statusText };
                }
                
                setError(`Stream unavailable (${proxyResponse.status}): ${errorData.message || 'Server error'}. VLC player works - click "Open In" → "VLC Player" for best experience.`);
              } else {
                setError('Stream format may not be supported by browser. VLC player works perfectly - use "Open In" → "VLC Player" for best experience.');
              }
            } catch (fetchError: any) {
              console.error('Fetch error:', fetchError);
              setError('Browser cannot play this stream format. VLC player works perfectly! Click "Open In" → "VLC Player" for best experience.');
            }
          }
        }
      });

      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    // For HLS streams, use Hls.js
    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10, // Very low buffer for zero buffering
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        maxBufferSize: 30 * 1000 * 1000, // 30MB - reduced for faster start
        maxBufferHole: 0.3,
        highBufferWatchdogPeriod: 1,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxFragLoadingTimeOut: 20000, // Increased for slow connections
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 20000, // Increased from 8s to 20s
        startLevel: -1, // Auto quality selection
        capLevelToPlayerSize: true, // Auto quality based on player size
        autoStartLoad: true,
        xhrSetup: (xhr, url) => {
          // Handle CORS for video streams
          xhr.withCredentials = false;
          // Some IPTV providers need specific headers
          try {
            xhr.setRequestHeader("Accept", "*/*");
            xhr.setRequestHeader("User-Agent", "Mozilla/5.0");
          } catch (e) {
            // Ignore if header can't be set
          }
        },
        debug: false,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        // Auto-play if possible
        video.play().catch(() => {
          // Autoplay blocked, user will need to click play
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log("Quality switched to:", data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Handle manifest load timeout specifically
              if (data.details === "manifestLoadTimeOut" || data.details === "manifestLoadError") {
                if (retryCount < maxRetries) {
                  setRetryCount((prev) => prev + 1);
                  setError(`Reconnecting... (${retryCount + 1}/${maxRetries})`);
                  setTimeout(() => {
                    // Try reloading the source with retry
                    hls.startLoad();
                  }, 2000);
                } else {
                  setError("Stream unavailable - This channel may be down or the URL format is incorrect. Please try another channel.");
                  hls.destroy();
                  setIsLoading(false);
                }
              } else if (retryCount < maxRetries) {
                setRetryCount((prev) => prev + 1);
                setError(`Reconnecting... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                  hls.startLoad();
                }, 1000);
              } else {
                setError("Network error - please check your connection or try another channel");
                hls.destroy();
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Recovering from media error...");
              hls.recoverMediaError();
              break;
            default:
              if (retryCount < maxRetries) {
                setRetryCount((prev) => prev + 1);
                setTimeout(() => {
                  hls.destroy();
                  hls.loadSource(url);
                  hls.attachMedia(video);
                }, 2000);
              } else {
                setError("Stream error - cannot recover. Please try another channel.");
                hls.destroy();
                setIsLoading(false);
              }
              break;
          }
        } else {
          // Non-fatal errors, just log
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            console.warn("Network warning:", data);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        setError(null);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => {
            video.load();
          }, 1000);
        } else {
          setError("Failed to load video");
        }
      });
    } else {
      setError("HLS is not supported in this browser");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, retryCount, isHlsStream, url, useProxy]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    setError(null);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!streamUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-white">No stream URL provided</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        muted={false}
      />

      {/* Fullscreen Button */}
      <Button
        onClick={toggleFullscreen}
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
      >
        {isFullscreen ? (
          <Minimize className="w-5 h-5" />
        ) : (
          <Maximize className="w-5 h-5" />
        )}
      </Button>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {error && !error.includes("Reconnecting") && !error.includes("Recovering") && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center max-w-md px-4">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <Button
              onClick={() => {
                setRetryCount(0);
                if (hlsRef.current) {
                  hlsRef.current.destroy();
                }
                if (videoRef.current) {
                  videoRef.current.load();
                }
                window.location.reload();
              }}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {error && (error.includes("Reconnecting") || error.includes("Recovering")) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-white">{error}</p>
          </div>
        </div>
      )}

      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Button
            onClick={handlePlay}
            size="lg"
            className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90"
          >
            <Play className="w-10 h-10 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
