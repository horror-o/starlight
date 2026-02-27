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
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
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
        setSuccessMessage('Added to Wishlist');
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
          setSuccessMessage(`Added to ${deck.name}`);
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
    <View style={{ flex: 1 }}>
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
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: card.card_images[0].image_url }} 
        style={styles.image} 
        resizeMode="contain"
      />
      
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{card.name}</Text>
        
        <View style={styles.row}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{card.type}</Text>
            </View>
            <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>{card.race}</Text>
            </View>
            {card.attribute && (
                <View style={[styles.badge, styles.badgeTertiary]}>
                    <Text style={styles.badgeText}>{card.attribute}</Text>
                </View>
            )}
        </View>

        {(card.atk !== undefined || card.def !== undefined) && (
             <View style={styles.statsRow}>
                {card.atk !== undefined && <Text style={styles.statText}>ATK: {card.atk}</Text>}
                {card.def !== undefined && <Text style={styles.statText}>DEF: {card.def}</Text>}
                {card.level !== undefined && <Text style={styles.statText}>Level: {card.level}</Text>}
             </View>
        )}

        <Text style={styles.desc}>{card.desc}</Text>

        <View style={styles.priceContainer}>
            <Text style={styles.priceTitle}>Market Prices:</Text>
            {card.card_prices.map((price, index) => (
                <View key={index}>
                    <TickingPrice value={price.tcgplayer_price} prefix="TCGPlayer: $" style={styles.priceText} />
                    <TickingPrice value={price.cardmarket_price} prefix="Cardmarket: €" style={styles.priceText} />
                    <TickingPrice value={price.ebay_price} prefix="eBay: $" style={styles.priceText} />
                    <TickingPrice value={price.amazon_price} prefix="Amazon: $" style={styles.priceText} />
                </View>
            ))}
        </View>

        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={[styles.button, styles.buttonAdd]}
                onPress={handleAddCollection}
            >
                <Text style={styles.buttonText}>Add to Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, styles.buttonDeck]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>Add to Deck</Text>
            </TouchableOpacity>
        </View>
        
        <View style={[styles.buttonContainer, { marginTop: 10 }]}>
            <TouchableOpacity 
                style={[styles.button, styles.buttonWishlist]}
                onPress={handleAddWishlist}
            >
                <Text style={styles.buttonText}>Add to Wishlist</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

    <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select a Deck</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                
                {decks.length === 0 ? (
                    <View style={styles.emptyDecks}>
                        <Text style={{color: COLORS.text, marginBottom: 15, textAlign: 'center'}}>
                            No decks found. Create one to add this card!
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Deck Name"
                            placeholderTextColor={COLORS.textDim}
                            value={newDeckName}
                            onChangeText={setNewDeckName}
                        />
                        <TouchableOpacity 
                            style={styles.createButton}
                            onPress={handleCreateAndAddDeck}
                        >
                            <Text style={styles.buttonText}>Create & Add</Text>
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
            </View>
        </View>
    </Modal>
    <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: 'transparent',
  },
  detailsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
    fontFamily: FONTS.header,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  badge: {
    backgroundColor: COLORS.glassBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  badgeSecondary: {
    backgroundColor: 'rgba(10, 189, 198, 0.2)',
    borderColor: COLORS.electricCyan,
  },
  badgeTertiary: {
    backgroundColor: 'rgba(234, 0, 217, 0.2)',
    borderColor: COLORS.cyberMagenta,
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glassBackground,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  desc: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textDim,
    marginBottom: 20,
    fontFamily: FONTS.body,
  },
  priceContainer: {
    backgroundColor: COLORS.glassBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  priceTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.electricCyan,
    fontFamily: FONTS.header,
  },
  priceText: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonAdd: {
    backgroundColor: COLORS.electricCyan,
  },
  buttonDeck: {
      backgroundColor: 'rgba(255, 152, 0, 0.8)', // Orange still distinctive but simpler
  },
  buttonWishlist: {
    backgroundColor: COLORS.cyberMagenta,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.header,
  },
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
      width: '85%',
      backgroundColor: COLORS.deepVoid,
      borderRadius: 10,
      padding: 20,
      elevation: 5,
      borderWidth: 1,
      borderColor: COLORS.chromeMist,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.text,
      fontFamily: FONTS.header,
  },
  deckItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.chromeMist,
  },
  deckName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text,
      fontFamily: FONTS.body,
  },
  deckCount: {
      fontSize: 12,
      color: COLORS.textDim,
      fontFamily: FONTS.body,
  },
  emptyDecks: {
      padding: 20,
      alignItems: 'center',
      width: '100%',
  },
  input: {
      backgroundColor: COLORS.glassBackground,
      color: COLORS.text,
      padding: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: COLORS.chromeMist,
      marginBottom: 15,
      width: '100%',
      fontFamily: FONTS.body,
  },
  createButton: {
      backgroundColor: COLORS.electricCyan,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      width: '100%',
  },
});
