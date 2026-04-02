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
const CARD_MARGIN = 6;
const CARD_WIDTH = (width - 48) / 3;

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onPress,
}) => {
  const logoUrl = channel.logo || (channel as any).tvgLogo;
  const primaryColor = '#00A8B5'; // Teal
  const secondaryColor = '#004E92'; // Blue

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}>
      <LinearGradient
        colors={['#002E34', '#001518']}
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

          <View style={styles.badgeContainer}>
            {isFavorite && (
              <View style={styles.favBadge}>
                <Text style={styles.favText}>❤️</Text>
              </View>
            )}
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.channelName} numberOfLines={2}>
            {channel.name}
          </Text>
        </View>
        
        {/* Smarters-style bottom accent bar */}
        <View style={[styles.accentBar, {backgroundColor: primaryColor}]} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  card: {
    borderRadius: 10,
    height: CARD_WIDTH * 1.3,
    borderWidth: 1,
    borderColor: '#002E34',
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  logo: {
    width: '75%',
    height: '75%',
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.5,
  },
  badgeContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  favBadge: {
    padding: 2,
  },
  favText: {
    fontSize: 10,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  infoContainer: {
    padding: 6,
    backgroundColor: '#001F24',
    justifyContent: 'center',
    minHeight: 40,
  },
  channelName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  accentBar: {
    height: 2,
    width: '100%',
  },
});

export default ChannelCard;
