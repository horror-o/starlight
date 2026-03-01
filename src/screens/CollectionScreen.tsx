import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCollection, removeCollectionItem } from '../services/storage';
import { exportCollectionToCSV, importCollectionFromCSV } from '../services/csv';
import { exportCollectionToYDK, importCollectionFromYDK } from '../services/ydk';
import { CollectionItem } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, STYLES } from '../theme';
import { MMOWindow } from '../components/MMOWindow';
import { InventorySlot } from '../components/InventorySlot';

type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export interface FilterState {
  searchTerm: string;
  cardType: string;
  attribute: string;
  level: string;
  atk: string;
  def: string;
}

export default function CollectionScreen() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    cardType: '',
    attribute: '',
    level: '',
    atk: '',
    def: ''
  });

  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const fetchCollection = async () => {
    const data = await getCollection();
    setCollection(data);
    applyFilters(data, filters);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCollection();
    }, [filters])
  );

  const applyFilters = (data: CollectionItem[], currentFilters: FilterState) => {
    let result = data;

    if (currentFilters.searchTerm) {
        const lowerTerm = currentFilters.searchTerm.toLowerCase();
        result = result.filter(item =>
            item.cardData.name.toLowerCase().includes(lowerTerm) ||
            item.cardData.desc.toLowerCase().includes(lowerTerm)
        );
    }

    if (currentFilters.cardType) {
        const lowerType = currentFilters.cardType.toLowerCase();
        result = result.filter(item => item.cardData.type.toLowerCase().includes(lowerType));
    }

    if (currentFilters.attribute) {
        const lowerAttr = currentFilters.attribute.toLowerCase();
        result = result.filter(item => item.cardData.attribute?.toLowerCase().includes(lowerAttr));
    }

    if (currentFilters.level) {
        result = result.filter(item => item.cardData.level?.toString() === currentFilters.level);
    }

    if (currentFilters.atk) {
        result = result.filter(item => item.cardData.atk?.toString() === currentFilters.atk);
    }

    if (currentFilters.def) {
        result = result.filter(item => item.cardData.def?.toString() === currentFilters.def);
    }

    setFilteredCollection(result);
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
      const emptyFilters = { searchTerm: '', cardType: '', attribute: '', level: '', atk: '', def: '' };
      setFilters(emptyFilters);
      applyFilters(collection, emptyFilters);
      setFilterModalVisible(false);
  };

  const executeFilter = () => {
      applyFilters(collection, filters);
      setFilterModalVisible(false);
  };

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

  const handleManage = () => {
      Alert.alert(
          "Manage Collection",
          "Choose an action",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Import CSV",
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
                  text: "Export CSV",
                  onPress: async () => {
                      setLoading(true);
                      await exportCollectionToCSV();
                      setLoading(false);
                  }
              },
              {
                  text: "Import YDK",
                  onPress: async () => {
                      setLoading(true);
                      const count = await importCollectionFromYDK();
                      setLoading(false);
                      if (count > 0) {
                          Alert.alert('Import Complete', `Successfully imported ${count} items.`);
                          fetchCollection();
                      }
                  } 
              },
              {
                  text: "Export YDK",
                  onPress: async () => {
                      setLoading(true);
                      await exportCollectionToYDK();
                      setLoading(false);
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
            <TouchableOpacity style={styles.actionButton} onPress={handleManage}>
                <Ionicons name="folder-open-outline" size={16} color={COLORS.text} />
                <Text style={styles.actionButtonText}>Manage Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setFilterModalVisible(true)}>
                <Ionicons name="filter-outline" size={16} color={COLORS.text} />
                <Text style={styles.actionButtonText}>Filter</Text>
            </TouchableOpacity>
             <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={styles.countText}>Items: {filteredCollection.length} / {collection.length}</Text>
             </View>
        </View>
      </MMOWindow>

      {/* Main Inventory Window */}
      <MMOWindow title="My Collection Quick Grid" style={styles.gridWindow} icon="grid-outline">
        {filteredCollection.length === 0 ? (
            <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found.</Text>
            <Text style={styles.emptySubtext}>Try changing your filters or searching.</Text>
            </View>
        ) : (
            <FlatList
            data={filteredCollection}
            keyExtractor={(item, index) => `${item.id}_collection_${index}`} // Fix key uniqueness
            renderItem={renderItem}
            numColumns={5} // 5 slots wide like classic MMO
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            />
        )}
      </MMOWindow>

      {/* Filter Modal */}
      {filterModalVisible && (
        <View style={styles.modalOverlay} pointerEvents="box-none">
            <View style={styles.modalOverlayBackground} pointerEvents="auto" />
            <View style={styles.modalContent} pointerEvents="box-none">
                <MMOWindow title="Collection Filters" icon="filter-outline" onClose={() => setFilterModalVisible(false)} style={styles.modalWindow}>
                    <ScrollView contentContainerStyle={{ padding: 10 }}>
                        <Text style={styles.label}>Search (Name or Effect):</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 'Dark Magician', 'Destroy'"
                            placeholderTextColor={COLORS.textDim}
                            value={filters.searchTerm}
                            onChangeText={(val) => updateFilter('searchTerm', val)}
                        />

                        <View style={styles.filterRow}>
                            <View style={styles.filterHalf}>
                                <Text style={styles.label}>Card Type:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., 'Monster', 'Spell'"
                                    placeholderTextColor={COLORS.textDim}
                                    value={filters.cardType}
                                    onChangeText={(val) => updateFilter('cardType', val)}
                                />
                            </View>
                            <View style={styles.filterHalf}>
                                <Text style={styles.label}>Attribute:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., 'DARK', 'LIGHT'"
                                    placeholderTextColor={COLORS.textDim}
                                    value={filters.attribute}
                                    onChangeText={(val) => updateFilter('attribute', val)}
                                />
                            </View>
                        </View>

                        <View style={styles.filterRow}>
                            <View style={styles.filterThird}>
                                <Text style={styles.label}>Level:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="8"
                                    placeholderTextColor={COLORS.textDim}
                                    value={filters.level}
                                    keyboardType="numeric"
                                    onChangeText={(val) => updateFilter('level', val)}
                                />
                            </View>
                            <View style={styles.filterThird}>
                                <Text style={styles.label}>ATK:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="3000"
                                    placeholderTextColor={COLORS.textDim}
                                    value={filters.atk}
                                    keyboardType="numeric"
                                    onChangeText={(val) => updateFilter('atk', val)}
                                />
                            </View>
                            <View style={styles.filterThird}>
                                <Text style={styles.label}>DEF:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="2500"
                                    placeholderTextColor={COLORS.textDim}
                                    value={filters.def}
                                    keyboardType="numeric"
                                    onChangeText={(val) => updateFilter('def', val)}
                                />
                            </View>
                        </View>

                        <View style={styles.filterActionButtons}>
                            <TouchableOpacity style={[styles.filterActionBtn, { backgroundColor: COLORS.chromeMist }]} onPress={clearFilters}>
                                <Text style={styles.filterActionText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterActionBtn, { backgroundColor: COLORS.electricCyan }]} onPress={executeFilter}>
                                <Text style={[styles.filterActionText, { color: '#fff' }]}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </MMOWindow>
            </View>
        </View>
      )}

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
  modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
  },
  modalOverlayBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
      width: '100%',
      alignItems: 'center',
      zIndex: 101,
  },
  modalWindow: {
      width: '90%',
      maxHeight: '80%',
  },
  label: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.text,
      marginBottom: 4,
      fontWeight: 'bold',
  },
  input: {
      ...STYLES.bevelIn,
      backgroundColor: COLORS.inputBackground,
      padding: 8,
      marginBottom: 10,
      color: COLORS.text,
      fontFamily: FONTS.body,
  },
  filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  filterHalf: {
      width: '48%',
  },
  filterThird: {
      width: '31%',
  },
  filterActionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
  },
  filterActionBtn: {
      flex: 1,
      padding: 10,
      marginHorizontal: 5,
      alignItems: 'center',
      borderRadius: 4,
      ...STYLES.bevelOut,
  },
  filterActionText: {
      fontFamily: FONTS.body,
      fontWeight: 'bold',
      color: COLORS.text,
  }
});
