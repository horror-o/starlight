import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addToWishlist } from '../services/wishlist';
import { getDecks, addCardToDeck, createDeck } from '../services/storage';
import { Deck } from '../types';
import { SuccessView } from '../components/SuccessView';
import { Toast } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { TickingPrice } from '../components/TickingPrice';
import { MMOWindow } from '../components/MMOWindow';

type CardDetailScreenRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;
type CardDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen() {
  const route = useRoute<CardDetailScreenRouteProp>();
  const { card } = route.params;
  const navigation = useNavigation<CardDetailNavigationProp>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'wishlist' | 'deck' | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  
  // Deck selection states
  const [modalVisible, setModalVisible] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  useEffect(() => {
    if (modalVisible) {
        fetchDecks();
    }
  }, [modalVisible]);

  const fetchDecks = async () => {
      const data = await getDecks();
      setDecks(data.sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()));
  };

  const handleAddCollection = () => {
    navigation.navigate('AddCard', { card });
  };

  const handleAddWishlist = async () => {
    const success = await addToWishlist(card);
    if (success) {
        setSuccessType('wishlist');
        setSuccessMessage('Added to [Wishlist]');
        setShowSuccess(true);
    } else {
        Alert.alert('Info', 'Already in Wishlist');
    }
  };

  const handleAddToDeck = async (deck: Deck) => {
      let section: 'main' | 'extra' | 'side' = 'main';
      const type = card.type.toLowerCase();
      if (type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link')) {
          section = 'extra';
      }

      const result = await addCardToDeck(deck.id, card, section);
      if (result.success) {
          setModalVisible(false);
          setTargetDeck(deck);
          setSuccessType('deck');
          setSuccessMessage(`Added to [${deck.name}]`);
          setShowSuccess(true);
      } else {
          setModalVisible(false);
          showToast(result.message || 'Failed to add card to deck');
      }
  };

  const handleCreateAndAddDeck = async () => {
      if (!newDeckName.trim()) {
          Alert.alert('Error', 'Please enter a deck name');
          return;
      }
      
      const newDeck = await createDeck(newDeckName.trim());
      if (newDeck) {
          await handleAddToDeck(newDeck);
          setNewDeckName(''); 
      } else {
          Alert.alert('Error', 'Failed to create deck');
      }
  };

  const handleDone = () => {
      setShowSuccess(false);
      navigation.goBack();
  };

  const handleStay = () => {
      setShowSuccess(false);
  };

  const handleViewAction = () => {
      setShowSuccess(false);
      if (successType === 'wishlist') {
          navigation.navigate('Tabs', { screen: 'Wishlist' } as any);
      } else if (successType === 'deck' && targetDeck) {
          navigation.navigate('DeckDetail', { deckId: targetDeck.id });
      }
  };

  const renderDeckItem = ({ item }: { item: Deck }) => (
      <TouchableOpacity style={styles.deckItem} onPress={() => handleAddToDeck(item)}>
          <View>
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.deckCount}>Cards: {item.mainDeck.length + item.extraDeck.length + item.sideDeck.length}</Text>
          </View>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.electricCyan} />
      </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
        {showSuccess && (
            <SuccessView
                message={successMessage}
                primaryText="Done"
                onPrimaryPress={handleDone}
                secondaryText="Stay Here"
                onSecondaryPress={handleStay}
                tertiaryText={successType === 'wishlist' ? "View Wishlist" : "View Deck"}
                onTertiaryPress={handleViewAction}
            />
        )}

        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Main Details Window */}
            <MMOWindow title={`Card Detail: ${card.name}`} icon="information-circle-outline" onClose={() => navigation.goBack()} style={styles.detailWindow}>
                <View style={styles.contentRow}>
                    {/* Card Image */}
                    <View style={styles.imageContainer}>
                         <Image
                            source={{ uri: card.card_images[0].image_url }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Type</Text>
                            <Text style={styles.statValue}>[{card.type}]</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Attribute</Text>
                            <Text style={styles.statValue}>[{card.attribute || 'N/A'}]</Text>
                        </View>
                         <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Level/Rank</Text>
                            <Text style={styles.statValue}>[{card.level || '-'}]</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>ATK</Text>
                            <Text style={styles.statValue}>[{card.atk || '-'}]</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>DEF</Text>
                            <Text style={styles.statValue}>[{card.def || '-'}]</Text>
                        </View>
                    </View>
                </View>

                {/* Card Text */}
                <View style={styles.textSection}>
                    <Text style={styles.sectionHeader}>[Card Text]</Text>
                    <View style={styles.textBox}>
                        <Text style={styles.desc}>{card.desc}</Text>
                    </View>
                </View>
            </MMOWindow>

            {/* Market Prices Window */}
            <MMOWindow title="Market Data" icon="pricetag-outline" style={styles.marketWindow}>
                 {card.card_prices.map((price, index) => (
                    <View key={index} style={styles.priceGrid}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>TCGPlayer:</Text>
                            <Text style={styles.priceValue}>${price.tcgplayer_price}</Text>
                        </View>
                         <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Cardmarket:</Text>
                            <Text style={styles.priceValue}>€{price.cardmarket_price}</Text>
                        </View>
                    </View>
                ))}
            </MMOWindow>

            {/* Actions Window */}
            <MMOWindow title="Actions" icon="flash-outline" style={styles.actionsWindow}>
                <View style={styles.buttonGrid}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleAddCollection}
                    >
                        <Text style={styles.actionButtonText}>Add to Collection</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.actionButtonText}>Add to Deck</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleAddWishlist}
                    >
                        <Text style={styles.actionButtonText}>Add to Wishlist</Text>
                    </TouchableOpacity>
                </View>
            </MMOWindow>

        </ScrollView>

        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <MMOWindow title="Select Deck" icon="albums-outline" onClose={() => setModalVisible(false)} style={styles.modalWindow}>
                    {decks.length === 0 ? (
                        <View style={styles.emptyDecks}>
                            <Text style={styles.emptyDeckText}>
                                No decks found.
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="New Deck Name..."
                                placeholderTextColor={COLORS.textDim}
                                value={newDeckName}
                                onChangeText={setNewDeckName}
                            />
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateAndAddDeck}
                            >
                                <Text style={styles.createButtonText}>Create & Add</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={decks}
                            keyExtractor={(item) => item.id}
                            renderItem={renderDeckItem}
                            style={{ maxHeight: 300 }}
                        />
                    )}
                </MMOWindow>
            </View>
        </Modal>
        <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 10,
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  detailWindow: {
      marginBottom: 10,
  },
  marketWindow: {
      marginBottom: 10,
  },
  actionsWindow: {
      marginBottom: 20,
  },
  contentRow: {
      flexDirection: 'row',
      marginBottom: 15,
  },
  imageContainer: {
      width: 120,
      height: 175,
      ...STYLES.bevelIn, // Inset look for image slot
      padding: 2,
      backgroundColor: '#fff',
      marginRight: 15,
  },
  image: {
      width: '100%',
      height: '100%',
  },
  statsContainer: {
      flex: 1,
      justifyContent: 'flex-start',
  },
  statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      alignItems: 'center',
  },
  statLabel: {
      fontSize: 12,
      color: COLORS.textDim,
      fontFamily: FONTS.body,
  },
  statValue: {
      fontSize: 13,
      color: COLORS.text,
      fontWeight: 'bold',
      fontFamily: FONTS.body,
  },
  separator: {
      height: 1,
      backgroundColor: '#bdc3c7',
      marginVertical: 6,
  },
  textSection: {
      marginTop: 5,
  },
  sectionHeader: {
      color: COLORS.electricCyan,
      fontWeight: 'bold',
      marginBottom: 5,
      fontSize: 12,
  },
  textBox: {
      ...STYLES.bevelIn,
      backgroundColor: '#fff',
      padding: 8,
      height: 100,
  },
  desc: {
      fontSize: 12,
      color: COLORS.text,
      fontFamily: FONTS.body,
      lineHeight: 16,
  },
  priceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
  },
  priceRow: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
  },
  priceLabel: {
      fontSize: 12,
      color: COLORS.textDim,
      marginRight: 5,
  },
  priceValue: {
      fontSize: 12,
      color: COLORS.text,
      fontWeight: 'bold',
  },
  buttonGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  actionButton: {
      flex: 1,
      backgroundColor: '#ecf0f1',
      borderWidth: 1,
      borderColor: '#bdc3c7',
      borderRadius: 4,
      paddingVertical: 10,
      alignItems: 'center',
      marginHorizontal: 2,
      ...STYLES.bevelOut,
  },
  actionButtonText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: COLORS.text,
  },
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWindow: {
      width: '85%',
      maxHeight: 400,
  },
  deckItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#bdc3c7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
  },
  deckName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: COLORS.text,
  },
  deckCount: {
      fontSize: 11,
      color: COLORS.textDim,
  },
  emptyDecks: {
      padding: 20,
      alignItems: 'center',
  },
  emptyDeckText: {
      marginBottom: 10,
      color: COLORS.text,
  },
  input: {
      width: '100%',
      ...STYLES.bevelIn,
      backgroundColor: '#fff',
      padding: 8,
      marginBottom: 10,
  },
  createButton: {
      width: '100%',
      backgroundColor: COLORS.electricCyan,
      padding: 10,
      alignItems: 'center',
      borderRadius: 4,
  },
  createButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  },
});
