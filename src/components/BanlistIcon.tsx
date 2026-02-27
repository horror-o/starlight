import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BanlistIconProps {
  status: 'Banned' | 'Forbidden' | 'Limited' | 'Semi-Limited';
}

export const BanlistIcon: React.FC<BanlistIconProps> = ({ status }) => {
  if (status === 'Banned' || status === 'Forbidden') {
    return (
      <View style={styles.container}>
        <View style={styles.circle}>
            <View style={styles.slash} />
        </View>
      </View>
    );
  }

  if (status === 'Limited') {
    return (
        <View style={styles.container}>
            <View style={styles.circle}>
                <Text style={styles.number}>1</Text>
            </View>
        </View>
    );
  }

  if (status === 'Semi-Limited') {
    return (
        <View style={styles.container}>
            <View style={styles.circle}>
                <Text style={styles.number}>2</Text>
            </View>
        </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 10,
    backgroundColor: '#000',
    borderRadius: 12, // Ensure rounded background to pop
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  slash: {
    width: '100%',
    height: 3,
    backgroundColor: 'red',
    transform: [{ rotate: '-45deg' }],
  },
  number: {
    color: '#FFFF00', // Yellow
    fontSize: 14,
    fontWeight: '900',
    // Text shadow to make it pop?
    textShadowColor: 'black',
    textShadowRadius: 1,
  }
});
