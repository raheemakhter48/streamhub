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
import {Channel, Favorite, ContentType} from '../types';
import ChannelCard from '../components/ChannelCard';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user, logout, isAuthenticated} = useAuth();
  const [viewMode, setViewMode] = useState<ContentType | 'home' | 'epg'>('home');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const channelsPerPage = 40;

  // Updated colors from logo: Teal/Cyan (#00A8B5) and Deep Blue (#004E92)
  const primaryColor = '#00A8B5';
  const secondaryColor = '#004E92';

  useEffect(() => {
    if (!isAuthenticated) {
      (navigation as any).navigate('Auth');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [credentialsData, favoritesData, watchedData] = await Promise.all([
        iptvAPI.getCredentials(),
        favoritesAPI.getFavorites(),
        recentlyWatchedAPI.getRecentlyWatched(),
      ]);

      if (credentialsData.success && (credentialsData.data.m3uUrl || credentialsData.data.m3uContent)) {
        await parseM3UPlaylist();
      }

      const favoriteUrls = new Set<string>(favoritesData.map((f: Favorite) => f.channelUrl));
      setFavorites(favoriteUrls);
      setRecentlyWatched(watchedData.slice(0, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3UPlaylist = async () => {
    try {
      const text = await iptvAPI.getPlaylist();
      if (text) {
        const parsedChannels = parseM3U(text);
        setChannels(parsedChannels);
        setFilteredChannels(parsedChannels);
      }
    } catch (error) {
      console.error('Error parsing M3U:', error);
    }
  };

  const categories = useMemo(() => {
    const filteredForMode = viewMode === 'home' || viewMode === 'epg' 
      ? channels 
      : channels.filter(ch => ch.type === viewMode);
    return ['All', ...getCategories(filteredForMode)];
  }, [channels, viewMode]);

  const filterChannels = useCallback(() => {
    let filtered = [...channels];
    
    if (viewMode !== 'home' && viewMode !== 'epg') {
      filtered = filtered.filter(ch => ch.type === viewMode);
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ch => ch.group === selectedCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(lowerQuery) || 
        (ch.group && ch.group.toLowerCase().includes(lowerQuery))
      );
    }
    setFilteredChannels(filtered);
    setCurrentPage(1);
  }, [channels, selectedCategory, searchQuery, viewMode]);

  useEffect(() => {
    filterChannels();
  }, [selectedCategory, searchQuery, viewMode, filterChannels]);

  const paginatedChannels = useMemo(() => {
    return filteredChannels.slice(0, currentPage * channelsPerPage);
  }, [filteredChannels, currentPage]);

  const loadMore = () => {
    if (paginatedChannels.length < filteredChannels.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const renderHomeMode = () => (
    <View style={styles.homeContainer}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{user?.email?.split('@')[0] || 'Streamer'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => (navigation as any).navigate('Setup')}>
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            style={styles.profileBadge}>
            <Text style={styles.profileIconText}>⚙️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.smartersGrid}>
        <TouchableOpacity 
          style={[styles.smartersButton, {backgroundColor: '#002C31'}]}
          onPress={() => setViewMode('live')}>
          <Text style={styles.smartersIcon}>📺</Text>
          <Text style={styles.smartersText}>LIVE TV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smartersButton, {backgroundColor: '#004A55'}]}
          onPress={() => setViewMode('movie')}>
          <Text style={styles.smartersIcon}>🎬</Text>
          <Text style={styles.smartersText}>MOVIES</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smartersButton, {backgroundColor: '#006B7B'}]}
          onPress={() => setViewMode('series')}>
          <Text style={styles.smartersIcon}>🎭</Text>
          <Text style={styles.smartersText}>SERIES</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.smartersButton, {backgroundColor: '#008496'}]}
          onPress={() => setViewMode('epg')}>
          <Text style={styles.smartersIcon}>📅</Text>
          <Text style={styles.smartersText}>EPG</Text>
        </TouchableOpacity>
      </View>

      {recentlyWatched.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <FlatList
            horizontal
            data={recentlyWatched}
            keyExtractor={(item, index) => `${item.channelUrl}-${index}`}
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
            contentContainerStyle={{paddingLeft: 20}}
          />
        </View>
      )}
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.listTopBar}>
        <TouchableOpacity 
          style={styles.backToHome}
          onPress={() => {
            setViewMode('home');
            setSelectedCategory('All');
            setSearchQuery('');
          }}>
          <Text style={[styles.backToHomeText, {color: primaryColor}]}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.viewModeTitle}>
          {viewMode.toUpperCase()}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, {borderColor: secondaryColor}]}
          placeholder={`Search ${viewMode}...`}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && {backgroundColor: primaryColor, borderColor: primaryColor},
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
        style={styles.categoryList}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Synchronizing streams...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {viewMode === 'home' ? (
        <FlatList
          key="home-list"
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHomeMode}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={loadData} 
              tintColor={primaryColor}
            />
          }
        />
      ) : viewMode === 'epg' ? (
        <View style={styles.epgPlaceholder}>
          <TouchableOpacity 
            style={styles.backToHome}
            onPress={() => setViewMode('home')}>
            <Text style={[styles.backToHomeText, {color: primaryColor}]}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.epgText}>EPG / TV Guide Coming Soon</Text>
          <Text style={styles.epgSubText}>We are working on integrating the TV schedule for your channels.</Text>
        </View>
      ) : (
        <FlatList
          key="grid-list"
          data={paginatedChannels}
          numColumns={3}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          renderItem={({item}) => (
            <ChannelCard
              channel={item}
              isFavorite={favorites.has(item.url)}
              onPress={() => (navigation as any).navigate('Player', {channel: item})}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.7}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={loadData} 
              tintColor={primaryColor}
            />
          }
          contentContainerStyle={{paddingBottom: 20}}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No content matching your search</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: { paddingBottom: 10 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  welcomeText: { color: '#888', fontSize: 12 },
  userNameText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  profileButton: {
    elevation: 4,
  },
  profileBadge: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  profileIconText: {
    fontSize: 22,
  },
  homeContainer: {
    flex: 1,
  },
  smartersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  smartersButton: {
    width: '47%',
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  smartersIcon: {
    fontSize: 35,
    marginBottom: 8,
  },
  smartersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    marginBottom: 10,
  },
  backToHome: {
    padding: 5,
  },
  backToHomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewModeTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
  },
  epgPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  epgText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  epgSubText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
    padding: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchInput: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, color: '#fff', borderWidth: 1, borderColor: '#333' },
  categoryList: { paddingLeft: 20, marginBottom: 15 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  categoryText: { color: '#888', fontWeight: 'bold' },
  categoryTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 10 },
});

export default DashboardScreen;
