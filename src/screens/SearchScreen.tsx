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
        <Text style={styles.cardType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search for a card..."
          value={query}
          onChangeText={handleTextChange}
          onSubmitEditing={handleManualSearch}
        />
        <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => navigation.navigate('ScanCard')}
            accessibilityLabel="Scan Card Button"
            accessibilityRole="button"
        >
            <Ionicons name="camera-outline" size={24} color={COLORS.electricCyan} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleManualSearch} accessibilityRole="button" accessibilityLabel="Search Button">
            <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.electricCyan} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={cards}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  button: {
    backgroundColor: 'rgba(10, 189, 198, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.electricCyan,
  },
  buttonText: {
    color: COLORS.electricCyan,
    fontWeight: 'bold',
    fontFamily: FONTS.header,
    fontSize: 12,
  },
  scanButton: {
      padding: 8,
      marginRight: 10,
  },
  listContent: {
    padding: 10,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBackground,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  imageContainer: {
      position: 'relative',
      marginRight: 10,
  },
  cardImage: {
    width: 60,
    height: 87,
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
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
});
