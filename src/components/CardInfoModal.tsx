import React from 'react';
import { View, Text, StyleSheet, Modal, Image, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Card } from '../services/api';
import { COLORS, FONTS, STYLES } from '../theme';
import { BanlistIcon } from './BanlistIcon';
import { TickingPrice } from './TickingPrice';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface CardInfoModalProps {
  visible: boolean;
  card: Card | null;
  onClose: () => void;
}

export const CardInfoModal: React.FC<CardInfoModalProps> = ({ visible, card, onClose }) => {
  if (!card) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
            {/* Header / Close */}
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>{card.name}</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Large Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: card.card_images[0].image_url }} style={styles.image} resizeMode="contain" />
                    {card.banlist_info?.ban_tcg && (
                        <View style={styles.banIconWrapper}>
                            <BanlistIcon status={card.banlist_info.ban_tcg as any} />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.typeText}>{card.type}</Text>
                    <View style={styles.row}>
                        <Text style={styles.detailText}>{card.race} / {card.attribute}</Text>
                    </View>
                    {(card.atk !== undefined || card.def !== undefined) && (
                        <View style={styles.row}>
                            {card.atk !== undefined && <Text style={styles.statText}>ATK/{card.atk}</Text>}
                            {card.def !== undefined && <Text style={styles.statText}> DEF/{card.def}</Text>}
                        </View>
                    )}
                    {card.level !== undefined && <Text style={styles.statText}>Level/Rank: {card.level}</Text>}
                    
                    <Text style={styles.desc}>{card.desc}</Text>
                    
                    <Text style={styles.passcode}>Passcode: {card.id}</Text>
                </View>

                {/* Prices */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Market Prices</Text>
                    {card.card_prices.map((price, index) => (
                        <View key={index} style={styles.priceRow}>
                            <TickingPrice value={price.tcgplayer_price} prefix="TCGPlayer: $" style={styles.priceText} />
                            <TickingPrice value={price.cardmarket_price} prefix="Cardmarket: €" style={styles.priceText} />
                            <TickingPrice value={price.ebay_price} prefix="eBay: $" style={styles.priceText} />
                            <TickingPrice value={price.amazon_price} prefix="Amazon: $" style={styles.priceText} />
                        </View>
                    ))}
                </View>

                {/* Sets */}
                {card.card_sets && card.card_sets.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sets</Text>
                        {card.card_sets.map((set, index) => (
                            <View key={index} style={styles.setItem}>
                                <Text style={styles.setName}>{set.set_name}</Text>
                                <View style={styles.setDetails}>
                                    <Text style={styles.setCode}>{set.set_code}</Text>
                                    <Text style={styles.setRarity}>{set.set_rarity}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.deepVoid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    overflow: 'hidden',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.chromeMist,
      backgroundColor: COLORS.glassBackground,
  },
  title: {
      fontSize: 18,
      fontFamily: FONTS.header,
      color: COLORS.text,
      flex: 1,
      marginRight: 10,
  },
  scrollContent: {
      padding: 15,
  },
  imageContainer: {
      alignItems: 'center',
      marginBottom: 20,
      position: 'relative',
  },
  image: {
      width: '100%',
      height: 300,
  },
  banIconWrapper: {
      position: 'absolute',
      top: 10,
      right: 10,
      transform: [{ scale: 1.5 }],
  },
  infoSection: {
      marginBottom: 20,
  },
  typeText: {
      color: COLORS.electricCyan,
      fontFamily: FONTS.header,
      fontSize: 16,
      marginBottom: 5,
  },
  row: {
      flexDirection: 'row',
      marginBottom: 5,
  },
  detailText: {
      color: COLORS.textDim,
      fontFamily: FONTS.body,
      fontSize: 14,
  },
  statText: {
      color: COLORS.text,
      fontFamily: FONTS.header,
      fontWeight: 'bold',
      marginRight: 15,
  },
  desc: {
      color: COLORS.text,
      fontFamily: FONTS.body,
      fontSize: 14,
      marginTop: 10,
      lineHeight: 20,
  },
  passcode: {
      color: COLORS.textDim,
      fontFamily: FONTS.body,
      fontSize: 12,
      marginTop: 10,
      fontStyle: 'italic',
  },
  section: {
      marginBottom: 20,
      backgroundColor: 'rgba(255,255,255,0.03)',
      padding: 10,
      borderRadius: 8,
  },
  sectionTitle: {
      color: COLORS.cyberMagenta,
      fontFamily: FONTS.header,
      fontSize: 16,
      marginBottom: 10,
  },
  priceRow: {
      marginBottom: 5,
  },
  priceText: {
      color: COLORS.text,
      fontFamily: FONTS.body,
      marginBottom: 2,
  },
  setItem: {
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
      paddingBottom: 5,
  },
  setName: {
      color: COLORS.text,
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
  },
  setDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
  },
  setCode: {
      color: COLORS.electricCyan,
      fontFamily: FONTS.body,
      fontSize: 12,
  },
  setRarity: {
      color: COLORS.textDim,
      fontFamily: FONTS.body,
      fontSize: 12,
  }
});
