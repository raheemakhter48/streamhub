import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {iptvAPI, favoritesAPI, recentlyWatchedAPI} from '../lib/api';
import {parseM3U, getCategories} from '../utils/m3uParser';
import {Channel, Favorite} from '../types';
import ChannelCard from '../components/ChannelCard';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user, logout, isAuthenticated} = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const channelsPerPage = 50;

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth' as never);
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    await Promise.all([
      loadCredentialsAndChannels(),
      loadFavorites(),
      loadRecentlyWatched(),
    ]);
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
        await parseM3UPlaylist();
      } else {
        setHasCredentials(false);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setHasCredentials(false);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3UPlaylist = async () => {
    try {
      setIsLoading(true);
      const text = await iptvAPI.getPlaylist();
      if (!text || text.trim().length === 0) {
        throw new Error('Empty playlist received');
      }
      const parsedChannels = parseM3U(text);
      setChannels(parsedChannels);
      setFilteredChannels(parsedChannels);
      console.log(`Loaded ${parsedChannels.length} channels`);
    } catch (error: any) {
      console.error('Error parsing M3U:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await favoritesAPI.getFavorites();
      const favoriteUrls = new Set(data.map((f: Favorite) => f.channelUrl));
      setFavorites(favoriteUrls);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadRecentlyWatched = async () => {
    try {
      const data = await recentlyWatchedAPI.getRecentlyWatched();
      setRecentlyWatched(data.slice(0, 10));
    } catch (error) {
      console.error('Error loading recently watched:', error);
    }
  };

  const categories = useMemo(() => {
    return ['All', ...getCategories(channels)];
  }, [channels]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    filterChannels(query, selectedCategory);
  }, [selectedCategory, channels]);

  const filterChannels = useCallback((query: string, category: string) => {
    let filtered = [...channels];

    if (category !== 'All') {
      filtered = filtered.filter(ch => ch.group === category);
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        ch =>
          ch.name.toLowerCase().includes(lowerQuery) ||
          (ch.group && ch.group.toLowerCase().includes(lowerQuery)),
      );
    }

    setFilteredChannels(filtered);
    setCurrentPage(1);
  }, [channels]);

  useEffect(() => {
    filterChannels(searchQuery, selectedCategory);
  }, [selectedCategory, filterChannels]);

  const paginatedChannels = useMemo(() => {
    const startIndex = (currentPage - 1) * channelsPerPage;
    return filteredChannels.slice(0, startIndex + channelsPerPage);
  }, [filteredChannels, currentPage]);

  const loadMore = () => {
    if (paginatedChannels.length < filteredChannels.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading channels...</Text>
      </View>
    );
  }

  if (!hasCredentials) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No IPTV Credentials</Text>
          <Text style={styles.emptyText}>
            Please set up your IPTV credentials to start streaming
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Setup' as never)}>
            <Text style={styles.buttonText}>Setup IPTV</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Setup' as never)}>
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {recentlyWatched.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Watched</Text>
          <FlatList
            horizontal
            data={recentlyWatched}
            keyExtractor={item => item._id || item.channelUrl}
            renderItem={({item}) => (
              <ChannelCard
                channel={{
                  name: item.channelName,
                  url: item.channelUrl,
                  logo: item.channelLogo,
                  group: item.category,
                }}
                isFavorite={favorites.has(item.channelUrl)}
                onPress={() =>
                  navigation.navigate('Player' as never, {
                    channel: {
                      name: item.channelName,
                      url: item.channelUrl,
                      logo: item.channelLogo,
                      group: item.category,
                    },
                  } as never)
                }
              />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <Text style={styles.channelCount}>
        {filteredChannels.length} channels
      </Text>

      <FlatList
        data={paginatedChannels}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({item}) => (
          <ChannelCard
            channel={item}
            isFavorite={favorites.has(item.url)}
            onPress={() =>
              navigation.navigate('Player' as never, {channel: item} as never)
            }
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No channels found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
  },
  settingsText: {
    fontSize: 24,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  channelCount: {
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;

