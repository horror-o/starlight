import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getCollection, saveCollectionItem } from './storage';
import { getCardById } from './api';
import { CollectionItem } from '../types';

/**
 * .ydk files are simple text files.
 * Format:
 * #created by ...
 * #main
 * <card_id>
 * <card_id>
 * #extra
 * <card_id>
 * !side
 * <card_id>
 *
 * We will export the collection by writing all card IDs under #main.
 * We will import by reading all numeric IDs from the file and adding them.
 */

export const exportCollectionToYDK = async () => {
    try {
        const collection = await getCollection();
        if (collection.length === 0) {
            alert('Collection is empty');
            return;
        }

        let ydkContent = '#created by YGO Collector\n#main\n';

        // Add each card id for its quantity
        collection.forEach(item => {
            for(let i=0; i < item.quantity; i++) {
                ydkContent += `${item.cardId}\n`;
            }
        });

        ydkContent += '#extra\n!side\n';

        const fileUri = `${FileSystem.documentDirectory}collection_export.ydk`;
        await FileSystem.writeAsStringAsync(fileUri, ydkContent, { encoding: FileSystem.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Export Collection YDK',
                UTI: 'public.plain-text'
            });
        } else {
            alert('Sharing is not available on this device');
        }

    } catch (error) {
        console.error('Error exporting YDK:', error);
        alert('Failed to export YDK');
    }
};

export const importCollectionFromYDK = async (): Promise<number> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // accept all, check extension later if needed, but text/plain might filter too much
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return 0;
        }

        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });

        const lines = fileContent.split('\n');
        let importCount = 0;

        // Basic parser: just find all numbers that look like card IDs
        for (const line of lines) {
            const cleanLine = line.trim();
            // If it's a number and not a comment/section header
            if (cleanLine && /^\d+$/.test(cleanLine)) {
                const cardId = cleanLine;

                // Fetch full card data
                const cardData = await getCardById(cardId);
                if (cardData) {
                    const newItem: CollectionItem = {
                        id: `${cardId}_${Date.now()}_${Math.random()}`,
                        cardId: cardData.id,
                        cardData: cardData,
                        condition: 'NM',
                        edition: 'Unlimited',
                        isGraded: false,
                        quantity: 1,
                        dateAdded: new Date().toISOString()
                    };
                    await saveCollectionItem(newItem);
                    importCount++;
                }
            }
        }

        return importCount;

    } catch (error) {
        console.error('Error importing YDK:', error);
        alert('Failed to import YDK file. Please check the file format.');
        return 0;
    }
};
