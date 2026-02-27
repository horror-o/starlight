import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWishlist, removeFromWishlist } from '../services/wishlist';
import { exportWishlistToCSV, importWishlistFromCSV } from '../services/csv';
import { Card } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { TickingPrice } from '../components/TickingPrice';

type WishlistScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<WishlistScreenNavigationProp>();

  const fetchWishlist = async () => {
    const data = await getWishlist();
    setWishlist(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [])
  );

  const handleRemove = async (id: number) => {
    await removeFromWishlist(id);
    fetchWishlist();
  };

  const handleExport = async () => {
      setLoading(true);
      await exportWishlistToCSV();
      setLoading(false);
  };

  const handleImport = async () => {
      setLoading(true);
      const count = await importWishlistFromCSV();
      setLoading(false);
      if (count > 0) {
          Alert.alert('Import Complete', `Successfully imported ${count} items.`);
          fetchWishlist();
      }
  };

  const renderItem = ({ item }: { item: Card }) => (
    <View style={styles.cardItem}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('CardDetail', { card: item })}
      >
        <Image 
            source={{ uri: item.card_images[0].image_url_small }} 
            style={styles.cardImage} 
        />
        <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardType}>{item.type}</Text>
            {item.card_prices && (
                <TickingPrice 
                    value={item.card_prices[0].tcgplayer_price} 
                    prefix="Est: $" 
                    style={styles.price} 
                />
            )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={24} color={COLORS.cyberMagenta} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
              <Ionicons name="cloud-upload-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Import CSV</Text>
          </TouchableOpacity>
      </View>

      {loading && (
          <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.electricCyan} />
              <Text style={styles.loadingText}>Processing...</Text>
          </View>
      )}

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
          <Text style={styles.emptySubtext}>Add cards you want to track!</Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
  },
  listContent: {
    padding: 10,
  },
  actionsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.chromeMist,
      backgroundColor: 'rgba(0,0,0,0.2)'
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.electricCyan,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
  },
  actionButtonText: {
      color: '#000',
      fontWeight: 'bold',
      marginLeft: 5,
      fontFamily: FONTS.body,
  },
  loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
  },
  loadingText: {
      color: '#fff',
      marginTop: 10,
      fontFamily: FONTS.header,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
    fontFamily: FONTS.header,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBackground,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  cardImage: {
    width: 60,
    height: 87,
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontFamily: FONTS.header,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    color: '#00FF00',
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  removeButton: {
    padding: 10,
  }
});
