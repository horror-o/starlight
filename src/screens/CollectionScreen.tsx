import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCollection, removeCollectionItem } from '../services/storage';
import { exportCollectionToCSV, importCollectionFromCSV } from '../services/csv';
import { exportCollectionToExcel, importCollectionFromExcel } from '../services/excel';
import { CollectionItem } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { TickingPrice } from '../components/TickingPrice';

type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function CollectionScreen() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CollectionScreenNavigationProp>();

  const fetchCollection = async () => {
    const data = await getCollection();
    setCollection(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCollection();
    }, [])
  );

  const handleRemove = async (id: string) => {
    await removeCollectionItem(id);
    fetchCollection();
  };

  const handleExport = () => {
      Alert.alert(
          "Export Collection",
          "Choose a format",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "CSV", 
                  onPress: async () => {
                      setLoading(true);
                      await exportCollectionToCSV();
                      setLoading(false);
                  } 
              },
              { 
                  text: "Excel (.xlsx)", 
                  onPress: async () => {
                      setLoading(true);
                      await exportCollectionToExcel();
                      setLoading(false);
                  } 
              }
          ]
      );
  };

  const handleImport = () => {
      Alert.alert(
          "Import Collection",
          "Choose a format",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "CSV", 
                  onPress: async () => {
                      setLoading(true);
                      const count = await importCollectionFromCSV();
                      setLoading(false);
                      if (count > 0) {
                          Alert.alert('Import Complete', `Successfully imported ${count} items.`);
                          fetchCollection();
                      }
                  } 
              },
              { 
                  text: "Excel (.xlsx)", 
                  onPress: async () => {
                      setLoading(true);
                      const count = await importCollectionFromExcel();
                      setLoading(false);
                      if (count > 0) {
                          Alert.alert('Import Complete', `Successfully imported ${count} items.`);
                          fetchCollection();
                      }
                  } 
              }
          ]
      );
  };

  const renderItem = ({ item }: { item: CollectionItem }) => {
    // Determine full set name
    const setInfo = item.cardData.card_sets?.find(s => s.set_code === item.setCode);
    const setDisplayName = setInfo ? setInfo.set_name : (item.setCode || 'No Set');

    return (
        <View style={styles.cardItem}>
        <TouchableOpacity 
            style={styles.cardContent}
            onPress={() => navigation.navigate('CardDetail', { card: item.cardData })}
        >
            <Image 
                source={{ uri: item.cardData.card_images[0].image_url_small }} 
                style={styles.cardImage} 
            />
            <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.cardData.name}</Text>
                
                <Text style={styles.setName}>
                    {setDisplayName} {item.setCode && setInfo ? `(${item.setCode})` : ''}
                </Text>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>{item.condition}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailText}>{item.edition === '1st Edition' ? '1st' : 'Unl'}</Text>
                </View>
                {item.isGraded && (
                    <Text style={styles.gradedText}>
                        Graded: {item.gradingCompany} {item.grade}
                    </Text>
                )}
                {item.purchasePrice && (
                    <TickingPrice 
                        value={item.purchasePrice} 
                        prefix="Paid: $" 
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>My Collection</Text>
      </View>

      <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
              <Ionicons name="cloud-upload-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>
      </View>

      {loading && (
          <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.electricCyan} />
              <Text style={styles.loadingText}>Processing...</Text>
          </View>
      )}

      {collection.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your collection is empty.</Text>
          <Text style={styles.emptySubtext}>Search for cards to add them!</Text>
        </View>
      ) : (
        <FlatList
          data={collection}
          keyExtractor={(item) => item.id}
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
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
  },
  headerTitle: {
      fontSize: 24,
      fontFamily: FONTS.header,
      color: COLORS.text,
  },
  listContent: {
    padding: 10,
    paddingBottom: 80,
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
    marginBottom: 2,
  },
  setName: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: 4,
    fontFamily: FONTS.body,
    flexWrap: 'wrap',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.text,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: FONTS.body,
  },
  separator: {
    marginHorizontal: 4,
    color: COLORS.textDim,
  },
  gradedText: {
      fontSize: 12,
      color: COLORS.electricCyan,
      fontWeight: 'bold',
      marginTop: 2,
      fontFamily: FONTS.body,
  },
  price: {
    fontSize: 14,
    color: '#00FF00',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  removeButton: {
    padding: 10,
  }
});
