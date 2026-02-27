import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from './api';

const WISHLIST_KEY = 'user_wishlist';

export const addToWishlist = async (card: Card) => {
  try {
    const existingWishlist = await getWishlist();
    const isAlreadyInWishlist = existingWishlist.some((c) => c.id === card.id);
    
    if (!isAlreadyInWishlist) {
      const newWishlist = [...existingWishlist, card];
      await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return false;
  }
};

export const removeFromWishlist = async (cardId: number) => {
  try {
    const existingWishlist = await getWishlist();
    const newWishlist = existingWishlist.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return false;
  }
};

export const getWishlist = async (): Promise<Card[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(WISHLIST_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return [];
  }
};
