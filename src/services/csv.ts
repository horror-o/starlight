import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { Alert } from 'react-native';
import { CollectionItem, Condition, Edition, GradingCompany } from '../types';
import { getCollection, addCollectionItem } from './storage';
import { getWishlist, addToWishlist } from './wishlist';
import { Card, getCardById, searchCards } from './api';

// --- Types for CSV Rows ---
interface CollectionCSVRow {
  'Card Name': string;
  'Card ID': string; // YGOPRODeck ID
  'Set Code': string;
  'Rarity': string;
  'Condition': string;
  'Edition': string;
  'Quantity': string;
  'Purchase Price': string;
  'Graded': string;
  'Grading Company': string;
  'Grade': string;
  'Date Added': string;
}

interface WishlistCSVRow {
  'Card Name': string;
  'Card ID': string;
  'Type': string;
  'Rarity': string; // Might be generic preference or specific
}

// --- Export Functions ---

export const exportCollectionToCSV = async () => {
  try {
    const collection = await getCollection();
    if (collection.length === 0) {
      Alert.alert('Export Failed', 'Collection is empty.');
      return;
    }

    const data: CollectionCSVRow[] = collection.map(item => ({
      'Card Name': item.cardData.name,
      'Card ID': item.cardId.toString(),
      'Set Code': item.setCode || '',
      'Rarity': item.setRarity || '',
      'Condition': item.condition,
      'Edition': item.edition,
      'Quantity': item.quantity.toString(),
      'Purchase Price': item.purchasePrice || '',
      'Graded': item.isGraded ? 'Yes' : 'No',
      'Grading Company': item.gradingCompany || '',
      'Grade': item.grade ? item.grade.toString() : '',
      'Date Added': item.dateAdded
    }));

    const csv = Papa.unparse(data);
    const filename = `collection_export_${Date.now()}.csv`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, csv, { encoding: 'utf8' });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filepath);
    } else {
      Alert.alert('Export Success', `File saved to ${filepath}`);
    }

  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Export Error', 'Failed to export collection.');
  }
};

export const exportWishlistToCSV = async () => {
  try {
    const wishlist = await getWishlist();
    if (wishlist.length === 0) {
      Alert.alert('Export Failed', 'Wishlist is empty.');
      return;
    }

    const data: WishlistCSVRow[] = wishlist.map(card => ({
      'Card Name': card.name,
      'Card ID': card.id.toString(),
      'Type': card.type,
      'Rarity': '' // Wishlist just stores Card object, usually no specific rarity unless customized
    }));

    const csv = Papa.unparse(data);
    const filename = `wishlist_export_${Date.now()}.csv`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, csv, { encoding: 'utf8' });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filepath);
    } else {
      Alert.alert('Export Success', `File saved to ${filepath}`);
    }

  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Export Error', 'Failed to export wishlist.');
  }
};

// --- Import Functions ---

const pickCSVFile = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      copyToCacheDirectory: true
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  } catch (error) {
    console.error('File Pick Error:', error);
    return null;
  }
};

const resolveCard = async (id: string, name: string): Promise<Card | null> => {
  // 1. Try by ID (most accurate)
  if (id && !isNaN(Number(id))) {
    const card = await getCardById(id);
    if (card) return card;
  }
  // 2. Try by Name
  if (name) {
    const results = await searchCards(name);
    if (results && results.length > 0) return results[0];
  }
  return null;
};

export const importCollectionFromCSV = async (): Promise<number> => {
  try {
    const uri = await pickCSVFile();
    if (!uri) return 0;

    const fileContent = await FileSystem.readAsStringAsync(uri);
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    
    if (parsed.errors.length > 0) {
      console.warn('CSV Parse Errors:', parsed.errors);
    }

    let addedCount = 0;
    const rows = parsed.data as any[];

    // Process sequentially to avoid API rate limits if massive
    for (const row of rows) {
      const name = row['Card Name'] || row['Name']; // flexible header
      const id = row['Card ID'] || row['ID'] || row['Passcode'];
      
      if (!name && !id) continue;

      try {
        const card = await resolveCard(id, name);
        if (card) {
          const newItem: CollectionItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            cardId: card.id,
            cardData: card,
            setCode: row['Set Code'] || undefined,
            setRarity: row['Rarity'] || undefined,
            condition: (row['Condition'] as Condition) || 'NM',
            edition: (row['Edition'] as Edition) || 'Unlimited',
            quantity: Number(row['Quantity']) || 1,
            purchasePrice: row['Purchase Price'] || undefined,
            isGraded: (row['Graded'] === 'Yes' || row['Graded'] === 'true'),
            gradingCompany: row['Grading Company'] as GradingCompany || undefined,
            grade: row['Grade'] ? Number(row['Grade']) : undefined,
            dateAdded: new Date().toISOString()
          };
          
          const success = await addCollectionItem(newItem);
          if (success) addedCount++;
        }
      } catch (err) {
        console.error(`Failed to import row: ${JSON.stringify(row)}`, err);
      }
    }
    
    return addedCount;

  } catch (error) {
    console.error('Import Error:', error);
    Alert.alert('Import Error', 'Failed to process CSV file.');
    return 0;
  }
};

export const importWishlistFromCSV = async (): Promise<number> => {
  try {
    const uri = await pickCSVFile();
    if (!uri) return 0;

    const fileContent = await FileSystem.readAsStringAsync(uri);
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    
    let addedCount = 0;
    const rows = parsed.data as any[];

    for (const row of rows) {
      const name = row['Card Name'] || row['Name'];
      const id = row['Card ID'] || row['ID'];

      if (!name && !id) continue;

      try {
        const card = await resolveCard(id, name);
        if (card) {
           const success = await addToWishlist(card);
           if (success) addedCount++;
        }
      } catch (err) {
         console.error(`Failed to import wishlist row: ${JSON.stringify(row)}`, err);
      }
    }

    return addedCount;
  } catch (error) {
    console.error('Import Error:', error);
    Alert.alert('Import Error', 'Failed to process CSV file.');
    return 0;
  }
};
