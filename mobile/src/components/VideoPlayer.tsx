import React, {useRef, useState, useEffect} from 'react';
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
  const videoRef = useRef<Video>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  const proxyUrl = streamAPI.getProxyUrl(streamUrl);
  const videoUrl = useProxy ? proxyUrl : streamUrl;

  const handleLoad = (data: OnLoadData) => {
    setLoading(false);
    setError(null);
    console.log('Video loaded:', data);
  };

  const handleError = (data: OnErrorData) => {
    console.error('Video error:', data);
    setLoading(false);
    
    if (useProxy) {
      // Try direct URL if proxy fails
      console.log('Proxy failed, trying direct URL...');
      setUseProxy(false);
      setLoading(true);
    } else {
      const errorMsg = 'Failed to load stream. Please try again.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleBuffer = ({isBuffering}: {isBuffering: boolean}) => {
    setLoading(isBuffering);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{uri: videoUrl}}
        style={styles.video}
        resizeMode="contain"
        onLoad={handleLoad}
        onError={handleError}
        onBuffer={handleBuffer}
        paused={paused}
        controls={true}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        bufferConfig={{
          minBufferMs: 1000,
          maxBufferMs: 5000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 2000,
        }}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading stream...</Text>
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
              setUseProxy(true);
            }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={() => setPaused(!paused)}>
          <Text style={styles.playPauseText}>{paused ? '▶️' : '⏸️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height * 0.4,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 24,
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
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 24,
  },
  playPauseText: {
    fontSize: 24,
  },
});

export default VideoPlayer;

