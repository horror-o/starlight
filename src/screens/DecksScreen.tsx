import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDecks, createDeck, deleteDeck } from '../services/storage';
import { Deck } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';

type DecksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function DecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const navigation = useNavigation<DecksScreenNavigationProp>();

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
    <View style={styles.deckItem}>
      <TouchableOpacity 
        style={styles.deckContent}
        onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })}
      >
        <View style={styles.deckIcon}>
            <Ionicons name="layers" size={24} color={COLORS.electricCyan} />
        </View>
        <View style={styles.deckInfo}>
            <Text style={styles.deckName}>{item.name}</Text>
            <Text style={styles.deckCount}>
                Main: {item.mainDeck.length} | Extra: {item.extraDeck.length} | Side: {item.sideDeck.length}
            </Text>
            <Text style={styles.deckDate}>Last modified: {new Date(item.dateModified).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => handleDeleteDeck(item.id)} style={styles.deleteButton} accessibilityLabel={`Delete ${item.name}`} accessibilityRole="button">
        <Ionicons name="trash-outline" size={24} color={COLORS.cyberMagenta} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Create Deck Button"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Deck</Text>
            <TextInput
              style={styles.input}
              placeholder="Deck Name"
              placeholderTextColor={COLORS.textDim}
              value={newDeckName}
              onChangeText={setNewDeckName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateDeck}
                accessibilityLabel="Confirm Create Deck"
                accessibilityRole="button"
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
  },
  listContent: {
    padding: 10,
    paddingBottom: 80, // Space for FAB
  },
  deckItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBackground,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  deckContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  deckIcon: {
      marginRight: 15,
      backgroundColor: 'rgba(10, 189, 198, 0.1)',
      padding: 10,
      borderRadius: 20,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontFamily: FONTS.header,
    color: COLORS.text,
    letterSpacing: 1,
  },
  deckCount: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginTop: 2,
  },
  deckDate: {
    fontSize: 10,
    color: COLORS.textDim,
    marginTop: 4,
    fontFamily: FONTS.body,
  },
  deleteButton: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
    fontFamily: FONTS.header,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: COLORS.cyberMagenta,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.cyberMagenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.deepVoid,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.header,
    marginBottom: 15,
    textAlign: 'center',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButton: {
    backgroundColor: COLORS.electricCyan,
  },
  cancelButtonText: {
    color: COLORS.textDim,
    fontWeight: 'bold',
    fontFamily: FONTS.body,
  },
  createButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: FONTS.body,
  },
});
