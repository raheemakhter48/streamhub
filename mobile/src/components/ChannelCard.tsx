import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Channel} from '../types';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
}

const {width} = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onPress,
}) => {
  const logoUrl = channel.logo || channel.tvgLogo;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={styles.logoWrapper}>
          {logoUrl ? (
            <Image
              source={{uri: logoUrl}}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a']}
              style={styles.placeholderLogo}>
              <Text style={styles.placeholderIcon}>📺</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          />

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

        <View style={styles.infoContainer}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.group && (
            <Text style={styles.category} numberOfLines={1}>
              {channel.group}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  logoWrapper: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    position: 'relative',
    backgroundColor: '#000',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  hdBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hdText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  favoriteText: {
    fontSize: 14,
  },
  infoContainer: {
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  category: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default ChannelCard;

