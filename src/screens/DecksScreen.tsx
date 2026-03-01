import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDecks, createDeck, deleteDeck } from '../services/storage';
import { importDeckFromYDKFile, parseYDKE, importDeckFromIDs } from '../services/deckImport';
import { Deck } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STYLES, FONTS } from '../theme';
import { MMOWindow } from '../components/MMOWindow';
import { InventorySlot } from '../components/InventorySlot';

type DecksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function DecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [importMode, setImportMode] = useState<'create' | 'ydk' | 'ydke'>('create');
  const [newDeckName, setNewDeckName] = useState('');
  const [ydkeCode, setYdkeCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
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

  const handleOpenModal = (mode: 'create' | 'ydk' | 'ydke') => {
      setImportMode(mode);
      setNewDeckName('');
      setYdkeCode('');
      setModalVisible(true);
  }

  const handleCreateDeck = async () => {
    const deckName = newDeckName.trim() || 'New Deck';
    const newDeck = await createDeck(deckName);
    if (newDeck) {
      setNewDeckName('');
      setModalVisible(false);
      fetchDecks();
    } else {
      Alert.alert('Error', 'Failed to create deck');
    }
  };

  const handleImportYDK = async () => {
      const deckName = newDeckName.trim() || 'Imported YDK Deck';
      setIsImporting(true);
      const newDeck = await importDeckFromYDKFile(deckName);
      setIsImporting(false);
      if (newDeck) {
          setNewDeckName('');
          setModalVisible(false);
          fetchDecks();
      } else {
          Alert.alert('Error', 'Failed to import YDK file or operation cancelled.');
      }
  };

  const handleImportYDKE = async () => {
      const deckName = newDeckName.trim() || 'Imported YDKE Deck';
      if (!ydkeCode.trim().startsWith('ydke://')) {
          Alert.alert('Error', 'Invalid YDKE code format. Must start with ydke://');
          return;
      }
      setIsImporting(true);
      const parsed = parseYDKE(ydkeCode.trim());
      const newDeck = await importDeckFromIDs(deckName, parsed);
      setIsImporting(false);
      if (newDeck) {
          setNewDeckName('');
          setYdkeCode('');
          setModalVisible(false);
          fetchDecks();
      } else {
          Alert.alert('Error', 'Failed to import YDKE code.');
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

      <View style={styles.fabContainer}>
          <TouchableOpacity style={[styles.fabMenuButton, {marginBottom: 10}]} onPress={() => handleOpenModal('ydke')}>
              <Ionicons name="link-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fabMenuButton, {marginBottom: 10}]} onPress={() => handleOpenModal('ydk')}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal('create')}>
              <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <MMOWindow
               title={importMode === 'create' ? "Create New Deck" : importMode === 'ydk' ? "Import YDK File" : "Import Master Duel Code"}
               icon="add-circle-outline"
               onClose={() => setModalVisible(false)}
               style={styles.modalWindow}
            >
                <View style={styles.modalContent}>
                    <TextInput
                    style={styles.input}
                    placeholder={importMode === 'create' ? "Enter Deck Name..." : "Enter Deck Name (Optional)..."}
                    placeholderTextColor={COLORS.textDim}
                    value={newDeckName}
                    onChangeText={setNewDeckName}
                    autoFocus
                    />

                    {importMode === 'ydke' && (
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="ydke://..."
                            placeholderTextColor={COLORS.textDim}
                            value={ydkeCode}
                            onChangeText={setYdkeCode}
                            multiline
                        />
                    )}

                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={
                            importMode === 'create' ? handleCreateDeck :
                            importMode === 'ydk' ? handleImportYDK :
                            handleImportYDKE
                        }
                        disabled={isImporting}
                    >
                        <Text style={styles.createButtonText}>
                            {isImporting ? "Importing..." : importMode === 'create' ? "Create Deck" : "Import & Save"}
                        </Text>
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
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'center',
  },
  fab: {
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
  fabMenuButton: {
    backgroundColor: COLORS.electricCyan,
    width: 40,
    height: 40,
    borderRadius: 20,
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
