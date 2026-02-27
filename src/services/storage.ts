import AsyncStorage from '@react-native-async-storage/async-storage';
import { CollectionItem, Deck } from '../types';
import { Card } from './api';

const COLLECTION_KEY = 'user_collection_v2';
const DECKS_KEY = 'user_decks_v1';

export const addCollectionItem = async (item: CollectionItem) => {
  try {
    const existingCollection = await getCollection();
    const newCollection = [...existingCollection, item];
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(newCollection));
    return true;
  } catch (error) {
    console.error('Error adding to collection:', error);
    return false;
  }
};

export const removeCollectionItem = async (itemId: string) => {
  try {
    const existingCollection = await getCollection();
    const newCollection = existingCollection.filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(newCollection));
    return true;
  } catch (error) {
    console.error('Error removing from collection:', error);
    return false;
  }
};

export const getCollection = async (): Promise<CollectionItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(COLLECTION_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error reading collection:', error);
    return [];
  }
};

// Deck Functions

export const getDecks = async (): Promise<Deck[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(DECKS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error reading decks:', error);
    return [];
  }
};

export const saveDecks = async (decks: Deck[]) => {
  try {
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    console.error('Error saving decks:', error);
    return false;
  }
};

export const createDeck = async (name: string): Promise<Deck | null> => {
  try {
    const newDeck: Deck = {
      id: Date.now().toString(),
      name,
      mainDeck: [],
      extraDeck: [],
      sideDeck: [],
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };
    const decks = await getDecks();
    const newDecks = [...decks, newDeck];
    await saveDecks(newDecks);
    return newDeck;
  } catch (error) {
    console.error('Error creating deck:', error);
    return null;
  }
};

export const updateDeck = async (updatedDeck: Deck): Promise<boolean> => {
  try {
    const decks = await getDecks();
    const index = decks.findIndex(d => d.id === updatedDeck.id);
    if (index !== -1) {
      updatedDeck.dateModified = new Date().toISOString();
      decks[index] = updatedDeck;
      await saveDecks(decks);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating deck:', error);
    return false;
  }
};

export const deleteDeck = async (deckId: string): Promise<boolean> => {
  try {
    const decks = await getDecks();
    const newDecks = decks.filter(d => d.id !== deckId);
    await saveDecks(newDecks);
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    return false;
  }
};

export const addCardToDeck = async (deckId: string, card: Card, section: 'main' | 'extra' | 'side' = 'main'): Promise<{ success: boolean; message?: string }> => {
  try {
    const decks = await getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index === -1) return { success: false, message: 'Deck not found' };

    const deck = decks[index];
    
    // 1. Check Deck Size Limits
    if (section === 'main' && deck.mainDeck.length >= 60) {
        return { success: false, message: 'Main Deck cannot exceed 60 cards.' };
    }
    if (section === 'extra' && deck.extraDeck.length >= 15) {
        return { success: false, message: 'Extra Deck cannot exceed 15 cards.' };
    }
    if (section === 'side' && deck.sideDeck.length >= 15) {
        return { success: false, message: 'Side Deck cannot exceed 15 cards.' };
    }

    // 2. Check Card Copy Limit (Max 3 copies across all sections)
    const allCards = [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck];
    const cardCount = allCards.filter(c => c.name === card.name).length;
    
    let limit = 3;
    if (card.banlist_info?.ban_tcg) {
        const banStatus = card.banlist_info.ban_tcg;
        if (banStatus === 'Forbidden' || banStatus === 'Banned') limit = 0;
        else if (banStatus === 'Limited') limit = 1;
        else if (banStatus === 'Semi-Limited') limit = 2;
    }

    if (cardCount >= limit) {
        if (limit === 0) return { success: false, message: `"${card.name}" is Forbidden in the TCG format.` };
        return { success: false, message: `You can only have ${limit} cop${limit === 1 ? 'y' : 'ies'} of "${card.name}" in your deck.` };
    }
    
    if (section === 'main') {
        deck.mainDeck.push(card);
    } else if (section === 'extra') {
        deck.extraDeck.push(card);
    } else {
        deck.sideDeck.push(card);
    }

    deck.dateModified = new Date().toISOString();
    decks[index] = deck;
    await saveDecks(decks);
    return { success: true };

  } catch (error) {
    console.error('Error adding card to deck:', error);
    return { success: false, message: 'Internal error adding card' };
  }
};

export const removeCardFromDeck = async (deckId: string, cardIndex: number, section: 'main' | 'extra' | 'side'): Promise<boolean> => {
    try {
      const decks = await getDecks();
      const index = decks.findIndex(d => d.id === deckId);
      if (index === -1) return false;
  
      const deck = decks[index];
      
      if (section === 'main') {
          deck.mainDeck.splice(cardIndex, 1);
      } else if (section === 'extra') {
          deck.extraDeck.splice(cardIndex, 1);
      } else {
          deck.sideDeck.splice(cardIndex, 1);
      }
  
      deck.dateModified = new Date().toISOString();
      decks[index] = deck;
      await saveDecks(decks);
      return true;
  
    } catch (error) {
      console.error('Error removing card from deck:', error);
      return false;
    }
  };

// Deprecated V1 functions (kept for reference or migration if needed)
export const addToCollection = async () => { console.warn('Use addCollectionItem'); return false; };
export const removeFromCollection = async () => { console.warn('Use removeCollectionItem'); return false; };
