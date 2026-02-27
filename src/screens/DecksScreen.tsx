import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDecks, createDeck, deleteDeck } from '../services/storage';
import { Deck } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { MMOWindow } from '../components/MMOWindow';
import { InventorySlot } from '../components/InventorySlot';

type DecksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function DecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const navigation = useNavigation<DecksScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const fetchDecks = async () => {
    const data = await getDecks();
    setDecks(data.sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()));
  };

  useFocusEffect(
    useCallback(() => {
      fetchDecks();
    }, [])
  );

  const handleCreateDeck = async () => {
    const deckName = newDeckName.trim() || 'New Deck';
    const newDeck = await createDeck(deckName);
    if (newDeck) {
      setNewDeckName('');
      setModalVisible(false);
      fetchDecks();
      // Optionally navigate to the new deck immediately
      // navigation.navigate('DeckDetail', { deck: newDeck });
    } else {
      Alert.alert('Error', 'Failed to create deck');
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (Platform.OS === 'web') {
        if (window.confirm('Are you sure you want to delete this deck?')) {
            await deleteDeck(id);
            fetchDecks();
        }
    } else {
        Alert.alert(
        'Delete Deck',
        'Are you sure you want to delete this deck?',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
                await deleteDeck(id);
                fetchDecks();
            }
            }
        ]
        );
    }
  };

  const renderItem = ({ item }: { item: Deck }) => (
    <View style={styles.deckItemWrapper}>
        <TouchableOpacity
            style={styles.deckItem}
            onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })}
        >
            <View style={styles.deckIcon}>
                <InventorySlot image={undefined} quantity={0} empty={false} />
                <View style={styles.iconOverlay}>
                    <Ionicons name="layers" size={24} color={COLORS.electricCyan} />
                </View>
            </View>
            <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{item.name}</Text>
                <Text style={styles.deckCount}>
                    M: {item.mainDeck.length} | E: {item.extraDeck.length} | S: {item.sideDeck.length}
                </Text>
                <Text style={styles.deckDate}>{new Date(item.dateModified).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDeleteDeck(item.id)} style={styles.deleteButton} accessibilityLabel={`Delete ${item.name}`} accessibilityRole="button">
            <Ionicons name="trash-outline" size={16} color={COLORS.cyberMagenta} />
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <MMOWindow title="Deck List" icon="layers-outline" style={styles.window} headerRight={<Ionicons name="information-circle-outline" size={16} color={COLORS.text} style={{ opacity: 0.5 }} />}>
        <FlatList
            data={decks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No decks created yet.</Text>
                <Text style={styles.emptySubtext}>Create a deck to start building!</Text>
            </View>
            }
        />
      </MMOWindow>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Create Deck Button"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <MMOWindow title="Create New Deck" icon="add-circle-outline" onClose={() => setModalVisible(false)} style={styles.modalWindow}>
                <View style={styles.modalContent}>
                    <TextInput
                    style={styles.input}
                    placeholder="Enter Deck Name..."
                    placeholderTextColor={COLORS.textDim}
                    value={newDeckName}
                    onChangeText={setNewDeckName}
                    autoFocus
                    />
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateDeck}
                        accessibilityLabel="Confirm Create Deck"
                        accessibilityRole="button"
                    >
                        <Text style={styles.createButtonText}>Create Deck</Text>
                    </TouchableOpacity>
                </View>
          </MMOWindow>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // paddingTop handled by inline style
  },
  window: {
      flex: 1,
      marginBottom: 60,
  },
  listContent: {
    padding: 5,
  },
  deckItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    padding: 5,
  },
  deckItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckIcon: {
      marginRight: 10,
      position: 'relative',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
  },
  iconOverlay: {
      position: 'absolute',
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 14,
    fontFamily: FONTS.header,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  deckCount: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  deckDate: {
    fontSize: 10,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    ...STYLES.bevelOut,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.text,
    fontFamily: FONTS.header,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: COLORS.cyberMagenta,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...STYLES.bevelOut,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWindow: {
    width: '85%',
  },
  modalContent: {
      paddingVertical: 10,
  },
  input: {
    ...STYLES.bevelIn,
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 15,
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  createButton: {
    backgroundColor: COLORS.electricCyan,
    padding: 10,
    alignItems: 'center',
    borderRadius: 4,
    ...STYLES.bevelOut,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: FONTS.body,
  },
});
