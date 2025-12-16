import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Play, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { favoritesAPI } from "@/lib/api";
import { toast } from "sonner";

interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  quality?: "HD" | "SD";
}

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ChannelCard = ({ channel, isFavorite, onToggleFavorite }: ChannelCardProps) => {
  const navigate = useNavigate();
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);
  const [imageError, setImageError] = useState(false);

  const handlePlay = () => {
    const params = new URLSearchParams({
      name: channel.name,
      url: channel.url,
      category: channel.group || "",
    });
    if (channel.logo && !imageError) {
      params.append("logo", channel.logo);
    }
    navigate(`/player?${params.toString()}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (localIsFavorite) {
        await favoritesAPI.removeFavorite(channel.url);
        toast.success("Removed from favorites");
      } else {
        await favoritesAPI.addFavorite({
          channelName: channel.name,
          channelUrl: channel.url,
          channelLogo: channel.logo,
          category: channel.group,
        });
        toast.success("Added to favorites");
      }
      setLocalIsFavorite(!localIsFavorite);
      onToggleFavorite();
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  return (
    <Card
      className="glass-card hover-scale group cursor-pointer overflow-hidden relative"
      onClick={handlePlay}
    >
      {/* Channel Image/Icon */}
      <div className="aspect-square bg-secondary/50 flex items-center justify-center relative overflow-hidden">
        {channel.logo && !imageError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Tv className="w-12 h-12 text-muted-foreground" />
        )}

        {/* Quality Badge */}
        {channel.quality && (
          <Badge
            className={`absolute top-2 left-2 ${
              channel.quality === "HD"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {channel.quality}
          </Badge>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>

        {/* Favorite Button */}
        <Button
          size="icon"
          variant="ghost"
          className={`absolute top-2 right-2 transition-opacity bg-black/40 hover:bg-black/60 ${
            localIsFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={handleToggleFavorite}
        >
          <Heart
            className={`w-4 h-4 ${localIsFavorite ? "fill-primary text-primary" : "text-white"}`}
          />
        </Button>
      </div>

      {/* Channel Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {channel.name}
        </h3>
        {channel.group && (
          <p className="text-xs text-muted-foreground">{channel.group}</p>
        )}
      </div>
    </Card>
  );
};

export default ChannelCard;
