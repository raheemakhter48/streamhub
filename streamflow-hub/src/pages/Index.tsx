import { Button } from "@/components/ui/button";
import { Play, Tv, Zap, Heart, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authAPI } from "@/lib/api";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authAPI.getCurrentUser();
        setIsAuthenticated(data.success && !!data.user);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-neon-cyan rounded-full filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-blue rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tv className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold neon-text">StreamVault</span>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
          <div className="animate-fade-in">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 glass-card rounded-full text-sm font-medium text-primary border border-primary/30">
                Zero Buffering • Ultra Fast • HLS Powered
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
              Stream Your IPTV
              <br />
              <span className="neon-text">Like Never Before</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Experience lightning-fast streaming with zero buffering. Add your IPTV credentials and watch thousands of channels instantly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 hover-glow">
                  <Play className="mr-2 w-5 h-5" />
                  Start Streaming
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            {[
              { icon: Zap, label: "0ms Buffering", value: "Ultra Fast" },
              { icon: Tv, label: "1000+ Channels", value: "All Categories" },
              { icon: Shield, label: "Secure & Private", value: "Encrypted" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-xl p-6 hover-scale animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose StreamVault?</h2>
          <p className="text-muted-foreground text-lg">The ultimate IPTV streaming experience</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Ultra-Fast Playback",
              description: "HLS technology ensures zero buffering and instant channel switching"
            },
            {
              icon: Heart,
              title: "Favorites System",
              description: "Mark your favorite channels and access them instantly"
            },
            {
              icon: Tv,
              title: "Smart Categories",
              description: "Channels organized by Movies, Sports, News, Kids and more"
            },
            {
              icon: Play,
              title: "Seamless Streaming",
              description: "Auto quality selection and reconnection for smooth playback"
            },
            {
              icon: Shield,
              title: "Secure Storage",
              description: "Your IPTV credentials are encrypted and stored securely"
            },
            {
              icon: Zap,
              title: "Mobile Ready",
              description: "Responsive design works perfectly on all devices"
            },
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-xl p-8 hover-scale animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="glass-card rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary rounded-full filter blur-[80px]"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-neon-blue rounded-full filter blur-[80px]"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Streaming?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users enjoying buffer-free IPTV streaming. Setup takes less than a minute.
            </p>
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                <Play className="mr-2 w-5 h-5" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 StreamVault. Ultra-fast IPTV streaming platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
