import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import {useRoute, useNavigation} from '@react-navigation/native';
import VideoPlayer from '../components/VideoPlayer';
import {favoritesAPI, recentlyWatchedAPI, streamAPI} from '../lib/api';
import {Channel} from '../types';

const PlayerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {channel} = route.params as {channel: Channel};
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
    addToRecentlyWatched();
  }, [channel.url]);

  const checkFavorite = async () => {
    try {
      const favorites = await favoritesAPI.getFavorites();
      const isFav = favorites.some((f: any) => f.channelUrl === channel.url);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const addToRecentlyWatched = async () => {
    try {
      await recentlyWatchedAPI.addRecentlyWatched({
        channelName: channel.name,
        channelUrl: channel.url,
        channelLogo: channel.logo || channel.tvgLogo,
        category: channel.group,
      });
    } catch (error) {
      console.error('Error adding to recently watched:', error);
    }
  };

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(channel.url);
        setIsFavorite(false);
      } else {
        await favoritesAPI.addFavorite({
          channelName: channel.name,
          channelUrl: channel.url,
          channelLogo: channel.logo || channel.tvgLogo,
          category: channel.group,
        });
        setIsFavorite(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  const openInVLC = async () => {
    try {
      const resolved = await streamAPI.resolveUrl(channel.url);
      const finalUrl = resolved.success ? resolved.finalUrl : channel.url;
      
      const vlcUrl = `vlc://${finalUrl}`;
      const canOpen = await Linking.canOpenURL(vlcUrl);
      
      if (canOpen) {
        await Linking.openURL(vlcUrl);
      } else {
        const httpUrl = finalUrl.startsWith('http')
          ? finalUrl 
          : `http://${finalUrl}`;
        const vlcHttpUrl = `vlc://${httpUrl}`;
        
        try {
          await Linking.openURL(vlcHttpUrl);
        } catch {
          Alert.alert(
            'VLC Not Found',
            'Please install VLC Player and try again.',
            [
              {text: 'Copy URL', onPress: () => copyToClipboard(finalUrl)},
              {text: 'OK'},
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open in VLC');
    }
  };

  const openInMXPlayer = async () => {
    try {
      const resolved = await streamAPI.resolveUrl(channel.url);
      const finalUrl = resolved.success ? resolved.finalUrl : channel.url;
      
      const mxUrl = `intent:${finalUrl}#Intent;scheme=http;package=com.mxtech.videoplayer.ad;end`;
      const canOpen = await Linking.canOpenURL(mxUrl);
      
      if (canOpen) {
        await Linking.openURL(mxUrl);
      } else {
        Alert.alert(
          'MX Player Not Found',
          'Please install MX Player and try again.',
          [{text: 'OK'}]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open in MX Player');
    }
  };

  const copyToClipboard = async (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Success', 'Stream URL copied to clipboard');
  };

  return (
    <View style={[styles.container, {paddingTop: 0}]}>
      <StatusBar hidden />

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <VideoPlayer
          streamUrl={channel.url}
          channelName={channel.name}
          onError={(error) => {
            Alert.alert('Stream Error', error);
          }}
        />

        {/* Back Button Overlay */}
        <TouchableOpacity
          style={[styles.backButton, {top: insets.top + 10}]}
          onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Text style={styles.backButtonText}>←</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.infoContainer} contentContainerStyle={styles.infoContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.channelName}>{channel.name}</Text>
            {channel.isHD && (
              <View style={styles.hdBadge}>
                <Text style={styles.hdText}>HD</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            disabled={loading}>
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        {channel.group && (
          <Text style={styles.category}>Category: {channel.group}</Text>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Open in External Player</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={openInVLC}>
            <Text style={styles.actionButtonText}>📺 Open in VLC</Text>
          </TouchableOpacity>

          {Platform.OS === 'android' && (
            <TouchableOpacity style={styles.actionButton} onPress={openInMXPlayer}>
              <Text style={styles.actionButtonText}>🎬 Open in MX Player</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => copyToClipboard(channel.url)}>
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              📋 Copy Stream URL
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -4, // Adjust for center alignment of arrow
  },
  infoContainer: {
    flex: 1,
  },
  infoContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  hdBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hdText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 28,
  },
  category: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 24,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
});

export default PlayerScreen;
