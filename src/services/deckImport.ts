import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from 'buffer'; // Need buffer for base64 decoding
import { getCardById } from './api';
import { createDeck, addCardToDeck } from './storage';
import { Deck, Card } from '../types';

/**
 * Parses a standard YDK file string.
 * Returns arrays of card IDs for main, extra, and side decks.
 */
export const parseYDK = (ydkString: string) => {
    const lines = ydkString.split('\n');
    const deck = {
        main: [] as string[],
        extra: [] as string[],
        side: [] as string[]
    };

    let currentSection: 'main' | 'extra' | 'side' = 'main';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#created')) continue;

        if (trimmed === '#main') {
            currentSection = 'main';
        } else if (trimmed === '#extra') {
            currentSection = 'extra';
        } else if (trimmed === '!side') {
            currentSection = 'side';
        } else if (/^\d+$/.test(trimmed)) {
            deck[currentSection].push(trimmed);
        }
    }

    return deck;
};

/**
 * Parses a YDKE URI string (ydke://<base64>!<base64>!<base64>!)
 * Returns arrays of card IDs for main, extra, and side decks.
 */
export const parseYDKE = (ydkeString: string) => {
    const deck = {
        main: [] as string[],
        extra: [] as string[],
        side: [] as string[]
    };

    try {
        if (!ydkeString.startsWith('ydke://')) {
            throw new Error('Invalid YDKE URI format');
        }

        const dataStr = ydkeString.replace('ydke://', '');
        const parts = dataStr.split('!');

        if (parts.length >= 1 && parts[0]) deck.main = decodeYDKEComponent(parts[0]);
        if (parts.length >= 2 && parts[1]) deck.extra = decodeYDKEComponent(parts[1]);
        if (parts.length >= 3 && parts[2]) deck.side = decodeYDKEComponent(parts[2]);

    } catch (e) {
        console.error('Failed to parse YDKE:', e);
    }

    return deck;
};

/**
 * Decodes a base64 YDKE component into an array of card IDs.
 * YDKE stores each card ID as a 4-byte little-endian integer.
 */
const decodeYDKEComponent = (base64Str: string): string[] => {
    const ids: string[] = [];
    try {
        const buffer = Buffer.from(base64Str, 'base64');
        for (let i = 0; i < buffer.length; i += 4) {
            // Read 32-bit integer (little endian)
            const id = buffer.readUInt32LE(i);
            ids.push(id.toString());
        }
    } catch (e) {
        console.error('Failed to decode YDKE component:', e);
    }
    return ids;
};

/**
 * Takes parsed deck IDs and creates a new Deck, fetching cards from the API.
 */
export const importDeckFromIDs = async (
    deckName: string,
    parsedDeck: { main: string[], extra: string[], side: string[] }
): Promise<Deck | null> => {
    try {
        const newDeck = await createDeck(deckName);
        if (!newDeck) return null;

        // Fetch all unique cards needed
        const allIds = new Set([...parsedDeck.main, ...parsedDeck.extra, ...parsedDeck.side]);
        const cardCache: { [id: string]: any } = {};

        // Fetch in parallel chunks for speed
        const idArray = Array.from(allIds);
        const chunkSize = 10;
        for (let i = 0; i < idArray.length; i += chunkSize) {
            const chunk = idArray.slice(i, i + chunkSize);
            const promises = chunk.map(id => getCardById(id));
            const results = await Promise.allSettled(promises);

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    cardCache[chunk[index]] = result.value;
                }
            });
        }

        // Add cards to deck
        for (const id of parsedDeck.main) {
            if (cardCache[id]) await addCardToDeck(newDeck.id, cardCache[id], 'main');
        }
        for (const id of parsedDeck.extra) {
            if (cardCache[id]) await addCardToDeck(newDeck.id, cardCache[id], 'extra');
        }
        for (const id of parsedDeck.side) {
            if (cardCache[id]) await addCardToDeck(newDeck.id, cardCache[id], 'side');
        }

        return newDeck;

    } catch (error) {
        console.error('Error importing deck:', error);
        return null;
    }
};

/**
 * Opens document picker to import a YDK file.
 */
export const importDeckFromYDKFile = async (deckName: string): Promise<Deck | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled) return null;

        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });

        const parsed = parseYDK(fileContent);
        return await importDeckFromIDs(deckName, parsed);

    } catch (error) {
        console.error('Error importing YDK file for deck:', error);
        return null;
    }
};
