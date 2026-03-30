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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
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
  const channelsPerPage = 60;

  useEffect(() => {
    if (!isAuthenticated) {
      (navigation as any).navigate('Auth');
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
    } catch (error: any) {
      console.error('Error parsing M3U:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await favoritesAPI.getFavorites();
      const favoriteUrls = new Set<string>(data.map((f: Favorite) => f.channelUrl));
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

  const renderHeader = () => (
    <View>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{user?.email?.split('@')[0] || 'Streamer'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => (navigation as any).navigate('Setup')}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.profileBadge}>
            <Text style={styles.profileIconText}>⚙️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels, categories..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <View style={styles.categoriesSection}>
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
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {recentlyWatched.length > 0 && searchQuery === '' && selectedCategory === 'All' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
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
                  (navigation as any).navigate('Player', {
                    channel: {
                      name: item.channelName,
                      url: item.channelUrl,
                      logo: item.channelLogo,
                      group: item.category,
                    },
                  })
                }
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingLeft: 16}}
          />
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'All Channels' : selectedCategory}
        </Text>
        <Text style={styles.channelCount}>
          {filteredChannels.length} found
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Synchronizing streams...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <FlatList
        data={paginatedChannels}
        numColumns={3}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({item}) => (
          <ChannelCard
            channel={item}
            isFavorite={favorites.has(item.url)}
            onPress={() =>
              (navigation as any).navigate('Player', {channel: item})
            }
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No channels matching your search</Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  listContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  userNameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    elevation: 4,
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 22,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 15,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  categoriesSection: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  section: {
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
  },
  channelCount: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DashboardScreen;

