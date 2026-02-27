import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../services/api';
import { STYLES } from '../theme';
import { BanlistIcon } from './BanlistIcon';

interface StarlightCardProps {
  card: Card;
  scale?: number;
}

export const StarlightCard: React.FC<StarlightCardProps> = ({ card, scale = 1 }) => {
  const sheenAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheenAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false, // width/left interpolation
        }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const sheenTranslate = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '200%'],
  });

  return (
    <View style={[styles.cardContainer, { transform: [{ scale }] }]}>
      <Image source={{ uri: card.card_images[0].image_url_small }} style={styles.image} />
      
      {/* Banlist Icon */}
      {card.banlist_info?.ban_tcg && (
          <BanlistIcon status={card.banlist_info.ban_tcg as any} />
      )}
      
      {/* Foil Overlay */}
      <View style={styles.foilOverlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.sheen,
            {
              left: sheenTranslate,
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'rgba(234, 0, 217, 0.3)', 'rgba(10, 189, 198, 0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
      
      {/* Border Glow */}
      <View style={[styles.border, STYLES.glow]} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    aspectRatio: 0.68,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  foilOverlay: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: Platform.OS === 'web' ? 'soft-light' : undefined, // Web only
    zIndex: 2,
  },
  sheen: {
    width: '150%',
    height: '100%',
    transform: [{ skewX: '-20deg' }],
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    zIndex: 3,
  }
});
