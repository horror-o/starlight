import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, STYLES, FONTS } from '../theme';

interface InventorySlotProps {
  image?: string;
  quantity?: number;
  onPress?: () => void;
  selected?: boolean;
  empty?: boolean;
}

export const InventorySlot: React.FC<InventorySlotProps> = ({ image, quantity, onPress, selected, empty }) => {
  return (
    <TouchableOpacity
      style={[
        styles.slot,
        selected && styles.selectedSlot,
        empty && styles.emptySlot
      ]}
      onPress={onPress}
      disabled={empty && !onPress}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
      ) : null}

      {quantity && quantity > 1 ? (
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{quantity}</Text>
        </View>
      ) : null}

      {/* Inner Bevel effect overlay */}
      <View style={styles.innerShadow} pointerEvents="none" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  slot: {
    width: 60, // Fixed grid size
    height: 60,
    backgroundColor: COLORS.slotBackground,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.windowBorderDark, // Subtle border
    borderRadius: 2,
  },
  selectedSlot: {
    backgroundColor: 'rgba(45, 152, 218, 0.2)', // Highlight color
    borderColor: COLORS.electricCyan,
    borderWidth: 2,
  },
  emptySlot: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  image: {
    width: '90%', // Slightly smaller to fit inside bevel
    height: '90%',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    zIndex: 10,
  },
  quantityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: FONTS.body,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)', // Inner top shadow
    borderLeftColor: 'rgba(0,0,0,0.1)', // Inner left shadow
    borderRightColor: 'rgba(255,255,255,0.5)', // Bottom highlight
    borderBottomColor: 'rgba(255,255,255,0.5)', // Right highlight
    borderRadius: 2,
  }
});
