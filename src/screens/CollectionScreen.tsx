import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCollection, removeCollectionItem } from '../services/storage';
import { exportCollectionToCSV, importCollectionFromCSV } from '../services/csv';
import { exportCollectionToYDK, importCollectionFromYDK } from '../services/ydk';
import { CollectionItem } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import { MMOWindow } from '../components/MMOWindow';
import { InventorySlot } from '../components/InventorySlot';

type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function CollectionScreen() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const insets = useSafeAreaInsets();

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
      Alert.alert(
          "Remove Item",
          "Are you sure you want to delete this card?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: 'destructive', onPress: async () => {
                  await removeCollectionItem(id);
                  fetchCollection();
              }}
          ]
      );
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
                  text: "YGOProDeck (.ydk)",
                  onPress: async () => {
                      setLoading(true);
                      await exportCollectionToYDK();
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
                  text: "YGOProDeck (.ydk)",
                  onPress: async () => {
                      setLoading(true);
                      const count = await importCollectionFromYDK();
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
    return (
        <InventorySlot
            image={item.cardData.card_images[0].image_url_small}
            quantity={1} // Collections are individual items usually, but could aggregate
            onPress={() => navigation.navigate('CardDetail', { card: item.cardData })}
        />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

      {/* Tools Window */}
      <MMOWindow title="Collection: Tools" style={styles.toolsWindow} icon="construct-outline" headerRight={<Ionicons name="information-circle-outline" size={16} color={COLORS.text} style={{ opacity: 0.5 }} />}>
        <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                <Ionicons name="download-outline" size={16} color={COLORS.text} />
                <Text style={styles.actionButtonText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
                <Ionicons name="cloud-upload-outline" size={16} color={COLORS.text} />
                <Text style={styles.actionButtonText}>Import Data</Text>
            </TouchableOpacity>
             <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={styles.countText}>Items: {collection.length}</Text>
             </View>
        </View>
      </MMOWindow>

      {/* Main Inventory Window */}
      <MMOWindow title="My Collection Quick Grid" style={styles.gridWindow} icon="grid-outline">
        {collection.length === 0 ? (
            <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your inventory is empty.</Text>
            <Text style={styles.emptySubtext}>Go to [Search] to find items.</Text>
            </View>
        ) : (
            <FlatList
            data={collection}
            keyExtractor={(item, index) => `${item.id}_collection_${index}`} // Fix key uniqueness
            renderItem={renderItem}
            numColumns={5} // 5 slots wide like classic MMO
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            />
        )}
      </MMOWindow>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // paddingTop handled by inline style with insets
  },
  toolsWindow: {
      marginBottom: 10,
      height: 70,
  },
  gridWindow: {
      flex: 1,
      marginBottom: 60, // Space for command bar
  },
  actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.chromeMist, // Softer pink instead of light grey
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginRight: 10,
      borderWidth: 1,
      borderColor: COLORS.windowBorderDark,
  },
  actionButtonText: {
      color: COLORS.text,
      marginLeft: 5,
      fontFamily: FONTS.body,
      fontSize: 12,
      fontWeight: 'bold', // Made bolder for better visibility
  },
  countText: {
      color: COLORS.textDim,
      fontSize: 12,
      fontFamily: FONTS.body,
  },
  listContent: {
    padding: 5,
  },
  columnWrapper: {
      justifyContent: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.text,
    fontFamily: FONTS.header,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
});
