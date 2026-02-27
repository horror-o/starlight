import { Card } from '../services/api';

export interface CollectionItem {
  id: string; // Unique instance ID
  cardId: number;
  cardData: Card; // Cached card data
  setCode?: string;
  setRarity?: string;
  condition: string;
  edition: string;
  isGraded: boolean;
  gradingCompany?: string;
  grade?: number;
  purchasePrice?: string;
  quantity: number;
  dateAdded: string;
}

export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
export type Edition = '1st Edition' | 'Unlimited' | 'Limited';
export type GradingCompany = 'PSA' | 'BGS' | 'CGC' | 'Other';

export interface Deck {
  id: string;
  name: string;
  mainDeck: Card[];
  extraDeck: Card[];
  sideDeck: Card[];
  dateCreated: string;
  dateModified: string;
}
