import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Settings as SettingsIcon, Play, Shield } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [playerType, setPlayerType] = useState(localStorage.getItem("preferred_player") || "auto");
  const [useProxy, setUseProxy] = useState(localStorage.getItem("use_proxy") !== "false");

  const handleSave = () => {
    localStorage.setItem("preferred_player", playerType);
    localStorage.setItem("use_proxy", useProxy.toString());
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
        </div>

        <div className="space-y-6">
          {/* Player Settings */}
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Play className="w-5 h-5 text-primary" />
                Player Preferences
              </CardTitle>
              <CardDescription>Choose how you want to play your streams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Stream Player Type</Label>
                <RadioGroup value={playerType} onValueChange={setPlayerType} className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-glass-border bg-glass-card/50">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Auto (Recommended)</div>
                      <div className="text-sm text-muted-foreground">Automatically choose best player for stream</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-glass-border bg-glass-card/50">
                    <RadioGroupItem value="hls" id="hls" />
                    <Label htmlFor="hls" className="flex-1 cursor-pointer">
                      <div className="font-semibold">HLS.js Only</div>
                      <div className="text-sm text-muted-foreground">Force HLS player for all compatible streams</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-glass-border bg-glass-card/50">
                    <RadioGroupItem value="mpegts" id="mpegts" />
                    <Label htmlFor="mpegts" className="flex-1 cursor-pointer">
                      <div className="font-semibold">MPEG-TS Only</div>
                      <div className="text-sm text-muted-foreground">Use mpegts.js (Best for some IPTV providers)</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-glass-border bg-glass-card/50">
                    <RadioGroupItem value="native" id="native" />
                    <Label htmlFor="native" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Native Player</div>
                      <div className="text-sm text-muted-foreground">Use browser's default player (Safari/Edge)</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Network Settings */}
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-5 h-5 text-primary" />
                Network & Privacy
              </CardTitle>
              <CardDescription>Control how streams are loaded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg border border-glass-border bg-glass-card/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Use Stream Proxy</Label>
                  <p className="text-sm text-muted-foreground italic">
                    Bypass CORS and Mixed Content issues (Recommended for IPTV)
                  </p>
                </div>
                <Switch checked={useProxy} onCheckedChange={setUseProxy} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Save Settings
            </Button>
            <Button variant="outline" onClick={() => navigate("/setup")} className="flex-1">
              IPTV Credentials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
