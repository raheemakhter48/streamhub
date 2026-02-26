import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
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
  const mpegtsRef = useRef<mpegts.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if this is an HLS stream (.m3u8)
  const isHlsStream = !!url && (url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('m3u'));
  
  // Check if this is an MPEG-TS stream (.ts)
  const isMpegTsStream = !!url && (url.toLowerCase().includes('.ts') || url.toLowerCase().includes('/live/'));

  // Use proxy URL if enabled
  const streamUrl = useProxy && url ? streamAPI.getProxyUrl(url) : url;

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    const video = videoRef.current;
    
    // Cleanup previous players
    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
    };

    cleanup();

    // --- CASE 1: MPEG-TS Stream (.ts) ---
    if (isMpegTsStream && mpegts.getFeatureList().mseLivePlayback) {
      console.log('🚀 Using mpegts.js for stream:', url);
      setIsLoading(true);
      setError(null);

      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl,
          cors: true,
          withCredentials: false
        }, {
          enableWorker: true,
          enableStashBuffer: false,
          stashInitialSize: 128,
          lazyLoad: false,
          autoCleanupSourceBuffer: true
        });

        mpegtsRef.current = player;
        player.attachMediaElement(video);
        player.load();
        
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked - show manual play button if needed
          });
        }

        player.on(mpegts.Events.ERROR, (type, detail, info) => {
          console.error('❌ MPEG-TS Error:', type, detail, info);
          // Only show error if it's fatal or not recovering
          if (detail === 'network_unauthorized' || detail === 'network_forbidden') {
            setError(`Stream access denied (401/403).`);
          } else if (detail === 'network_not_found') {
            setError(`Stream URL not found (404).`);
          } else {
            setError(`Stream Error: ${detail}. Use "Open In" → "VLC Player" if it fails.`);
          }
          setIsLoading(false);
        });

        player.on(mpegts.Events.LOADING_COMPLETE, () => {
          setIsLoading(false);
          setError(null);
        });

        player.on(mpegts.Events.METADATA_ARRIVED, () => {
          setIsLoading(false);
          setError(null);
        });
      } catch (err: any) {
        console.error('❌ mpegts creation error:', err);
        setError('Player initialization failed.');
        setIsLoading(false);
      }

      return cleanup;
    }

    // --- CASE 2: HLS Stream (.m3u8) ---
    if (isHlsStream) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 10,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          maxBufferSize: 30 * 1000 * 1000,
          maxBufferHole: 0.3,
          highBufferWatchdogPeriod: 1,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 5,
          maxFragLoadingTimeOut: 20000,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
          startLevel: -1,
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
        });

        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setError(null);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('❌ HLS Fatal Error:', data);
            setError('Stream format error. Click "Open In" → "VLC Player" for best results.');
            setIsLoading(false);
            hls.destroy();
          }
        });

        return cleanup;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native Safari support
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          setError(null);
          video.play().catch(() => {});
        });
        return cleanup;
      }
    }

    // --- CASE 3: Fallback Native Player ---
    console.log('🎬 Using native video player fallback');
    video.src = streamUrl;
    
    const handleLoaded = () => {
      setIsLoading(false);
      setError(null);
      video.play().catch(() => {});
    };

    const handleError = () => {
      setError('Browser cannot play this stream format. Use "Open In" → "VLC Player" for best experience.');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('error', handleError);
      cleanup();
    };
  }, [streamUrl, isHlsStream, isMpegTsStream]);

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
      <div className="aspect-video bg-black flex items-center justify-center text-white">
        <p>No stream URL provided</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black group overflow-hidden rounded-lg shadow-2xl"
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        playsInline
      />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white text-sm animate-pulse">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 px-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="bg-red-500/20 p-3 rounded-full">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Playback Error</h3>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay (when paused) */}
      {!isPlaying && !isLoading && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10"
          onClick={handlePlay}
        >
          <div className="bg-primary/90 p-5 rounded-full shadow-lg transform transition-transform hover:scale-110 active:scale-95">
            <Play className="w-10 h-10 text-white fill-current" />
          </div>
        </div>
      )}

      {/* Controls Overlay (appears on hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <Play className="w-6 h-6 fill-current" />
              )}
            </Button>
            
            <div className="text-white text-xs font-medium bg-red-600 px-2 py-0.5 rounded-sm animate-pulse">
              LIVE
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HLSPlayer;
