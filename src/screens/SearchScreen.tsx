import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchCards, Card } from '../services/api';
import { sortSearchResults } from '../utils/search';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, STYLES, FONTS } from '../theme';
import { BanlistIcon } from '../components/BanlistIcon';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';
import { MMOWindow } from '../components/MMOWindow';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<SearchScreenNavigationProp>();

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery) {
        setCards([]);
        return;
      }
      setLoading(true);
      const results = await searchCards(searchQuery);
      const sortedResults = sortSearchResults(results, searchQuery);
      setCards(sortedResults);
      setLoading(false);
    }, 500),
    []
  );

  const handleTextChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleManualSearch = () => {
    // If debounced search hasn't fired yet or to force a search
    debouncedSearch(query);
    debouncedSearch.flush(); // Execute immediately
  };

  const renderItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={styles.cardItem} 
      onPress={() => navigation.navigate('CardDetail', { card: item })}
    >
      <View style={styles.imageContainer}>
        <Image 
            source={{ uri: item.card_images[0].image_url_small }} 
            style={styles.cardImage} 
        />
        {item.banlist_info?.ban_tcg && (
            <BanlistIcon status={item.banlist_info.ban_tcg as any} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardType}>[{item.type}]</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Search Bar Window */}
      <MMOWindow title="Database: Search" icon="search-outline" style={styles.searchWindow}>
        <View style={styles.searchRow}>
            <TextInput
                style={styles.input}
                placeholder="Enter card name..."
                placeholderTextColor={COLORS.textDim}
                value={query}
                onChangeText={handleTextChange}
                onSubmitEditing={handleManualSearch}
            />
            <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('ScanCard')}
            >
                <Ionicons name="camera-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
        </View>
        <View style={styles.filtersRow}>
             <Text style={styles.filterLabel}>Filter:</Text>
             <View style={styles.filterBadge}><Text style={styles.filterText}>[All]</Text></View>
        </View>
      </MMOWindow>

      {/* Results Window */}
      <MMOWindow title={`Results: [${cards.length}]`} icon="list-outline" style={styles.resultsWindow}>
        {loading ? (
            <View style={styles.centerContent}>
                <ActivityIndicator size="small" color={COLORS.electricCyan} />
                <Text style={styles.loadingText}>Querying Database...</Text>
            </View>
        ) : cards.length === 0 ? (
             <View style={styles.centerContent}>
                <Text style={styles.emptyText}>No results found.</Text>
            </View>
        ) : (
            <FlatList
                data={cards}
                keyExtractor={(item) => item.id.toString()} // Assuming ID is unique enough for search results
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        )}
      </MMOWindow>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 15,
  },
  searchWindow: {
      marginBottom: 10,
  },
  searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  input: {
      flex: 1,
      height: 36,
      ...STYLES.bevelIn, // Inset look for input
      backgroundColor: '#fff',
      paddingHorizontal: 10,
      marginRight: 8,
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.text,
  },
  scanButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      ...STYLES.bevelOut,
      backgroundColor: '#ecf0f1',
  },
  filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  filterLabel: {
      fontSize: 12,
      color: COLORS.textDim,
      marginRight: 5,
  },
  filterBadge: {
      backgroundColor: '#dfe6e9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#bdc3c7',
  },
  filterText: {
      fontSize: 10,
      color: COLORS.text,
  },
  resultsWindow: {
      flex: 1,
      marginBottom: 60, // Space for command bar
  },
  centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  loadingText: {
      marginTop: 10,
      color: COLORS.textDim,
      fontSize: 12,
  },
  emptyText: {
      color: COLORS.textDim,
      fontStyle: 'italic',
  },
  listContent: {
      paddingBottom: 10,
  },
  cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
      width: 40,
      height: 58,
      marginRight: 10,
      ...STYLES.bevelIn,
      padding: 1,
      backgroundColor: '#fff',
  },
  cardImage: {
      width: '100%',
      height: '100%',
  },
  cardInfo: {
      flex: 1,
  },
  cardName: {
      fontSize: 14,
      fontFamily: FONTS.header,
      color: COLORS.text,
      marginBottom: 2,
  },
  cardType: {
      fontSize: 11,
      color: COLORS.textDim,
  },
});
