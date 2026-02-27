import axios from 'axios';

const BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export interface Card {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  card_images: {
    image_url: string;
    image_url_small: string;
  }[];
  card_prices: {
    tcgplayer_price: string;
    cardmarket_price: string;
    ebay_price: string;
    amazon_price: string;
  }[];
  banlist_info?: {
    ban_tcg?: string;
    ban_ocg?: string;
    ban_goat?: string;
  };
  card_sets?: {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code?: string;
    set_price: string;
  }[];
}

export const searchCards = async (query: string): Promise<Card[]> => {
  try {
    // Parallel Search for Variations (including original)
    // User wants "harpies" to find "Harpie's Feather Duster".
    // "Harpies" -> "Harpie" (root search).
    
    const searches = [axios.get(`${BASE_URL}?fname=${query}`)]; // Always search original

    // Heuristics for variations:
    const lowerQuery = query.toLowerCase();
    
    // a. Handle plural "ies" -> "y" (e.g. "Fairies" -> "Fairy") OR "ie" ("Harpies" -> "Harpie")
    if (lowerQuery.endsWith('ies')) {
        const rootIe = lowerQuery.slice(0, -1); // "Harpies" -> "Harpie"
        const rootY = lowerQuery.slice(0, -3) + 'y'; // "Fairies" -> "Fairy"
        searches.push(axios.get(`${BASE_URL}?fname=${rootIe}`));
        searches.push(axios.get(`${BASE_URL}?fname=${rootY}`));
    }
    // b. Handle standard plural "s" -> remove "s" (e.g. "Magicians" -> "Magician")
    else if (lowerQuery.endsWith('s') && !lowerQuery.endsWith('ss')) {
        const singular = lowerQuery.slice(0, -1);
        searches.push(axios.get(`${BASE_URL}?fname=${singular}`));
    }
    
    // c. Strip punctuation (e.g. "Magician's" input -> "Magicians")
    const noPunc = query.replace(/[^\w\s]/g, '');
    if (noPunc !== query) {
        searches.push(axios.get(`${BASE_URL}?fname=${noPunc}`));
    }

    // Execute all relevant searches
    const results = await Promise.allSettled(searches);
    
    const allCards: Card[] = [];
    const seenIds = new Set<number>();

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.data.data) {
            result.value.data.data.forEach((card: Card) => {
                if (!seenIds.has(card.id)) {
                    seenIds.add(card.id);
                    allCards.push(card);
                }
            });
        }
    });

    if (allCards.length > 0) {
        return allCards;
    }

    // 3. Fallback: Try stripping punctuation from query (if user included it but API failed? unlikely given prompt, but safe)
    const sanitizedQuery = query.replace(/[^\w\s]/g, '');
    if (sanitizedQuery !== query) {
        try {
            const response = await axios.get(`${BASE_URL}?fname=${sanitizedQuery}`);
            if (response.data.data && response.data.data.length > 0) {
                return response.data.data;
            }
        } catch (e) {
             // Continue
        }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
};

export const getCardByName = async (name: string): Promise<Card | null> => {
  try {
    const response = await axios.get(`${BASE_URL}?name=${name}`);
    return response.data.data[0];
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
};

export const getCardBySetCode = async (setCode: string): Promise<Card | null> => {
  try {
    // Correct Endpoint for Set Code Info: cardsetsinfo.php
    // However, this endpoint returns simplified data {id, name, set_name...} not full Card object.
    // So we use it to get the ID, then fetch full card.
    const setResponse = await axios.get(`https://db.ygoprodeck.com/api/v7/cardsetsinfo.php?setcode=${setCode}`);
    
    if (setResponse.data && setResponse.data.id) {
        return await getCardById(setResponse.data.id.toString());
    }
    return null;
  } catch (error) {
    console.error('Error fetching card by Set Code:', error);
    return null;
  }
};

export const getCardById = async (id: string): Promise<Card | null> => {
  try {
    // YGOPRODeck API supports 'id' parameter for passcode
    const response = await axios.get(`${BASE_URL}?id=${id}`);
    // API returns array of matches (usually 1)
    return response.data.data[0];
  } catch (error) {
    console.error('Error fetching card by ID:', error);
    return null;
  }
};
