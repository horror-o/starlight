import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchCards, Card } from '../services/api';
import { sortSearchResults } from '../utils/search';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, STYLES, FONTS } from '../theme';
import { BanlistIcon } from '../components/BanlistIcon';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';
import { MMOWindow } from '../components/MMOWindow';
import { CardDetailView } from '../components/CardDetailView';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  // Modal state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery) {
      setCards([]);
      return;
    }
    setLoading(true);
    try {
        const results = await searchCards(searchQuery);
        // Only update if the query matches current input to avoid race conditions
        setCards(results);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, 500);

  useEffect(() => {
      debouncedSearch(query);
      return () => {
          debouncedSearch.cancel();
      }
  }, [query, debouncedSearch]);

  const handleCardPress = (card: Card) => {
      setSelectedCard(card);
  };

  const closeDetail = () => {
      setSelectedCard(null);
  };

  const renderItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={styles.cardItem} 
      onPress={() => handleCardPress(item)}
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
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

      {/* Search Bar Window */}
      <MMOWindow title="Database: Search" icon="search-outline" style={styles.searchWindow} headerRight={null}>
        <View style={styles.searchRow}>
            <TextInput
                style={styles.input}
                placeholder="Enter card name..."
                placeholderTextColor={COLORS.textDim}
                value={query}
                onChangeText={setQuery}
            />
            <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('ScanCard')}
            >
                <Ionicons name="camera-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
        </View>
      </MMOWindow>

      {/* Results Window */}
      <View style={{ flex: 1, marginBottom: 60 }}>
        <MMOWindow
            title={`Results: [${cards.length}]`}
            icon="list-outline"
            style={{ flex: 1 }}
            headerRight={
                loading ? <ActivityIndicator size="small" color={COLORS.text} style={{ marginRight: 8 }} /> : null
            }
        >
            {cards.length === 0 && !loading ? (
                <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>No results found.</Text>
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </MMOWindow>
      </View>

      {/* Modal Detail View */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedCard}
        onRequestClose={closeDetail}
      >
        <View style={styles.modalContainer}>
             <View style={styles.modalContent}>
                {selectedCard && (
                    <CardDetailView
                        card={selectedCard}
                        onClose={closeDetail}
                        onNavigateToCollection={(c) => {
                            closeDetail();
                            // Small timeout to allow modal to close first if needed, though direct nav usually works
                            setTimeout(() => {
                                navigation.navigate('AddCard', { card: c });
                            }, 100);
                        }}
                        onNavigateToDeck={(deckId) => {
                            closeDetail();
                            setTimeout(() => {
                                navigation.navigate('DeckDetail', { deckId });
                            }, 100);
                        }}
                        style={{ flex: 1 }}
                    />
                )}
             </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: COLORS.deepVoid,
  },
  searchWindow: {
      marginBottom: 10,
  },
  searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
      backgroundColor: COLORS.windowHeader,
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
      borderBottomColor: COLORS.windowBorderDark,
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
  modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
      justifyContent: 'flex-end',
  },
  modalContent: {
      height: '90%', // Slide up to 90% height
      backgroundColor: COLORS.deepVoid,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      padding: 10,
      ...STYLES.bevelOut, // Frame the modal content
      borderBottomWidth: 0, // No bottom border needed
  }
});
