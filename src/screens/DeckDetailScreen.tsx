import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TextInput, ActivityIndicator, Platform, Keyboard, LayoutAnimation, UIManager, BackHandler, Dimensions } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDecks, removeCardFromDeck, addCardToDeck } from '../services/storage';
import { Deck } from '../types';
import { Card, searchCards } from '../services/api';
import { sortSearchResults } from '../utils/search';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { Toast } from '../components/Toast';
import { COLORS, STYLES, FONTS } from '../theme';
import { BanlistIcon } from '../components/BanlistIcon';
import { MMOWindow } from '../components/MMOWindow';
import { InventorySlot } from '../components/InventorySlot';

type DeckDetailScreenRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>;
type DeckDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen() {
  const route = useRoute<DeckDetailScreenRouteProp>();
  const navigation = useNavigation<DeckDetailScreenNavigationProp>();
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'extra' | 'side'>('main');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Enable LayoutAnimation for Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const fetchDeck = async () => {
    const decks = await getDecks();
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
    } else {
      Alert.alert('Error', 'Deck not found');
      navigation.goBack();
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeck();
    }, [deckId])
  );

  // Search Logic
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const results = await searchCards(searchQuery);
      const sortedResults = sortSearchResults(results, searchQuery);
      setSearchResults(sortedResults);
      setSearching(false);
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

  const handleAddCard = async (card: Card) => {
      if (!deck) return;

      let section: 'main' | 'extra' | 'side' = 'main';
      
      // Determine section logic
      if (activeTab === 'side') {
          section = 'side';
      } else {
          const type = card.type.toLowerCase();
          if (type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link')) {
              section = 'extra';
          } else {
              section = 'main';
          }
      }

      const result = await addCardToDeck(deck.id, card, section);
      if (result.success) {
          fetchDeck();
          showToast(`Added to [${section.charAt(0).toUpperCase() + section.slice(1)}]`);
      } else {
          showToast(result.message || 'Failed to add card');
      }
  };

  const handleRemoveCard = async (index: number, section: 'main' | 'extra' | 'side') => {
    await removeCardFromDeck(deckId, index, section);
    fetchDeck();
  };

  const renderDeckCard = ({ item, index }: { item: Card, index: number }) => {
      return (
        <InventorySlot
            image={item.card_images[0].image_url_small}
            quantity={1}
            onPress={() => navigation.navigate('CardDetail', { card: item })}
        />
      );
  };

  const renderSearchItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={styles.searchItem} 
      onPress={() => handleAddCard(item)}
    >
      <View style={styles.searchImageContainer}>
        <Image 
            source={{ uri: item.card_images[0].image_url_small }} 
            style={styles.searchImage} 
        />
        {item.banlist_info?.ban_tcg && (
            <BanlistIcon status={item.banlist_info.ban_tcg as any} />
        )}
      </View>
      <View style={styles.searchInfo}>
        <Text style={styles.searchName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.searchType}>[{item.type}]</Text>
      </View>
      <Ionicons name="add-circle-outline" size={20} color={COLORS.electricCyan} />
    </TouchableOpacity>
  );

  const [windowWidth, setWindowWidth] = useState(0);

  const onLayout = (event: any) => {
    setWindowWidth(event.nativeEvent.layout.width);
  };

  const isWide = windowWidth > 768; // Simple breakpoint

  if (!deck) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.electricCyan} /></View>;

  const currentCards = activeTab === 'main' ? deck.mainDeck : activeTab === 'extra' ? deck.extraDeck : deck.sideDeck;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]} onLayout={onLayout}>
      <View style={[styles.contentContainer, isWide && styles.wideContainer]}>

      {/* Top/Left Tray: Deck View */}
      {(!keyboardVisible || isWide) && (
        <View style={[styles.trayContainer, isWide && styles.wideTray]}>

            <MMOWindow
                title={`Deck Builder: [${deck.name}]`}
                icon="layers-outline"
                style={styles.deckWindow}
                onClose={() => navigation.goBack()}
            >
                {/* Deck Stats & Tabs */}
                <View style={styles.header}>
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'main' && styles.activeTab]}
                            onPress={() => setActiveTab('main')}
                        >
                            <Text style={[styles.tabText, activeTab === 'main' && styles.activeTabText]}>Main [{deck.mainDeck.length}]</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'extra' && styles.activeTab]}
                            onPress={() => setActiveTab('extra')}
                        >
                            <Text style={[styles.tabText, activeTab === 'extra' && styles.activeTabText]}>Extra [{deck.extraDeck.length}]</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'side' && styles.activeTab]}
                            onPress={() => setActiveTab('side')}
                        >
                            <Text style={[styles.tabText, activeTab === 'side' && styles.activeTabText]}>Side [{deck.sideDeck.length}]</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Grid */}
                <FlatList
                    data={currentCards}
                    keyExtractor={(item, index) => `${item.id}_${activeTab}_${index}`}
                    renderItem={({ item, index }) => (
                        <View style={{ position: 'relative' }}>
                             {renderDeckCard({ item, index })}
                             <TouchableOpacity
                                style={styles.removeBadge}
                                onPress={() => handleRemoveCard(index, activeTab)}
                             >
                                 <Ionicons name="close" size={10} color="#fff" />
                             </TouchableOpacity>
                        </View>
                    )}
                    numColumns={5} // Matches inventory grid
                    contentContainerStyle={styles.deckListContent}
                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No cards in {activeTab} deck.</Text>
                        </View>
                    }
                />
            </MMOWindow>
        </View>
      )}

      {/* Bottom/Right Section: Search */}
      <View style={[
          styles.searchSection, 
          isWide && styles.wideSearch, 
          keyboardVisible && !isWide && styles.fullHeightSearch 
      ]}>
        <MMOWindow title="Card Database: Quick Add" icon="search-outline" style={styles.searchWindow}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search card name..."
                    placeholderTextColor={COLORS.textDim}
                    value={query}
                    onChangeText={handleTextChange}
                    onSubmitEditing={handleManualSearch}
                />
                {searching ? (
                    <ActivityIndicator size="small" color={COLORS.electricCyan} />
                ) : (
                    <TouchableOpacity onPress={handleManualSearch}>
                        <Ionicons name="search" size={16} color={COLORS.text} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSearchItem}
                contentContainerStyle={styles.searchListContent}
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
            />
        </MMOWindow>
      </View>
      </View>
      <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 5,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  wideContainer: {
    flexDirection: 'row',
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  trayContainer: {
      flex: 0.6,
      marginBottom: 10,
  },
  wideTray: {
      flex: 0.6,
      marginBottom: 0,
      marginRight: 10,
  },
  deckWindow: {
      flex: 1,
  },
  header: {
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    marginBottom: 5,
  },
  tabs: {
      flexDirection: 'row',
  },
  tab: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
  },
  activeTab: {
      borderBottomColor: COLORS.electricCyan,
  },
  tabText: {
      fontSize: 12,
      fontFamily: FONTS.body,
      color: COLORS.textDim,
  },
  activeTabText: {
      color: COLORS.electricCyan,
      fontWeight: 'bold',
  },
  deckListContent: {
      padding: 5,
  },
  removeBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: COLORS.cyberMagenta,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      zIndex: 10,
      borderWidth: 1,
      borderColor: '#fff',
  },
  emptyContainer: {
      padding: 20,
      alignItems: 'center',
  },
  emptyText: {
      color: COLORS.textDim,
      fontStyle: 'italic',
      fontSize: 12,
  },
  searchSection: {
      flex: 0.4,
      marginBottom: 10,
  },
  fullHeightSearch: {
      flex: 1,
  },
  wideSearch: {
      flex: 0.4,
  },
  searchWindow: {
      flex: 1,
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      ...STYLES.bevelIn,
      backgroundColor: '#fff',
      paddingHorizontal: 8,
      height: 32,
      marginBottom: 8,
  },
  searchInput: {
      flex: 1,
      height: '100%',
      color: COLORS.text,
      fontFamily: FONTS.body,
      fontSize: 12,
  },
  searchListContent: {
      paddingHorizontal: 2,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  searchImageContainer: {
      width: 30,
      height: 44,
      marginRight: 8,
      ...STYLES.bevelIn,
      padding: 1,
      backgroundColor: '#fff',
  },
  searchImage: {
    width: '100%',
    height: '100%',
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 12,
    fontFamily: FONTS.header,
    color: COLORS.text,
  },
  searchType: {
    fontSize: 10,
    color: COLORS.textDim,
  },
});
