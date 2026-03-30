import { useEffect, useState, useMemo, useCallback } from "react";
import { authAPI, iptvAPI, favoritesAPI, recentlyWatchedAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search, Settings, Tv, Heart, Clock, Moon, Sun, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import ChannelCard from "@/components/ChannelCard";
import CategoryFilter from "@/components/CategoryFilter";

interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  quality?: "HD" | "SD";
}

interface RecentlyWatched {
  channelName: string;
  channelUrl: string;
  channelLogo?: string;
  category?: string;
  watchedAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<RecentlyWatched[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltering, setIsFiltering] = useState(false);
  const channelsPerPage = 100; // Show 100 channels per page for performance

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadCredentialsAndChannels();
      loadFavorites();
      loadRecentlyWatched();
    }
  }, [user]);

  // Optimized filtering with useMemo for performance
  const filteredChannels = useMemo(() => {
    if (isFiltering) return [];
    
    let filtered = [...channels];

    if (showFavoritesOnly) {
      filtered = filtered.filter((ch) => favorites.includes(ch.url));
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((ch) => ch.group === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ch) =>
        ch.name.toLowerCase().includes(query) ||
        (ch.group && ch.group.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [channels, searchQuery, selectedCategory, showFavoritesOnly, favorites, isFiltering]);

  // Paginated channels for display
  const paginatedChannels = useMemo(() => {
    const startIndex = (currentPage - 1) * channelsPerPage;
    const endIndex = startIndex + channelsPerPage;
    return filteredChannels.slice(startIndex, endIndex);
  }, [filteredChannels, currentPage]);

  const totalPages = Math.ceil(filteredChannels.length / channelsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, showFavoritesOnly]);

  const checkAuth = async () => {
    try {
      const data = await authAPI.getCurrentUser();
      if (!data.success || !data.user) {
        navigate("/auth");
        return;
      }
      setUser(data.user);
    } catch (error) {
      navigate("/auth");
    }
  };

  const loadCredentialsAndChannels = async () => {
    try {
      const credentialsData = await iptvAPI.getCredentials();
      
      if (!credentialsData.success || !credentialsData.data) {
        setHasCredentials(false);
        setIsLoading(false);
        return;
      }

      const credentials = credentialsData.data;
      
      if (credentials.m3uUrl || credentials.m3uContent) {
        setHasCredentials(true);
        // Fetch playlist from backend (no CORS issues!)
        await parseM3UPlaylist();
      } else {
        setHasCredentials(false);
      }
    } catch (error: any) {
      console.error("Error loading credentials:", error);
      setHasCredentials(false);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3UPlaylist = async () => {
    try {
      setIsLoading(true);
      setIsFiltering(true);
      
      // Fetch playlist from backend API (no CORS issues!)
      const text = await iptvAPI.getPlaylist();
      
      if (!text || text.trim().length === 0) {
        throw new Error("Empty playlist received");
      }
      
      // Validate M3U format
      const hasExtInf = text.includes("#EXTINF");
      const hasExtM3U = text.includes("#EXTM3U");
      const hasHttpUrls = /https?:\/\//.test(text);
      
      if (!hasExtInf && !hasExtM3U && !hasHttpUrls) {
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error("Received HTML instead of M3U playlist");
        }
        throw new Error("Invalid M3U format received");
      }
      
      // Parse channels
      const parsedChannels = parseM3U(text);
      
      if (parsedChannels.length === 0) {
        toast.warning("No channels found in playlist");
        setChannels([]);
      } else {
        setChannels(parsedChannels);
        toast.success(`Successfully loaded ${parsedChannels.length.toLocaleString()} channels!`);
      }
      setIsFiltering(false);
    } catch (error: any) {
      console.error("Error parsing M3U:", error);
      toast.error(error.message || "Failed to load channels");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  const handleRefreshChannels = async () => {
    try {
      await parseM3UPlaylist();
    } catch (error: any) {
      toast.error("Failed to refresh channels");
    }
  };

  const parseM3U = (content: string): Channel[] => {
    const lines = content.split("\n");
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("#EXTINF:")) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        
        // Detect HD/SD quality from channel name
        const channelName = nameMatch ? nameMatch[1].trim() : "Unknown";
        const isHD = /HD|1080|720|FHD|UHD|4K/i.test(channelName);
        const isSD = /SD|480/i.test(channelName);
        const quality = isHD ? "HD" : isSD ? "SD" : undefined;

        currentChannel = {
          name: channelName,
          logo: logoMatch ? logoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : "Other",
          quality,
        };
      } else if (line && !line.startsWith("#") && currentChannel.name) {
        channels.push({
          ...currentChannel,
          url: line,
        } as Channel);
        currentChannel = {};
      }
    }

    return channels;
  };

  const loadFavorites = async () => {
    try {
      const favoritesList = await favoritesAPI.getFavorites();
      setFavorites(favoritesList.map((fav: any) => fav.channelUrl));
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadRecentlyWatched = async () => {
    try {
      const data = await recentlyWatchedAPI.getRecentlyWatched();
      setRecentlyWatched(data);
    } catch (error) {
      console.error("Error loading recently watched:", error);
    }
  };

  const refreshFavorites = () => {
    loadFavorites();
  };

  // Debounced search handler
  const [searchDebounce, setSearchDebounce] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchDebounce);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchDebounce]);

  const handleLogout = async () => {
    authAPI.logout();
    navigate("/");
  };

  const categories = ["All", ...Array.from(new Set(channels.map((ch) => ch.group || "Other")))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Tv className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCredentials) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Setup Required</h2>
          <p className="text-muted-foreground mb-8">
            Add your IPTV credentials to start streaming
          </p>
          <Button
            onClick={() => navigate("/setup")}
            className="bg-primary hover:bg-primary/90"
          >
            Add IPTV Credentials
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-glass-border sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold neon-text">StreamVault</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshChannels}
                title="Refresh channels"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/setup")}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Recently Watched Section */}
        {recentlyWatched.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Recently Watched</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {recentlyWatched.map((item, index) => {
                const channel: Channel = {
                  name: item.channelName,
                  url: item.channelUrl,
                  logo: item.channelLogo || undefined,
                  group: item.category || undefined,
                };
                return (
                  <ChannelCard
                    key={`recent-${item.channelUrl}-${index}`}
                    channel={channel}
                    isFavorite={favorites.includes(item.channelUrl)}
                    onToggleFavorite={refreshFavorites}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && !showFavoritesOnly && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <h2 className="text-2xl font-bold">Favorites</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {channels
                .filter((ch) => favorites.includes(ch.url))
                .slice(0, 12)
                .map((channel, index) => (
                  <ChannelCard
                    key={`fav-${channel.url}-${index}`}
                    channel={channel}
                    isFavorite={true}
                    onToggleFavorite={refreshFavorites}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
              className="pl-10 bg-secondary/50 border-glass-border h-12"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-2"
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favorites
            </Button>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Channels Grid */}
        {isFiltering ? (
          <div className="text-center py-20">
            <Tv className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Processing channels...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-20">
            <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No channels found</p>
            {channels.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or category filter
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * channelsPerPage + 1).toLocaleString()} - {Math.min(currentPage * channelsPerPage, filteredChannels.length).toLocaleString()} of {filteredChannels.length.toLocaleString()} channels
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {paginatedChannels.map((channel, index) => (
                <ChannelCard
                  key={`${channel.url}-${index}`}
                  channel={channel}
                  isFavorite={favorites.includes(channel.url)}
                  onToggleFavorite={refreshFavorites}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
