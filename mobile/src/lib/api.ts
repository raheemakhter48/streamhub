// API Client for React Native Backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

// Get auth token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: Request failed` }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Better error messages for network issues
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to server. Make sure backend is running at ${API_URL.replace('/api', '')} and phone is on same WiFi.`);
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
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
    const token = await getToken();
    const response = await fetch(`${API_URL}/iptv/playlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

