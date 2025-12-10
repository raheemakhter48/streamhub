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
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useRoute, useNavigation} from '@react-navigation/native';
import VideoPlayer from '../components/VideoPlayer';
import {favoritesAPI, recentlyWatchedAPI, streamAPI} from '../lib/api';
import {Channel} from '../types';

const PlayerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
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
        // Fallback: try to open VLC with http/https
        const httpUrl = finalUrl.startsWith('http') 
          ? finalUrl 
          : `http://${finalUrl}`;
        const vlcHttpUrl = `vlc://${httpUrl}`;
        
        try {
          await Linking.openURL(vlcHttpUrl);
        } catch {
          Alert.alert(
            'VLC Not Found',
            'Please install VLC Player and try again.\n\nOr copy the URL manually:\n' + finalUrl,
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
    <View style={styles.container}>
      <VideoPlayer
        streamUrl={channel.url}
        channelName={channel.name}
        onError={(error) => {
          Alert.alert('Stream Error', error);
        }}
      />

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
  infoContainer: {
    flex: 1,
  },
  infoContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 20,
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
    fontSize: 24,
  },
  category: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
  },
  actionsContainer: {
    marginTop: 16,
  },
  actionsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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

