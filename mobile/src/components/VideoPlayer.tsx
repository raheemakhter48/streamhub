import React, {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Video, {OnLoadData, OnErrorData} from 'react-native-video';
import {streamAPI} from '../lib/api';

interface VideoPlayerProps {
  streamUrl: string;
  channelName?: string;
  onError?: (error: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  channelName,
  onError,
}) => {
  type FallbackStrategy = 'proxy' | 'direct_vlc' | 'direct_chrome' | 'resolved';

  const videoRef = useRef<Video>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<FallbackStrategy>('proxy');
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  const getSource = () => {
    switch (strategy) {
      case 'proxy':
        return { uri: streamAPI.getProxyUrl(streamUrl) };
      case 'direct_vlc':
        return {
          uri: streamUrl,
          headers: {
            'User-Agent': 'VLC/3.0.0',
          },
        };
      case 'direct_chrome':
        return {
          uri: streamUrl,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        };
      case 'resolved':
        return {
          uri: resolvedUrl || streamUrl,
          headers: {
            'User-Agent': 'VLC/3.0.0',
          },
        };
      default:
        return { uri: streamUrl };
    }
  };

  const currentSource = getSource();

  const handleLoad = (data: OnLoadData) => {
    setLoading(false);
    setError(null);
  };

  const handleError = async (data: OnErrorData) => {
    console.log(`Video error with strategy ${strategy}:`, data);

    if (strategy === 'proxy') {
      setStrategy('direct_vlc');
      setLoading(true);
    } else if (strategy === 'direct_vlc') {
      setStrategy('direct_chrome');
      setLoading(true);
    } else if (strategy === 'direct_chrome') {
      setLoading(true);
      const resolved = await streamAPI.resolveUrl(streamUrl);
      if (resolved.success && resolved.finalUrl && resolved.finalUrl !== streamUrl) {
        setResolvedUrl(resolved.finalUrl);
        setStrategy('resolved');
      } else {
        const errorMsg = 'Failed to load stream securely.';
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
      }
    } else {
      const errorMsg = 'Stream is offline.';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const handleBuffer = ({isBuffering}: {isBuffering: boolean}) => {
    setLoading(isBuffering);
  };

  return (
    <View style={styles.container}>
      <Video
        key={`${strategy}-${resolvedUrl || streamUrl}`}
        ref={videoRef}
        source={currentSource as any}
        style={styles.video}
        resizeMode="cover"
        onLoad={handleLoad}
        onError={handleError}
        onBuffer={handleBuffer}
        controls={true}
        playInBackground={false}
        ignoreSilentSwitch="ignore"
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              setStrategy('proxy');
              setResolvedUrl(null);
            }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 240, // Fixed height for a consistent look
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default VideoPlayer;
