import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import XLSX from 'xlsx';
import { Alert } from 'react-native';
import { CollectionItem, Condition, Edition, GradingCompany } from '../types';
import { getCollection, addCollectionItem } from './storage';
import { getWishlist, addToWishlist } from './wishlist';
import { Card, getCardById, searchCards } from './api';

// --- Types ---
// Reusing similar logic to CSV but handling XLSX Workbook

// --- Export Functions ---

export const exportCollectionToExcel = async () => {
  try {
    const collection = await getCollection();
    if (collection.length === 0) {
      Alert.alert('Export Failed', 'Collection is empty.');
      return;
    }

    const data = collection.map(item => ({
      'Card Name': item.cardData.name,
      'Card ID': item.cardId.toString(),
      'Set Code': item.setCode || '',
      'Rarity': item.setRarity || '',
      'Condition': item.condition,
      'Edition': item.edition,
      'Quantity': item.quantity,
      'Purchase Price': item.purchasePrice || '',
      'Graded': item.isGraded ? 'Yes' : 'No',
      'Grading Company': item.gradingCompany || '',
      'Grade': item.grade ? item.grade : '',
      'Date Added': item.dateAdded
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collection");

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const filename = `collection_export_${Date.now()}.xlsx`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, wbout, { encoding: 'base64' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filepath);
    } else {
      Alert.alert('Export Success', `File saved to ${filepath}`);
    }

  } catch (error) {
    console.error('Export Excel Error:', error);
    Alert.alert('Export Error', 'Failed to export to Excel.');
  }
};

export const exportWishlistToExcel = async () => {
  try {
    const wishlist = await getWishlist();
    if (wishlist.length === 0) {
      Alert.alert('Export Failed', 'Wishlist is empty.');
      return;
    }

    const data = wishlist.map(card => ({
      'Card Name': card.name,
      'Card ID': card.id.toString(),
      'Type': card.type,
      'Rarity': '' 
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wishlist");

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const filename = `wishlist_export_${Date.now()}.xlsx`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, wbout, { encoding: 'base64' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filepath);
    } else {
      Alert.alert('Export Success', `File saved to ${filepath}`);
    }

  } catch (error) {
    console.error('Export Excel Error:', error);
    Alert.alert('Export Error', 'Failed to export to Excel.');
  }
};

// --- Import Functions ---

const pickExcelFile = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
          'application/vnd.ms-excel',
          'application/excel'
      ],
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
    // Shared logic with CSV - duplicative but safe
    if (id && !isNaN(Number(id))) {
      const card = await getCardById(id);
      if (card) return card;
    }
    if (name) {
      const results = await searchCards(name);
      if (results && results.length > 0) return results[0];
    }
    return null;
  };

export const importCollectionFromExcel = async (): Promise<number> => {
  try {
    const uri = await pickExcelFile();
    if (!uri) return 0;

    const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const workbook = XLSX.read(fileContent, { type: 'base64' });
    
    // Assume first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    let addedCount = 0;

    for (const row of rows) {
      const name = row['Card Name'] || row['Name'];
      const id = row['Card ID'] || row['ID'] || row['Passcode'];

      if (!name && !id) continue;

      try {
        const card = await resolveCard(String(id), name); // Ensure ID is string
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
            purchasePrice: row['Purchase Price'] ? String(row['Purchase Price']) : undefined,
            isGraded: (row['Graded'] === 'Yes' || row['Graded'] === true || row['Graded'] === 'true'),
            gradingCompany: row['Grading Company'] as GradingCompany || undefined,
            grade: row['Grade'] ? Number(row['Grade']) : undefined,
            dateAdded: new Date().toISOString()
          };
          
          const success = await addCollectionItem(newItem);
          if (success) addedCount++;
        }
      } catch (err) {
        console.error(`Failed to import Excel row: ${JSON.stringify(row)}`, err);
      }
    }

    return addedCount;

  } catch (error) {
    console.error('Import Excel Error:', error);
    Alert.alert('Import Error', 'Failed to process Excel file.');
    return 0;
  }
};

export const importWishlistFromExcel = async (): Promise<number> => {
    try {
      const uri = await pickExcelFile();
      if (!uri) return 0;
  
      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  
      let addedCount = 0;
  
      for (const row of rows) {
        const name = row['Card Name'] || row['Name'];
        const id = row['Card ID'] || row['ID'];
  
        if (!name && !id) continue;
  
        try {
          const card = await resolveCard(String(id), name);
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
      Alert.alert('Import Error', 'Failed to process Excel file.');
      return 0;
    }
  };
