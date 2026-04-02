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
  Image,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {iptvAPI, favoritesAPI, recentlyWatchedAPI} from '../lib/api';
import {parseM3U, getCategories} from '../utils/m3uParser';
import {Channel, Favorite, ContentType} from '../types';
import ChannelCard from '../components/ChannelCard';

const {width} = Dimensions.get('window');

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

  // Smarters Teal & Blue Theme
  const primaryColor = '#00A8B5'; // Teal
  const secondaryColor = '#004E92'; // Blue
  const darkBg = '#001518';

  useEffect(() => {
    if (!isAuthenticated) {
      (navigation as any).navigate('Auth');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const [credentialsData, favoritesData, watchedData] = await Promise.all([
        iptvAPI.getCredentials(),
        favoritesAPI.getFavorites(),
        recentlyWatchedAPI.getRecentlyWatched(),
      ]);

      if (credentialsData.success) {
        await parseM3UPlaylist();
      }

      const favoriteUrls = new Set<string>(favoritesData.map((f: Favorite) => f.channelUrl));
      setFavorites(favoriteUrls);
      setRecentlyWatched(watchedData.slice(0, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
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

  const renderHomeMode = () => (
    <View style={styles.homeContainer}>
      <View style={styles.topHeader}>
        <View style={styles.brandingContainer}>
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            style={styles.logoCircleGradient}>
            <View style={styles.logoCircle}>
               <Text style={{fontSize: 22}}>SF</Text>
            </View>
          </LinearGradient>
          <View>
            <Text style={styles.welcomeText}>StreamFlow Hub</Text>
            <Text style={styles.userNameText}>{user?.email?.split('@')[0] || 'Guest'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => (navigation as any).navigate('Setup')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.smartersGrid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => setViewMode('live')}>
          <LinearGradient colors={['#002E34', '#001518']} style={styles.gridGradient}>
            <Text style={styles.gridIcon}>📺</Text>
            <Text style={styles.gridText}>LIVE TV</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem} onPress={() => setViewMode('movie')}>
          <LinearGradient colors={['#004B56', '#002E34']} style={styles.gridGradient}>
            <Text style={styles.gridIcon}>🎬</Text>
            <Text style={styles.gridText}>MOVIES</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem} onPress={() => setViewMode('series')}>
          <LinearGradient colors={['#006B7B', '#004B56']} style={styles.gridGradient}>
            <Text style={styles.gridIcon}>🎭</Text>
            <Text style={styles.gridText}>SERIES</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem} onPress={() => setViewMode('epg')}>
          <LinearGradient colors={['#008496', '#006B7B']} style={styles.gridGradient}>
            <Text style={styles.gridIcon}>📅</Text>
            <Text style={styles.gridText}>EPG GUIDE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {recentlyWatched.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History</Text>
          <FlatList
            horizontal
            data={recentlyWatched}
            renderItem={({item}) => (
              <ChannelCard
                channel={{name: item.channelName, url: item.channelUrl, logo: item.channelLogo, group: item.category}}
                isFavorite={favorites.has(item.channelUrl)}
                onPress={() => (navigation as any).navigate('Player', {channel: {name: item.channelName, url: item.channelUrl, logo: item.channelLogo, group: item.category}})}
              />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Switch Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListView = () => (
    <View style={styles.listView}>
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={() => setViewMode('home')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.listTitle}>{viewMode.toUpperCase()}</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={categories}
        horizontal
        style={styles.categoryList}
        renderItem={({item}) => (
          <TouchableOpacity 
            onPress={() => setSelectedCategory(item)}
            style={[styles.categoryBtn, selectedCategory === item && {backgroundColor: primaryColor}]}>
            <Text style={styles.categoryText}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={paginatedChannels}
        numColumns={3}
        key={viewMode} // Force re-render on mode change
        renderItem={({item}) => (
          <ChannelCard
            channel={item}
            isFavorite={favorites.has(item.url)}
            onPress={() => (navigation as any).navigate('Player', {channel: item})}
          />
        )}
        onEndReached={() => setCurrentPage(p => p + 1)}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={darkBg} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading StreamFlow...</Text>
        </View>
      ) : (
        viewMode === 'home' ? renderHomeMode() : renderListView()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#001518'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {color: '#fff', marginTop: 10, fontSize: 16},
  homeContainer: {flex: 1, padding: 20},
  topHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30},
  brandingContainer: {flexDirection: 'row', alignItems: 'center'},
  logoCircleGradient: {width: 50, height: 50, borderRadius: 25, padding: 2, marginRight: 15},
  logoCircle: {flex: 1, backgroundColor: '#001518', borderRadius: 23, justifyContent: 'center', alignItems: 'center'},
  welcomeText: {color: '#00A8B5', fontSize: 14},
  userNameText: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
  settingsButton: {padding: 10},
  settingsIcon: {fontSize: 24},
  smartersGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  gridItem: {width: '48%', height: 120, marginBottom: 15, borderRadius: 15, overflow: 'hidden'},
  gridGradient: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10},
  gridIcon: {fontSize: 32, marginBottom: 10},
  gridText: {color: '#fff', fontSize: 14, fontWeight: 'bold'},
  historySection: {marginTop: 20},
  sectionTitle: {color: '#00A8B5', fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  logoutBtn: {marginTop: 'auto', alignSelf: 'center', padding: 15},
  logoutBtnText: {color: '#666', fontSize: 14},
  listView: {flex: 1},
  listHeader: {flexDirection: 'row', alignItems: 'center', padding: 20},
  backBtn: {marginRight: 20},
  backBtnText: {color: '#00A8B5', fontSize: 16},
  listTitle: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
  searchBar: {paddingHorizontal: 20, marginBottom: 15},
  searchInput: {backgroundColor: '#002E34', color: '#fff', padding: 12, borderRadius: 10},
  categoryList: {maxHeight: 50, marginBottom: 10, paddingLeft: 20},
  categoryBtn: {paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#002E34'},
  categoryText: {color: '#fff', fontSize: 12},
  listContainer: {padding: 10, paddingBottom: 100},
});

export default DashboardScreen;
