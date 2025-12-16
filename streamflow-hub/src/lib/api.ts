// API Client for Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('auth_token');
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
};

// IPTV API
export const iptvAPI = {
  getCredentials: async () => {
    return apiRequest('/iptv/credentials');
  },

  saveCredentials: async (credentials: {
    providerName?: string;
    username?: string;
    password?: string;
    serverUrl?: string;
    m3uUrl?: string;
    m3uContent?: string;
  }) => {
    return apiRequest('/iptv/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getPlaylist: async () => {
    const response = await fetch(`${API_URL}/iptv/playlist`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch playlist' }));
      throw new Error(error.message || 'Failed to fetch playlist');
    }
    
    return response.text();
  },
};

// Favorites API
export const favoritesAPI = {
  getFavorites: async () => {
    const data = await apiRequest('/favorites');
    return data.data || [];
  },

  addFavorite: async (channel: {
    channelName: string;
    channelUrl: string;
    channelLogo?: string;
    category?: string;
  }) => {
    return apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  },

  removeFavorite: async (channelUrl: string) => {
    return apiRequest(`/favorites/${encodeURIComponent(channelUrl)}`, {
      method: 'DELETE',
    });
  },
};

// Recently Watched API
export const recentlyWatchedAPI = {
  getRecentlyWatched: async () => {
    const data = await apiRequest('/favorites/recently-watched');
    return data.data || [];
  },

  addRecentlyWatched: async (channel: {
    channelName: string;
    channelUrl: string;
    channelLogo?: string;
    category?: string;
  }) => {
    return apiRequest('/favorites/recently-watched', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  },
};

// Stream API
export const streamAPI = {
  getProxyUrl: (streamUrl: string) => {
    return `${API_URL}/stream/proxy?url=${encodeURIComponent(streamUrl)}`;
  },

  resolveUrl: async (streamUrl: string) => {
    try {
      const response = await fetch(
        `${API_URL}/stream/resolve?url=${encodeURIComponent(streamUrl)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error resolving URL:', error);
      return { success: false, finalUrl: streamUrl };
    }
  },
};

