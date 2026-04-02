-- 1. Profiles Table (Extended)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. IPTV Credentials Table (Master Structure)
CREATE TABLE IF NOT EXISTS public.iptv_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_name TEXT,
  username TEXT,
  password TEXT,
  server_url TEXT,
  m3u_url TEXT,
  epg_url TEXT,
  m3u_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.iptv_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON public.iptv_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own credentials"
  ON public.iptv_credentials FOR ALL
  USING (auth.uid() = user_id);

-- 3. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_logo TEXT,
  channel_url TEXT NOT NULL,
  category TEXT,
  stream_type TEXT DEFAULT 'live',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel_url)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

-- 4. Recently Watched Table
CREATE TABLE IF NOT EXISTS public.recently_watched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_logo TEXT,
  channel_url TEXT NOT NULL,
  category TEXT,
  stream_type TEXT DEFAULT 'live',
  watched_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.recently_watched ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own history"
  ON public.recently_watched FOR ALL
  USING (auth.uid() = user_id);

-- 5. Playlist Cache Table (Critical for Performance)
CREATE TABLE IF NOT EXISTS public.playlist_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.playlist_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cache"
  ON public.playlist_cache FOR ALL
  USING (auth.uid() = user_id);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_watched_user_id ON public.recently_watched(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_watched_time ON public.recently_watched(watched_at DESC);

-- 7. Trigger for Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
