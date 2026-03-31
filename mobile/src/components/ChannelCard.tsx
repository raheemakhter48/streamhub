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
// Smarters-style grid: 3 columns with better spacing
const CARD_MARGIN = 6;
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
      activeOpacity={0.7}>
      <LinearGradient
        colors={['#252525', '#121212']}
        style={styles.card}>

        <View style={styles.logoWrapper}>
          {logoUrl ? (
            <Image
              source={{uri: logoUrl}}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderIcon}>📺</Text>
            </View>
          )}

          {/* Top badges */}
          <View style={styles.badgeContainer}>
            {channel.isHD && (
              <View style={styles.hdBadge}>
                <Text style={styles.hdText}>HD</Text>
              </View>
            )}
            {isFavorite && (
              <Text style={styles.favoriteHeart}>❤️</Text>
            )}
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.overlay}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.channelName} numberOfLines={2}>
            {channel.name}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    height: CARD_WIDTH * 1.3, // Smarters typically uses portrait-style cards
  },
  logoWrapper: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hdBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hdText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  favoriteHeart: {
    fontSize: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  infoContainer: {
    padding: 8,
    minHeight: 45,
    justifyContent: 'center',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ChannelCard;
