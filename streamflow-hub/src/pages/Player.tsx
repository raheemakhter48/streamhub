import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Tv, ExternalLink, Copy, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import HLSPlayer from "@/components/HLSPlayer";
import { favoritesAPI, recentlyWatchedAPI, streamAPI } from "@/lib/api";
import { toast } from "sonner";

const Player = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const channelName = searchParams.get("name") || "Unknown Channel";
  const channelUrl = searchParams.get("url") || "";
  const channelLogo = searchParams.get("logo") || "";
  const channelCategory = searchParams.get("category") || "";

  useEffect(() => {
    checkFavorite();
    addToRecentlyWatched();
  }, [channelUrl]);

  const checkFavorite = async () => {
    try {
      const favorites = await favoritesAPI.getFavorites();
      const isFav = favorites.some((fav: any) => fav.channelUrl === channelUrl);
      setIsFavorite(isFav);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const addToRecentlyWatched = async () => {
    try {
      await recentlyWatchedAPI.addRecentlyWatched({
        channelName,
        channelUrl,
        channelLogo,
        category: channelCategory,
      });
    } catch (error) {
      console.error("Error adding to recently watched:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(channelUrl);
        toast.success("Removed from favorites");
      } else {
        await favoritesAPI.addFavorite({
          channelName,
          channelUrl,
          channelLogo,
          category: channelCategory,
        });
        toast.success("Added to favorites");
      }
      setIsFavorite(!isFavorite);
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const copyStreamUrl = () => {
    navigator.clipboard.writeText(channelUrl);
    toast.success("Stream URL copied to clipboard!");
  };

  const openInVLC = async () => {
    try {
      toast.info("Resolving redirects...");
      
      // First, resolve redirects to get final URL
      const resolveResult = await streamAPI.resolveUrl(channelUrl);
      
      let urlToUse = channelUrl;
      let redirectInfo = "";
      
      if (resolveResult.success && resolveResult.finalUrl) {
        urlToUse = resolveResult.finalUrl;
        
        if (resolveResult.redirected) {
          redirectInfo = ` (Redirected from original URL)`;
          toast.success(`Redirect resolved! Opening in VLC...`);
        } else {
          toast.success("Opening in VLC...");
        }
      } else {
        // If resolve fails, use original URL - VLC will handle redirects automatically
        toast.warning("Could not resolve redirects. VLC will handle redirects automatically.");
      }
      
      // VLC protocol handler - works on Windows, Mac, Linux if VLC is installed
      const vlcUrl = `vlc://${urlToUse}`;
      window.location.href = vlcUrl;
      
      // Fallback: Show instructions
      setTimeout(() => {
        toast.info(
          `If VLC didn't open automatically:\n1. Open VLC\n2. Go to Media > Open Network Stream\n3. Paste this URL: ${urlToUse}${redirectInfo}`,
          { duration: 8000 }
        );
      }, 1500);
      
    } catch (error) {
      console.error('Error opening in VLC:', error);
      // Fallback to original URL
      const vlcUrl = `vlc://${channelUrl}`;
      window.location.href = vlcUrl;
      toast.info("Opening in VLC. VLC will automatically handle any redirects.");
    }
  };

  const openInMXPlayer = () => {
    // MX Player intent for Android
    const mxUrl = `intent:${channelUrl}#Intent;type=video/*;scheme=http;end`;
    window.location.href = mxUrl;
    toast.info("Opening in MX Player (Android only). For other devices, copy the URL and paste in your player.");
  };

  const openInExternalPlayer = (player: string) => {
    switch (player) {
      case 'vlc':
        openInVLC();
        break;
      case 'mx':
        openInMXPlayer();
        break;
      case 'default':
        window.open(channelUrl, '_blank');
        toast.info("Opening stream in default player. If it doesn't work, copy the URL and paste in VLC or MX Player.");
        break;
      default:
        window.open(channelUrl, '_blank');
    }
  };

  const downloadM3U = () => {
    // Create a simple M3U file with this channel
    const m3uContent = `#EXTM3U
#EXTINF:-1,${channelName}
${channelUrl}`;
    
    const blob = new Blob([m3uContent], { type: 'application/vnd.apple.mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${channelName.replace(/[^a-z0-9]/gi, '_')}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("M3U file downloaded! Open it in VLC or any IPTV player.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-glass-border sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h1 className="font-bold">{channelName}</h1>
                {channelCategory && (
                  <p className="text-sm text-muted-foreground">{channelCategory}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openInExternalPlayer('vlc')}>
                      <Tv className="w-4 h-4 mr-2" />
                      VLC Player
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInExternalPlayer('mx')}>
                      <Tv className="w-4 h-4 mr-2" />
                      MX Player (Android)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInExternalPlayer('default')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Default Player
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyStreamUrl}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadM3U}>
                      <Download className="w-4 h-4 mr-2" />
                      Download M3U
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFavorite}
                  className="hover-glow"
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="container mx-auto px-6 py-8">
        {/* VLC Recommendation Banner */}
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">
                ✅ Stream is working in VLC Player!
              </p>
              <p className="text-xs text-green-300/80 mt-1">
                For best experience, use VLC Player. Click "Open In" → "VLC Player" button above.
              </p>
            </div>
            <Button
              onClick={() => openInExternalPlayer('vlc')}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white gap-2"
            >
              <Tv className="w-4 h-4" />
              Open in VLC
            </Button>
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-xl overflow-hidden glass-card border-glass-border">
          {channelUrl ? (
            <>
              <HLSPlayer url={channelUrl} />
              {/* Quick Action Button - Overlay on player */}
              <div className="absolute top-4 right-4 z-30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2 bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openInExternalPlayer('vlc')}>
                      <Tv className="w-4 h-4 mr-2" />
                      <span className="font-semibold">Open in VLC (Recommended)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInExternalPlayer('mx')}>
                      <Tv className="w-4 h-4 mr-2" />
                      Open in MX Player
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInExternalPlayer('default')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Browser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyStreamUrl}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Stream URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadM3U}>
                      <Download className="w-4 h-4 mr-2" />
                      Download M3U File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-16 h-16 text-destructive mx-auto mb-4" />
                <p className="text-white">No stream URL provided</p>
                <Button onClick={() => navigate("/dashboard")} className="mt-4">
                  Back to Channels
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Channel Info */}
        <div className="mt-6 glass-card rounded-xl p-6">
          <div className="flex items-start gap-4">
            {channelLogo && (
              <img
                src={channelLogo}
                alt={channelName}
                className="w-20 h-20 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{channelName}</h2>
              {channelCategory && (
                <p className="text-muted-foreground mb-4">{channelCategory}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>Stream URL: {channelUrl.substring(0, 60)}...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyStreamUrl}
                  className="gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
              
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400 mb-2">
                  <strong>✅ Great News!</strong> This stream works perfectly in VLC Player!
                </p>
                <p className="text-sm text-green-300/90 mb-2">
                  The web browser player may have limitations with this stream format, but VLC handles it perfectly.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => openInExternalPlayer('vlc')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white gap-2"
                  >
                    <Tv className="w-4 h-4" />
                    Open in VLC Now
                  </Button>
                  <Button
                    onClick={copyStreamUrl}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </Button>
                </div>
              </div>
              
              {channelUrl.includes("otv.to") && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    <strong>Note:</strong> If the stream doesn't load, the channel may be temporarily unavailable. Try opening in VLC or MX Player for better compatibility.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
