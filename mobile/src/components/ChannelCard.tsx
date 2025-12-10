import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {Channel} from '../types';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.logoContainer}>
        {channel.logo || channel.tvgLogo ? (
          <Image
            source={{uri: channel.logo || channel.tvgLogo}}
            style={styles.logo}
            resizeMode="contain"
            onError={() => {}}
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>📺</Text>
          </View>
        )}
        {channel.isHD && (
          <View style={styles.hdBadge}>
            <Text style={styles.hdText}>HD</Text>
          </View>
        )}
        {isFavorite && (
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteText}>❤️</Text>
          </View>
        )}
      </View>
      <Text style={styles.channelName} numberOfLines={2}>
        {channel.name}
      </Text>
      {channel.group && (
        <Text style={styles.category} numberOfLines={1}>
          {channel.group}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    margin: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  logoContainer: {
    width: '100%',
    height: 90,
    marginBottom: 8,
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  hdBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hdText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  favoriteText: {
    fontSize: 16,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    color: '#888',
    fontSize: 12,
  },
});

export default ChannelCard;

