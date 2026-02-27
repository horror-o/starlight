import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TextInput, ActivityIndicator, Platform, Keyboard, LayoutAnimation, UIManager, BackHandler, Dimensions } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDecks, removeCardFromDeck, addCardToDeck } from '../services/storage';
import { Deck } from '../types';
import { Card, searchCards } from '../services/api';
import { sortSearchResults } from '../utils/search';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { Toast } from '../components/Toast';
import { COLORS, STYLES } from '../theme';
import { StarlightCard } from '../components/StarlightCard';
import { BanlistIcon } from '../components/BanlistIcon';
import { BlurView } from 'expo-blur';
import { CardInfoModal } from '../components/CardInfoModal';

type DeckDetailScreenRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>;
type DeckDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen() {
  const route = useRoute<DeckDetailScreenRouteProp>();
  const navigation = useNavigation<DeckDetailScreenNavigationProp>();
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'extra' | 'side'>('main');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Info Modal state
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoCard, setSelectedInfoCard] = useState<Card | null>(null);

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

  // Handle Back Button
  useEffect(() => {
      const backAction = () => {
          if (keyboardVisible) {
              Keyboard.dismiss();
              return true; // Prevent default behavior (going back)
          }
          return false; // Let default behavior happen
      };

      const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction
      );

      return () => backHandler.remove();
  }, [keyboardVisible]);

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
      } else {
          showToast(result.message || 'Failed to add card');
      }
  };

  const handleRemoveCard = async (index: number, section: 'main' | 'extra' | 'side') => {
    await removeCardFromDeck(deckId, index, section);
    fetchDeck();
  };

  const handleLongPressCard = (card: Card) => {
      setSelectedInfoCard(card);
      setInfoModalVisible(true);
  };

  const renderDeckCard = ({ item, index }: { item: Card, index: number }) => {
      const numColumns = isWide ? 6 : 4;
      const cardWidth = `${100 / numColumns}%`;

      return (
        <View style={[styles.deckCardWrapper, { width: cardWidth }]}>
            <TouchableOpacity 
                style={styles.deckCard}
                onLongPress={() => handleLongPressCard(item)}
                onPress={() => navigation.navigate('CardDetail', { card: item })}
            >
                <StarlightCard card={item} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.removeBadge}
                onPress={() => handleRemoveCard(index, activeTab)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                accessibilityLabel={`Remove ${item.name}`}
                accessibilityRole="button"
            >
                <Ionicons name="close-circle" size={24} color={COLORS.cyberMagenta} />
            </TouchableOpacity>
        </View>
      );
  };

  const renderSearchItem = ({ item }: { item: Card }) => (
    <TouchableOpacity 
      style={styles.searchItem} 
      onPress={() => handleAddCard(item)}
      onLongPress={() => handleLongPressCard(item)}
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
        <Text style={styles.searchType}>{item.type}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={COLORS.electricCyan} />
    </TouchableOpacity>
  );

  const [windowWidth, setWindowWidth] = useState(0);

  const onLayout = (event: any) => {
    setWindowWidth(event.nativeEvent.layout.width);
  };

  const isWide = windowWidth > 768; // Simple breakpoint

  if (!deck) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

  const currentCards = activeTab === 'main' ? deck.mainDeck : activeTab === 'extra' ? deck.extraDeck : deck.sideDeck;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={[styles.contentContainer, isWide && styles.wideContainer]}>
      {/* Top/Left Tray: Deck View */}
      {(!keyboardVisible || isWide) && (
        <View style={[styles.trayContainer, isWide && styles.wideTray]}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Text style={styles.deckCounts}>
                        M: {deck.mainDeck.length} | E: {deck.extraDeck.length} | S: {deck.sideDeck.length}
                    </Text>
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'main' && styles.activeTab]} 
                    onPress={() => setActiveTab('main')}
                >
                    <Text style={[styles.tabText, activeTab === 'main' && styles.activeTabText]}>Main</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'extra' && styles.activeTab]} 
                    onPress={() => setActiveTab('extra')}
                >
                    <Text style={[styles.tabText, activeTab === 'extra' && styles.activeTabText]}>Extra</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'side' && styles.activeTab]} 
                    onPress={() => setActiveTab('side')}
                >
                    <Text style={[styles.tabText, activeTab === 'side' && styles.activeTabText]}>Side</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.deckListContainer}>
                <FlatList
                    data={currentCards}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={renderDeckCard}
                    numColumns={isWide ? 6 : 4} 
                    contentContainerStyle={styles.deckListContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No cards in {activeTab} deck.</Text>
                        </View>
                    }
                />
            </View>
        </View>
      )}

      {/* Bottom/Right Section: Search */}
      <View style={[
          styles.searchSection, 
          isWide && styles.wideSearch, 
          keyboardVisible && !isWide && styles.fullHeightSearch 
      ]}>
        <View style={styles.searchBar}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search to add cards..."
                placeholderTextColor={COLORS.textDim}
                value={query}
                onChangeText={handleTextChange}
                onSubmitEditing={handleManualSearch}
            />
            {searching ? (
                <ActivityIndicator size="small" color={COLORS.electricCyan} />
            ) : (
                <TouchableOpacity onPress={handleManualSearch} accessibilityRole="button" accessibilityLabel="Search Button">
                    <Ionicons name="search" size={24} color={COLORS.electricCyan} />
                </TouchableOpacity>
            )}
        </View>

        <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.searchListContent}
            keyboardShouldPersistTaps="handled"
        />
      </View>
      </View>
      <CardInfoModal 
        visible={infoModalVisible} 
        card={selectedInfoCard} 
        onClose={() => setInfoModalVisible(false)} 
      />
      <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
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
      flex: 0.55,
      backgroundColor: 'rgba(5, 5, 16, 0.5)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.chromeMist,
  },
  wideTray: {
      flex: 0.6,
      borderBottomWidth: 0,
      borderRightWidth: 1,
      borderRightColor: COLORS.chromeMist,
  },
  header: {
    padding: 15,
    paddingBottom: 5,
  },
  deckName: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: COLORS.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  deckCounts: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: COLORS.textDim,
      marginTop: 2,
  },
  tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.chromeMist,
      marginTop: 5,
  },
  tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
  },
  activeTab: {
      borderBottomColor: COLORS.electricCyan,
  },
  tabText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: COLORS.textDim,
  },
  activeTabText: {
      color: COLORS.electricCyan,
  },
  deckListContainer: {
      flex: 1,
      backgroundColor: 'transparent',
  },
  deckListContent: {
      padding: 5,
  },
  deckCardWrapper: {
      // Width is set dynamically in renderItem to fix scaling issues on last row
      aspectRatio: 0.68,
      padding: 1, // Use padding instead of margin for grid alignment
      position: 'relative',
      zIndex: 1,
  },
  deckCard: {
      width: '100%',
      height: '100%',
      borderRadius: 4,
      overflow: 'hidden',
      elevation: 2,
  },
  deckCardImage: {
      width: '100%',
      height: '100%',
  },
  removeBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: '#000',
      borderRadius: 12,
      elevation: 10,
      zIndex: 10,
      padding: 2,
  },
  emptyContainer: {
      padding: 20,
      alignItems: 'center',
  },
  emptyText: {
      color: COLORS.textDim,
      fontStyle: 'italic',
      fontFamily: 'Inter_400Regular',
  },
  searchSection: {
      flex: 0.45,
      backgroundColor: 'rgba(5, 5, 16, 0.3)',
      borderTopWidth: 1,
      borderTopColor: COLORS.chromeMist,
  },
  fullHeightSearch: {
      flex: 1,
      borderTopWidth: 0,
  },
  wideSearch: {
      flex: 0.4,
      borderTopWidth: 0,
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      margin: 10,
      paddingHorizontal: 10,
      borderRadius: 20, // Rounded for Omni-bar look
      height: 40,
      borderWidth: 1,
      borderColor: COLORS.chromeMist,
  },
  searchInput: {
      flex: 1,
      height: '100%',
      color: COLORS.text,
      fontFamily: 'Inter_400Regular',
  },
  searchListContent: {
      paddingHorizontal: 10,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchImageContainer: {
      position: 'relative',
      marginRight: 12,
  },
  searchImage: {
    width: 37.5,
    height: 55,
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.text,
  },
  searchType: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textDim,
  },
});
